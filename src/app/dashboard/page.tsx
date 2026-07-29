'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { gql } from 'graphql-tag';
import { apolloClient } from '@/lib/apollo-client';
import { useAuthStore } from '@/store/auth-store';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { AppShell } from '@/components/tf/AppShell';
import { GlassCard, TfAvatar, Icon } from '@/components/tf/atoms';
import { CountUp } from '@/components/tf/CountUp';
import { stagger, fadeUp } from '@/components/tf/motion';

const SPARK = 'M0 18 L12 14 L24 16 L36 10 L48 12 L60 8 L72 11 L84 4 L100 6';

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

const ACCENTS = ['#6366f1', '#8b5cf6', '#3b82f6', '#06b6d4', '#7c3aed', '#0ea5e9'];

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [creating, setCreating] = useState(false);

  // La session vit dans un cookie httpOnly : on ne peut plus la deviner
  // depuis le client, useRequireAuth interroge le serveur.
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    void fetchProjects();
  }, [authLoading, isAuthenticated]);

  const fetchProjects = async () => {
    try {
      const { data } = await apolloClient.query({ query: GET_PROJECTS, fetchPolicy: 'network-only' });
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
  const doneTasks = projects.reduce((acc, p) => acc + p.tasks.filter((t) => t.status === 'DONE').length, 0);
  const activeProjects = projects.filter((p) =>
    p.tasks.some((t) => t.status !== 'DONE' && t.status !== 'CANCELLED'),
  );
  const memberCount = [...new Set(projects.flatMap((p) => p.members.map((m) => m.user.id)))].length;

  const stats = [
    { id: 'projects', label: 'Projets actifs', value: activeProjects.length, color: '#6366f1' },
    { id: 'tasks', label: 'Tâches totales', value: totalTasks, color: '#3b82f6' },
    { id: 'done', label: 'Terminées', value: doneTasks, color: '#10b981' },
    { id: 'team', label: 'Membres', value: memberCount, color: '#8b5cf6' },
  ];

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ color: 'var(--tf-text-muted)' }}>
        Chargement...
      </div>
    );

  return (
    <AppShell breadcrumb={['Dashboard']} active="dashboard">
      {/* Greeting + CTA */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.2, 0.7, 0.3, 1] }}
        className="flex items-end justify-between gap-4 flex-wrap mb-6"
      >
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold" style={{ letterSpacing: '-0.03em' }}>
            Bonjour, {user?.name ?? user?.email}
          </h1>
          <p className="mt-2 text-[15px]" style={{ color: 'var(--tf-text-muted)' }}>
            <b style={{ color: 'var(--tf-text)' }}>{activeProjects.length} projet(s)</b> en cours.
          </p>
        </div>
        <Button size="lg" onClick={() => setShowModal(true)}>
          <Icon.Plus /> Nouveau projet
        </Button>
      </motion.div>

      {/* Stats */}
      <motion.div
        variants={stagger(0.08)}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-8"
      >
        {stats.map((s) => (
          <motion.div
            key={s.id}
            variants={fadeUp}
            className="tf-panel relative overflow-hidden p-4 lg:p-5 h-full"
            style={{ borderRadius: 'calc(24px * var(--tf-radius-scale, 1))' }}
          >
            <div
              className="absolute -top-8 -right-8 w-24 h-24 pointer-events-none"
              style={{ background: `radial-gradient(closest-side, ${s.color}66, transparent)` }}
            />
            <div className="flex items-start justify-between">
              <span className="text-[13px] font-medium" style={{ color: 'var(--tf-text-muted)' }}>
                {s.label}
              </span>
              <span className="w-2 h-2 rounded-full" style={{ background: s.color, boxShadow: `0 0 12px ${s.color}` }} />
            </div>
            <div className="mt-2 text-3xl lg:text-4xl font-bold" style={{ color: s.color, letterSpacing: '-0.03em' }}>
              <CountUp value={s.value} />
            </div>
            <svg viewBox="0 0 100 24" preserveAspectRatio="none" className="mt-2 w-full h-6 block">
              <defs>
                <linearGradient id={`sg-${s.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity="0.35" />
                  <stop offset="100%" stopColor={s.color} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={`${SPARK} L100 24 L0 24 Z`} fill={`url(#sg-${s.id})`} />
              <path d={SPARK} fill="none" stroke={s.color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
            </svg>
          </motion.div>
        ))}
      </motion.div>

      {/* Projects */}
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-xl lg:text-2xl font-semibold" style={{ letterSpacing: '-0.015em' }}>
          Mes projets
        </h2>
        <span className="text-sm" style={{ color: 'var(--tf-text-faint)' }}>
          {projects.length} projet(s) · {totalTasks} tâches
        </span>
      </div>

      {projects.length === 0 ? (
        <GlassCard style={{ padding: 48, textAlign: 'center' }}>
          <p className="text-base" style={{ color: 'var(--tf-text-muted)' }}>
            Aucun projet — créez-en un !
          </p>
        </GlassCard>
      ) : (
        <motion.div
          variants={stagger(0.07)}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5"
        >
          {projects.map((project, idx) => {
            const done = project.tasks.filter((t) => t.status === 'DONE').length;
            const total = project.tasks.length;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            const accent = ACCENTS[idx % ACCENTS.length];
            return (
              <motion.div
                key={project.id}
                variants={fadeUp}
                whileHover={{ y: -5 }}
                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                className="tf-card-glass cursor-pointer overflow-hidden h-full"
                style={{ padding: 22, borderRadius: 'calc(28px * var(--tf-radius-scale, 1))' }}
              >
                <div className="flex flex-col h-full relative">
                  <div
                    className="absolute -top-12 -right-12 w-44 h-44 pointer-events-none"
                    style={{ background: `radial-gradient(closest-side, ${accent}55, transparent)` }}
                  />
                  <div className="flex items-start justify-between relative">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-white"
                      style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, boxShadow: `0 6px 14px ${accent}55` }}
                    >
                      <Icon.Board />
                    </div>
                    <span
                      className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
                      style={{ background: `${accent}22`, color: accent, border: `1px solid ${accent}33` }}
                    >
                      {pct === 100 ? 'Terminé' : 'En cours'}
                    </span>
                  </div>

                  <h3 className="mt-4 mb-1.5 text-[17px] font-semibold" style={{ letterSpacing: '-0.01em' }}>
                    {project.name}
                  </h3>
                  <p
                    className="text-[13px] leading-relaxed line-clamp-2"
                    style={{ color: 'var(--tf-text-muted)', minHeight: 38 }}
                  >
                    {project.description || 'Pas de description.'}
                  </p>

                  <div className="mt-4">
                    <div className="flex justify-between text-[12px] mb-1.5" style={{ color: 'var(--tf-text-muted)' }}>
                      <span>
                        {done}/{total} tâches
                      </span>
                      <span style={{ color: 'var(--tf-text)', fontWeight: 600 }}>{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--tf-soft)' }}>
                      <div
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          background: `linear-gradient(90deg, ${accent}, ${accent}cc)`,
                          boxShadow: `0 0 12px ${accent}88`,
                        }}
                      />
                    </div>
                  </div>

                  <div
                    className="mt-4 pt-4 flex items-center justify-between"
                    style={{ borderTop: '1px solid var(--tf-hairline)' }}
                  >
                    <div className="flex">
                      {project.members.slice(0, 4).map((m, i) => (
                        <div key={m.id} style={{ marginLeft: i === 0 ? 0 : -8 }}>
                          <TfAvatar name={m.user.name} avatar={m.user.avatar} size={26} ring />
                        </div>
                      ))}
                    </div>
                    <span className="inline-flex items-center gap-1 text-[12px] font-semibold" style={{ color: 'var(--tf-text)' }}>
                      Ouvrir <span>→</span>
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

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
    </AppShell>
  );
}
