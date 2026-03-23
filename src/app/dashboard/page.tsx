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
  const activeProjects = projects.filter((p) =>
    p.tasks.some((t) => t.status !== 'DONE' && t.status !== 'CANCELLED'),
  );

  if (loading)
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-[#8888aa] text-base">Chargement...</div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      {/* Sidebar */}
      <aside className="w-60 bg-[#111118] border-r border-[#2a2a3a] flex flex-col fixed h-full">
        <div className="p-6 border-b border-[#2a2a3a]">
          <div className="text-3xl font-bold text-[#f0f0ff]">
            Task<span className="text-indigo-400">Flow</span>
          </div>
        </div>

        <nav className="p-3 flex-1">
          <div className="text-[12px] font-medium text-[#55556a] uppercase tracking-wider px-2 mb-3">
            Menu
          </div>

          <button className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-md bg-indigo-500/10 text-indigo-400 mb-1">
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
            onClick={() => router.push('/profile')}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-md text-[#8888aa] hover:text-[#f0f0ff] hover:bg-[#1e1e2a] transition-colors mb-1"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Profil
          </button>

          <button
            onClick={() => {
              logout();
              router.push('/login');
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-md text-[#8888aa] hover:text-red-400 hover:bg-red-500/10 transition-colors mb-1"
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

        <div className="p-4 border-t border-[#2a2a3a]">
          <div className="flex items-center gap-3 px-2 py-2">
            <Avatar name={user?.name ?? user?.email ?? 'U'} size="sm" />
            <div className="min-w-0">
              <div className="text-sm font-medium text-[#f0f0ff] truncate">
                {user?.name ?? 'Utilisateur'}
              </div>
              <div className="text-xs text-[#8888aa] truncate">{user?.email}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-60 flex-1 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#f0f0ff]">Dashboard</h1>
            <p className="text-[#8888aa] mt-1">Bienvenue, {user?.name ?? user?.email} 👋</p>
          </div>
          <Button size="lg" onClick={() => setShowModal(true)}>
            + Nouveau projet
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Projets actifs', value: activeProjects.length, color: 'text-indigo-400' },
            { label: 'Tâches totales', value: totalTasks, color: 'text-[#f0f0ff]' },
            { label: 'Terminées', value: doneTasks, color: 'text-green-400' },
            {
              label: 'Membres',
              value: [...new Set(projects.flatMap((p) => p.members.map((m) => m.user.id)))].length,
              color: 'text-amber-400',
            },
          ].map((s) => (
            <div key={s.label} className="bg-[#16161f] border border-[#2a2a3a] rounded-xl p-5">
              <div className="text-lg text-[#8888aa] mb-2">{s.label}</div>
              <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Projects */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl font-semibold text-[#f0f0ff]">Mes projets</h2>
          <span className="text-lg text-[#8888aa]">{projects.length} projet(s)</span>
        </div>

        {projects.length === 0 ? (
          <div className="bg-[#16161f] border border-[#2a2a3a] rounded-xl p-16 text-center">
            <p className="text-[#8888aa] text-base">Aucun projet — créez-en un !</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((project) => {
              const done = project.tasks.filter((t) => t.status === 'DONE').length;
              const total = project.tasks.length;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              return (
                <div
                  key={project.id}
                  onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                  className="bg-[#16161f] border border-[#2a2a3a] rounded-xl p-6 cursor-pointer hover:border-[#3a3a50] transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-semibold text-[#f0f0ff] group-hover:text-indigo-400 transition-colors">
                      {project.name}
                    </h3>
                    <Badge variant={pct === 100 ? 'success' : 'purple'}>
                      {pct === 100 ? 'Terminé' : 'En cours'}
                    </Badge>
                  </div>

                  {project.description && (
                    <p className="text-md text-[#8888aa] mb-4 line-clamp-2">
                      {project.description}
                    </p>
                  )}

                  <div className="flex gap-0.5 mb-4 h-1.5">
                    {project.tasks.length > 0 ? (
                      <>
                        <div
                          className="rounded-full bg-green-500 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                        <div className="rounded-full bg-[#2a2a3a] flex-1" />
                      </>
                    ) : (
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
                    <span className="text-md text-[#8888aa]">
                      {done}/{total} tâches
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

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
