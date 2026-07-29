import { createRateLimiter, createMemoryStore } from '@/lib/rate-limit';
import type { RateLimitStore } from '@/lib/rate-limit';

/**
 * Vérifie que le comptage est bien indépendant du stockage : c'est ce qui
 * permettra de brancher Redis derrière plusieurs instances sans toucher
 * aux appelants.
 */
function createSpyStore(): RateLimitStore & { readCount: number; writeCount: number } {
  const inner = createMemoryStore();
  const spy = {
    readCount: 0,
    writeCount: 0,
    read: (key: string) => {
      spy.readCount++;
      return inner.read(key);
    },
    write: (key: string, timestamps: number[]) => {
      spy.writeCount++;
      inner.write(key, timestamps);
    },
    remove: inner.remove,
    keys: inner.keys,
    clear: inner.clear,
  };
  return spy;
}

describe('createRateLimiter — magasin injectable', () => {
  it('utilise le magasin fourni plutôt que la mémoire interne', () => {
    const store = createSpyStore();
    const limit = createRateLimiter({ max: 2, windowMs: 1000, store });

    limit.check('ip-1');

    expect(store.readCount).toBeGreaterThan(0);
    expect(store.writeCount).toBeGreaterThan(0);
  });

  it('applique la même règle quel que soit le magasin', () => {
    const store = createSpyStore();
    const limit = createRateLimiter({ max: 2, windowMs: 1000, store });

    expect(limit.check('ip-1').allowed).toBe(true);
    expect(limit.check('ip-1').allowed).toBe(true);
    expect(limit.check('ip-1').allowed).toBe(false);
  });

  it('deux limiteurs partageant un magasin comptent ensemble', () => {
    // C'est exactement le comportement attendu de plusieurs instances
    // derrière un magasin Redis commun.
    const partage = createMemoryStore();
    const instanceA = createRateLimiter({ max: 2, windowMs: 1000, store: partage });
    const instanceB = createRateLimiter({ max: 2, windowMs: 1000, store: partage });

    expect(instanceA.check('ip-1').allowed).toBe(true);
    expect(instanceB.check('ip-1').allowed).toBe(true);
    // La troisième tentative doit être refusée, peu importe l'instance.
    expect(instanceA.check('ip-1').allowed).toBe(false);
    expect(instanceB.check('ip-1').allowed).toBe(false);
  });

  it('deux limiteurs avec des magasins distincts comptent séparément', () => {
    const a = createRateLimiter({ max: 1, windowMs: 1000 });
    const b = createRateLimiter({ max: 1, windowMs: 1000 });

    expect(a.check('ip-1').allowed).toBe(true);
    // Sans magasin partagé, l'autre instance ne voit rien : c'est la limite
    // documentée du magasin en mémoire.
    expect(b.check('ip-1').allowed).toBe(true);
  });
});

describe('createMemoryStore', () => {
  it('rend un tableau vide pour une clé inconnue', () => {
    expect(createMemoryStore().read('inconnue')).toEqual([]);
  });

  it('conserve ce qui a été écrit', () => {
    const store = createMemoryStore();
    store.write('k', [1, 2, 3]);
    expect(store.read('k')).toEqual([1, 2, 3]);
    expect(store.keys()).toEqual(['k']);
  });

  it('oublie une clé retirée', () => {
    const store = createMemoryStore();
    store.write('k', [1]);
    store.remove('k');
    expect(store.read('k')).toEqual([]);
    expect(store.keys()).toEqual([]);
  });
});
