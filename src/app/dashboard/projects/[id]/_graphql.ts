import { gql } from 'graphql-tag';

export const GET_PROJECT = gql`
  query GetProject($id: ID!, $limit: Int, $offset: Int) {
    project(id: $id) {
      id
      name
      description
      owner {
        id
        name
        email
      }
      members {
        id
        role
        user {
          id
          name
          email
          avatar
        }
      }
      tasks(limit: $limit, offset: $offset) {
        totalCount
        hasMore
        items {
          id
          title
          description
          status
          priority
          dueDate
          createdAt
          assignee {
            id
            name
            avatar
          }
          creator {
            id
            name
          }
          images {
            id
            url
            publicId
          }
        }
      }
    }
  }
`;

/**
 * Tâches chargées par page.
 *
 * Plus généreux que sur le tableau de bord : un tableau Kanban perd son sens
 * si l'on ne voit qu'un fragment de chaque colonne. Le serveur plafonne à 100,
 * et le bouton « charger plus » prend le relais au-delà.
 */
export const TASKS_PAGE = 100;

export const CREATE_TASK = gql`
  mutation CreateTask($input: CreateTaskInput!) {
    createTask(input: $input) {
      id
      title
      status
      priority
    }
  }
`;

export const UPDATE_TASK = gql`
  mutation UpdateTask($id: ID!, $input: UpdateTaskInput!) {
    updateTask(id: $id, input: $input) {
      id
      status
      priority
      dueDate
    }
  }
`;

export const DELETE_TASK = gql`
  mutation DeleteTask($id: ID!) {
    deleteTask(id: $id)
  }
`;

export const ADD_MEMBER = gql`
  mutation AddMember($projectId: ID!, $email: String!, $role: MemberRole!) {
    addMember(projectId: $projectId, email: $email, role: $role) {
      id
      role
      user {
        id
        name
        email
      }
    }
  }
`;

export const REMOVE_MEMBER = gql`
  mutation RemoveMember($projectId: ID!, $userId: ID!) {
    removeMember(projectId: $projectId, userId: $userId)
  }
`;

export const UPDATE_MEMBER_ROLE = gql`
  mutation UpdateMemberRole($projectId: ID!, $userId: ID!, $role: MemberRole!) {
    updateMemberRole(projectId: $projectId, userId: $userId, role: $role) {
      id
      role
      user {
        id
        name
      }
    }
  }
`;

export const UPDATE_PROJECT = gql`
  mutation UpdateProject($id: ID!, $input: UpdateProjectInput!) {
    updateProject(id: $id, input: $input) {
      id
      name
      description
    }
  }
`;

export const DELETE_PROJECT = gql`
  mutation DeleteProject($id: ID!) {
    deleteProject(id: $id)
  }
`;

export const UPLOAD_IMAGE = gql`
  mutation UploadTaskImage($taskId: ID!, $base64Image: String!) {
    uploadTaskImage(taskId: $taskId, base64Image: $base64Image) {
      id
      url
      publicId
    }
  }
`;

export const DELETE_IMAGE = gql`
  mutation DeleteTaskImage($imageId: ID!) {
    deleteTaskImage(imageId: $imageId)
  }
`;
