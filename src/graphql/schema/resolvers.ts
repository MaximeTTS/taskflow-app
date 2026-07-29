import { prisma } from '@/lib/prisma';
import { hashPassword, verifyPassword } from '@/lib/auth';
import { requireProjectRole, canAssignRole, canManageMember } from '@/lib/permissions';
import type { Role } from '@/lib/permissions';
import { revokeAllSessions } from '@/lib/session';
import { assertValidImageUpload } from '@/lib/upload-validation';
import { pageBounds, toPage } from '@/lib/pagination';
import type { PageArgs } from '@/lib/pagination';
import { readAudit, recordAudit } from '@/lib/audit';
import { issueVerificationToken } from '@/lib/email-verification';
import { sendAddressTakenNotice, sendVerificationMail } from '@/lib/account-mail';
import {
  assertValidEmail,
  assertLength,
  assertValidPassword,
  normalizeEmail,
  LIMITS,
} from '@/lib/validation';
import type { Context } from '@/types/context';

/** Rejette toute requête non authentifiée et rend l'utilisateur courant. */
function requireUser(context: Context) {
  if (!context.user) throw new Error('Non autorisé');
  return context.user;
}

/**
 * Supprime des fichiers chez Cloudinary après leur disparition de la base.
 *
 * Sans cet appel, supprimer une tâche ou un projet effaçait bien les lignes
 * TaskImage par cascade mais laissait les fichiers en ligne pour toujours :
 * une fuite de stockage silencieuse et sans limite.
 *
 * Les échecs sont journalisés, jamais propagés : la suppression métier a
 * déjà eu lieu, et faire échouer la mutation à cause d'un fichier distant
 * laisserait l'utilisateur croire que rien n'a été supprimé.
 */
async function purgeCloudinary(publicIds: string[]): Promise<void> {
  if (publicIds.length === 0) return;

  const { deleteImage, isCloudinaryConfigured } = await import('@/lib/cloudinary');
  if (!isCloudinaryConfigured) return;

  await Promise.allSettled(publicIds.map((id) => deleteImage(id))).then((résultats) => {
    for (const r of résultats) {
      if (r.status === 'rejected') {
        console.error('[cloudinary] suppression impossible', r.reason);
      }
    }
  });
}

/**
 * Forme d'un projet tel que renvoyé par les resolvers de Query : les
 * compteurs ne sont présents que si la requête parente les a déjà chargés.
 */
type ProjectParent = {
  id: string;
  taskCount?: number;
  completedTaskCount?: number;
};

/** Nombre de lignes rendues par défaut, par liste. */
const DEFAULTS = {
  projects: 24,
  tasks: 50,
  users: 50,
  projectTasks: 100,
  audit: 50,
} as const;

/** Sérialise les détails d'un événement d'audit pour le champ 'details'. */
function auditDetails(metadata: unknown): string | null {
  if (metadata === null || metadata === undefined) return null;
  return JSON.stringify(metadata);
}

export const resolvers = {
  User: {
    emailVerified: (parent: { emailVerifiedAt?: Date | null }) =>
      Boolean(parent.emailVerifiedAt),

    /**
     * Adresse en attente de confirmation.
     *
     * Rendue au seul titulaire du compte. Sur un autre utilisateur, ce champ
     * révélerait une démarche en cours — et l'adresse visée — à quiconque
     * partage un projet avec lui.
     */
    pendingEmail: async (
      parent: { id: string; email: string },
      _args: unknown,
      context: Context,
    ) => {
      if (!context.user || context.user.id !== parent.id) return null;

      const token = await prisma.emailVerificationToken.findFirst({
        where: {
          userId: parent.id,
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
        select: { email: true },
      });

      // Le jeton d'une inscription vise l'adresse déjà portée par le compte :
      // ce n'est pas un changement en attente, il n'y a rien à signaler.
      if (!token || token.email === parent.email) return null;
      return token.email;
    },
  },

  /**
   * Résolveurs de champ, qui gardent le type cohérent quelle que soit la
   * requête d'origine : `projects` fournit les compteurs sans les tâches,
   * `project(id)` charge les tâches à la demande. Chacun se contente de ce qui
   * est déjà chargé et ne va en base qu'en dernier recours.
   */
  Project: {
    /**
     * Tâches du projet, paginées.
     *
     * Elles étaient toutes chargées avec le projet. Sur un projet fourni,
     * c'est une lenteur ; sur un projet gonflé à dessein, c'est un levier de
     * déni de service — et il suffit d'être MEMBER pour créer des tâches.
     */
    tasks: async (parent: ProjectParent, args: PageArgs) => {
      const { take, skip } = pageBounds(args, DEFAULTS.projectTasks);

      const [items, totalCount] = await Promise.all([
        prisma.task.findMany({
          where: { projectId: parent.id },
          include: { assignee: true, creator: true, images: true },
          orderBy: { createdAt: 'asc' },
          take,
          skip,
        }),
        prisma.task.count({ where: { projectId: parent.id } }),
      ]);

      return toPage(items, totalCount, skip);
    },

    taskCount: async (parent: ProjectParent) => {
      if (typeof parent.taskCount === 'number') return parent.taskCount;
      return prisma.task.count({ where: { projectId: parent.id } });
    },

    completedTaskCount: async (parent: ProjectParent) => {
      if (typeof parent.completedTaskCount === 'number') return parent.completedTaskCount;
      return prisma.task.count({ where: { projectId: parent.id, status: 'DONE' } });
    },
  },

  AuditEvent: {
    details: (parent: { metadata?: unknown }) => auditDetails(parent.metadata),
  },

  Query: {
    me: async (_: unknown, __: unknown, context: Context) => {
      if (!context.user) return null;
      return prisma.user.findUnique({
        where: { id: context.user.id },
      });
    },

    /**
     * Restreint aux personnes avec qui on partage au moins un projet.
     * Cette requête était publique et sans authentification : elle permettait
     * à un anonyme de récupérer l'email et le nom de tous les comptes.
     */
    users: async (_: unknown, args: PageArgs, context: Context) => {
      const user = requireUser(context);
      const { take, skip } = pageBounds(args, DEFAULTS.users);

      const where = {
        memberships: {
          some: {
            project: {
              members: { some: { userId: user.id } },
            },
          },
        },
      };

      const [items, totalCount] = await Promise.all([
        prisma.user.findMany({ where, orderBy: { createdAt: 'asc' }, take, skip }),
        prisma.user.count({ where }),
      ]);

      return toPage(items, totalCount, skip);
    },

    user: async (_: unknown, args: { id: string }, context: Context) => {
      const currentUser = requireUser(context);

      if (args.id === currentUser.id) {
        return prisma.user.findUnique({ where: { id: args.id } });
      }

      // Même règle que `users` : visible seulement via un projet partagé.
      return prisma.user.findFirst({
        where: {
          id: args.id,
          memberships: {
            some: {
              project: {
                members: { some: { userId: currentUser.id } },
              },
            },
          },
        },
      });
    },

    projects: async (_: unknown, args: PageArgs, context: Context) => {
      const user = requireUser(context);
      const { take, skip } = pageBounds(args, DEFAULTS.projects);

      const where = { members: { some: { userId: user.id } } };

      const [projects, totalCount] = await Promise.all([
        prisma.project.findMany({
          where,
          include: {
            owner: true,
            members: { include: { user: true } },
          },
          orderBy: { createdAt: 'desc' },
          take,
          skip,
        }),
        prisma.project.count({ where }),
      ]);

      if (projects.length === 0) return toPage([], totalCount, skip);

      // La version precedente incluait `tasks: true`, chargeant toutes les
      // taches de tous les projets uniquement pour en afficher le nombre.
      // Un seul regroupement suffit, quel que soit le nombre de projets.
      const grouped = await prisma.task.groupBy({
        by: ['projectId', 'status'],
        where: { projectId: { in: projects.map((p) => p.id) } },
        _count: { _all: true },
      });

      const totals = new Map<string, { total: number; done: number }>();
      for (const row of grouped) {
        const entry = totals.get(row.projectId) ?? { total: 0, done: 0 };
        const count = row._count._all;
        entry.total += count;
        if (row.status === 'DONE') entry.done += count;
        totals.set(row.projectId, entry);
      }

      const items = projects.map((project) => {
        const counts = totals.get(project.id) ?? { total: 0, done: 0 };
        return {
          ...project,
          taskCount: counts.total,
          completedTaskCount: counts.done,
        };
      });

      return toPage(items, totalCount, skip);
    },

    project: async (_: unknown, args: { id: string }, context: Context) => {
      const user = requireUser(context);
      await requireProjectRole(user.id, args.id, 'VIEWER');
      // Les tâches ne sont plus incluses ici : le résolveur de champ
      // `Project.tasks` s'en charge, borné, et n'est interrogé que si la
      // requête les demande.
      return prisma.project.findUnique({
        where: { id: args.id },
        include: {
          owner: true,
          members: { include: { user: true } },
        },
      });
    },

    tasks: async (_: unknown, args: PageArgs, context: Context) => {
      const user = requireUser(context);
      const { take, skip } = pageBounds(args, DEFAULTS.tasks);

      const where = { creatorId: user.id };

      const [items, totalCount] = await Promise.all([
        prisma.task.findMany({
          where,
          include: { project: true, assignee: true, creator: true },
          orderBy: { createdAt: 'desc' },
          take,
          skip,
        }),
        prisma.task.count({ where }),
      ]);

      return toPage(items, totalCount, skip);
    },

    task: async (_: unknown, args: { id: string }, context: Context) => {
      const user = requireUser(context);
      const task = await prisma.task.findUnique({
        where: { id: args.id },
        include: {
          project: true,
          assignee: true,
          creator: true,
          images: true,
        },
      });
      if (!task) return null;
      await requireProjectRole(user.id, task.projectId, 'VIEWER');
      return task;
    },

    /**
     * Historique d'un projet.
     *
     * Réservé aux ADMIN : le journal dit qui a fait entrer ou sortir qui, ce
     * qui reste une information sur les personnes. Un VIEWER n'a pas à la lire.
     */
    projectAuditLog: async (
      _: unknown,
      args: { projectId: string } & PageArgs,
      context: Context,
    ) => {
      const user = requireUser(context);
      await requireProjectRole(user.id, args.projectId, 'ADMIN');

      const { take, skip } = pageBounds(args, DEFAULTS.audit);
      return readAudit('project', args.projectId, take, skip);
    },

    /** Historique de son propre compte. Nul besoin d'autre garde. */
    accountAuditLog: async (_: unknown, args: PageArgs, context: Context) => {
      const user = requireUser(context);
      const { take, skip } = pageBounds(args, DEFAULTS.audit);
      return readAudit('user', user.id, take, skip);
    },
  },

  Mutation: {
    // `register` et `login` ont quitté GraphQL pour /api/auth/* : poser un
    // cookie httpOnly demande une réponse HTTP que les resolvers ne
    // contrôlent pas.

    /**
     * Met à jour le profil.
     *
     * Deux corrections par rapport à la version précédente.
     *
     * **L'adresse n'est plus appliquée directement.** Elle l'était sur simple
     * demande, sans preuve que la nouvelle boîte appartienne au demandeur :
     * n'importe qui disposant d'une session ouverte pouvait déplacer le compte
     * vers une adresse qu'il contrôle, puis en prendre possession par
     * « mot de passe oublié ». Un lien de confirmation part désormais vers la
     * nouvelle adresse, et le compte ne bouge qu'à son ouverture.
     *
     * **L'erreur « Cet email est déjà utilisé » a disparu.** Elle permettait de
     * tester une liste d'adresses depuis un compte quelconque. La réponse est
     * maintenant la même que l'adresse soit libre ou prise ; ce qui diffère est
     * l'email envoyé — au titulaire légitime de l'adresse visée, pas au
     * demandeur.
     */
    updateProfile: async (
      _: unknown,
      args: { input: { name?: string; email?: string } },
      context: Context,
    ) => {
      const currentUser = requireUser(context);

      assertLength(args.input.name, 'nom', LIMITS.userName);

      const before = await prisma.user.findUnique({ where: { id: currentUser.id } });
      if (!before) throw new Error('Utilisateur introuvable');

      // Le nom, lui, n'a rien à prouver : il s'applique tout de suite.
      const user =
        args.input.name === undefined
          ? before
          : await prisma.user.update({
              where: { id: currentUser.id },
              data: { name: args.input.name.trim() },
            });

      if (args.input.email === undefined) return user;

      assertValidEmail(args.input.email);
      const email = normalizeEmail(args.input.email);

      // Demander son adresse actuelle n'est pas une demande de changement.
      if (email === before.email) return user;

      const occupant = await prisma.user.findUnique({
        where: { email },
        select: { id: true, name: true },
      });

      if (occupant && occupant.id !== currentUser.id) {
        // Adresse prise : on prévient son titulaire, et on rend exactement la
        // même chose que dans le cas favorable. Le demandeur n'apprend rien.
        await sendAddressTakenNotice({
          to: email,
          name: occupant.name,
          origin: context.origin,
        });
        return user;
      }

      const token = await issueVerificationToken(currentUser.id, email);
      await sendVerificationMail({
        to: email,
        name: user.name,
        origin: context.origin,
        token,
        isChange: true,
      });

      void recordAudit({
        action: 'EMAIL_CHANGE_REQUESTED',
        actor: { id: currentUser.id, email: before.email },
        targetType: 'user',
        targetId: currentUser.id,
        targetLabel: before.email,
        metadata: { nouvelleAdresse: email },
        ip: context.ip,
      });

      return user;
    },

    /**
     * Annule un changement d'adresse en attente.
     *
     * Le geste utile après un « ce n'était pas moi » : le lien encore vivant
     * cesse de l'être immédiatement, sans attendre ses 24 heures.
     */
    cancelEmailChange: async (_: unknown, __: unknown, context: Context) => {
      const currentUser = requireUser(context);

      await prisma.emailVerificationToken.updateMany({
        where: { userId: currentUser.id, usedAt: null },
        data: { usedAt: new Date() },
      });

      const user = await prisma.user.findUnique({ where: { id: currentUser.id } });
      if (!user) throw new Error('Utilisateur introuvable');
      return user;
    },

    changePassword: async (
      _: unknown,
      args: { input: { currentPassword: string; newPassword: string } },
      context: Context,
    ) => {
      const currentUser = requireUser(context);

      const user = await prisma.user.findUnique({
        where: { id: currentUser.id },
      });

      if (!user) throw new Error('Utilisateur introuvable');

      const isValid = await verifyPassword(args.input.currentPassword, user.password);

      if (!isValid) throw new Error('Mot de passe actuel incorrect');

      // Après la vérification du mot de passe actuel, et pas avant : le
      // contrôle de robustesse a besoin de l'email et du nom du compte, que
      // seule la lecture en base fournit.
      assertValidPassword(args.input.newPassword, {
        email: user.email,
        name: user.name ?? undefined,
      });

      const hashedPassword = await hashPassword(args.input.newPassword);

      await prisma.user.update({
        where: { id: currentUser.id },
        data: { password: hashedPassword },
      });

      // Un changement de mot de passe doit déconnecter les autres appareils :
      // c'est le geste attendu quand on soupçonne un accès non désiré.
      await revokeAllSessions(currentUser.id);

      void recordAudit({
        action: 'PASSWORD_CHANGED',
        actor: { id: user.id, email: user.email },
        targetType: 'user',
        targetId: user.id,
        targetLabel: user.email,
        ip: context.ip,
      });

      return true;
    },

    updateAvatar: async (_: unknown, args: { base64Image: string }, context: Context) => {
      const currentUser = requireUser(context);

      assertValidImageUpload(args.base64Image);

      const { uploadImage } = await import('@/lib/cloudinary');
      const { url } = await uploadImage(args.base64Image, 'taskflow/avatars');

      return prisma.user.update({
        where: { id: currentUser.id },
        data: { avatar: url },
      });
    },

    createProject: async (
      _: unknown,
      args: { input: { name: string; description?: string } },
      context: Context,
    ) => {
      const user = requireUser(context);

      assertLength(args.input.name, 'nom du projet', LIMITS.projectName);
      assertLength(args.input.description, 'description', LIMITS.projectDescription);

      const project = await prisma.project.create({
        data: {
          name: args.input.name.trim(),
          description: args.input.description?.trim(),
          ownerId: user.id,
          members: {
            create: {
              userId: user.id,
              role: 'OWNER',
            },
          },
        },
        include: {
          owner: true,
          members: true,
        },
      });

      void recordAudit({
        action: 'PROJECT_CREATED',
        actor: user,
        targetType: 'project',
        targetId: project.id,
        targetLabel: project.name,
        ip: context.ip,
      });

      return project;
    },

    updateProject: async (
      _: unknown,
      args: { id: string; input: { name?: string; description?: string } },
      context: Context,
    ) => {
      const user = requireUser(context);
      await requireProjectRole(user.id, args.id, 'ADMIN');

      assertLength(args.input.name, 'nom du projet', LIMITS.projectName);
      assertLength(args.input.description, 'description', LIMITS.projectDescription);

      return prisma.project.update({
        where: { id: args.id },
        data: {
          name: args.input.name?.trim() ?? undefined,
          description: args.input.description?.trim() ?? undefined,
        },
        include: {
          owner: true,
          members: { include: { user: true } },
          tasks: true,
        },
      });
    },

    deleteProject: async (_: unknown, args: { id: string }, context: Context) => {
      const user = requireUser(context);
      await requireProjectRole(user.id, args.id, 'OWNER');

      // Les TaskImage disparaissent en base par cascade, mais les fichiers
      // resteraient chez Cloudinary indéfiniment. On les collecte avant de
      // supprimer, sinon leurs identifiants sont perdus.
      const images = await prisma.taskImage.findMany({
        where: { task: { projectId: args.id } },
        select: { publicId: true },
      });

      // Le nom est relevé avant la suppression : après, il n'existe plus, et
      // un journal qui ne dit que « projet clx4… supprimé » ne répond pas à la
      // question qu'on lui pose.
      const projet = await prisma.project.findUnique({
        where: { id: args.id },
        select: { name: true, ownerId: true },
      });

      await prisma.project.delete({
        where: { id: args.id },
      });

      void recordAudit({
        action: 'PROJECT_DELETED',
        actor: user,
        targetType: 'project',
        targetId: args.id,
        targetLabel: projet?.name ?? null,
        metadata: { proprietaire: projet?.ownerId ?? null },
        ip: context.ip,
      });

      // Après la suppression en base : un échec côté Cloudinary ne doit pas
      // laisser le projet à moitié supprimé. Au pire, un fichier orphelin.
      await purgeCloudinary(images.map((i) => i.publicId));

      return true;
    },

    addMember: async (
      _: unknown,
      args: { projectId: string; email: string; role: Role },
      context: Context,
    ) => {
      const user = requireUser(context);
      const actorRole = await requireProjectRole(user.id, args.projectId, 'ADMIN');

      // Un ADMIN ne peut pas faire entrer quelqu'un à son niveau ou au-dessus.
      if (!canAssignRole(actorRole, args.role)) {
        throw new Error("Action non autorisée");
      }

      const userToAdd = await prisma.user.findUnique({
        where: { email: normalizeEmail(args.email) },
      });

      if (!userToAdd) {
        throw new Error('Aucun utilisateur trouvé avec cet email');
      }

      const existingMember = await prisma.projectMember.findUnique({
        where: {
          userId_projectId: {
            userId: userToAdd.id,
            projectId: args.projectId,
          },
        },
      });

      if (existingMember) {
        throw new Error('Cet utilisateur est déjà membre du projet');
      }

      const membre = await prisma.projectMember.create({
        data: {
          userId: userToAdd.id,
          projectId: args.projectId,
          role: args.role,
        },
        include: {
          user: true,
          project: true,
        },
      });

      void recordAudit({
        action: 'MEMBER_ADDED',
        actor: user,
        targetType: 'project',
        targetId: args.projectId,
        targetLabel: membre.project.name,
        metadata: { membre: userToAdd.email, role: args.role },
        ip: context.ip,
      });

      return membre;
    },

    removeMember: async (
      _: unknown,
      args: { projectId: string; userId: string },
      context: Context,
    ) => {
      const user = requireUser(context);
      const actorRole = await requireProjectRole(user.id, args.projectId, 'ADMIN');

      const target = await prisma.projectMember.findUnique({
        where: {
          userId_projectId: {
            userId: args.userId,
            projectId: args.projectId,
          },
        },
        include: { user: { select: { email: true } }, project: { select: { name: true } } },
      });

      if (!target) {
        throw new Error('Membre introuvable');
      }

      // Couvre aussi le propriétaire, qui est OWNER et donc hors de portée.
      if (!canManageMember(actorRole, target.role as Role)) {
        throw new Error("Action non autorisée");
      }

      await prisma.projectMember.delete({
        where: {
          userId_projectId: {
            userId: args.userId,
            projectId: args.projectId,
          },
        },
      });

      void recordAudit({
        action: 'MEMBER_REMOVED',
        actor: user,
        targetType: 'project',
        targetId: args.projectId,
        targetLabel: target.project.name,
        metadata: { membre: target.user.email, roleRetire: target.role },
        ip: context.ip,
      });

      return true;
    },

    updateMemberRole: async (
      _: unknown,
      args: { projectId: string; userId: string; role: Role },
      context: Context,
    ) => {
      const user = requireUser(context);
      const actorRole = await requireProjectRole(user.id, args.projectId, 'ADMIN');

      const target = await prisma.projectMember.findUnique({
        where: {
          userId_projectId: {
            userId: args.userId,
            projectId: args.projectId,
          },
        },
        include: { user: { select: { email: true } } },
      });

      if (!target) {
        throw new Error('Membre introuvable');
      }

      // Deux gardes distinctes : pouvoir agir sur ce membre, et pouvoir
      // attribuer ce rôle. Sans la seconde, un ADMIN se promouvait OWNER.
      if (
        !canManageMember(actorRole, target.role as Role) ||
        !canAssignRole(actorRole, args.role)
      ) {
        throw new Error("Action non autorisée");
      }

      const membre = await prisma.projectMember.update({
        where: {
          userId_projectId: {
            userId: args.userId,
            projectId: args.projectId,
          },
        },
        data: {
          role: args.role,
        },
        include: {
          user: true,
          project: true,
        },
      });

      // Le changement de rôle est l'exemple même de ce que le journal doit
      // retenir : l'ancien rôle disparaît de la base, seule cette trace le
      // conserve.
      void recordAudit({
        action: 'MEMBER_ROLE_CHANGED',
        actor: user,
        targetType: 'project',
        targetId: args.projectId,
        targetLabel: membre.project.name,
        metadata: {
          membre: target.user.email,
          ancienRole: target.role,
          nouveauRole: args.role,
        },
        ip: context.ip,
      });

      return membre;
    },

    createTask: async (
      _: unknown,
      args: {
        input: {
          title: string;
          description?: string;
          projectId: string;
          assigneeId?: string;
          status?: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'CANCELLED';
          priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
          dueDate?: string;
        };
      },
      context: Context,
    ) => {
      const user = requireUser(context);
      await requireProjectRole(user.id, args.input.projectId, 'MEMBER');

      assertLength(args.input.title, 'titre', LIMITS.taskTitle);
      assertLength(args.input.description, 'description', LIMITS.taskDescription);

      // Un assigné doit être membre du projet : sans cette garde, on pouvait
      // attribuer une tâche à n'importe quel identifiant d'utilisateur.
      if (args.input.assigneeId) {
        await requireProjectRole(args.input.assigneeId, args.input.projectId, 'VIEWER').catch(
          () => {
            throw new Error("L'assigné n'est pas membre de ce projet");
          },
        );
      }

      return prisma.task.create({
        data: {
          title: args.input.title.trim(),
          description: args.input.description?.trim(),
          projectId: args.input.projectId,
          assigneeId: args.input.assigneeId,
          creatorId: user.id,
          status: args.input.status,
          priority: args.input.priority,
          dueDate: args.input.dueDate ? new Date(args.input.dueDate) : undefined,
        },
        include: {
          project: true,
          assignee: true,
          creator: true,
          images: true,
        },
      });
    },

    updateTask: async (
      _: unknown,
      args: {
        id: string;
        input: {
          title?: string;
          description?: string;
          status?: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'CANCELLED';
          priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
          dueDate?: string | null;
          assigneeId?: string | null;
        };
      },
      context: Context,
    ) => {
      const user = requireUser(context);
      const task = await prisma.task.findUnique({
        where: { id: args.id },
      });
      if (!task) throw new Error('Tâche introuvable');
      await requireProjectRole(user.id, task.projectId, 'MEMBER');

      assertLength(args.input.title, 'titre', LIMITS.taskTitle);
      assertLength(args.input.description, 'description', LIMITS.taskDescription);

      if (args.input.assigneeId) {
        await requireProjectRole(args.input.assigneeId, task.projectId, 'VIEWER').catch(() => {
          throw new Error("L'assigné n'est pas membre de ce projet");
        });
      }

      return prisma.task.update({
        where: { id: args.id },
        data: {
          title: args.input.title?.trim() ?? undefined,
          description: args.input.description?.trim() ?? undefined,
          assigneeId: args.input.assigneeId === null ? null : (args.input.assigneeId ?? undefined),
          status: args.input.status,
          priority: args.input.priority,
          // `null` efface l'échéance, `undefined` la laisse inchangée.
          // L'ancien code passait `new Date(null)` — soit le 1er janvier 1970 —
          // ce qui rendait toute suppression d'échéance impossible.
          dueDate:
            args.input.dueDate === null
              ? null
              : args.input.dueDate !== undefined
                ? new Date(args.input.dueDate)
                : undefined,
        },
        include: {
          project: true,
          assignee: true,
          creator: true,
          images: true,
        },
      });
    },

    deleteTask: async (_: unknown, args: { id: string }, context: Context) => {
      const user = requireUser(context);
      const task = await prisma.task.findUnique({
        where: { id: args.id },
      });
      if (!task) throw new Error('Tâche introuvable');

      // Aligné sur `updateTask` : un MEMBER qui peut vider entièrement une
      // tâche devait déjà pouvoir la supprimer. L'écart précédent (ADMIN pour
      // supprimer, MEMBER pour modifier) n'apportait aucune protection.
      await requireProjectRole(user.id, task.projectId, 'MEMBER');

      const images = await prisma.taskImage.findMany({
        where: { taskId: args.id },
        select: { publicId: true },
      });

      await prisma.task.delete({ where: { id: args.id } });

      await purgeCloudinary(images.map((i) => i.publicId));

      return true;
    },

    uploadTaskImage: async (
      _: unknown,
      args: { taskId: string; base64Image: string },
      context: Context,
    ) => {
      const user = requireUser(context);

      assertValidImageUpload(args.base64Image);

      const task = await prisma.task.findUnique({
        where: { id: args.taskId },
      });

      if (!task) throw new Error('Tâche introuvable');

      await requireProjectRole(user.id, task.projectId, 'MEMBER');

      const { uploadImage } = await import('@/lib/cloudinary');
      const { url, publicId } = await uploadImage(args.base64Image, 'taskflow/tasks');

      return prisma.taskImage.create({
        data: {
          url,
          publicId,
          taskId: args.taskId,
        },
      });
    },

    deleteTaskImage: async (_: unknown, args: { imageId: string }, context: Context) => {
      const user = requireUser(context);

      const image = await prisma.taskImage.findUnique({
        where: { id: args.imageId },
        include: { task: true },
      });

      if (!image) throw new Error('Image introuvable');

      await requireProjectRole(user.id, image.task.projectId, 'MEMBER');

      const { deleteImage } = await import('@/lib/cloudinary');
      await deleteImage(image.publicId);

      await prisma.taskImage.delete({
        where: { id: args.imageId },
      });

      return true;
    },
  },
};
