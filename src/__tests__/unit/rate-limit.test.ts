import { createRateLimiter } from '@/lib/rate-limit';

describe('createRateLimiter', () => {
  it('laisse passer les tentatives sous la limite', async () => {
    const limit = createRateLimiter({ max: 3, windowMs: 1000 });
    expect((await limit.check('ip-1')).allowed).toBe(true);
    expect((await limit.check('ip-1')).allowed).toBe(true);
    expect((await limit.check('ip-1')).allowed).toBe(true);
  });

  it('bloque au-dela de la limite', async () => {
    const limit = createRateLimiter({ max: 3, windowMs: 1000 });
    await limit.check('ip-1');
    await limit.check('ip-1');
    await limit.check('ip-1');
    expect((await limit.check('ip-1')).allowed).toBe(false);
  });

  it('compte chaque cle independamment', async () => {
    const limit = createRateLimiter({ max: 2, windowMs: 1000 });
    await limit.check('ip-1');
    await limit.check('ip-1');
    expect((await limit.check('ip-1')).allowed).toBe(false);
    expect((await limit.check('ip-2')).allowed).toBe(true);
  });

  it('libere la cle une fois la fenetre ecoulee', async () => {
    jest.useFakeTimers();
    try {
      const limit = createRateLimiter({ max: 2, windowMs: 1000 });
      await limit.check('ip-1');
      await limit.check('ip-1');
      expect((await limit.check('ip-1')).allowed).toBe(false);

      jest.advanceTimersByTime(1001);
      expect((await limit.check('ip-1')).allowed).toBe(true);
    } finally {
      jest.useRealTimers();
    }
  });

  it('utilise une fenetre glissante et non un seau remis a zero', async () => {
    jest.useFakeTimers();
    try {
      const limit = createRateLimiter({ max: 2, windowMs: 1000 });
      await limit.check('ip-1'); // t=0
      jest.advanceTimersByTime(600);
      await limit.check('ip-1'); // t=600
      jest.advanceTimersByTime(500); // t=1100 : la 1re tentative est sortie de la fenetre
      expect((await limit.check('ip-1')).allowed).toBe(true); // seules 600 et 1100 comptent
      expect((await limit.check('ip-1')).allowed).toBe(false); // 3 tentatives dans la fenetre
    } finally {
      jest.useRealTimers();
    }
  });

  it('indique le delai avant reessai quand la limite est atteinte', async () => {
    jest.useFakeTimers();
    try {
      const limit = createRateLimiter({ max: 1, windowMs: 5000 });
      await limit.check('ip-1');
      const blocked = await limit.check('ip-1');
      expect(blocked.allowed).toBe(false);
      expect(blocked.retryAfterMs).toBeGreaterThan(0);
      expect(blocked.retryAfterMs).toBeLessThanOrEqual(5000);
    } finally {
      jest.useRealTimers();
    }
  });

  it('purge les cles expirees pour ne pas fuir en memoire', async () => {
    jest.useFakeTimers();
    try {
      const limit = createRateLimiter({ max: 1, windowMs: 1000 });
      for (let i = 0; i < 500; i++) await limit.check(`ip-${i}`);
      expect(limit.size()).toBe(500);

      jest.advanceTimersByTime(1001);
      await limit.check('declencheur');
      // Les 500 cles expirees ont ete purgees, seule la nouvelle subsiste.
      expect(limit.size()).toBeLessThanOrEqual(2);
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('createRateLimiter — espace de noms', () => {
  it('isole deux limiteurs qui partagent un magasin', async () => {
    // Le cas concret : loginLimiter et registerLimiter partagent desormais le
    // magasin de l'application. Sans prefixe, cinq inscriptions depuis une
    // adresse bloqueraient les connexions depuis cette meme adresse.
    const { createMemoryStore } = await import('@/lib/rate-limit');
    const partage = createMemoryStore();

    const connexion = createRateLimiter({
      max: 1,
      windowMs: 1000,
      store: partage,
      prefix: 'login',
    });
    const inscription = createRateLimiter({
      max: 1,
      windowMs: 1000,
      store: partage,
      prefix: 'register',
    });

    expect((await inscription.check('ip-1')).allowed).toBe(true);
    expect((await inscription.check('ip-1')).allowed).toBe(false);
    // La connexion depuis la meme adresse reste intacte.
    expect((await connexion.check('ip-1')).allowed).toBe(true);
  });

  it('compte ensemble sans prefixe distinct', async () => {
    const { createMemoryStore } = await import('@/lib/rate-limit');
    const partage = createMemoryStore();

    const a = createRateLimiter({ max: 1, windowMs: 1000, store: partage, prefix: 'meme' });
    const b = createRateLimiter({ max: 1, windowMs: 1000, store: partage, prefix: 'meme' });

    expect((await a.check('ip-1')).allowed).toBe(true);
    expect((await b.check('ip-1')).allowed).toBe(false);
  });
});
