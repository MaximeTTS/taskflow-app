import { createHash, randomUUID } from 'node:crypto';
import type { RateLimitResult, RateLimitStore } from '@/lib/rate-limit';

/**
 * Magasin de limitation adossé à Redis, via l'API REST d'Upstash.
 *
 * Pourquoi REST et non un client TCP : ce projet tourne en fonctions
 * serverless. Un client TCP y ouvre une connexion par invocation, que rien ne
 * ferme proprement — on épuise le pool de Redis avant d'épuiser le trafic. Une
 * requête HTTP courte n'a pas ce défaut, et évite au passage une dépendance
 * npm de plus.
 *
 * Pourquoi un script Lua : la décision doit être atomique. Trois allers-retours
 * (lire, compter, écrire) laissent entre eux une fenêtre où deux requêtes
 * simultanées lisent le même compteur et passent toutes les deux — exactement
 * le cas que le limiteur existe pour empêcher, et exactement celui qu'une
 * attaque par force brute produit. Redis exécute le script d'un seul tenant.
 *
 * La fenêtre est glissante, implémentée par un ensemble trié dont le score est
 * l'horodatage : on retire ce qui est sorti de la fenêtre, on compte, on ajoute.
 */

/** Un magasin partagé est-il configuré ? */
export function isUpstashConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL?.trim() && process.env.UPSTASH_REDIS_REST_TOKEN?.trim(),
  );
}

/**
 * KEYS[1] clé, ARGV : maintenant (ms), fenêtre (ms), maximum, membre unique.
 * Rend {autorisé, délai avant réessai en ms}.
 *
 * Le membre est fourni par l'appelant plutôt que tiré dans le script : deux
 * tentatives arrivant à la même milliseconde produiraient le même membre, et
 * la seconde écraserait la première au lieu de s'ajouter — le compteur
 * sous-estimerait alors le nombre réel de tentatives.
 */
const SCRIPT = `
local key    = KEYS[1]
local now    = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local max    = tonumber(ARGV[3])
local member = ARGV[4]

redis.call('ZREMRANGEBYSCORE', key, '-inf', now - window)
local count = redis.call('ZCARD', key)

if count >= max then
  local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
  local retry = window
  if oldest[2] then
    retry = window - (now - tonumber(oldest[2]))
    if retry < 0 then retry = 0 end
  end
  return {0, tostring(math.ceil(retry))}
end

redis.call('ZADD', key, now, member)
-- L'expiration est repoussée à chaque tentative : une clé inactive disparaît
-- d'elle-même, sans quoi Redis conserverait indéfiniment chaque adresse vue.
redis.call('PEXPIRE', key, window)
return {1, '0'}
`.trim();

const SCRIPT_SHA = createHash('sha1').update(SCRIPT).digest('hex');

/** Au-delà, on considère Redis injoignable et le repli prend la main. */
const TIMEOUT_MS = 2_000;

/** Préfixe des clés, pour cohabiter avec d'autres usages du même Redis. */
const PREFIX = 'taskflow:rl:';

type UpstashResponse = { result?: unknown; error?: string };

export function createUpstashStore(): RateLimitStore {
  const url = process.env.UPSTASH_REDIS_REST_URL!.trim().replace(/\/+$/, '');
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!.trim();

  async function command(args: (string | number)[]): Promise<unknown> {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(args.map(String)),
      // Pas de cache : chaque appel doit atteindre Redis.
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    const payload = (await response.json().catch(() => ({}))) as UpstashResponse;

    if (!response.ok || payload.error) {
      throw new Error(payload.error ?? `Redis a répondu ${response.status}`);
    }
    return payload.result;
  }

  /**
   * Exécute le script. `EVALSHA` d'abord : le corps ne transite alors qu'une
   * fois par instance Redis, au lieu de 500 octets à chaque tentative de
   * connexion. `NOSCRIPT` signifie que le cache de scripts a été vidé
   * (redémarrage, `SCRIPT FLUSH`) — on renvoie le corps complet, ce qui le
   * remet en cache pour les appels suivants.
   */
  async function runScript(args: (string | number)[]): Promise<unknown> {
    try {
      return await command(['EVALSHA', SCRIPT_SHA, ...args]);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes('NOSCRIPT')) throw error;
      return command(['EVAL', SCRIPT, ...args]);
    }
  }

  function parse(result: unknown): RateLimitResult {
    if (!Array.isArray(result) || result.length < 2) {
      throw new Error(`Réponse inattendue de Redis : ${JSON.stringify(result)}`);
    }
    return {
      allowed: Number(result[0]) === 1,
      retryAfterMs: Number(result[1]) || 0,
    };
  }

  return {
    name: 'Redis (Upstash)',

    async hit(key, max, windowMs) {
      const result = await runScript([
        '1',
        `${PREFIX}${key}`,
        Date.now(),
        windowMs,
        max,
        // Unicité garantie côté appelant : voir le commentaire du script.
        `${Date.now()}-${randomUUID()}`,
      ]);
      return parse(result);
    },

    async reset(key) {
      if (key === undefined) {
        // Volontairement non implémenté : effacer toutes les clés demanderait
        // un balayage (`SCAN`) sur une base potentiellement partagée avec
        // d'autres usages. Les clés expirent seules au bout de la fenêtre.
        throw new Error(
          'reset() global non disponible sur le magasin Redis : les clés expirent d’elles-mêmes',
        );
      }
      await command(['DEL', `${PREFIX}${key}`]);
    },
  };
}
