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
import {
  Sidebar,
  SidebarProvider,
  MobileMenuButton,
  SidebarIcons,
} from '@/components/layout/Sidebar';
import { motion } from 'framer-motion';

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
          avatar
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
type Member = { id: string; role: string; user: { id: string; name: string; avatar?: string } };
type Project = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  owner: { id: string; name: string; email: string };
  tasks: Task[];
  members: Member[];
};

// ─── Animation variants ───

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
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
    setTimeout(() => {
      void fetchProjects();
    }, 0);
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

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: SidebarIcons.dashboard, active: true },
    { label: 'Profil', path: '/profile', icon: SidebarIcons.profile },
    {
      label: 'Déconnexion',
      icon: SidebarIcons.logout,
      variant: 'danger' as const,
      onClick: () => {
        logout();
        router.push('/login');
      },
    },
  ];

  if (loading)
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-[#8888aa] text-base">Chargement...</div>
      </div>
    );

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-[#0a0a0f] flex">
        <Sidebar navItems={navItems} />

        <main className="lg:ml-60 flex-1 p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.4 }}
            className="flex items-center justify-between mb-6 lg:mb-8"
          >
            <div className="flex items-center gap-3">
              <MobileMenuButton />
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-[#f0f0ff]">Dashboard</h1>
                <p className="text-[#8888aa] mt-1 text-sm lg:text-base">
                  Bienvenue, {user?.name ?? user?.email} 👋
                </p>
              </div>
            </div>
            <div className="hidden sm:block">
              <Button size="lg" onClick={() => setShowModal(true)}>
                + Nouveau projet
              </Button>
            </div>
            <div className="sm:hidden">
              <Button size="sm" onClick={() => setShowModal(true)}>
                + Projet
              </Button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-8 lg:mb-10"
          >
            {[
              { label: 'Projets actifs', value: activeProjects.length, color: 'text-indigo-400' },
              { label: 'Tâches totales', value: totalTasks, color: 'text-[#f0f0ff]' },
              { label: 'Terminées', value: doneTasks, color: 'text-green-400' },
              {
                label: 'Membres',
                value: [...new Set(projects.flatMap((p) => p.members.map((m) => m.user.id)))]
                  .length,
                color: 'text-amber-400',
              },
            ].map((s) => (
              <motion.div
                key={s.label}
                variants={fadeInUp}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="bg-[#16161f] border border-[#2a2a3a] rounded-xl p-4 lg:p-5"
              >
                <div className="text-sm lg:text-lg text-[#8888aa] mb-1 lg:mb-2">{s.label}</div>
                <div className={`text-2xl lg:text-3xl font-bold ${s.color}`}>{s.value}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Projects */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="flex items-center justify-between mb-4 lg:mb-5"
          >
            <h2 className="text-xl lg:text-2xl font-semibold text-[#f0f0ff]">Mes projets</h2>
            <span className="text-sm lg:text-lg text-[#8888aa]">{projects.length} projet(s)</span>
          </motion.div>

          {projects.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="bg-[#16161f] border border-[#2a2a3a] rounded-xl p-10 lg:p-16 text-center"
            >
              <p className="text-[#8888aa] text-base">Aucun projet — créez-en un !</p>
            </motion.div>
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5"
            >
              {projects.map((project) => {
                const done = project.tasks.filter((t) => t.status === 'DONE').length;
                const total = project.tasks.length;
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                return (
                  <motion.div
                    key={project.id}
                    variants={fadeInUp}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    whileHover={{ y: -2, transition: { duration: 0.2 } }}
                    onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                    className="bg-[#16161f] border border-[#2a2a3a] rounded-xl p-5 lg:p-6 cursor-pointer hover:border-[#3a3a50] transition-colors group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg lg:text-xl font-semibold text-[#f0f0ff] group-hover:text-indigo-400 transition-colors">
                        {project.name}
                      </h3>
                      <Badge variant={pct === 100 ? 'success' : 'purple'}>
                        {pct === 100 ? 'Terminé' : 'En cours'}
                      </Badge>
                    </div>

                    {project.description && (
                      <p className="text-sm lg:text-md text-[#8888aa] mb-4 line-clamp-2">
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
                            <Avatar name={m.user.name} avatar={m.user.avatar} size="sm" />
                          </div>
                        ))}
                      </div>
                      <span className="text-sm lg:text-md text-[#8888aa]">
                        {done}/{total} tâches
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
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
    </SidebarProvider>
  );
}
