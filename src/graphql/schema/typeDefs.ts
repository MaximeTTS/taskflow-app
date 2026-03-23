import { gql } from 'graphql-tag';

export const typeDefs = gql`
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
    images: [TaskImage!]!
  }

  type TaskImage {
    id: ID!
    url: String!
    publicId: String!
    createdAt: String!
  }

  # Nouveau type pour la réponse auth
  type AuthPayload {
    token: String!
    user: User!
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

  type Mutation {
    # Auth
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!

    # Users
    createUser(input: CreateUserInput!): User!
    updateProfile(input: UpdateProfileInput!): User!
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

  input RegisterInput {
    email: String!
    name: String
    password: String!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input CreateUserInput {
    email: String!
    name: String
    password: String!
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
