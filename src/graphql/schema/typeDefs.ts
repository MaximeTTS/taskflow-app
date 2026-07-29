import { gql } from 'graphql-tag';

export const typeDefs = gql`
  type User {
    id: ID!
    email: String!
    name: String
    avatar: String
    createdAt: String!
    ownedProjects: [Project!]!
    assignedTasks: [Task!]!
  }

  type Project {
    id: ID!
    name: String!
    description: String
    createdAt: String!
    owner: User!
    members: [ProjectMember!]!
    tasks: [Task!]!

    # Compteurs agrégés. Permettent aux vues de synthèse (le tableau de bord)
    # d'afficher une progression sans rapatrier toutes les tâches.
    taskCount: Int!
    completedTaskCount: Int!
  }

  type ProjectMember {
    id: ID!
    role: MemberRole!
    joinedAt: String!
    user: User!
    project: Project!
  }

  type Task {
    id: ID!
    title: String!
    description: String
    status: TaskStatus!
    priority: Priority!
    dueDate: String
    createdAt: String!
    project: Project!
    assignee: User
    creator: User!
    images: [TaskImage!]!
  }

  type TaskImage {
    id: ID!
    url: String!
    publicId: String!
    createdAt: String!
  }

  enum MemberRole {
    OWNER
    ADMIN
    MEMBER
    VIEWER
  }

  enum TaskStatus {
    TODO
    IN_PROGRESS
    IN_REVIEW
    DONE
    CANCELLED
  }

  enum Priority {
    LOW
    MEDIUM
    HIGH
    URGENT
  }

  type Query {
    me: User
    users: [User!]!
    user(id: ID!): User
    projects: [Project!]!
    project(id: ID!): Project
    tasks: [Task!]!
    task(id: ID!): Task
  }

  # L'authentification passe par des routes REST (/api/auth/*) et non par
  # GraphQL : seule une route peut poser un cookie httpOnly sur la réponse.
  type Mutation {
    # Users
    updateProfile(input: UpdateProfileInput!): User!
    updateAvatar(base64Image: String!): User!
    changePassword(input: ChangePasswordInput!): Boolean!

    # Projects
    createProject(input: CreateProjectInput!): Project!
    updateProject(id: ID!, input: UpdateProjectInput!): Project!
    deleteProject(id: ID!): Boolean!
    addMember(projectId: ID!, email: String!, role: MemberRole!): ProjectMember!
    removeMember(projectId: ID!, userId: ID!): Boolean!
    updateMemberRole(projectId: ID!, userId: ID!, role: MemberRole!): ProjectMember!

    # Tasks
    createTask(input: CreateTaskInput!): Task!
    updateTask(id: ID!, input: UpdateTaskInput!): Task!
    deleteTask(id: ID!): Boolean!

    uploadTaskImage(taskId: ID!, base64Image: String!): TaskImage!
    deleteTaskImage(imageId: ID!): Boolean!
  }

  input CreateProjectInput {
    name: String!
    description: String
  }

  input CreateTaskInput {
    title: String!
    description: String
    status: TaskStatus
    priority: Priority
    dueDate: String
    projectId: ID!
    assigneeId: ID
  }

  input UpdateTaskInput {
    title: String
    description: String
    status: TaskStatus
    priority: Priority
    dueDate: String
    assigneeId: String
  }

  input UpdateProjectInput {
    name: String
    description: String
  }

  input UpdateProfileInput {
    name: String
    email: String
  }

  input ChangePasswordInput {
    currentPassword: String!
    newPassword: String!
  }
`;
