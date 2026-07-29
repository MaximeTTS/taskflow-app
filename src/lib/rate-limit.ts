/**
 * Limiteur de débit à fenêtre glissante.
 *
 * Sans lui, `login` acceptait un nombre illimité de tentatives : un mot de
 * passe faible tombait en quelques minutes.
 *
 * Le comptage est séparé du stockage. Le magasin par défaut vit dans le
 * processus, ce qui suffit à une instance unique mais compte séparément
 * derrière plusieurs répliques (Vercel, conteneurs) — la protection y est
 * donc partielle. Fournir un magasin partagé, typiquement adossé à Redis,
 * corrige cela sans toucher une ligne des appelants : c'est l'objet de
 * l'interface `RateLimitStore`.
 */

/**
 * Stockage des horodatages de tentatives, par clé.
 *
 * Volontairement minimal : lire, écrire, oublier. Une implémentation Redis
 * tient en quelques lignes derrière ce contrat.
 */
export type RateLimitStore = {
  /** Horodatages connus pour cette clé. Tableau vide si inconnue. */
  read: (key: string) => number[];
  write: (key: string, timestamps: number[]) => void;
  remove: (key: string) => void;
  /** Toutes les clés suivies, pour la purge. */
  keys: () => string[];
  clear: () => void;
};

/** Magasin par défaut : une Map dans le processus courant. */
export function createMemoryStore(): RateLimitStore {
  const hits = new Map<string, number[]>();
  return {
    read: (key) => hits.get(key) ?? [],
    write: (key, timestamps) => {
      hits.set(key, timestamps);
    },
    remove: (key) => {
      hits.delete(key);
    },
    keys: () => [...hits.keys()],
    clear: () => hits.clear(),
  };
}

type RateLimiterOptions = {
  /** Nombre de tentatives autorisées dans la fenêtre. */
  max: number;
  /** Durée de la fenêtre, en millisecondes. */
  windowMs: number;
  /** Magasin des compteurs. En mémoire par défaut. */
  store?: RateLimitStore;
};

export type RateLimitResult = {
  allowed: boolean;
  /** Délai avant qu'une nouvelle tentative soit acceptée. 0 si autorisée. */
  retryAfterMs: number;
};

export type RateLimiter = {
  check: (key: string) => RateLimitResult;
  /** Nombre de clés suivies. Exposé pour les tests et le diagnostic. */
  size: () => number;
  reset: () => void;
};

export function createRateLimiter({
  max,
  windowMs,
  store = createMemoryStore(),
}: RateLimiterOptions): RateLimiter {
  /** Retire les clés dont toutes les tentatives sont sorties de la fenêtre. */
  function purge(now: number): void {
    for (const key of store.keys()) {
      const live = store.read(key).filter((t) => now - t < windowMs);
      if (live.length === 0) {
        store.remove(key);
      } else {
        store.write(key, live);
      }
    }
  }

  return {
    check(key: string): RateLimitResult {
      const now = Date.now();
      purge(now);

      const timestamps = store.read(key).filter((t) => now - t < windowMs);

      if (timestamps.length >= max) {
        const oldest = timestamps[0]!;
        store.write(key, timestamps);
        return { allowed: false, retryAfterMs: windowMs - (now - oldest) };
      }

      timestamps.push(now);
      store.write(key, timestamps);
      return { allowed: true, retryAfterMs: 0 };
    },

    size: () => store.keys().length,

    reset: () => store.clear(),
  };
}

/**
 * Limiteurs partagés par l'application. Volontairement stricts : ces deux
 * opérations sont les portes d'entrée du compte.
 */
export const loginLimiter = createRateLimiter({ max: 8, windowMs: 15 * 60 * 1000 });
export const registerLimiter = createRateLimiter({ max: 5, windowMs: 60 * 60 * 1000 });
