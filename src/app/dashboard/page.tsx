'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { gql } from 'graphql-tag';
import { apolloClient } from '@/lib/apollo-client';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';

const GET_PROJECTS = gql`
  query GetProjects {
    projects {
      id
      name
      description
      createdAt
      owner {
        id
        name
        email
      }
      tasks {
        id
        status
      }
      members {
        id
        role
        user {
          id
          name
        }
      }
    }
  }
`;

const CREATE_PROJECT = gql`
  mutation CreateProject($input: CreateProjectInput!) {
    createProject(input: $input) {
      id
      name
      description
    }
  }
`;

type Task = { id: string; status: string };
type Member = { id: string; role: string; user: { id: string; name: string } };
type Project = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  owner: { id: string; name: string; email: string };
  tasks: Task[];
  members: Member[];
};

const STATUS_COLORS: Record<string, string> = {
  TODO: 'bg-[#2a2a3a]',
  IN_PROGRESS: 'bg-indigo-500',
  IN_REVIEW: 'bg-amber-500',
  DONE: 'bg-green-500',
  CANCELLED: 'bg-red-500',
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      router.push('/login');
      return;
    }
    const { initFromStorage } = useAuthStore.getState();
    initFromStorage();
    void fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data } = await apolloClient.query({
        query: GET_PROJECTS,
        fetchPolicy: 'network-only',
      });
      setProjects((data as { projects: Project[] }).projects);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await apolloClient.mutate({
        mutation: CREATE_PROJECT,
        variables: { input: { name, description: desc } },
      });
      setName('');
      setDesc('');
      setShowModal(false);
      void fetchProjects();
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const totalTasks = projects.reduce((acc, p) => acc + p.tasks.length, 0);
  const doneTasks = projects.reduce(
    (acc, p) => acc + p.tasks.filter((t) => t.status === 'DONE').length,
    0,
  );

  if (loading)
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-[#55556a] text-sm">Chargement...</div>
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
          <div className="text-[10px] font-medium text-[#55556a] uppercase tracking-wider px-2 mb-2">
            Menu
          </div>
          <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm bg-indigo-500/10 text-indigo-400 mb-1">
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
          <button
            onClick={() => {
              logout();
              router.push('/login');
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[#8888aa] hover:text-[#f0f0ff] hover:bg-[#1e1e2a] transition-colors mt-auto"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Déconnexion
          </button>
        </nav>

        <div className="p-3 border-t border-[#2a2a3a]">
          <div className="flex items-center gap-2.5 px-2 py-2">
            <Avatar name={user?.name ?? user?.email ?? 'U'} size="sm" />
            <div className="min-w-0">
              <div className="text-xs font-medium text-[#f0f0ff] truncate">
                {user?.name ?? 'Utilisateur'}
              </div>
              <div className="text-[10px] text-[#55556a] truncate">{user?.email}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-56 flex-1 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-[#f0f0ff]">Dashboard</h1>
            <p className="text-sm text-[#55556a] mt-0.5">
              Bienvenue, {user?.name ?? user?.email} 👋
            </p>
          </div>
          <Button onClick={() => setShowModal(true)}>+ Nouveau projet</Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Projets', value: projects.length },
            { label: 'Tâches totales', value: totalTasks },
            { label: 'Terminées', value: doneTasks },
            {
              label: 'Membres',
              value: [...new Set(projects.flatMap((p) => p.members.map((m) => m.user.id)))].length,
            },
          ].map((s) => (
            <div key={s.label} className="bg-[#16161f] border border-[#2a2a3a] rounded-xl p-4">
              <div className="text-xs text-[#55556a] mb-1">{s.label}</div>
              <div className="text-2xl font-bold text-[#f0f0ff]">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Projects */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[#f0f0ff]">Mes projets</h2>
          <span className="text-xs text-[#55556a]">{projects.length} projet(s)</span>
        </div>

        {projects.length === 0 ? (
          <div className="bg-[#16161f] border border-[#2a2a3a] rounded-xl p-16 text-center">
            <p className="text-[#55556a] text-sm">Aucun projet — créez-en un !</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => {
              const done = project.tasks.filter((t) => t.status === 'DONE').length;
              const total = project.tasks.length;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;

              return (
                <div
                  key={project.id}
                  onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                  className="bg-[#16161f] border border-[#2a2a3a] rounded-xl p-5 cursor-pointer hover:border-[#3a3a50] transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-sm font-semibold text-[#f0f0ff] group-hover:text-indigo-400 transition-colors">
                      {project.name}
                    </h3>
                    <Badge variant={pct === 100 ? 'success' : 'purple'}>
                      {pct === 100 ? 'Terminé' : 'En cours'}
                    </Badge>
                  </div>

                  {project.description && (
                    <p className="text-xs text-[#55556a] mb-4 line-clamp-2">
                      {project.description}
                    </p>
                  )}

                  {/* Mini task bars */}
                  <div className="flex gap-0.5 mb-4 h-1">
                    {project.tasks.slice(0, 20).map((t) => (
                      <div
                        key={t.id}
                        className={`flex-1 rounded-full ${STATUS_COLORS[t.status] ?? 'bg-[#2a2a3a]'}`}
                      />
                    ))}
                    {project.tasks.length === 0 && (
                      <div className="flex-1 rounded-full bg-[#2a2a3a]" />
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-1.5">
                      {project.members.slice(0, 4).map((m) => (
                        <div key={m.id} className="ring-2 ring-[#16161f] rounded-full">
                          <Avatar name={m.user.name} size="sm" />
                        </div>
                      ))}
                    </div>
                    <span className="text-xs text-[#55556a]">
                      {done}/{total} tâches
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal nouveau projet */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nouveau projet">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <Input
            label="Nom du projet"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Mon super projet"
            required
          />
          <Input
            label="Description"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Description (optionnel)"
          />
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" type="button" onClick={() => setShowModal(false)}>
              Annuler
            </Button>
            <Button type="submit" loading={creating}>
              Créer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
