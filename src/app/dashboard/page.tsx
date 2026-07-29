'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { gql } from 'graphql-tag';
import { apolloClient } from '@/lib/apollo-client';
import { useAuthStore } from '@/store/auth-store';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { AppShell } from '@/components/ui/AppShell';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Textarea } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Alert } from '@/components/ui/Alert';
import { Icon } from '@/components/ui/Icon';
import { AvatarStack } from '@/components/ui/Avatar';

const GET_PROJECTS = gql`
  query GetProjects($limit: Int, $offset: Int) {
    projects(limit: $limit, offset: $offset) {
      totalCount
      hasMore
      items {
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
  }
`;

/** Projets chargés par page. Le serveur plafonne de toute façon à 100. */
const PAGE = 24;

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
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  /**
   * Charge une page de projets.
   *
   * `offset` à 0 remplace la liste (premier chargement, ou rechargement après
   * création) ; sinon la page est ajoutée à la suite.
   */
  const fetchProjects = useCallback(async (offset = 0) => {
    setLoadError('');
    if (offset > 0) setLoadingMore(true);

    try {
      const { data } = await apolloClient.query({
        query: GET_PROJECTS,
        variables: { limit: PAGE, offset },
        fetchPolicy: 'network-only',
      });

      const page = (data as { projects: { items: Project[]; totalCount: number; hasMore: boolean } })
        .projects;

      setProjects((précédents) => (offset === 0 ? page.items : [...précédents, ...page.items]));
      setTotalCount(page.totalCount);
      setHasMore(page.hasMore);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Chargement impossible');
    } finally {
      setLoading(false);
      setLoadingMore(false);
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
            <span >
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
      {/* Trois mesures, pas huit : un chiffre n'a de valeur que si on peut
          agir dessus. Le total des projets vient du serveur ; les deux autres
          ne portent que sur les projets chargés, et le disent. */}
      <div className=" mb-10 grid gap-3.5 sm:grid-cols-3">
        <Stat label="Projets" value={totalCount} />
        <Stat
          label="Tâches"
          value={totalTasks}
          sub={hasMore ? `sur les ${projects.length} projets chargés` : `${doneTasks} terminée(s)`}
        />
        <Stat
          label="Personnes"
          value={people.size}
          sub={hasMore ? 'sur les projets chargés' : undefined}
        />
      </div>

      <div className="mb-5 flex items-baseline gap-3">
        <h2 className="tf-display text-[1.25rem]">Vos projets</h2>
        <span className="h-px flex-1" style={{ background: 'var(--border)' }} />
        <span className="tf-num text-[12px]" style={{ color: 'var(--text-3)' }}>
          {hasMore ? `${projects.length} / ${totalCount}` : projects.length}
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
        <Surface radius="xl" className="p-14 text-center">
          <p className="tf-display mb-2.5 text-[1.35rem]">Aucun projet pour l’instant</p>
          <p className="mx-auto mb-7 max-w-sm text-[14px]" style={{ color: 'var(--text-2)' }}>
            Un projet contient un tableau, des tâches et les personnes qui y travaillent.
          </p>
          <Button variant="primary" onClick={() => setModalOpen(true)}>
            <Icon.Plus size={16} />
            Créer le premier
          </Button>
        </Surface>
      ) : (
        <>
          <div className=" grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>

          {hasMore && (
            <div className="mt-8 flex justify-center">
              <Button
                variant="ghost"
                size="lg"
                loading={loadingMore}
                onClick={() => void fetchProjects(projects.length)}
              >
                Charger plus ({totalCount - projects.length} restant
                {totalCount - projects.length > 1 ? 's' : ''})
              </Button>
            </div>
          )}
        </>
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
    <Surface radius="lg" className="p-5">
      <p className="tf-eyebrow mb-2.5">{label}</p>
      <p className="tf-num text-[2.1rem] leading-none">{value}</p>
      {sub && (
        <p className="mt-2 text-[12.5px]" style={{ color: 'var(--text-3)' }}>
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
      <Surface radius="lg" lift="md" className="h-full p-6 transition-transform duration-300 group-hover:-translate-y-1">
        <h3 className="mb-1.5 text-[16px] font-semibold tracking-[-0.015em]">{project.name}</h3>
        <p
          className="mb-6 line-clamp-2 min-h-[2.6em] text-[13px] leading-relaxed"
          style={{ color: 'var(--text-2)' }}
        >
          {project.description || 'Sans description.'}
        </p>

        <div className="mb-2 flex items-baseline justify-between">
          <span className="tf-num text-[12px]" style={{ color: 'var(--text-3)' }}>
            {completedTaskCount}/{taskCount} tâches
          </span>
          <span className="tf-num text-[12px]" style={{ color: 'var(--accent-text)' }}>
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
              background: 'linear-gradient(90deg, #2aa8b8, var(--accent-text))',
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
            style={{ color: 'var(--accent-text)' }}
          >
            Ouvrir <Icon.Arrow size={14} />
          </span>
        </div>
      </Surface>
    </Link>
  );
}
