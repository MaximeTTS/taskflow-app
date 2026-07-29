import { useState } from 'react';
import { apolloClient } from '@/lib/apollo-client';
import {
  GET_PROJECT,
  TASKS_PAGE,
  UPDATE_TASK,
  CREATE_TASK,
  DELETE_TASK,
  ADD_MEMBER,
  REMOVE_MEMBER,
  UPDATE_MEMBER_ROLE,
  UPDATE_PROJECT,
  DELETE_PROJECT,
  UPLOAD_IMAGE,
  DELETE_IMAGE,
} from '../_graphql';
import type { Project, ProjectResponse, Task, TasksMeta } from '../_types';

export function useProject(projectId: string) {
  const [project, setProject] = useState<Project | null>(null);
  const [tasksMeta, setTasksMeta] = useState<TasksMeta>({ totalCount: 0, hasMore: false });
  const [loading, setLoading] = useState(true);
  const [loadingMoreTasks, setLoadingMoreTasks] = useState(false);

  /** Interroge le serveur et aplatit la page de tâches. */
  const load = async (offset: number) => {
    const { data } = await apolloClient.query({
      query: GET_PROJECT,
      variables: { id: projectId, limit: TASKS_PAGE, offset },
      fetchPolicy: 'network-only',
    });

    const brut = (data as { project: ProjectResponse | null }).project;
    if (!brut) return null;

    return {
      projet: { ...brut, tasks: brut.tasks.items } satisfies Project,
      meta: { totalCount: brut.tasks.totalCount, hasMore: brut.tasks.hasMore },
    };
  };

  /**
   * Recharge le projet depuis la première page.
   *
   * Les pages supplémentaires déjà chargées sont perdues, et c'est le choix le
   * plus sûr : après une création ou une suppression, les positions ont
   * changé, et recoller des pages obtenues avant la mutation afficherait des
   * doublons ou des trous. Repartir du début donne toujours une vue juste.
   */
  const fetchProject = async () => {
    try {
      const résultat = await load(0);
      if (!résultat) return;

      setProject(résultat.projet);
      setTasksMeta(résultat.meta);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /** Ajoute la page suivante de tâches à celles déjà affichées. */
  const fetchMoreTasks = async () => {
    if (!project || !tasksMeta.hasMore) return;

    setLoadingMoreTasks(true);
    try {
      const résultat = await load(project.tasks.length);
      if (!résultat) return;

      setProject((prev) =>
        prev ? { ...prev, tasks: [...prev.tasks, ...résultat.projet.tasks] } : résultat.projet,
      );
      setTasksMeta(résultat.meta);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMoreTasks(false);
    }
  };

  const handleUpdateTask = async (taskId: string, input: Record<string, string | null>) => {
    setProject((prev) => {
      if (!prev) return prev;
      return { ...prev, tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, ...input } : t)) };
    });
    try {
      await apolloClient.mutate({ mutation: UPDATE_TASK, variables: { id: taskId, input } });
    } catch (err) {
      console.error(err);
      void fetchProject();
    }
  };

  const handleDeleteTask = async (taskId: string, onDone: () => void) => {
    try {
      await apolloClient.mutate({ mutation: DELETE_TASK, variables: { id: taskId } });
      onDone();
      void fetchProject();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTask = async (input: Record<string, unknown>, images: File[]) => {
    const { data } = await apolloClient.mutate({ mutation: CREATE_TASK, variables: { input } });
    const createdTask = (data as { createTask: { id: string } }).createTask;
    for (const file of images) {
      const base64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      await apolloClient.mutate({
        mutation: UPLOAD_IMAGE,
        variables: { taskId: createdTask.id, base64Image: base64 },
      });
    }
    void fetchProject();
  };

  const handleUploadImage = async (
    file: File,
    selectedTask: Task,
    onDone: (task: Task, project: Project) => void,
  ) => {
    const base64 = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(file);
    });
    await apolloClient.mutate({
      mutation: UPLOAD_IMAGE,
      variables: { taskId: selectedTask.id, base64Image: base64 },
    });

    const résultat = await load(0);
    if (!résultat) return;

    setTasksMeta(résultat.meta);
    const ut = résultat.projet.tasks.find((t) => t.id === selectedTask.id);
    if (ut) onDone(ut, résultat.projet);
  };

  const handleDeleteImage = async (
    imageId: string,
    selectedTaskId: string | undefined,
    onDone: (task: Task | undefined, project: Project) => void,
  ) => {
    await apolloClient.mutate({ mutation: DELETE_IMAGE, variables: { imageId } });

    const résultat = await load(0);
    if (!résultat) return;

    setTasksMeta(résultat.meta);
    const ut = résultat.projet.tasks.find((t) => t.id === selectedTaskId);
    onDone(ut, résultat.projet);
  };

  const handleAddMember = async (email: string, role: string) => {
    await apolloClient.mutate({ mutation: ADD_MEMBER, variables: { projectId, email, role } });
    void fetchProject();
  };

  const handleRemoveMember = async (userId: string) => {
    await apolloClient.mutate({ mutation: REMOVE_MEMBER, variables: { projectId, userId } });
    void fetchProject();
  };

  const handleUpdateRole = async (userId: string, role: string) => {
    try {
      await apolloClient.mutate({
        mutation: UPDATE_MEMBER_ROLE,
        variables: { projectId, userId, role },
      });
      void fetchProject();
    } catch (err) {
      console.error('Erreur lors de la mise à jour du rôle:', err);
      void fetchProject();
    }
  };

  const handleUpdateProject = async (name: string, description: string) => {
    await apolloClient.mutate({
      mutation: UPDATE_PROJECT,
      variables: { id: projectId, input: { name, description } },
    });
    void fetchProject();
  };

  const handleDeleteProject = async () => {
    await apolloClient.mutate({ mutation: DELETE_PROJECT, variables: { id: projectId } });
  };

  return {
    project,
    setProject,
    loading,
    tasksMeta,
    loadingMoreTasks,
    fetchMoreTasks,
    fetchProject,
    handleUpdateTask,
    handleDeleteTask,
    handleCreateTask,
    handleUploadImage,
    handleDeleteImage,
    handleAddMember,
    handleRemoveMember,
    handleUpdateRole,
    handleUpdateProject,
    handleDeleteProject,
  };
}
