import { prisma } from '@/lib/prisma';
import { hashPassword, verifyPassword, generateToken } from '@/lib/auth';
import { requireProjectRole } from '@/lib/permissions';
import type { Context } from '@/types/context';

export const resolvers = {
  Query: {
    me: async (_: unknown, __: unknown, context: Context) => {
      if (!context.user) return null;
      return prisma.user.findUnique({
        where: { id: context.user.id },
      });
    },

    users: async () => {
      return prisma.user.findMany();
    },

    user: async (_: unknown, args: { id: string }) => {
      return prisma.user.findUnique({
        where: { id: args.id },
      });
    },

    projects: async (_: unknown, __: unknown, context: Context) => {
      if (!context.user) throw new Error('Non autorisé');
      return prisma.project.findMany({
        where: {
          members: {
            some: { userId: context.user.id },
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
      if (!context.user) throw new Error('Non autorisé');
      await requireProjectRole(context.user.id, args.id, 'VIEWER');
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
      if (!context.user) throw new Error('Non autorisé');
      return prisma.task.findMany({
        where: { creatorId: context.user.id },
        include: {
          project: true,
          assignee: true,
          creator: true,
        },
      });
    },

    task: async (_: unknown, args: { id: string }, context: Context) => {
      if (!context.user) throw new Error('Non autorisé');
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
      await requireProjectRole(context.user.id, task.projectId, 'VIEWER');
      return task;
    },
  },

  Mutation: {
    register: async (
      _: unknown,
      args: { input: { email: string; name?: string; password: string } },
    ) => {
      const existingUser = await prisma.user.findUnique({
        where: { email: args.input.email },
      });
      if (existingUser) {
        throw new Error('Un compte existe déjà avec cet email');
      }
      const hashedPassword = await hashPassword(args.input.password);
      const user = await prisma.user.create({
        data: {
          email: args.input.email,
          name: args.input.name,
          password: hashedPassword,
        },
      });
      const token = generateToken({ id: user.id, email: user.email });
      return { token, user };
    },

    login: async (_: unknown, args: { input: { email: string; password: string } }) => {
      const user = await prisma.user.findUnique({
        where: { email: args.input.email },
      });
      if (!user) throw new Error('Email ou mot de passe incorrect');
      const isValid = await verifyPassword(args.input.password, user.password);
      if (!isValid) throw new Error('Email ou mot de passe incorrect');
      const token = generateToken({ id: user.id, email: user.email });
      return { token, user };
    },

    updateProfile: async (
      _: unknown,
      args: { input: { name?: string; email?: string } },
      context: Context,
    ) => {
      if (!context.user) throw new Error('Non autorisé');

      const existingUser = args.input.email
        ? await prisma.user.findUnique({
            where: { email: args.input.email },
          })
        : null;

      if (existingUser && existingUser.id !== context.user.id) {
        throw new Error('Cet email est déjà utilisé');
      }

      return prisma.user.update({
        where: { id: context.user.id },
        data: {
          name: args.input.name ?? undefined,
          email: args.input.email ?? undefined,
        },
      });
    },

    changePassword: async (
      _: unknown,
      args: { input: { currentPassword: string; newPassword: string } },
      context: Context,
    ) => {
      if (!context.user) throw new Error('Non autorisé');

      const user = await prisma.user.findUnique({
        where: { id: context.user.id },
      });

      if (!user) throw new Error('Utilisateur introuvable');

      const isValid = await verifyPassword(args.input.currentPassword, user.password);

      if (!isValid) throw new Error('Mot de passe actuel incorrect');

      const hashedPassword = await hashPassword(args.input.newPassword);

      await prisma.user.update({
        where: { id: context.user.id },
        data: { password: hashedPassword },
      });

      return true;
    },

    createUser: async (
      _: unknown,
      args: { input: { email: string; name?: string; password: string } },
    ) => {
      const hashedPassword = await hashPassword(args.input.password);
      return prisma.user.create({
        data: {
          email: args.input.email,
          name: args.input.name,
          password: hashedPassword,
        },
      });
    },

    createProject: async (
      _: unknown,
      args: { input: { name: string; description?: string } },
      context: Context,
    ) => {
      if (!context.user) throw new Error('Non autorisé');
      return prisma.project.create({
        data: {
          name: args.input.name,
          description: args.input.description,
          ownerId: context.user.id,
          members: {
            create: {
              userId: context.user.id,
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
      if (!context.user) throw new Error('Non autorisé');
      await requireProjectRole(context.user.id, args.id, 'ADMIN');

      return prisma.project.update({
        where: { id: args.id },
        data: {
          name: args.input.name ?? undefined,
          description: args.input.description ?? undefined,
        },
        include: {
          owner: true,
          members: { include: { user: true } },
          tasks: true,
        },
      });
    },

    deleteProject: async (_: unknown, args: { id: string }, context: Context) => {
      if (!context.user) throw new Error('Non autorisé');
      await requireProjectRole(context.user.id, args.id, 'OWNER');

      await prisma.project.delete({
        where: { id: args.id },
      });

      return true;
    },

    addMember: async (
      _: unknown,
      args: { projectId: string; email: string; role: string },
      context: Context,
    ) => {
      if (!context.user) throw new Error('Non autorisé');
      await requireProjectRole(context.user.id, args.projectId, 'ADMIN');

      const userToAdd = await prisma.user.findUnique({
        where: { email: args.email },
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
          role: args.role as 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER',
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
      if (!context.user) throw new Error('Non autorisé');
      await requireProjectRole(context.user.id, args.projectId, 'ADMIN');

      const project = await prisma.project.findUnique({
        where: { id: args.projectId },
      });

      if (project?.ownerId === args.userId) {
        throw new Error("Impossible d'expulser le propriétaire du projet");
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
      args: { projectId: string; userId: string; role: string },
      context: Context,
    ) => {
      if (!context.user) throw new Error('Non autorisé');
      await requireProjectRole(context.user.id, args.projectId, 'OWNER');

      const project = await prisma.project.findUnique({
        where: { id: args.projectId },
      });

      if (project?.ownerId === args.userId) {
        throw new Error('Impossible de changer le rôle du propriétaire');
      }

      return prisma.projectMember.update({
        where: {
          userId_projectId: {
            userId: args.userId,
            projectId: args.projectId,
          },
        },
        data: {
          role: args.role as 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER',
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
        };
      },
      context: Context,
    ) => {
      if (!context.user) throw new Error('Non autorisé');
      await requireProjectRole(context.user.id, args.input.projectId, 'MEMBER');

      return prisma.task.create({
        data: {
          title: args.input.title,
          description: args.input.description,
          projectId: args.input.projectId,
          assigneeId: args.input.assigneeId,
          creatorId: context.user.id,
        },
        include: {
          project: true,
          assignee: true,
          creator: true,
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
          status?: string;
          priority?: string;
          dueDate?: string;
          assigneeId?: string;
        };
      },
      context: Context,
    ) => {
      if (!context.user) throw new Error('Non autorisé');
      const task = await prisma.task.findUnique({
        where: { id: args.id },
      });
      if (!task) throw new Error('Tâche introuvable');
      await requireProjectRole(context.user.id, task.projectId, 'MEMBER');

      return prisma.task.update({
        where: { id: args.id },
        data: {
          title: args.input.title ?? undefined,
          description: args.input.description ?? undefined,
          assigneeId: args.input.assigneeId ?? undefined,
          status: args.input.status as
            | 'TODO'
            | 'IN_PROGRESS'
            | 'IN_REVIEW'
            | 'DONE'
            | 'CANCELLED'
            | undefined,
          priority: args.input.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | undefined,
        },
        include: {
          project: true,
          assignee: true,
          creator: true,
        },
      });
    },

    deleteTask: async (_: unknown, args: { id: string }, context: Context) => {
      if (!context.user) throw new Error('Non autorisé');
      const task = await prisma.task.findUnique({
        where: { id: args.id },
      });
      if (!task) throw new Error('Tâche introuvable');
      await requireProjectRole(context.user.id, task.projectId, 'ADMIN');

      await prisma.task.delete({ where: { id: args.id } });
      return true;
    },
    uploadTaskImage: async (
      _: unknown,
      args: { taskId: string; base64Image: string },
      context: Context,
    ) => {
      if (!context.user) throw new Error('Non autorisé');

      const task = await prisma.task.findUnique({
        where: { id: args.taskId },
      });

      if (!task) throw new Error('Tâche introuvable');

      await requireProjectRole(context.user.id, task.projectId, 'MEMBER');

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
      if (!context.user) throw new Error('Non autorisé');

      const image = await prisma.taskImage.findUnique({
        where: { id: args.imageId },
        include: { task: true },
      });

      if (!image) throw new Error('Image introuvable');

      await requireProjectRole(context.user.id, image.task.projectId, 'MEMBER');

      const { deleteImage } = await import('@/lib/cloudinary');
      await deleteImage(image.publicId);

      await prisma.taskImage.delete({
        where: { id: args.imageId },
      });

      return true;
    },
  },
};
