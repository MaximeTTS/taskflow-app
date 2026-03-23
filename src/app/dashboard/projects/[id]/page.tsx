'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { gql } from 'graphql-tag';
import { apolloClient } from '@/lib/apollo-client';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';

const GET_PROJECT = gql`
  query GetProject($id: ID!) {
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
        }
      }
      tasks {
        id
        title
        description
        status
        priority
        createdAt
        assignee {
          id
          name
        }
        creator {
          id
          name
        }
      }
    }
  }
`;

const CREATE_TASK = gql`
  mutation CreateTask($input: CreateTaskInput!) {
    createTask(input: $input) {
      id
      title
      status
      priority
    }
  }
`;

const UPDATE_TASK = gql`
  mutation UpdateTask($id: ID!, $input: UpdateTaskInput!) {
    updateTask(id: $id, input: $input) {
      id
      status
    }
  }
`;

const DELETE_TASK = gql`
  mutation DeleteTask($id: ID!) {
    deleteTask(id: $id)
  }
`;

const ADD_MEMBER = gql`
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

const REMOVE_MEMBER = gql`
  mutation RemoveMember($projectId: ID!, $userId: ID!) {
    removeMember(projectId: $projectId, userId: $userId)
  }
`;

const UPDATE_MEMBER_ROLE = gql`
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

type Assignee = { id: string; name: string };
type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  createdAt: string;
  assignee: Assignee | null;
  creator: { id: string; name: string };
};
type Member = { id: string; role: string; user: { id: string; name: string; email: string } };
type Project = {
  id: string;
  name: string;
  description: string | null;
  owner: { id: string; name: string; email: string };
  members: Member[];
  tasks: Task[];
};

const COLUMNS = [
  { key: 'TODO', label: 'À faire', color: 'bg-[#2a2a3a]' },
  { key: 'IN_PROGRESS', label: 'En cours', color: 'bg-indigo-500' },
  { key: 'IN_REVIEW', label: 'En révision', color: 'bg-amber-500' },
  { key: 'DONE', label: 'Terminé', color: 'bg-green-500' },
];

const PRIORITY_BADGE: Record<string, 'danger' | 'warning' | 'info' | 'default'> = {
  URGENT: 'danger',
  HIGH: 'warning',
  MEDIUM: 'info',
  LOW: 'default',
};

const PRIORITY_LABEL: Record<string, string> = {
  URGENT: 'Urgent',
  HIGH: 'Haute',
  MEDIUM: 'Moyenne',
  LOW: 'Basse',
};

export default function ProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState('MEDIUM');
  const [creating, setCreating] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('MEMBER');
  const [addingMember, setAddingMember] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const u = JSON.parse(userStr) as { id: string };
      setCurrentUserId(u.id);
    }
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      router.push('/login');
      return;
    }
    void fetchProject();
  }, [projectId]);

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

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    const userStr = localStorage.getItem('user');
    const currentUser = userStr ? (JSON.parse(userStr) as { id: string }) : null;
    if (!currentUser?.id) return;
    try {
      await apolloClient.mutate({
        mutation: CREATE_TASK,
        variables: {
          input: {
            title: newTitle,
            description: newDesc,
            priority: newPriority,
            projectId,
            creatorId: currentUser.id,
          },
        },
      });
      setNewTitle('');
      setNewDesc('');
      setShowTaskModal(false);
      void fetchProject();
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateStatus = async (taskId: string, status: string) => {
    try {
      await apolloClient.mutate({
        mutation: UPDATE_TASK,
        variables: { id: taskId, input: { status } },
      });
      void fetchProject();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await apolloClient.mutate({ mutation: DELETE_TASK, variables: { id: taskId } });
      setSelectedTask(null);
      void fetchProject();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingMember(true);
    try {
      await apolloClient.mutate({
        mutation: ADD_MEMBER,
        variables: { projectId, email: memberEmail, role: memberRole },
      });
      setMemberEmail('');
      setShowMemberModal(false);
      void fetchProject();
    } catch (err) {
      console.error(err);
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      await apolloClient.mutate({ mutation: REMOVE_MEMBER, variables: { projectId, userId } });
      void fetchProject();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateRole = async (userId: string, role: string) => {
    try {
      await apolloClient.mutate({
        mutation: UPDATE_MEMBER_ROLE,
        variables: { projectId, userId, role },
      });
      void fetchProject();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-[#55556a] text-sm">Chargement...</div>
      </div>
    );

  if (!project)
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-[#55556a] text-sm">Projet introuvable</div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      {/* Sidebar */}
      <aside className="w-56 bg-[#111118] border-r border-[#2a2a3a] flex flex-col fixed h-full">
        <div className="p-5 border-b border-[#2a2a3a]">
          <div className="text-base font-bold text-[#f0f0ff]">
            Task<span className="text-indigo-400">Flow</span>
          </div>
        </div>
        <nav className="p-3 flex-1">
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[#8888aa] hover:text-[#f0f0ff] hover:bg-[#1e1e2a] transition-colors mb-1"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
            Dashboard
          </button>
          <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm bg-indigo-500/10 text-indigo-400">
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
            {project.name}
          </button>
        </nav>
        <div className="p-3 border-t border-[#2a2a3a]">
          <div className="flex items-center gap-2 px-2 py-1">
            <div className="text-xs text-[#55556a]">{project.members.length} membre(s)</div>
            <div className="flex -space-x-1.5 ml-auto">
              {project.members.slice(0, 3).map((m) => (
                <div key={m.id} className="ring-2 ring-[#111118] rounded-full">
                  <Avatar name={m.user.name} size="sm" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-56 flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-[#2a2a3a] px-8 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-[#f0f0ff]">{project.name}</h1>
            {project.description && (
              <p className="text-sm text-[#55556a] mt-0.5">{project.description}</p>
            )}
          </div>
          <Button onClick={() => setShowTaskModal(true)}>+ Nouvelle tâche</Button>
        </div>

        {/* Kanban */}
        <div className="p-8 overflow-x-auto">
          <div className="grid grid-cols-4 gap-4 min-w-[800px]">
            {COLUMNS.map((col) => {
              const tasks = project.tasks.filter((t) => t.status === col.key);
              return (
                <div
                  key={col.key}
                  className="bg-[#111118] border border-[#2a2a3a] rounded-xl flex flex-col"
                >
                  <div className="flex items-center gap-2 p-4 border-b border-[#2a2a3a]">
                    <div className={`w-2 h-2 rounded-full ${col.color}`} />
                    <span className="text-xs font-medium text-[#8888aa]">{col.label}</span>
                    <span className="ml-auto bg-[#2a2a3a] text-[#55556a] text-xs px-2 py-0.5 rounded-full">
                      {tasks.length}
                    </span>
                  </div>
                  <div className="p-3 flex flex-col gap-2 flex-1">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => setSelectedTask(task)}
                        className="bg-[#16161f] border border-[#2a2a3a] rounded-lg p-3 cursor-pointer hover:border-[#3a3a50] transition-all group"
                      >
                        <p className="text-sm text-[#f0f0ff] mb-2 leading-snug group-hover:text-indigo-300 transition-colors">
                          {task.title}
                        </p>
                        <div className="flex items-center justify-between">
                          <Badge variant={PRIORITY_BADGE[task.priority] ?? 'default'}>
                            {PRIORITY_LABEL[task.priority] ?? task.priority}
                          </Badge>
                          {task.assignee && <Avatar name={task.assignee.name} size="sm" />}
                        </div>
                      </div>
                    ))}
                    {tasks.length === 0 && (
                      <div className="flex-1 flex items-center justify-center py-8">
                        <p className="text-xs text-[#2a2a3a]">Aucune tâche</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section membres */}
        <div className="px-8 pb-8">
          <div className="bg-[#111118] border border-[#2a2a3a] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-[#f0f0ff]">Membres</h2>
              <Button size="sm" onClick={() => setShowMemberModal(true)}>
                + Inviter
              </Button>
            </div>
            <div className="flex flex-col gap-2">
              {project.members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 p-3 bg-[#16161f] border border-[#2a2a3a] rounded-lg"
                >
                  <Avatar name={m.user.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[#f0f0ff] truncate">{m.user.name}</div>
                    <div className="text-xs text-[#55556a] truncate">{m.user.email}</div>
                  </div>
                  {m.user.id !== project.owner.id ? (
                    <select
                      value={m.role}
                      onChange={(e) => void handleUpdateRole(m.user.id, e.target.value)}
                      className="bg-[#2a2a3a] border border-[#3a3a50] rounded-lg px-2 py-1 text-xs text-[#f0f0ff] outline-none"
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="MEMBER">Member</option>
                      <option value="VIEWER">Viewer</option>
                    </select>
                  ) : (
                    <Badge variant="purple">Owner</Badge>
                  )}
                  {m.user.id !== project.owner.id && m.user.id !== currentUserId && (
                    <button
                      onClick={() => void handleRemoveMember(m.user.id)}
                      className="text-[#55556a] hover:text-red-400 transition-colors text-lg leading-none ml-1"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Modal nouvelle tâche */}
      <Modal open={showTaskModal} onClose={() => setShowTaskModal(false)} title="Nouvelle tâche">
        <form onSubmit={handleCreateTask} className="flex flex-col gap-4">
          <Input
            label="Titre"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Titre de la tâche"
            required
          />
          <Input
            label="Description"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Description (optionnel)"
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#8888aa]">Priorité</label>
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value)}
              className="w-full bg-[#16161f] border border-[#2a2a3a] rounded-lg px-4 py-2.5 text-sm text-[#f0f0ff] outline-none focus:border-indigo-500"
            >
              <option value="LOW">Basse</option>
              <option value="MEDIUM">Moyenne</option>
              <option value="HIGH">Haute</option>
              <option value="URGENT">Urgente</option>
            </select>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" type="button" onClick={() => setShowTaskModal(false)}>
              Annuler
            </Button>
            <Button type="submit" loading={creating}>
              Créer
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal détail tâche */}
      <Modal
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        title={selectedTask?.title ?? ''}
      >
        {selectedTask && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Badge variant={PRIORITY_BADGE[selectedTask.priority] ?? 'default'}>
                {PRIORITY_LABEL[selectedTask.priority]}
              </Badge>
              {selectedTask.assignee && (
                <div className="flex items-center gap-1.5">
                  <Avatar name={selectedTask.assignee.name} size="sm" />
                  <span className="text-xs text-[#8888aa]">{selectedTask.assignee.name}</span>
                </div>
              )}
            </div>
            {selectedTask.description && (
              <p className="text-sm text-[#8888aa] leading-relaxed break-words overflow-hidden">
                {selectedTask.description}
              </p>
            )}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#8888aa]">Statut</label>
              <select
                value={selectedTask.status}
                onChange={(e) => void handleUpdateStatus(selectedTask.id, e.target.value)}
                className="w-full bg-[#16161f] border border-[#2a2a3a] rounded-lg px-4 py-2.5 text-sm text-[#f0f0ff] outline-none focus:border-indigo-500"
              >
                {COLUMNS.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-between pt-2 border-t border-[#2a2a3a]">
              <Button
                variant="danger"
                size="sm"
                onClick={() => void handleDeleteTask(selectedTask.id)}
              >
                Supprimer
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedTask(null)}>
                Fermer
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal inviter membre */}
      <Modal
        open={showMemberModal}
        onClose={() => setShowMemberModal(false)}
        title="Inviter un membre"
      >
        <form onSubmit={handleAddMember} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            value={memberEmail}
            onChange={(e) => setMemberEmail(e.target.value)}
            placeholder="alice@exemple.com"
            required
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#8888aa]">Rôle</label>
            <select
              value={memberRole}
              onChange={(e) => setMemberRole(e.target.value)}
              className="w-full bg-[#16161f] border border-[#2a2a3a] rounded-lg px-4 py-2.5 text-sm text-[#f0f0ff] outline-none focus:border-indigo-500"
            >
              <option value="ADMIN">Admin</option>
              <option value="MEMBER">Member</option>
              <option value="VIEWER">Viewer</option>
            </select>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" type="button" onClick={() => setShowMemberModal(false)}>
              Annuler
            </Button>
            <Button type="submit" loading={addingMember}>
              Inviter
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
