import { prisma } from '@/lib/prisma';
import { hashPassword, verifyPassword } from '@/lib/auth';
import { requireProjectRole, canAssignRole, canManageMember } from '@/lib/permissions';
import type { Role } from '@/lib/permissions';
import { revokeAllSessions } from '@/lib/session';
import { assertValidImageUpload } from '@/lib/upload-validation';
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

export const resolvers = {
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
    users: async (_: unknown, __: unknown, context: Context) => {
      const user = requireUser(context);
      return prisma.user.findMany({
        where: {
          memberships: {
            some: {
              project: {
                members: { some: { userId: user.id } },
              },
            },
          },
        },
      });
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

    projects: async (_: unknown, __: unknown, context: Context) => {
      const user = requireUser(context);
      return prisma.project.findMany({
        where: {
          members: {
            some: { userId: user.id },
          },
        },
        include: {
          owner: true,
          members: { include: { user: true } },
          tasks: true,
        },
      });
    },

    project: async (_: unknown, args: { id: string }, context: Context) => {
      const user = requireUser(context);
      await requireProjectRole(user.id, args.id, 'VIEWER');
      return prisma.project.findUnique({
        where: { id: args.id },
        include: {
          owner: true,
          members: { include: { user: true } },
          tasks: {
            include: {
              assignee: true,
              creator: true,
              images: true,
            },
          },
        },
      });
    },

    tasks: async (_: unknown, __: unknown, context: Context) => {
      const user = requireUser(context);
      return prisma.task.findMany({
        where: { creatorId: user.id },
        include: {
          project: true,
          assignee: true,
          creator: true,
        },
      });
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
  },

  Mutation: {
    // `register` et `login` ont quitté GraphQL pour /api/auth/* : poser un
    // cookie httpOnly demande une réponse HTTP que les resolvers ne
    // contrôlent pas.

    updateProfile: async (
      _: unknown,
      args: { input: { name?: string; email?: string } },
      context: Context,
    ) => {
      const currentUser = requireUser(context);

      assertLength(args.input.name, 'nom', LIMITS.userName);

      let email: string | undefined;
      if (args.input.email !== undefined) {
        assertValidEmail(args.input.email);
        email = normalizeEmail(args.input.email);

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser && existingUser.id !== currentUser.id) {
          throw new Error('Cet email est déjà utilisé');
        }
      }

      return prisma.user.update({
        where: { id: currentUser.id },
        data: {
          name: args.input.name?.trim() ?? undefined,
          email,
        },
      });
    },

    changePassword: async (
      _: unknown,
      args: { input: { currentPassword: string; newPassword: string } },
      context: Context,
    ) => {
      const currentUser = requireUser(context);

      assertValidPassword(args.input.newPassword);

      const user = await prisma.user.findUnique({
        where: { id: currentUser.id },
      });

      if (!user) throw new Error('Utilisateur introuvable');

      const isValid = await verifyPassword(args.input.currentPassword, user.password);

      if (!isValid) throw new Error('Mot de passe actuel incorrect');

      const hashedPassword = await hashPassword(args.input.newPassword);

      await prisma.user.update({
        where: { id: currentUser.id },
        data: { password: hashedPassword },
      });

      // Un changement de mot de passe doit déconnecter les autres appareils :
      // c'est le geste attendu quand on soupçonne un accès non désiré.
      await revokeAllSessions(currentUser.id);

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

      return prisma.project.create({
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

      await prisma.project.delete({
        where: { id: args.id },
      });

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

      return prisma.projectMember.create({
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

      return prisma.projectMember.update({
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

      await prisma.task.delete({ where: { id: args.id } });
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
