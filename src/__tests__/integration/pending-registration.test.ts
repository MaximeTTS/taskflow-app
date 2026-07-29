/**
 * Inscription différée.
 *
 * Le compte naît à l'ouverture du lien, pas à la soumission du formulaire.
 * Ces tests fixent les deux propriétés qui font tenir la garantie :
 *
 *   — une demande remplace la précédente pour la même adresse, ce qui
 *     invalide l'ancien lien ;
 *   — un lien ne crée qu'un compte, même ouvert deux fois.
 */

const demandeDb = {
  upsert: jest.fn(),
  findUnique: jest.fn(),
  deleteMany: jest.fn(),
};
const utilisateurDb = { create: jest.fn() };

jest.mock('@/lib/prisma', () => ({
  prisma: {
    pendingRegistration: demandeDb,
    user: utilisateurDb,
    // La transaction exécute simplement le rappel avec les mêmes doubles :
    // ce qu'on veut vérifier est l'enchaînement, pas l'isolation de Postgres.
    $transaction: (rappel: (tx: unknown) => unknown) =>
      rappel({ pendingRegistration: demandeDb, user: utilisateurDb }),
  },
}));

import {
  issuePendingRegistration,
  consumePendingRegistration,
  hasPendingRegistration,
} from '@/lib/pending-registration';

const DANS_UNE_HEURE = () => new Date(Date.now() + 3_600_000);
const IL_Y_A_UNE_HEURE = () => new Date(Date.now() - 3_600_000);

beforeEach(() => {
  jest.clearAllMocks();
  demandeDb.upsert.mockResolvedValue({});
  demandeDb.deleteMany.mockResolvedValue({ count: 1 });
  utilisateurDb.create.mockResolvedValue({
    id: 'u1',
    email: 'neuf@example.com',
    name: null,
    avatar: null,
  });
});

describe('issuePendingRegistration', () => {
  it('rend un jeton opaque et ne stocke que son empreinte', async () => {
    const token = await issuePendingRegistration({
      email: 'neuf@example.com',
      name: 'Neuf',
      passwordHash: '$2b$10$empreinte',
    });

    expect(token).toHaveLength(43); // 32 octets en base64url
    const écrit = demandeDb.upsert.mock.calls[0]![0] as {
      create: { tokenHash: string };
    };
    expect(écrit.create.tokenHash).not.toBe(token);
    expect(écrit.create.tokenHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('remplace la demande précédente pour la même adresse', async () => {
    await issuePendingRegistration({
      email: 'neuf@example.com',
      name: null,
      passwordHash: '$2b$10$a',
    });

    // L'upsert sur l'email est ce qui invalide l'ancien lien : deux demandes
    // vivantes pour une même adresse laisseraient deux mots de passe
    // candidats, et le premier lien ouvert l'emporterait.
    const appel = demandeDb.upsert.mock.calls[0]![0] as { where: { email: string } };
    expect(appel.where).toEqual({ email: 'neuf@example.com' });
  });

  it('deux demandes produisent deux jetons différents', async () => {
    const a = await issuePendingRegistration({
      email: 'a@example.com',
      name: null,
      passwordHash: 'x',
    });
    const b = await issuePendingRegistration({
      email: 'a@example.com',
      name: null,
      passwordHash: 'x',
    });

    expect(a).not.toBe(b);
  });
});

describe('consumePendingRegistration', () => {
  it('crée le compte, déjà vérifié', async () => {
    demandeDb.findUnique.mockResolvedValue({
      id: 'd1',
      email: 'neuf@example.com',
      name: 'Neuf',
      password: '$2b$10$empreinte',
      expiresAt: DANS_UNE_HEURE(),
    });

    const compte = await consumePendingRegistration('un-jeton');

    expect(compte).toMatchObject({ id: 'u1', email: 'neuf@example.com' });

    const données = (utilisateurDb.create.mock.calls[0]![0] as { data: Record<string, unknown> })
      .data;
    expect(données.password).toBe('$2b$10$empreinte');
    // Le compte naît vérifié : ouvrir le lien *est* la preuve d'adresse.
    expect(données.emailVerifiedAt).toBeInstanceOf(Date);
  });

  it('refuse un jeton inconnu', async () => {
    demandeDb.findUnique.mockResolvedValue(null);

    expect(await consumePendingRegistration('inconnu')).toBeNull();
    expect(utilisateurDb.create).not.toHaveBeenCalled();
  });

  it('refuse un jeton expiré', async () => {
    demandeDb.findUnique.mockResolvedValue({
      id: 'd1',
      email: 'neuf@example.com',
      name: null,
      password: 'x',
      expiresAt: IL_Y_A_UNE_HEURE(),
    });

    expect(await consumePendingRegistration('perime')).toBeNull();
    expect(utilisateurDb.create).not.toHaveBeenCalled();
  });

  it('refuse une valeur vide sans interroger la base', async () => {
    expect(await consumePendingRegistration('')).toBeNull();
    expect(demandeDb.findUnique).not.toHaveBeenCalled();
  });

  it('ne crée pas deux comptes si le lien est ouvert deux fois', async () => {
    demandeDb.findUnique.mockResolvedValue({
      id: 'd1',
      email: 'neuf@example.com',
      name: null,
      password: 'x',
      expiresAt: DANS_UNE_HEURE(),
    });
    // La seconde requête ne supprime rien : la demande a déjà été consommée.
    demandeDb.deleteMany.mockResolvedValue({ count: 0 });

    expect(await consumePendingRegistration('un-jeton')).toBeNull();
    expect(utilisateurDb.create).not.toHaveBeenCalled();
  });

  it('rend null si l’adresse a été prise entre-temps', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      demandeDb.findUnique.mockResolvedValue({
        id: 'd1',
        email: 'neuf@example.com',
        name: null,
        password: 'x',
        expiresAt: DANS_UNE_HEURE(),
      });
      utilisateurDb.create.mockRejectedValue(new Error('Unique constraint failed on email'));

      expect(await consumePendingRegistration('un-jeton')).toBeNull();
    } finally {
      spy.mockRestore();
    }
  });
});

describe('hasPendingRegistration', () => {
  it('est vrai pour une demande vivante', async () => {
    demandeDb.findUnique.mockResolvedValue({ expiresAt: DANS_UNE_HEURE() });
    expect(await hasPendingRegistration('a@example.com')).toBe(true);
  });

  it('est faux pour une demande expirée', async () => {
    demandeDb.findUnique.mockResolvedValue({ expiresAt: IL_Y_A_UNE_HEURE() });
    expect(await hasPendingRegistration('a@example.com')).toBe(false);
  });

  it('est faux quand il n’y a rien', async () => {
    demandeDb.findUnique.mockResolvedValue(null);
    expect(await hasPendingRegistration('a@example.com')).toBe(false);
  });
});
