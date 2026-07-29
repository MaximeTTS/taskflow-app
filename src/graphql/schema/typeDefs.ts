import { gql } from 'graphql-tag';

export const typeDefs = gql`
  type User {
    id: ID!
    email: String!
    name: String
    avatar: String
    createdAt: String!

    "L'adresse a-t-elle été confirmée ? La connexion l'exige."
    emailVerified: Boolean!

    """
    Adresse en attente de confirmation, s'il y en a une.
    Visible du seul titulaire du compte : c'est une information sur une
    démarche en cours, pas un attribut public.
    """
    pendingEmail: String

    """
    Apparence choisie : "light", "dark", ou null pour suivre le système.
    Le cookie pilote le rendu ; ce champ sert à retrouver son thème depuis
    un autre navigateur.
    """
    themePreference: String

    ownedProjects: [Project!]!
    assignedTasks: [Task!]!
  }

  # ── Pagination ───────────────────────────────────────────────────────────
  # Les listes renvoyaient tout. Chaque page porte son total et un drapeau de
  # suite, pour que l'interface sache ce qu'elle n'affiche pas — une liste
  # tronquée en silence est pire qu'une liste bornée.

  type ProjectPage {
    items: [Project!]!
    totalCount: Int!
    hasMore: Boolean!
  }

  type TaskPage {
    items: [Task!]!
    totalCount: Int!
    hasMore: Boolean!
  }

  type UserPage {
    items: [User!]!
    totalCount: Int!
    hasMore: Boolean!
  }

  type Project {
    id: ID!
    name: String!
    description: String
    createdAt: String!
    owner: User!
    members: [ProjectMember!]!

    # Bornée elle aussi : un projet à dix mille tâches était le chemin le plus
    # court pour saturer le serveur, et le tableau Kanban n'en affiche jamais
    # autant d'un coup.
    tasks(limit: Int, offset: Int): TaskPage!

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

  """
  Action consignée au journal d'audit.
  Reflète l'énumération du même nom côté base : les deux doivent rester
  alignées, une action absente ici serait enregistrée mais illisible.
  """
  enum AuditAction {
    ACCOUNT_CREATED
    EMAIL_VERIFIED
    EMAIL_CHANGE_REQUESTED
    EMAIL_CHANGED
    PASSWORD_CHANGED
    PASSWORD_RESET
    PROJECT_CREATED
    PROJECT_DELETED
    MEMBER_ADDED
    MEMBER_REMOVED
    MEMBER_ROLE_CHANGED
  }

  type AuditEvent {
    id: ID!
    action: AuditAction!
    createdAt: String!

    """
    Adresse de l'auteur au moment des faits. Conservée telle quelle : elle
    survit à la suppression du compte, sans quoi le journal perdrait son
    intérêt au moment précis où il en aurait le plus.
    """
    actorEmail: String

    targetType: String!
    targetId: ID!
    "Nom lisible de la cible au moment des faits."
    targetLabel: String
    ip: String

    """
    Détails propres à l'action, sérialisés en JSON.
    Non typé volontairement : chaque action a sa propre forme, et un type par
    action gonflerait le schéma sans bénéfice — l'interface en fait une phrase.
    """
    details: String
  }

  type AuditEventPage {
    items: [AuditEvent!]!
    totalCount: Int!
    hasMore: Boolean!
  }

  type Query {
    me: User
    users(limit: Int, offset: Int): UserPage!
    user(id: ID!): User
    projects(limit: Int, offset: Int): ProjectPage!
    project(id: ID!): Project
    tasks(limit: Int, offset: Int): TaskPage!
    task(id: ID!): Task

    "Historique d'un projet. Réservé à ses ADMIN et à son propriétaire."
    projectAuditLog(projectId: ID!, limit: Int, offset: Int): AuditEventPage!

    "Historique de son propre compte."
    accountAuditLog(limit: Int, offset: Int): AuditEventPage!
  }

  # L'authentification passe par des routes REST (/api/auth/*) et non par
  # GraphQL : seule une route peut poser un cookie httpOnly sur la réponse.
  type Mutation {
    # Users
    """
    Met à jour le profil.

    Le nom s'applique immédiatement. Un changement d'adresse, lui, n'est
    qu'une demande : la nouvelle adresse n'est portée au compte qu'une fois le
    lien de confirmation ouvert. Le compte rendu se lit dans 'pendingEmail'.
    """
    updateProfile(input: UpdateProfileInput!): User!
    "Annule un changement d'adresse en attente."
    cancelEmailChange: User!
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
    """
    "light", "dark", ou null pour revenir au réglage système. Toute autre
    valeur est refusée.
    """
    themePreference: String
  }

  input ChangePasswordInput {
    currentPassword: String!
    newPassword: String!
  }
`;
