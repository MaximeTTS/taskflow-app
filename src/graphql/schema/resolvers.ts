import { prisma } from '@/lib/prisma';
import { hashPassword, verifyPassword, generateToken } from '@/lib/auth';
import type { Context } from '@/types/context';

export const resolvers = {
  Query: {
    // Retourne l'utilisateur connecté
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
        where: { ownerId: context.user.id },
        include: {
          owner: true,
          members: { include: { user: true } },
          tasks: true,
        },
      });
    },

    project: async (_: unknown, args: { id: string }, context: Context) => {
      if (!context.user) throw new Error('Non autorisé');
      return prisma.project.findUnique({
        where: { id: args.id },
        include: {
          owner: true,
          members: { include: { user: true } },
          tasks: true,
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
      return prisma.task.findUnique({
        where: { id: args.id },
        include: {
          project: true,
          assignee: true,
          creator: true,
        },
      });
    },
  },

  Mutation: {
    // Inscription
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

    // Connexion
    login: async (_: unknown, args: { input: { email: string; password: string } }) => {
      const user = await prisma.user.findUnique({
        where: { email: args.input.email },
      });

      if (!user) {
        throw new Error('Email ou mot de passe incorrect');
      }

      const isValid = await verifyPassword(args.input.password, user.password);

      if (!isValid) {
        throw new Error('Email ou mot de passe incorrect');
      }

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
      args: {
        input: { name: string; description?: string; ownerId: string };
      },
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
      return prisma.task.update({
        where: { id: args.id },
        data: {
          title: args.input.title ?? undefined,
          description: args.input.description ?? undefined,
          assigneeId: args.input.assigneeId ?? undefined,
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
      await prisma.task.delete({
        where: { id: args.id },
      });
      return true;
    },
  },
};
