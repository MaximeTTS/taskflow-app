import { createRateLimiter, createMemoryStore, withFallback } from '@/lib/rate-limit';
import type { RateLimitResult, RateLimitStore } from '@/lib/rate-limit';

/**
 * Magasin espion, pour verifier que la decision est bien deleguee au magasin
 * et non recalculee au-dessus de lui : c'est ce qui permet a Redis de la
 * rendre atomique.
 */
function createSpyStore(): RateLimitStore & { hits: string[] } {
  const inner = createMemoryStore();
  const hits: string[] = [];

  return {
    name: 'espion',
    hits,
    hit(key, max, windowMs) {
      hits.push(key);
      return inner.hit(key, max, windowMs);
    },
    reset: inner.reset,
    size: inner.size,
  };
}

/** Magasin qui echoue toujours, pour eprouver le repli. */
function createBrokenStore(): RateLimitStore {
  return {
    name: 'casse',
    async hit() {
      throw new Error('Redis injoignable');
    },
    async reset() {
      throw new Error('Redis injoignable');
    },
  };
}

describe('createRateLimiter — magasin injectable', () => {
  it('delegue la decision au magasin fourni', async () => {
    const store = createSpyStore();
    const limit = createRateLimiter({ max: 2, windowMs: 1000, store });

    await limit.check('ip-1');

    expect(store.hits).toEqual(['ip-1']);
  });

  it('applique la meme regle quel que soit le magasin', async () => {
    const store = createSpyStore();
    const limit = createRateLimiter({ max: 2, windowMs: 1000, store });

    expect((await limit.check('ip-1')).allowed).toBe(true);
    expect((await limit.check('ip-1')).allowed).toBe(true);
    expect((await limit.check('ip-1')).allowed).toBe(false);
  });

  it('deux limiteurs partageant un magasin comptent ensemble', async () => {
    // C'est exactement le comportement attendu de plusieurs instances
    // derriere un magasin Redis commun.
    const partage = createMemoryStore();
    const instanceA = createRateLimiter({ max: 2, windowMs: 1000, store: partage });
    const instanceB = createRateLimiter({ max: 2, windowMs: 1000, store: partage });

    expect((await instanceA.check('ip-1')).allowed).toBe(true);
    expect((await instanceB.check('ip-1')).allowed).toBe(true);
    // La troisieme tentative doit etre refusee, peu importe l'instance.
    expect((await instanceA.check('ip-1')).allowed).toBe(false);
    expect((await instanceB.check('ip-1')).allowed).toBe(false);
  });

  it('deux limiteurs avec des magasins distincts comptent separement', async () => {
    const a = createRateLimiter({ max: 1, windowMs: 1000 });
    const b = createRateLimiter({ max: 1, windowMs: 1000 });

    expect((await a.check('ip-1')).allowed).toBe(true);
    // Sans magasin partage, l'autre instance ne voit rien : c'est la limite
    // documentee du magasin en memoire.
    expect((await b.check('ip-1')).allowed).toBe(true);
  });
});

describe('createMemoryStore', () => {
  it('autorise sous la limite et refuse au-dela', async () => {
    const store = createMemoryStore();
    expect((await store.hit('k', 1, 1000)).allowed).toBe(true);
    expect((await store.hit('k', 1, 1000)).allowed).toBe(false);
  });

  it('oublie une cle reinitialisee', async () => {
    const store = createMemoryStore();
    await store.hit('k', 1, 1000);
    expect((await store.hit('k', 1, 1000)).allowed).toBe(false);

    await store.reset('k');
    expect((await store.hit('k', 1, 1000)).allowed).toBe(true);
  });

  it('oublie tout sans argument', async () => {
    const store = createMemoryStore();
    await store.hit('a', 1, 1000);
    await store.hit('b', 1, 1000);
    expect(store.size?.()).toBe(2);

    await store.reset();
    expect(store.size?.()).toBe(0);
  });
});

describe('withFallback — panne du magasin partage', () => {
  const erreurs: unknown[][] = [];
  let spy: jest.SpyInstance;

  beforeEach(() => {
    erreurs.length = 0;
    spy = jest.spyOn(console, 'error').mockImplementation((...args) => {
      erreurs.push(args);
    });
  });

  afterEach(() => spy.mockRestore());

  it('continue de limiter en memoire quand Redis est injoignable', async () => {
    const store = withFallback(createBrokenStore(), createMemoryStore());
    const limit = createRateLimiter({ max: 2, windowMs: 1000, store });

    // La protection est degradee — locale a l'instance — mais pas absente.
    expect((await limit.check('ip-1')).allowed).toBe(true);
    expect((await limit.check('ip-1')).allowed).toBe(true);
    expect((await limit.check('ip-1')).allowed).toBe(false);
  });

  it('ne journalise le basculement qu’une fois', async () => {
    const store = withFallback(createBrokenStore(), createMemoryStore());
    const limit = createRateLimiter({ max: 10, windowMs: 1000, store });

    for (let i = 0; i < 5; i++) await limit.check('ip-1');

    expect(erreurs).toHaveLength(1);
    expect(String(erreurs[0]?.[0])).toMatch(/repli en memoire/);
  });

  it('prefere le magasin partage quand il repond', async () => {
    const partage = createSpyStore();
    const store = withFallback(partage, createMemoryStore());
    const limit = createRateLimiter({ max: 2, windowMs: 1000, store });

    await limit.check('ip-1');

    expect(partage.hits).toEqual(['ip-1']);
    expect(erreurs).toHaveLength(0);
  });
});

describe('withFallback — retour a la normale', () => {
  it('signale le retour du magasin partage', async () => {
    let enPanne = true;
    const intermittent: RateLimitStore = {
      name: 'intermittent',
      async hit(): Promise<RateLimitResult> {
        if (enPanne) throw new Error('Redis injoignable');
        return { allowed: true, retryAfterMs: 0 };
      },
      async reset() {},
    };

    const infos: string[] = [];
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const infoSpy = jest.spyOn(console, 'info').mockImplementation((m) => {
      infos.push(String(m));
    });

    try {
      const limit = createRateLimiter({
        max: 5,
        windowMs: 1000,
        store: withFallback(intermittent, createMemoryStore()),
      });

      await limit.check('ip-1');
      enPanne = false;
      await limit.check('ip-1');

      expect(infos.some((m) => /de nouveau joignable/.test(m))).toBe(true);
    } finally {
      errSpy.mockRestore();
      infoSpy.mockRestore();
    }
  });
});
