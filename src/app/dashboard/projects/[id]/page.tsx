'use client';

import { use, useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { AppShell } from '@/components/ui/AppShell';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Icon } from '@/components/ui/Icon';
import { AvatarStack } from '@/components/ui/Avatar';
import { STATUS, STATUS_ORDER } from '@/components/ui/Pill';
import type { TaskStatus } from '@/components/ui/Pill';
import { ROLE_HIERARCHY } from '@/lib/role-utils';
import type { Role } from '@/lib/role-utils';
import { useProject } from './_hooks/useProject';
import { TaskCard } from './_components/TaskCard';
import { TaskModal } from './_components/TaskModal';
import { MembersModal, NewTaskModal, SettingsModal } from './_components/ProjectModals';
import type { Task } from './_types';

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const router = useRouter();
  const { user } = useAuthStore();
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();

  const {
    project,
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
  } = useProject(projectId);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [draggingTask, setDraggingTask] = useState<Task | null>(null);
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  /** Colonne visible sur mobile : quatre colonnes n'y tiennent pas. */
  const [mobileColumn, setMobileColumn] = useState<TaskStatus>('TODO');

  const sensors = useSensors(
    // 6 px de tolérance : sans ce seuil, un simple clic sur une carte
    // déclencherait un glissement et n'ouvrirait jamais la tâche.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    void fetchProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated, projectId]);

  const myRole: Role = useMemo(() => {
    const membership = project?.members.find((m) => m.user.id === user?.id);
    return (membership?.role as Role) ?? 'VIEWER';
  }, [project, user]);

  const canEdit = ROLE_HIERARCHY[myRole] >= ROLE_HIERARCHY.MEMBER;
  const isAdmin = ROLE_HIERARCHY[myRole] >= ROLE_HIERARCHY.ADMIN;
  const isOwner = myRole === 'OWNER';

  const byStatus = useMemo(() => {
    const map = new Map<TaskStatus, Task[]>();
    for (const s of STATUS_ORDER) map.set(s, []);
    for (const t of project?.tasks ?? []) {
      const list = map.get(t.status as TaskStatus);
      if (list) list.push(t);
    }
    return map;
  }, [project]);

  const onDragStart = (event: DragStartEvent) => {
    const task = project?.tasks.find((t) => t.id === event.active.id);
    setDraggingTask(task ?? null);
  };

  const onDragEnd = async (event: DragEndEvent) => {
    setDraggingTask(null);
    const { active, over } = event;
    if (!over || !project) return;

    const task = project.tasks.find((t) => t.id === active.id);
    if (!task) return;

    // La cible est soit une colonne, soit une autre tâche : dans le second
    // cas on récupère le statut de cette tâche.
    const overId = String(over.id);
    const targetStatus = STATUS_ORDER.includes(overId as TaskStatus)
      ? (overId as TaskStatus)
      : ((project.tasks.find((t) => t.id === overId)?.status as TaskStatus) ?? null);

    if (!targetStatus || targetStatus === task.status) return;

    await handleUpdateTask(task.id, { status: targetStatus });
  };

  if (loading || !project) {
    return (
      <AppShell active="dashboard" breadcrumb={[{ label: 'Projets', href: '/dashboard' }, { label: '…' }]}>
        <div className="grid gap-3 lg:grid-cols-4">
          {STATUS_ORDER.map((s) => (
            <Surface key={s} radius="lg" className="h-64 animate-pulse">
              <span />
            </Surface>
          ))}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      active="dashboard"
      breadcrumb={[{ label: 'Projets', href: '/dashboard' }, { label: project.name }]}
    >
      <header className="mb-8 flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-0">
          <p className="tf-eyebrow mb-3">Tableau</p>
          <h1 className="tf-display mb-2 text-[clamp(1.8rem,4.5vw,2.6rem)]">
            <span >
              <span>{project.name}</span>
            </span>
          </h1>
          {project.description && (
            <p className="max-w-xl text-[14px]" style={{ color: 'var(--text-2)' }}>
              {project.description}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMembersOpen(true)}
            className="rounded-full p-0.5 transition-transform hover:-translate-y-0.5"
            aria-label="Voir les membres"
          >
            <AvatarStack
              people={project.members.map((m) => ({
                name: m.user.name || m.user.email,
                avatar: m.user.avatar,
              }))}
              size={30}
            />
          </button>

          {isAdmin && (
            <Button variant="neutral" onClick={() => setSettingsOpen(true)}>
              Réglages
            </Button>
          )}
          {canEdit && (
            <Button variant="primary" onClick={() => setNewTaskOpen(true)}>
              <Icon.Plus size={16} />
              Nouvelle tâche
            </Button>
          )}
        </div>
      </header>

      {!canEdit && (
        <div className="mb-6">
          <Alert tone="info">
            Vous consultez ce projet en lecture seule. Demandez le rôle « Membre » pour
            modifier les tâches.
          </Alert>
        </div>
      )}

      {/* Sélecteur de colonne, sous lg uniquement. */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
        {STATUS_ORDER.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setMobileColumn(s)}
            className="tf-nav-item shrink-0"
            data-active={mobileColumn === s ? 'true' : undefined}
          >
            {STATUS[s].label}
            <span className="tf-num text-[11px]" style={{ color: 'var(--text-3)' }}>
              {byStatus.get(s)?.length ?? 0}
            </span>
          </button>
        ))}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div className="grid gap-3.5 lg:grid-cols-4">
          {STATUS_ORDER.map((status) => (
            <Column
              key={status}
              status={status}
              tasks={byStatus.get(status) ?? []}
              hiddenOnMobile={mobileColumn !== status}
              onOpenTask={setSelectedTask}
            />
          ))}
        </div>

        {/* La carte suit le curseur pendant le glissement. */}
        <DragOverlay>
          {draggingTask && (
            <div className="rotate-2 opacity-95">
              <TaskCard task={draggingTask} onOpen={() => {}} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Les tâches sont chargées par pages : le dire explicitement évite de
          croire que le tableau est complet alors qu'il ne l'est pas. */}
      {tasksMeta.hasMore && (
        <div className="mt-7 flex flex-col items-center gap-2.5">
          <p className="tf-num text-[12px]" style={{ color: 'var(--text-3)' }}>
            {project.tasks.length} tâches affichées sur {tasksMeta.totalCount}
          </p>
          <Button variant="ghost" loading={loadingMoreTasks} onClick={() => void fetchMoreTasks()}>
            Charger plus de tâches
          </Button>
        </div>
      )}

      {selectedTask && (
        <TaskModal
          task={project.tasks.find((t) => t.id === selectedTask.id) ?? selectedTask}
          project={project}
          canEdit={canEdit}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleUpdateTask}
          onDelete={async (taskId) => {
            await handleDeleteTask(taskId, () => setSelectedTask(null));
          }}
          onUploadImage={async (file) => {
            await handleUploadImage(file, selectedTask, (task) => setSelectedTask(task));
          }}
          onDeleteImage={async (imageId) => {
            await handleDeleteImage(imageId, selectedTask.id, (task) => {
              if (task) setSelectedTask(task);
            });
          }}
        />
      )}

      <NewTaskModal
        open={newTaskOpen}
        onClose={() => setNewTaskOpen(false)}
        project={project}
        onCreate={handleCreateTask}
      />

      <MembersModal
        open={membersOpen}
        onClose={() => setMembersOpen(false)}
        project={project}
        myRole={myRole}
        myUserId={user?.id ?? ''}
        onAdd={handleAddMember}
        onRemove={handleRemoveMember}
        onUpdateRole={handleUpdateRole}
      />

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        project={project}
        isOwner={isOwner}
        onSave={handleUpdateProject}
        onDelete={async () => {
          await handleDeleteProject();
          router.push('/dashboard');
        }}
      />
    </AppShell>
  );
}

/** Une colonne du tableau, zone de dépôt. */
function Column({
  status,
  tasks,
  hiddenOnMobile,
  onOpenTask,
}: {
  status: TaskStatus;
  tasks: Task[];
  hiddenOnMobile: boolean;
  onOpenTask: (task: Task) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const meta = STATUS[status];

  return (
    <section
      ref={setNodeRef}
      className={`${hiddenOnMobile ? 'hidden lg:flex' : 'flex'} flex-col`}
      aria-label={meta.label}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <span className="tf-pill" style={{ color: meta.color }}>
          <span className="tf-dot" />
          {meta.label}
        </span>
        <span className="tf-num text-[12px]" style={{ color: 'var(--text-3)' }}>
          {tasks.length}
        </span>
      </div>

      <div
        className="tf-column flex min-h-[180px] flex-1 flex-col gap-2.5 rounded-[var(--r-2)] p-2.5 transition-colors duration-200"
        style={{
          // La colonne s'éclaire au survol d'un glissement : le retour doit
          // dire où la carte va tomber.
          background: isOver ? 'rgba(79,224,213,0.07)' : 'rgba(255,255,255,0.018)',
          boxShadow: isOver
            ? 'inset 0 0 0 1px rgba(79,224,213,0.35)'
            : 'inset 0 0 0 1px var(--border)',
        }}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onOpen={onOpenTask} />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <p
            className="flex flex-1 items-center justify-center text-[12.5px]"
            style={{ color: 'var(--text-3)' }}
          >
            Rien ici.
          </p>
        )}
      </div>
    </section>
  );
}
