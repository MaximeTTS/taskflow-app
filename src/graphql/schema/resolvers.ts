import { prisma } from '@/lib/prisma';

export const resolvers = {
  Query: {
    // Récupère tous les users
    users: async () => {
      return prisma.user.findMany();
    },

    // Récupère un user par son ID
    user: async (_: unknown, args: { id: string }) => {
      return prisma.user.findUnique({
        where: { id: args.id },
      });
    },

    // Récupère tous les projets
    projects: async () => {
      return prisma.project.findMany({
        include: {
          owner: true,
          members: { include: { user: true } },
          tasks: true,
        },
      });
    },

    // Récupère un projet par son ID
    project: async (_: unknown, args: { id: string }) => {
      return prisma.project.findUnique({
        where: { id: args.id },
        include: {
          owner: true,
          members: { include: { user: true } },
          tasks: true,
        },
      });
    },

    // Récupère toutes les tâches
    tasks: async () => {
      return prisma.task.findMany({
        include: {
          project: true,
          assignee: true,
          creator: true,
        },
      });
    },

    // Récupère une tâche par son ID
    task: async (_: unknown, args: { id: string }) => {
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
    // Crée un nouvel utilisateur
    createUser: async (
      _: unknown,
      args: {
        input: {
          email: string;
          name?: string;
          password: string;
        };
      },
    ) => {
      return prisma.user.create({
        data: {
          email: args.input.email,
          name: args.input.name,
          password: args.input.password,
        },
      });
    },

    // Crée un nouveau projet
    createProject: async (
      _: unknown,
      args: {
        input: {
          name: string;
          description?: string;
          ownerId: string;
        };
      },
    ) => {
      return prisma.project.create({
        data: {
          name: args.input.name,
          description: args.input.description,
          ownerId: args.input.ownerId,
          members: {
            create: {
              userId: args.input.ownerId,
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

    // Crée une nouvelle tâche
    createTask: async (
      _: unknown,
      args: {
        input: {
          title: string;
          description?: string;
          status?: string;
          priority?: string;
          dueDate?: string;
          projectId: string;
          assigneeId?: string;
          creatorId: string;
        };
      },
    ) => {
      return prisma.task.create({
        data: {
          title: args.input.title,
          description: args.input.description,
          projectId: args.input.projectId,
          assigneeId: args.input.assigneeId,
          creatorId: args.input.creatorId,
        },
        include: {
          project: true,
          assignee: true,
          creator: true,
        },
      });
    },

    // Met à jour une tâche
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
    ) => {
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

    // Supprime une tâche
    deleteTask: async (_: unknown, args: { id: string }) => {
      await prisma.task.delete({
        where: { id: args.id },
      });
      return true;
    },
  },
};
