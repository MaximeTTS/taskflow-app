import { createUpstashStore, isUpstashConfigured } from '@/lib/rate-limit-redis';

/**
 * Limiteur de débit à fenêtre glissante.
 *
 * Sans lui, `login` acceptait un nombre illimité de tentatives : un mot de
 * passe faible tombait en quelques minutes.
 *
 * Le comptage est délégué au magasin, et non calculé au-dessus de lui. C'est
 * la différence qui compte : « lire, décider, écrire » depuis le processus
 * laisse une fenêtre entre la lecture et l'écriture, que deux requêtes
 * simultanées franchissent ensemble. Confier la décision au magasin permet à
 * Redis de la rendre atomique — un unique script côté serveur.
 *
 * Deux magasins :
 *   mémoire — suffit à une instance unique, compte séparément derrière
 *             plusieurs répliques (Vercel, conteneurs) ;
 *   Redis   — partagé entre toutes les instances, c'est celui qui protège
 *             réellement en production.
 *
 * Le choix est fait par la configuration, pas par le code appelant.
 */

export type RateLimitResult = {
  allowed: boolean;
  /** Délai avant qu'une nouvelle tentative soit acceptée. 0 si autorisée. */
  retryAfterMs: number;
};

/**
 * Stockage et décision.
 *
 * Asynchrone parce que Redis l'est : rendre l'interface synchrone reviendrait
 * à exclure d'emblée la seule implémentation qui résout le problème.
 */
export type RateLimitStore = {
  /** Nom court, pour les journaux de démarrage. */
  readonly name: string;
  /**
   * Enregistre une tentative sur `key` et rend la décision.
   * Doit être atomique : c'est tout l'intérêt de porter la règle ici.
   */
  hit: (key: string, max: number, windowMs: number) => Promise<RateLimitResult>;
  /** Oublie une clé, ou toutes si `key` est absente. */
  reset: (key?: string) => Promise<void>;
  /** Nombre de clés suivies, quand le magasin peut le dire. Diagnostic et tests. */
  size?: () => number;
};

/**
 * Magasin par défaut : une Map dans le processus courant.
 *
 * Honnête sur ce qu'il fait — et ne fait pas. Derrière plusieurs instances,
 * chacune compte pour elle seule : huit tentatives autorisées deviennent huit
 * par réplique. C'est mieux que rien, ce n'est pas une protection.
 */
export function createMemoryStore(): RateLimitStore {
  const hits = new Map<string, number[]>();

  /** Retire les clés dont toutes les tentatives sont sorties de la fenêtre. */
  function purge(now: number, windowMs: number): void {
    for (const [key, timestamps] of hits) {
      const live = timestamps.filter((t) => now - t < windowMs);
      if (live.length === 0) {
        hits.delete(key);
      } else {
        hits.set(key, live);
      }
    }
  }

  return {
    name: 'mémoire',

    async hit(key, max, windowMs) {
      const now = Date.now();
      purge(now, windowMs);

      const timestamps = (hits.get(key) ?? []).filter((t) => now - t < windowMs);

      if (timestamps.length >= max) {
        hits.set(key, timestamps);
        const oldest = timestamps[0]!;
        return { allowed: false, retryAfterMs: windowMs - (now - oldest) };
      }

      timestamps.push(now);
      hits.set(key, timestamps);
      return { allowed: true, retryAfterMs: 0 };
    },

    async reset(key) {
      if (key === undefined) hits.clear();
      else hits.delete(key);
    },

    size: () => hits.size,
  };
}

/**
 * Enveloppe un magasin distant d'un repli en mémoire.
 *
 * Question posée par toute panne de Redis : laisser passer, ou tout bloquer ?
 * Laisser passer rouvre le brute force ; tout bloquer met la connexion hors
 * service pour l'ensemble des utilisateurs, ce qui transforme un incident
 * Redis en panne d'authentification. Le repli garde la protection au niveau du
 * magasin mémoire — dégradé, jamais absent.
 */
export function withFallback(primary: RateLimitStore, backup: RateLimitStore): RateLimitStore {
  // Une panne de Redis produirait une ligne de journal par tentative de
  // connexion. On signale le basculement, puis le retour.
  let dégradé = false;

  return {
    name: `${primary.name} (repli ${backup.name})`,

    async hit(key, max, windowMs) {
      try {
        const result = await primary.hit(key, max, windowMs);
        if (dégradé) {
          console.info('[rate-limit] magasin partage de nouveau joignable');
          dégradé = false;
        }
        return result;
      } catch (error) {
        if (!dégradé) {
          console.error(
            '[rate-limit] magasin partage injoignable, repli en memoire — la limite ' +
              'redevient locale a chaque instance',
            error,
          );
          dégradé = true;
        }
        return backup.hit(key, max, windowMs);
      }
    },

    async reset(key) {
      await Promise.allSettled([primary.reset(key), backup.reset(key)]);
    },

    size: backup.size,
  };
}

/**
 * Magasin retenu pour l'application : Redis s'il est configuré, mémoire sinon.
 * Résolu une seule fois, au chargement du module.
 */
function createDefaultStore(): RateLimitStore {
  const mémoire = createMemoryStore();

  if (!isUpstashConfigured()) {
    return mémoire;
  }

  return withFallback(createUpstashStore(), mémoire);
}

type RateLimiterOptions = {
  /** Nombre de tentatives autorisées dans la fenêtre. */
  max: number;
  /** Durée de la fenêtre, en millisecondes. */
  windowMs: number;
  /** Magasin des compteurs. Un magasin mémoire dédié par défaut. */
  store?: RateLimitStore;
  /**
   * Espace de noms des clés.
   *
   * Indispensable dès que plusieurs limiteurs partagent un magasin : sans lui,
   * `login` et `register` compteraient la même adresse IP dans le même
   * compteur, et cinq inscriptions suffiraient à bloquer les connexions.
   */
  prefix?: string;
};

export type RateLimiter = {
  check: (key: string) => Promise<RateLimitResult>;
  /** Nombre de clés suivies. Exposé pour les tests et le diagnostic. */
  size: () => number;
  reset: (key?: string) => Promise<void>;
};

export function createRateLimiter({
  max,
  windowMs,
  store,
  prefix = '',
}: RateLimiterOptions): RateLimiter {
  const magasin = store ?? createMemoryStore();
  const namespaced = (key: string) => (prefix ? `${prefix}:${key}` : key);

  return {
    check: (key: string) => magasin.hit(namespaced(key), max, windowMs),
    size: () => magasin.size?.() ?? 0,
    reset: (key?: string) => magasin.reset(key === undefined ? undefined : namespaced(key)),
  };
}

/**
 * Magasin partagé par les limiteurs de l'application. Un seul, pour que les
 * quotas de `login` et de `register` s'appuient sur la même connexion.
 */
const applicationStore = createDefaultStore();

/** Nom du magasin actif. Journalisé au démarrage pour lever toute ambiguïté. */
export const rateLimitBackend = applicationStore.name;

/**
 * Limiteurs partagés par l'application. Volontairement stricts : ces deux
 * opérations sont les portes d'entrée du compte.
 */
export const loginLimiter = createRateLimiter({
  max: 8,
  windowMs: 15 * 60 * 1000,
  store: applicationStore,
  prefix: 'login',
});

export const registerLimiter = createRateLimiter({
  max: 5,
  windowMs: 60 * 60 * 1000,
  store: applicationStore,
  prefix: 'register',
});

/** Demandes de réinitialisation : par adresse IP et par compte visé. */
export const forgotPasswordLimiter = createRateLimiter({
  max: 5,
  windowMs: 60 * 60 * 1000,
  store: applicationStore,
  prefix: 'forgot',
});

/** Renvois de lien de vérification d'email. */
export const verificationLimiter = createRateLimiter({
  max: 5,
  windowMs: 60 * 60 * 1000,
  store: applicationStore,
  prefix: 'verify',
});
