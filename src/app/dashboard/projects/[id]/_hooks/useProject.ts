import { useState } from 'react';
import { apolloClient } from '@/lib/apollo-client';
import {
  GET_PROJECT,
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
import type { Project, Task } from '../_types';

export function useProject(projectId: string) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProject = async () => {
    try {
      const { data } = await apolloClient.query({
        query: GET_PROJECT,
        variables: { id: projectId },
        fetchPolicy: 'network-only',
      });
      setProject((data as { project: Project }).project);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
    const { data } = await apolloClient.query({
      query: GET_PROJECT,
      variables: { id: projectId },
      fetchPolicy: 'network-only',
    });
    const up = (data as { project: Project }).project;
    const ut = up.tasks.find((t) => t.id === selectedTask.id);
    if (ut) onDone(ut, up);
  };

  const handleDeleteImage = async (
    imageId: string,
    selectedTaskId: string | undefined,
    onDone: (task: Task | undefined, project: Project) => void,
  ) => {
    await apolloClient.mutate({ mutation: DELETE_IMAGE, variables: { imageId } });
    const { data } = await apolloClient.query({
      query: GET_PROJECT,
      variables: { id: projectId },
      fetchPolicy: 'network-only',
    });
    const up = (data as { project: Project }).project;
    const ut = up.tasks.find((t) => t.id === selectedTaskId);
    onDone(ut, up);
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
    await apolloClient.mutate({
      mutation: UPDATE_MEMBER_ROLE,
      variables: { projectId, userId, role },
    });
    void fetchProject();
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
