/**
 * Limiteur de débit à fenêtre glissante, en mémoire.
 *
 * Portée volontairement limitée : l'état vit dans le processus. Derrière
 * plusieurs instances (Vercel, conteneurs répliqués), chaque instance compte
 * séparément — la protection est donc partielle. C'est un compromis assumé
 * pour éviter d'imposer Redis à ce projet ; le remplacement par un magasin
 * partagé se fait derrière cette même interface, sans toucher aux appelants.
 *
 * Sans cela, `login` acceptait un nombre illimité de tentatives : un mot de
 * passe faible tombait en quelques minutes.
 */

type RateLimiterOptions = {
  /** Nombre de tentatives autorisées dans la fenêtre. */
  max: number;
  /** Durée de la fenêtre, en millisecondes. */
  windowMs: number;
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

export function createRateLimiter({ max, windowMs }: RateLimiterOptions): RateLimiter {
  /** Horodatages des tentatives, par clé. */
  const hits = new Map<string, number[]>();

  /** Retire les clés dont toutes les tentatives sont sorties de la fenêtre. */
  function purge(now: number): void {
    for (const [key, timestamps] of hits) {
      const live = timestamps.filter((t) => now - t < windowMs);
      if (live.length === 0) {
        hits.delete(key);
      } else if (live.length !== timestamps.length) {
        hits.set(key, live);
      }
    }
  }

  return {
    check(key: string): RateLimitResult {
      const now = Date.now();
      purge(now);

      const timestamps = (hits.get(key) ?? []).filter((t) => now - t < windowMs);

      if (timestamps.length >= max) {
        const oldest = timestamps[0]!;
        hits.set(key, timestamps);
        return { allowed: false, retryAfterMs: windowMs - (now - oldest) };
      }

      timestamps.push(now);
      hits.set(key, timestamps);
      return { allowed: true, retryAfterMs: 0 };
    },

    size: () => hits.size,

    reset: () => hits.clear(),
  };
}

/**
 * Limiteurs partagés par l'application. Volontairement stricts : ces deux
 * opérations sont les portes d'entrée du compte.
 */
export const loginLimiter = createRateLimiter({ max: 8, windowMs: 15 * 60 * 1000 });
export const registerLimiter = createRateLimiter({ max: 5, windowMs: 60 * 60 * 1000 });
