'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { gql } from 'graphql-tag';
import { apolloClient } from '@/lib/apollo-client';
import { useAuthStore } from '@/store/auth-store';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { AppShell } from '@/components/glass/AppShell';
import { Surface } from '@/components/glass/Surface';
import { Button } from '@/components/glass/Button';
import { Field } from '@/components/glass/Field';
import { Textarea } from '@/components/glass/Select';
import { Modal } from '@/components/glass/Modal';
import { Alert } from '@/components/glass/Alert';
import { Icon } from '@/components/glass/Icon';
import { AvatarStack } from '@/components/glass/Avatar';

const GET_PROJECTS = gql`
  query GetProjects {
    projects {
      id
      name
      description
      createdAt
      taskCount
      completedTaskCount
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
    }
  }
`;

const CREATE_PROJECT = gql`
  mutation CreateProject($input: CreateProjectInput!) {
    createProject(input: $input) {
      id
      name
    }
  }
`;

type Member = {
  id: string;
  role: string;
  user: { id: string; name: string | null; email: string; avatar?: string | null };
};

type Project = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  taskCount: number;
  completedTaskCount: number;
  owner: { id: string; name: string | null; email: string };
  members: Member[];
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const fetchProjects = useCallback(async () => {
    setLoadError('');
    try {
      const { data } = await apolloClient.query({
        query: GET_PROJECTS,
        fetchPolicy: 'network-only',
      });
      setProjects((data as { projects: Project[] }).projects);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Chargement impossible');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    void fetchProjects();
  }, [authLoading, isAuthenticated, fetchProjects]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreating(true);
    try {
      await apolloClient.mutate({
        mutation: CREATE_PROJECT,
        variables: { input: { name, description: description || undefined } },
      });
      setName('');
      setDescription('');
      setModalOpen(false);
      await fetchProjects();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Création impossible');
    } finally {
      setCreating(false);
    }
  };

  const totalTasks = projects.reduce((acc, p) => acc + p.taskCount, 0);
  const doneTasks = projects.reduce((acc, p) => acc + p.completedTaskCount, 0);
  const people = new Set(projects.flatMap((p) => p.members.map((m) => m.user.id)));

  const prenom = (user?.name ?? user?.email ?? '').split(/[\s@]/)[0];

  return (
    <AppShell active="dashboard" breadcrumb={[{ label: 'Projets' }]}>
      <header className="mb-9 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="tf-eyebrow mb-3">Tableau de bord</p>
          <h1 className="tf-display text-[clamp(2rem,5vw,2.9rem)]">
            <span className="tf-mask">
              <span>Bonjour{prenom ? `, ${prenom}` : ''}</span>
            </span>
          </h1>
        </div>

        <Button variant="primary" size="lg" onClick={() => setModalOpen(true)}>
          <Icon.Plus size={16} />
          Nouveau projet
        </Button>
      </header>

      {/* Trois mesures, pas huit : un chiffre n'a de valeur que si on peut
          agir dessus. */}
      <div className="tf-cascade mb-10 grid gap-3.5 sm:grid-cols-3">
        <Stat label="Projets" value={projects.length} />
        <Stat label="Tâches" value={totalTasks} sub={`${doneTasks} terminée(s)`} />
        <Stat label="Personnes" value={people.size} />
      </div>

      <div className="mb-5 flex items-baseline gap-3">
        <h2 className="tf-display text-[1.25rem]">Vos projets</h2>
        <span className="h-px flex-1" style={{ background: 'var(--rim)' }} />
        <span className="tf-num text-[12px]" style={{ color: 'var(--color-mute)' }}>
          {projects.length}
        </span>
      </div>

      {loadError && <Alert tone="danger">{loadError}</Alert>}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Surface key={i} radius="lg" className="h-44 animate-pulse" >
              <span />
            </Surface>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Surface radius="xl" panel className="p-14 text-center">
          <p className="tf-display mb-2.5 text-[1.35rem]">Aucun projet pour l’instant</p>
          <p className="mx-auto mb-7 max-w-sm text-[14px]" style={{ color: 'var(--color-haze)' }}>
            Un projet contient un tableau, des tâches et les personnes qui y travaillent.
          </p>
          <Button variant="primary" onClick={() => setModalOpen(true)}>
            <Icon.Plus size={16} />
            Créer le premier
          </Button>
        </Surface>
      ) : (
        <div className="tf-cascade grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nouveau projet"
        subtitle="Vous en serez propriétaire."
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="primary"
              form="form-projet"
              type="submit"
              loading={creating}
              disabled={name.trim().length === 0}
            >
              Créer le projet
            </Button>
          </>
        }
      >
        <form id="form-projet" onSubmit={handleCreate} className="flex flex-col gap-4">
          {createError && <Alert tone="danger">{createError}</Alert>}
          <Field
            label="Nom du projet"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Refonte du site"
            maxLength={120}
            autoFocus
            required
          />
          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="À quoi sert ce projet ?"
            maxLength={2000}
          />
        </form>
      </Modal>
    </AppShell>
  );
}

function Stat({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <Surface radius="lg" specular className="p-5">
      <p className="tf-eyebrow mb-2.5">{label}</p>
      <p className="tf-num text-[2.1rem] leading-none">{value}</p>
      {sub && (
        <p className="mt-2 text-[12.5px]" style={{ color: 'var(--color-mute)' }}>
          {sub}
        </p>
      )}
    </Surface>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const { taskCount, completedTaskCount } = project;
  const pct = taskCount > 0 ? Math.round((completedTaskCount / taskCount) * 100) : 0;

  return (
    <Link href={`/dashboard/projects/${project.id}`} className="group block">
      <Surface radius="lg" specular lift="md" className="h-full p-6 transition-transform duration-300 group-hover:-translate-y-1">
        <h3 className="mb-1.5 text-[16px] font-semibold tracking-[-0.015em]">{project.name}</h3>
        <p
          className="mb-6 line-clamp-2 min-h-[2.6em] text-[13px] leading-relaxed"
          style={{ color: 'var(--color-haze)' }}
        >
          {project.description || 'Sans description.'}
        </p>

        <div className="mb-2 flex items-baseline justify-between">
          <span className="tf-num text-[12px]" style={{ color: 'var(--color-mute)' }}>
            {completedTaskCount}/{taskCount} tâches
          </span>
          <span className="tf-num text-[12px]" style={{ color: 'var(--color-aqua)' }}>
            {pct}%
          </span>
        </div>

        {/* La barre porte aussi le pourcentage en texte juste au-dessus :
            la couleur seule ne suffirait pas. */}
        <div
          className="mb-5 h-1 overflow-hidden rounded-full"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Avancement de ${project.name}`}
          style={{ background: 'rgba(255,255,255,0.07)' }}
        >
          <span
            className="block h-full rounded-full transition-[width] duration-500"
            style={{
              width: `${pct}%`,
              background: 'linear-gradient(90deg, #2aa8b8, var(--color-aqua))',
            }}
          />
        </div>

        <div className="flex items-center justify-between">
          <AvatarStack
            people={project.members.map((m) => ({
              name: m.user.name ?? m.user.email,
              avatar: m.user.avatar,
            }))}
            size={26}
          />
          <span
            className="inline-flex items-center gap-1.5 text-[12.5px] transition-transform duration-300 group-hover:translate-x-1"
            style={{ color: 'var(--color-aqua)' }}
          >
            Ouvrir <Icon.Arrow size={14} />
          </span>
        </div>
      </Surface>
    </Link>
  );
}
