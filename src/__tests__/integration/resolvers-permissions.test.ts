/**
 * Tests d'intégration des resolvers.
 *
 * Les tests unitaires couvraient les fonctions pures (hiérarchie des rôles,
 * validation, limiteur de débit). Ils ne disaient rien de leur câblage : un
 * resolver qui oublierait d'appeler `requireProjectRole` passait toutes les
 * suites au vert.
 *
 * Ici on exerce les resolvers eux-mêmes, avec Prisma remplacé par un double.
 * Ce sont les règles d'autorisation qui sont vérifiées, pas la base.
 */

import { resolvers } from '@/graphql/schema/resolvers';
import { prisma } from '@/lib/prisma';
import type { Context } from '@/types/context';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), update: jest.fn() },
    project: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    projectMember: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    task: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn(), groupBy: jest.fn() },
    taskImage: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), delete: jest.fn() },
    session: { deleteMany: jest.fn() },
  },
}));

// Clés déclarées explicitement plutôt qu'en `Record<string, …>` : avec
// `noUncheckedIndexedAccess`, un accès indexé rendrait `jest.Mock | undefined`
// et obligerait à un `!` sur chaque ligne.
type M = jest.Mock;

const db = prisma as unknown as {
  user: { findUnique: M; findFirst: M; findMany: M; update: M };
  project: { findUnique: M; findMany: M; create: M; update: M; delete: M };
  projectMember: { findUnique: M; create: M; update: M; delete: M };
  task: {
    findUnique: M;
    findMany: M;
    create: M;
    update: M;
    delete: M;
    count: M;
    groupBy: M;
  };
  taskImage: { findUnique: M; findMany: M; create: M; delete: M };
  session: { deleteMany: M };
};

const ANONYME: Context = { user: null, ip: '127.0.0.1' };
const CONNECTE: Context = { user: { id: 'u1', email: 'a@b.com' }, ip: '127.0.0.1' };

/** Fait répondre au double que `u1` a ce rôle sur le projet interrogé. */
function withRole(role: string | null) {
  db.projectMember.findUnique.mockResolvedValue(role ? { role, userId: 'u1' } : null);
}

const Query = resolvers.Query as Record<string, (...a: unknown[]) => Promise<unknown>>;
const Mutation = resolvers.Mutation as Record<string, (...a: unknown[]) => Promise<unknown>>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Authentification requise', () => {
  it.each([
    ['users', () => Query.users!({}, {}, ANONYME)],
    ['user', () => Query.user!({}, { id: 'x' }, ANONYME)],
    ['projects', () => Query.projects!({}, {}, ANONYME)],
    ['project', () => Query.project!({}, { id: 'p1' }, ANONYME)],
    ['tasks', () => Query.tasks!({}, {}, ANONYME)],
    ['task', () => Query.task!({}, { id: 't1' }, ANONYME)],
    ['createProject', () => Mutation.createProject!({}, { input: { name: 'X' } }, ANONYME)],
    ['deleteProject', () => Mutation.deleteProject!({}, { id: 'p1' }, ANONYME)],
    ['createTask', () => Mutation.createTask!({}, { input: { title: 'X', projectId: 'p1' } }, ANONYME)],
    ['updateProfile', () => Mutation.updateProfile!({}, { input: {} }, ANONYME)],
    ['updateAvatar', () => Mutation.updateAvatar!({}, { base64Image: 'x' }, ANONYME)],
  ])('%s refuse une requête anonyme', async (_nom, appel) => {
    await expect(appel()).rejects.toThrow('Non autorisé');
  });

  it('me rend null sans jeton, plutôt que de lever', async () => {
    await expect(Query.me!({}, {}, ANONYME)).resolves.toBeNull();
  });

  it("users ne renvoie que les comptes partageant un projet", async () => {
    db.user.findMany.mockResolvedValue([]);
    await Query.users!({}, {}, CONNECTE);

    const filtre = db.user.findMany.mock.calls[0]![0].where;
    // La requête doit être bornée : sans clause `where`, elle rendrait
    // toute la table.
    expect(filtre).toBeDefined();
    expect(JSON.stringify(filtre)).toContain('memberships');
  });
});

describe('Escalade de privilèges', () => {
  it('un ADMIN ne peut pas se promouvoir OWNER', async () => {
    withRole('ADMIN');
    db.projectMember.findUnique.mockResolvedValueOnce({ role: 'ADMIN' });

    await expect(
      Mutation.updateMemberRole!({}, { projectId: 'p1', userId: 'u2', role: 'OWNER' }, CONNECTE),
    ).rejects.toThrow('Action non autorisée');

    expect(db.projectMember.update).not.toHaveBeenCalled();
  });

  it("un ADMIN ne peut pas promouvoir quelqu'un ADMIN", async () => {
    db.projectMember.findUnique
      .mockResolvedValueOnce({ role: 'ADMIN' })
      .mockResolvedValueOnce({ role: 'MEMBER' });

    await expect(
      Mutation.updateMemberRole!({}, { projectId: 'p1', userId: 'u2', role: 'ADMIN' }, CONNECTE),
    ).rejects.toThrow('Action non autorisée');
  });

  it('un ADMIN ne peut pas rétrograder un autre ADMIN', async () => {
    db.projectMember.findUnique
      .mockResolvedValueOnce({ role: 'ADMIN' })
      .mockResolvedValueOnce({ role: 'ADMIN' });

    await expect(
      Mutation.updateMemberRole!({}, { projectId: 'p1', userId: 'u2', role: 'VIEWER' }, CONNECTE),
    ).rejects.toThrow('Action non autorisée');
  });

  it('un ADMIN peut rétrograder un MEMBER en VIEWER', async () => {
    db.projectMember.findUnique
      .mockResolvedValueOnce({ role: 'ADMIN' })
      .mockResolvedValueOnce({ role: 'MEMBER' });
    db.projectMember.update.mockResolvedValue({ id: 'pm1' });

    await Mutation.updateMemberRole!({}, { projectId: 'p1', userId: 'u2', role: 'VIEWER' }, CONNECTE);

    expect(db.projectMember.update).toHaveBeenCalled();
  });

  it("un ADMIN ne peut pas expulser un autre ADMIN", async () => {
    db.projectMember.findUnique
      .mockResolvedValueOnce({ role: 'ADMIN' })
      .mockResolvedValueOnce({ role: 'ADMIN' });

    await expect(
      Mutation.removeMember!({}, { projectId: 'p1', userId: 'u2' }, CONNECTE),
    ).rejects.toThrow('Action non autorisée');

    expect(db.projectMember.delete).not.toHaveBeenCalled();
  });

  it('addMember refuse de faire entrer un OWNER', async () => {
    withRole('ADMIN');

    await expect(
      Mutation.addMember!({}, { projectId: 'p1', email: 'x@y.com', role: 'OWNER' }, CONNECTE),
    ).rejects.toThrow('Action non autorisée');

    expect(db.projectMember.create).not.toHaveBeenCalled();
  });
});

describe('Rôle minimum par opération', () => {
  it('un VIEWER ne peut pas créer de tâche', async () => {
    withRole('VIEWER');

    await expect(
      Mutation.createTask!({}, { input: { title: 'X', projectId: 'p1' } }, CONNECTE),
    ).rejects.toThrow('Action non autorisée');

    expect(db.task.create).not.toHaveBeenCalled();
  });

  it('un MEMBER ne peut pas supprimer le projet', async () => {
    withRole('MEMBER');

    await expect(Mutation.deleteProject!({}, { id: 'p1' }, CONNECTE)).rejects.toThrow(
      'Action non autorisée',
    );

    expect(db.project.delete).not.toHaveBeenCalled();
  });

  it('un MEMBER ne peut pas modifier le projet', async () => {
    withRole('MEMBER');

    await expect(
      Mutation.updateProject!({}, { id: 'p1', input: { name: 'X' } }, CONNECTE),
    ).rejects.toThrow('Action non autorisée');
  });

  it("un non-membre ne peut pas lire un projet", async () => {
    withRole(null);

    await expect(Query.project!({}, { id: 'p1' }, CONNECTE)).rejects.toThrow(
      'Action non autorisée',
    );
  });
});

describe('Validation des entrées', () => {
  it('un titre de tâche vide est refusé', async () => {
    withRole('MEMBER');

    await expect(
      Mutation.createTask!({}, { input: { title: '   ', projectId: 'p1' } }, CONNECTE),
    ).rejects.toThrow(/titre/i);
  });

  it('un nom de projet trop long est refusé', async () => {
    await expect(
      Mutation.createProject!({}, { input: { name: 'a'.repeat(121) } }, CONNECTE),
    ).rejects.toThrow(/120/);
  });

  it("une image envoyée sous forme d'URL est refusée (SSRF)", async () => {
    await expect(
      Mutation.updateAvatar!({}, { base64Image: 'http://169.254.169.254/' }, CONNECTE),
    ).rejects.toThrow(/base64/i);
  });

  it('un nouveau mot de passe trop court est refusé', async () => {
    await expect(
      Mutation.changePassword!(
        {},
        { input: { currentPassword: 'x', newPassword: 'court' } },
        CONNECTE,
      ),
    ).rejects.toThrow(/10 caractères/);
  });
});

describe('createTask — le créateur vient du jeton', () => {
  it("ignore tout creatorId fourni et utilise l'utilisateur authentifié", async () => {
    withRole('MEMBER');
    db.task.create.mockResolvedValue({ id: 't1' });

    await Mutation.createTask!(
      {},
      { input: { title: 'Tâche', projectId: 'p1', creatorId: 'attaquant' } },
      CONNECTE,
    );

    expect(db.task.create.mock.calls[0]![0].data.creatorId).toBe('u1');
  });
});

describe('updateTask — effacement de l’échéance', () => {
  it('dueDate null efface la date au lieu de poser le 1er janvier 1970', async () => {
    db.task.findUnique.mockResolvedValue({ id: 't1', projectId: 'p1' });
    withRole('MEMBER');
    db.task.update.mockResolvedValue({ id: 't1' });

    await Mutation.updateTask!({}, { id: 't1', input: { dueDate: null } }, CONNECTE);

    expect(db.task.update.mock.calls[0]![0].data.dueDate).toBeNull();
  });

  it('une échéance absente laisse la valeur inchangée', async () => {
    db.task.findUnique.mockResolvedValue({ id: 't1', projectId: 'p1' });
    withRole('MEMBER');
    db.task.update.mockResolvedValue({ id: 't1' });

    await Mutation.updateTask!({}, { id: 't1', input: { title: 'Neuf' } }, CONNECTE);

    expect(db.task.update.mock.calls[0]![0].data.dueDate).toBeUndefined();
  });
});

describe('Compteurs agrégés du tableau de bord', () => {
  it('ne charge pas les tâches et agrège en une seule requête', async () => {
    db.project.findMany.mockResolvedValue([{ id: 'p1' }, { id: 'p2' }]);
    db.task.groupBy.mockResolvedValue([
      { projectId: 'p1', status: 'DONE', _count: { _all: 2 } },
      { projectId: 'p1', status: 'TODO', _count: { _all: 3 } },
    ]);

    const résultat = (await Query.projects!({}, {}, CONNECTE)) as {
      id: string;
      taskCount: number;
      completedTaskCount: number;
    }[];

    // La régression à empêcher : réintroduire `tasks: true` dans l'include.
    expect(db.project.findMany.mock.calls[0]![0].include.tasks).toBeUndefined();
    expect(db.task.groupBy).toHaveBeenCalledTimes(1);

    expect(résultat[0]).toMatchObject({ taskCount: 5, completedTaskCount: 2 });
    expect(résultat[1]).toMatchObject({ taskCount: 0, completedTaskCount: 0 });
  });
});
