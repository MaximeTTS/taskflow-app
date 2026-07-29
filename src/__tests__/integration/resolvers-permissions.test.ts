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
    user: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), update: jest.fn(), count: jest.fn() },
    project: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn() },
    projectMember: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    task: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn(), groupBy: jest.fn() },
    taskImage: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), delete: jest.fn() },
    session: { deleteMany: jest.fn() },
    auditLog: { create: jest.fn(), findMany: jest.fn(), count: jest.fn() },
    emailVerificationToken: { findFirst: jest.fn(), updateMany: jest.fn(), create: jest.fn() },
  },
}));

// Les emails partent vers de vrais fournisseurs : on coupe le fil ici, et on
// s'en sert pour verifier *qui* recoit quoi lors d'un changement d'adresse.
jest.mock('@/lib/account-mail', () => ({
  sendVerificationMail: jest.fn(async () => {}),
  sendAddressTakenNotice: jest.fn(async () => {}),
  sendExistingAccountNotice: jest.fn(async () => {}),
}));

jest.mock('@/lib/email-verification', () => ({
  issueVerificationToken: jest.fn(async () => 'jeton-de-test'),
}));

// bcrypt coute une centaine de millisecondes par appel : le remplacer garde
// la suite rapide sans rien changer aux regles qu'on veut eprouver ici.
jest.mock('@/lib/auth', () => ({
  hashPassword: jest.fn(async (clair: string) => `empreinte:${clair}`),
  verifyPassword: jest.fn(async (clair: string, empreinte: string) => empreinte === `empreinte:${clair}`),
}));

// Clés déclarées explicitement plutôt qu'en `Record<string, …>` : avec
// `noUncheckedIndexedAccess`, un accès indexé rendrait `jest.Mock | undefined`
// et obligerait à un `!` sur chaque ligne.
type M = jest.Mock;

const db = prisma as unknown as {
  user: { findUnique: M; findFirst: M; findMany: M; update: M; count: M };
  project: { findUnique: M; findMany: M; create: M; update: M; delete: M; count: M };
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
  auditLog: { create: M; findMany: M; count: M };
  emailVerificationToken: { findFirst: M; updateMany: M; create: M };
};

const ORIGINE = 'https://taskflow.test';

const ANONYME: Context = { user: null, ip: '127.0.0.1', origin: ORIGINE };
const CONNECTE: Context = {
  user: { id: 'u1', email: 'a@b.com' },
  ip: '127.0.0.1',
  origin: ORIGINE,
};

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
      .mockResolvedValueOnce({ role: 'MEMBER', user: { email: 'membre@b.com' } });
    db.projectMember.update.mockResolvedValue({
      id: 'pm1',
      project: { name: 'Projet' },
      user: { email: 'membre@b.com' },
    });

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
    db.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      name: null,
      password: 'empreinte:actuel-correct',
    });

    await expect(
      Mutation.changePassword!(
        {},
        { input: { currentPassword: 'actuel-correct', newPassword: 'court' } },
        CONNECTE,
      ),
    ).rejects.toThrow(/10 caractères/);
  });

  it('un nouveau mot de passe devinable est refusé', async () => {
    db.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      name: null,
      password: 'empreinte:actuel-correct',
    });

    await expect(
      Mutation.changePassword!(
        {},
        { input: { currentPassword: 'actuel-correct', newPassword: 'aaaaaaaaaa' } },
        CONNECTE,
      ),
    ).rejects.toThrow(/répétitif/);

    expect(db.user.update).not.toHaveBeenCalled();
  });

  it('le mot de passe actuel est vérifié avant tout', async () => {
    db.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      name: null,
      password: 'empreinte:actuel-correct',
    });

    await expect(
      Mutation.changePassword!(
        {},
        { input: { currentPassword: 'faux', newPassword: 'fjord-lampe-27' } },
        CONNECTE,
      ),
    ).rejects.toThrow(/actuel incorrect/);

    expect(db.user.update).not.toHaveBeenCalled();
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

type Page<T> = { items: T[]; totalCount: number; hasMore: boolean };
type ProjetAgrege = { id: string; taskCount: number; completedTaskCount: number };

describe('Compteurs agrégés du tableau de bord', () => {
  it('ne charge pas les tâches et agrège en une seule requête', async () => {
    db.project.findMany.mockResolvedValue([{ id: 'p1' }, { id: 'p2' }]);
    db.project.count.mockResolvedValue(2);
    db.task.groupBy.mockResolvedValue([
      { projectId: 'p1', status: 'DONE', _count: { _all: 2 } },
      { projectId: 'p1', status: 'TODO', _count: { _all: 3 } },
    ]);

    const page = (await Query.projects!({}, {}, CONNECTE)) as Page<ProjetAgrege>;

    // La régression à empêcher : réintroduire `tasks: true` dans l'include.
    expect(db.project.findMany.mock.calls[0]![0].include.tasks).toBeUndefined();
    expect(db.task.groupBy).toHaveBeenCalledTimes(1);

    expect(page.items[0]).toMatchObject({ taskCount: 5, completedTaskCount: 2 });
    expect(page.items[1]).toMatchObject({ taskCount: 0, completedTaskCount: 0 });
  });
});

describe('Pagination — plafond non négociable', () => {
  beforeEach(() => {
    db.project.findMany.mockResolvedValue([]);
    db.project.count.mockResolvedValue(0);
    db.task.findMany.mockResolvedValue([]);
    db.task.count.mockResolvedValue(0);
    db.user.findMany.mockResolvedValue([]);
    db.user.count.mockResolvedValue(0);
  });

  it('borne une demande démesurée au plafond du serveur', async () => {
    await Query.projects!({}, { limit: 100000 }, CONNECTE);
    expect(db.project.findMany.mock.calls[0]![0].take).toBe(100);
  });

  it('borne aussi les tâches et les utilisateurs', async () => {
    await Query.tasks!({}, { limit: 5000 }, CONNECTE);
    expect(db.task.findMany.mock.calls[0]![0].take).toBe(100);

    await Query.users!({}, { limit: 5000 }, CONNECTE);
    expect(db.user.findMany.mock.calls[0]![0].take).toBe(100);
  });

  it('refuse un limit nul ou négatif plutôt que de tourner à vide', async () => {
    await Query.projects!({}, { limit: 0 }, CONNECTE);
    expect(db.project.findMany.mock.calls[0]![0].take).toBe(24);

    await Query.projects!({}, { limit: -10 }, CONNECTE);
    expect(db.project.findMany.mock.calls[1]![0].take).toBe(1);
  });

  it('ignore un offset négatif', async () => {
    await Query.projects!({}, { offset: -5 }, CONNECTE);
    expect(db.project.findMany.mock.calls[0]![0].skip).toBe(0);
  });

  it('signale la suite quand tout n’est pas rendu', async () => {
    db.project.findMany.mockResolvedValue([{ id: 'p1' }]);
    db.project.count.mockResolvedValue(50);
    db.task.groupBy.mockResolvedValue([]);

    const page = (await Query.projects!({}, { limit: 1 }, CONNECTE)) as Page<ProjetAgrege>;

    expect(page.totalCount).toBe(50);
    expect(page.hasMore).toBe(true);
  });

  it('les tâches d’un projet sont bornées elles aussi', async () => {
    db.task.findMany.mockResolvedValue([]);
    db.task.count.mockResolvedValue(0);

    const Project = resolvers.Project as Record<string, (...a: unknown[]) => Promise<unknown>>;
    await Project.tasks!({ id: 'p1' }, { limit: 99999 });

    expect(db.task.findMany.mock.calls[0]![0].take).toBe(100);
  });
});

describe('updateProfile — énumération de comptes', () => {
  const { sendVerificationMail, sendAddressTakenNotice } =
    jest.requireMock<{
      sendVerificationMail: jest.Mock;
      sendAddressTakenNotice: jest.Mock;
    }>('@/lib/account-mail');

  beforeEach(() => {
    sendVerificationMail.mockClear();
    sendAddressTakenNotice.mockClear();
  });

  it('ne révèle pas qu’une adresse est déjà prise', async () => {
    db.user.findUnique
      // 1) le compte courant
      .mockResolvedValueOnce({ id: 'u1', email: 'a@b.com', name: 'A' })
      // 2) l'occupant de l'adresse visée
      .mockResolvedValueOnce({ id: 'u2', name: 'Autre' });

    // Aucune exception : c'est tout l'objet de la correction. L'ancienne
    // version levait « Cet email est déjà utilisé », ce qui suffisait à
    // tester une liste d'adresses depuis n'importe quel compte.
    await expect(
      Mutation.updateProfile!({}, { input: { email: 'pris@b.com' } }, CONNECTE),
    ).resolves.toBeDefined();

    // Le titulaire de l'adresse est prévenu ; le demandeur n'apprend rien.
    expect(sendAddressTakenNotice).toHaveBeenCalledTimes(1);
    expect(sendAddressTakenNotice.mock.calls[0]![0].to).toBe('pris@b.com');
    expect(sendVerificationMail).not.toHaveBeenCalled();
  });

  it('n’applique pas l’adresse avant confirmation', async () => {
    db.user.findUnique
      .mockResolvedValueOnce({ id: 'u1', email: 'a@b.com', name: 'A' })
      .mockResolvedValueOnce(null);

    await Mutation.updateProfile!({}, { input: { email: 'neuve@b.com' } }, CONNECTE);

    // La regression a empecher : ecrire directement la nouvelle adresse.
    const écritures = db.user.update.mock.calls.map((c) => c[0].data);
    expect(écritures.some((d: { email?: string }) => d.email !== undefined)).toBe(false);

    expect(sendVerificationMail).toHaveBeenCalledTimes(1);
    expect(sendVerificationMail.mock.calls[0]![0]).toMatchObject({
      to: 'neuve@b.com',
      isChange: true,
    });
  });

  it('applique le nom immédiatement, lui', async () => {
    db.user.findUnique.mockResolvedValueOnce({ id: 'u1', email: 'a@b.com', name: 'A' });
    db.user.update.mockResolvedValue({ id: 'u1', email: 'a@b.com', name: 'Nouveau' });

    await Mutation.updateProfile!({}, { input: { name: 'Nouveau' } }, CONNECTE);

    expect(db.user.update.mock.calls[0]![0].data).toEqual({ name: 'Nouveau' });
  });

  it('ne fait rien si l’adresse demandée est déjà celle du compte', async () => {
    db.user.findUnique.mockResolvedValueOnce({ id: 'u1', email: 'a@b.com', name: 'A' });

    await Mutation.updateProfile!({}, { input: { email: 'a@b.com' } }, CONNECTE);

    expect(sendVerificationMail).not.toHaveBeenCalled();
    expect(sendAddressTakenNotice).not.toHaveBeenCalled();
  });
});

describe('Journal d’audit', () => {
  it('consigne un changement de rôle avec l’ancien et le nouveau', async () => {
    db.projectMember.findUnique
      .mockResolvedValueOnce({ role: 'ADMIN' })
      .mockResolvedValueOnce({ role: 'MEMBER', user: { email: 'membre@b.com' } });
    db.projectMember.update.mockResolvedValue({
      id: 'pm1',
      project: { name: 'Refonte' },
      user: { email: 'membre@b.com' },
    });

    await Mutation.updateMemberRole!(
      {},
      { projectId: 'p1', userId: 'u2', role: 'VIEWER' },
      CONNECTE,
    );

    // L'ecriture est deliberement detachee (`void`) : elle ne doit pas faire
    // echouer la mutation. On laisse donc la micro-tache s'executer.
    await Promise.resolve();

    expect(db.auditLog.create).toHaveBeenCalledTimes(1);
    expect(db.auditLog.create.mock.calls[0]![0].data).toMatchObject({
      action: 'MEMBER_ROLE_CHANGED',
      actorId: 'u1',
      actorEmail: 'a@b.com',
      targetType: 'project',
      targetId: 'p1',
      targetLabel: 'Refonte',
      metadata: { membre: 'membre@b.com', ancienRole: 'MEMBER', nouveauRole: 'VIEWER' },
    });
  });

  it('retient le nom du projet supprimé, qui n’existe plus après coup', async () => {
    withRole('OWNER');
    db.taskImage.findMany.mockResolvedValue([]);
    db.project.findUnique.mockResolvedValue({ name: 'Refonte du site', ownerId: 'u1' });
    db.project.delete.mockResolvedValue({});

    await Mutation.deleteProject!({}, { id: 'p1' }, CONNECTE);
    await Promise.resolve();

    expect(db.auditLog.create.mock.calls[0]![0].data).toMatchObject({
      action: 'PROJECT_DELETED',
      targetId: 'p1',
      targetLabel: 'Refonte du site',
    });
  });

  it('une panne du journal ne fait pas échouer l’action', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      withRole('OWNER');
      db.taskImage.findMany.mockResolvedValue([]);
      db.project.findUnique.mockResolvedValue({ name: 'Refonte', ownerId: 'u1' });
      db.project.delete.mockResolvedValue({});
      db.auditLog.create.mockRejectedValue(new Error('base indisponible'));

      // La suppression aboutit malgre tout : un journal en panne ne doit pas
      // devenir un point de panne unique.
      await expect(Mutation.deleteProject!({}, { id: 'p1' }, CONNECTE)).resolves.toBe(true);
    } finally {
      spy.mockRestore();
    }
  });

  it('projectAuditLog est refusé à un MEMBER', async () => {
    withRole('MEMBER');

    await expect(
      Query.projectAuditLog!({}, { projectId: 'p1' }, CONNECTE),
    ).rejects.toThrow('Action non autorisée');
  });

  it('projectAuditLog est ouvert à un ADMIN', async () => {
    withRole('ADMIN');
    db.auditLog.findMany.mockResolvedValue([]);
    db.auditLog.count.mockResolvedValue(0);

    await expect(
      Query.projectAuditLog!({}, { projectId: 'p1' }, CONNECTE),
    ).resolves.toMatchObject({ items: [], totalCount: 0, hasMore: false });
  });
});
