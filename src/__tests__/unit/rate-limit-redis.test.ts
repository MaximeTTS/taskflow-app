import { createUpstashStore, isUpstashConfigured } from '@/lib/rate-limit-redis';

/**
 * Le magasin Redis est teste contre une fausse API Upstash plutot que contre
 * un vrai serveur : ce qui doit etre verifie ici, c'est le protocole — quelle
 * commande part, avec quels arguments, et comment la reponse est lue. Le
 * comportement de Redis lui-meme n'est pas ce qui risque de casser.
 */

type Appel = { args: string[] };

function installFetch(reponses: (unknown | Error)[]): Appel[] {
  const appels: Appel[] = [];
  let index = 0;

  global.fetch = jest.fn(async (_url: unknown, init?: { body?: BodyInit | null }) => {
    appels.push({ args: JSON.parse(String(init?.body)) as string[] });

    const reponse = reponses[Math.min(index, reponses.length - 1)];
    index += 1;

    if (reponse instanceof Error) {
      return {
        ok: false,
        status: 400,
        json: async () => ({ error: reponse.message }),
      };
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({ result: reponse }),
    };
  }) as unknown as typeof fetch;

  return appels;
}

describe('isUpstashConfigured', () => {
  const original = { ...process.env };
  afterEach(() => {
    process.env = { ...original };
  });

  it('est faux sans variables', () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    expect(isUpstashConfigured()).toBe(false);
  });

  it('exige les deux variables', () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://exemple.upstash.io';
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    expect(isUpstashConfigured()).toBe(false);

    process.env.UPSTASH_REDIS_REST_TOKEN = 'jeton';
    expect(isUpstashConfigured()).toBe(true);
  });

  it('ignore les valeurs vides', () => {
    process.env.UPSTASH_REDIS_REST_URL = '   ';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'jeton';
    expect(isUpstashConfigured()).toBe(false);
  });
});

describe('createUpstashStore', () => {
  const originalFetch = global.fetch;
  const original = { ...process.env };

  beforeEach(() => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://exemple.upstash.io/';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'jeton-secret';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env = { ...original };
  });

  it('lit une autorisation', async () => {
    installFetch([[1, '0']]);
    const store = createUpstashStore();

    expect(await store.hit('ip-1', 5, 60_000)).toEqual({ allowed: true, retryAfterMs: 0 });
  });

  it('lit un refus et son delai', async () => {
    installFetch([[0, '42000']]);
    const store = createUpstashStore();

    expect(await store.hit('ip-1', 5, 60_000)).toEqual({ allowed: false, retryAfterMs: 42000 });
  });

  it('passe par EVALSHA pour ne pas renvoyer le script a chaque tentative', async () => {
    const appels = installFetch([[1, '0']]);
    await createUpstashStore().hit('ip-1', 5, 60_000);

    expect(appels[0]?.args[0]).toBe('EVALSHA');
    // Empreinte SHA-1 : 40 caracteres hexadecimaux.
    expect(appels[0]?.args[1]).toMatch(/^[0-9a-f]{40}$/);
  });

  it('renvoie le script complet quand Redis ne le connait plus', async () => {
    // Cas reel : redemarrage de Redis ou SCRIPT FLUSH. Sans ce repli, le
    // limiteur tomberait en panne jusqu'au prochain deploiement.
    const appels = installFetch([new Error('NOSCRIPT No matching script'), [1, '0']]);

    const resultat = await createUpstashStore().hit('ip-1', 5, 60_000);

    expect(appels).toHaveLength(2);
    expect(appels[0]?.args[0]).toBe('EVALSHA');
    expect(appels[1]?.args[0]).toBe('EVAL');
    expect(appels[1]?.args[1]).toContain('ZREMRANGEBYSCORE');
    expect(resultat.allowed).toBe(true);
  });

  it('transmet la fenetre, le maximum et un membre unique', async () => {
    const appels = installFetch([[1, '0'], [1, '0']]);
    const store = createUpstashStore();

    await store.hit('ip-1', 7, 90_000);
    await store.hit('ip-1', 7, 90_000);

    // EVALSHA, sha, nbCles, cle, maintenant, fenetre, max, membre
    const premier = appels[0]!.args;
    expect(premier[2]).toBe('1');
    expect(premier[3]).toBe('taskflow:rl:ip-1');
    expect(premier[5]).toBe('90000');
    expect(premier[6]).toBe('7');

    // Deux tentatives a la meme milliseconde ne doivent pas produire le meme
    // membre, sinon la seconde ecraserait la premiere dans l'ensemble trie.
    expect(appels[1]!.args[7]).not.toBe(premier[7]);
  });

  it('prefixe les cles pour cohabiter avec d’autres usages du meme Redis', async () => {
    const appels = installFetch([[1, '0']]);
    await createUpstashStore().hit('login:ip-1', 5, 60_000);

    expect(appels[0]?.args[3]).toBe('taskflow:rl:login:ip-1');
  });

  it('leve quand Redis renvoie une erreur, pour que le repli prenne la main', async () => {
    installFetch([new Error('WRONGPASS invalid credentials')]);

    await expect(createUpstashStore().hit('ip-1', 5, 60_000)).rejects.toThrow(/WRONGPASS/);
  });

  it('leve sur une reponse de forme inattendue', async () => {
    installFetch(['pas un tableau']);

    await expect(createUpstashStore().hit('ip-1', 5, 60_000)).rejects.toThrow(/inattendue/);
  });

  it('supprime une cle sur reset', async () => {
    const appels = installFetch([1]);
    await createUpstashStore().reset('login:ip-1');

    expect(appels[0]?.args).toEqual(['DEL', 'taskflow:rl:login:ip-1']);
  });

  it('refuse un reset global plutot que de balayer la base', async () => {
    installFetch([1]);
    await expect(createUpstashStore().reset()).rejects.toThrow(/non disponible/);
  });

  it('porte le jeton d’authentification', async () => {
    installFetch([[1, '0']]);
    await createUpstashStore().hit('ip-1', 5, 60_000);

    const [, init] = (global.fetch as jest.Mock).mock.calls[0] as [
      string,
      { headers: Record<string, string> },
    ];
    expect(init.headers.Authorization).toBe('Bearer jeton-secret');
  });

  it('retire la barre oblique finale de l’URL', async () => {
    installFetch([[1, '0']]);
    await createUpstashStore().hit('ip-1', 5, 60_000);

    const [url] = (global.fetch as jest.Mock).mock.calls[0] as [string];
    expect(url).toBe('https://exemple.upstash.io');
  });
});
