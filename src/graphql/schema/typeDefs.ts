import { gql } from 'graphql-tag';

export const typeDefs = gql`
  # ============================================
  # TYPES DE BASE
  # ============================================

  type User {
    id: ID!
    email: String!
    name: String
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
  }

  # ============================================
  # ENUMS
  # ============================================

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

  # ============================================
  # QUERIES
  # ============================================

  type Query {
    users: [User!]!
    user(id: ID!): User
    projects: [Project!]!
    project(id: ID!): Project
    tasks: [Task!]!
    task(id: ID!): Task
  }

  # ============================================
  # MUTATIONS
  # ============================================

  type Mutation {
    createUser(input: CreateUserInput!): User!
    createProject(input: CreateProjectInput!): Project!
    createTask(input: CreateTaskInput!): Task!
    updateTask(id: ID!, input: UpdateTaskInput!): Task!
    deleteTask(id: ID!): Boolean!
  }

  # ============================================
  # INPUTS
  # ============================================

  input CreateUserInput {
    email: String!
    name: String
    password: String!
  }

  input CreateProjectInput {
    name: String!
    description: String
    ownerId: String!
  }

  input CreateTaskInput {
    title: String!
    description: String
    status: TaskStatus
    priority: Priority
    dueDate: String
    projectId: String!
    assigneeId: String
    creatorId: String!
  }

  input UpdateTaskInput {
    title: String
    description: String
    status: TaskStatus
    priority: Priority
    dueDate: String
    assigneeId: String
  }
`;
