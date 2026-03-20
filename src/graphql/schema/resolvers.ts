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

    // Nouvelle mutation — ajouter un membre
    addMember: async (
      _: unknown,
      args: { projectId: string; email: string; role: string },
      context: Context,
    ) => {
      if (!context.user) throw new Error('Non autorisé');

      // Seul un OWNER ou ADMIN peut ajouter des membres
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

      // Seul un MEMBER ou plus peut créer des tâches
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

      // Seul un MEMBER ou plus peut modifier des tâches
      await requireProjectRole(context.user.id, task.projectId, 'MEMBER');

      return prisma.task.update({
        where: { id: args.id },
        data: {
          title: args.input.title ?? undefined,
          description: args.input.description ?? undefined,
          assigneeId: args.input.assigneeId ?? undefined,
          status:
            (args.input.status as 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'CANCELLED') ??
            undefined,
          priority: (args.input.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT') ?? undefined,
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

      // Seul un ADMIN ou plus peut supprimer des tâches
      await requireProjectRole(context.user.id, task.projectId, 'ADMIN');

      await prisma.task.delete({ where: { id: args.id } });
      return true;
    },
  },
};
