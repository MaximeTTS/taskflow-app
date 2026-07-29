import { createRateLimiter } from '@/lib/rate-limit';

describe('createRateLimiter', () => {
  it('laisse passer les tentatives sous la limite', () => {
    const limit = createRateLimiter({ max: 3, windowMs: 1000 });
    expect(limit.check('ip-1').allowed).toBe(true);
    expect(limit.check('ip-1').allowed).toBe(true);
    expect(limit.check('ip-1').allowed).toBe(true);
  });

  it('bloque au-dela de la limite', () => {
    const limit = createRateLimiter({ max: 3, windowMs: 1000 });
    limit.check('ip-1');
    limit.check('ip-1');
    limit.check('ip-1');
    expect(limit.check('ip-1').allowed).toBe(false);
  });

  it('compte chaque cle independamment', () => {
    const limit = createRateLimiter({ max: 2, windowMs: 1000 });
    limit.check('ip-1');
    limit.check('ip-1');
    expect(limit.check('ip-1').allowed).toBe(false);
    expect(limit.check('ip-2').allowed).toBe(true);
  });

  it('libere la cle une fois la fenetre ecoulee', () => {
    jest.useFakeTimers();
    try {
      const limit = createRateLimiter({ max: 2, windowMs: 1000 });
      limit.check('ip-1');
      limit.check('ip-1');
      expect(limit.check('ip-1').allowed).toBe(false);

      jest.advanceTimersByTime(1001);
      expect(limit.check('ip-1').allowed).toBe(true);
    } finally {
      jest.useRealTimers();
    }
  });

  it('utilise une fenetre glissante et non un seau remis a zero', () => {
    jest.useFakeTimers();
    try {
      const limit = createRateLimiter({ max: 2, windowMs: 1000 });
      limit.check('ip-1'); // t=0
      jest.advanceTimersByTime(600);
      limit.check('ip-1'); // t=600
      jest.advanceTimersByTime(500); // t=1100 : la 1re tentative est sortie de la fenetre
      expect(limit.check('ip-1').allowed).toBe(true); // t=1100, seules 600 et 1100 comptent
      expect(limit.check('ip-1').allowed).toBe(false); // 3 tentatives dans la fenetre
    } finally {
      jest.useRealTimers();
    }
  });

  it('indique le delai avant reessai quand la limite est atteinte', () => {
    jest.useFakeTimers();
    try {
      const limit = createRateLimiter({ max: 1, windowMs: 5000 });
      limit.check('ip-1');
      const blocked = limit.check('ip-1');
      expect(blocked.allowed).toBe(false);
      expect(blocked.retryAfterMs).toBeGreaterThan(0);
      expect(blocked.retryAfterMs).toBeLessThanOrEqual(5000);
    } finally {
      jest.useRealTimers();
    }
  });

  it('purge les cles expirees pour ne pas fuir en memoire', () => {
    jest.useFakeTimers();
    try {
      const limit = createRateLimiter({ max: 1, windowMs: 1000 });
      for (let i = 0; i < 500; i++) limit.check(`ip-${i}`);
      expect(limit.size()).toBe(500);

      jest.advanceTimersByTime(1001);
      limit.check('declencheur');
      // Les 500 cles expirees ont ete purgees, seule la nouvelle subsiste.
      expect(limit.size()).toBeLessThanOrEqual(2);
    } finally {
      jest.useRealTimers();
    }
  });
});
