'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { TfBackground } from '@/components/tf/Backgrounds';
import { BrandMark, ThemeToggle, IconButton, TfAvatar, Icon } from '@/components/tf/atoms';

import { useProject } from './_hooks/useProject';
import { TaskCard } from './_components/TaskCard';
import { CreateTaskModal } from './_components/CreateTaskModal';
import { TaskDetailModal } from './_components/TaskDetailModal';
import { InviteMemberModal, EditProjectModal, MembersModal } from './_components/OtherModals';
import { COLUMNS, columnVariants } from './_constants';
import type { Task, TaskImage } from './_types';

function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className="p-3 flex flex-col gap-2.5 flex-1 min-h-[80px] rounded-b-3xl transition-all duration-200"
      style={isOver ? { boxShadow: 'inset 0 0 0 2px var(--tf-accent)' } : undefined}
    >
      {children}
    </div>
  );
}

export default function ProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const {
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
  } = useProject(projectId);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('TODO');

  const [showCreateTask, setShowCreateTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showMembersList, setShowMembersList] = useState(false);
  const [showEditProject, setShowEditProject] = useState(false);
  const [deletingProject, setDeletingProject] = useState(false);

  const [lightboxImages, setLightboxImages] = useState<TaskImage[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeTaskWidth, setActiveTaskWidth] = useState<number | null>(null);
  const [taskOrder, setTaskOrder] = useState<Record<string, string[]>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const { user: authUser, isAuthenticated, isLoading: authLoading } = useRequireAuth();

  useEffect(() => {
    if (authUser) setCurrentUserId(authUser.id);
  }, [authUser]);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    void fetchProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated, projectId]);

  const projectTasksKey = project?.tasks.map((t) => `${t.id}:${t.status}`).join(',') ?? '';

  useEffect(() => {
    if (!project) return;
    setTaskOrder((prev) => {
      const merged: Record<string, string[]> = {};
      let changed = false;
      COLUMNS.forEach((col) => {
        const order = project.tasks.filter((t) => t.status === col.key).map((t) => t.id);
        const prevCol = prev[col.key] ?? [];
        if (prevCol.length > 0) {
          const existing = prevCol.filter((id) => order.includes(id));
          const newIds = order.filter((id) => !existing.includes(id));
          merged[col.key] = [...existing, ...newIds];
        } else {
          merged[col.key] = order;
        }
        if ((merged[col.key] ?? []).join(',') !== prevCol.join(',')) changed = true;
      });
      return changed ? merged : prev;
    });
  }, [projectTasksKey]);

  const getOrderedTasks = (status: string): Task[] => {
    if (!project) return [];
    const tasksInCol = project.tasks.filter((t) => t.status === status);
    const order = taskOrder[status];
    if (!order || order.length === 0) return tasksInCol;
    return [...tasksInCol].sort((a, b) => {
      const ia = order.indexOf(a.id);
      const ib = order.indexOf(b.id);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });
  };

  const findColumnOfTask = (taskId: string): string | null => {
    for (const col of COLUMNS) {
      if (taskOrder[col.key]?.includes(taskId)) return col.key;
    }
    return project?.tasks.find((t) => t.id === taskId)?.status ?? null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = project?.tasks.find((t) => t.id === event.active.id);
    if (task) {
      setActiveTask(task);
      const node = document.getElementById(`task-card-${task.id}`);
      if (node) setActiveTaskWidth(node.getBoundingClientRect().width);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = active.id as string;
    const overId = over.id as string;
    const activeCol = findColumnOfTask(activeId);
    const overCol = COLUMNS.some((c) => c.key === overId) ? overId : findColumnOfTask(overId);
    if (!activeCol || !overCol || activeCol === overCol) return;
    setTaskOrder((prev) => {
      const activeItems = [...(prev[activeCol] ?? [])];
      const overItems = [...(prev[overCol!] ?? [])];
      const activeIndex = activeItems.indexOf(activeId);
      if (activeIndex === -1) return prev;
      activeItems.splice(activeIndex, 1);
      if (COLUMNS.some((c) => c.key === overId)) {
        overItems.push(activeId);
      } else {
        const overIndex = overItems.indexOf(overId);
        overItems.splice(overIndex === -1 ? overItems.length : overIndex, 0, activeId);
      }
      return { ...prev, [activeCol]: activeItems, [overCol!]: overItems };
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    setActiveTaskWidth(null);
    if (!over || !project) return;
    const activeId = active.id as string;
    const overId = over.id as string;
    const currentCol = findColumnOfTask(activeId);
    if (!currentCol) return;
    let targetCol = COLUMNS.some((c) => c.key === overId) ? overId : findColumnOfTask(overId);
    if (!targetCol) targetCol = currentCol;
    if (currentCol === targetCol && activeId !== overId) {
      setTaskOrder((prev) => {
        const items = [...(prev[currentCol] ?? [])];
        const oldIndex = items.indexOf(activeId);
        const newIndex = items.indexOf(overId);
        if (oldIndex === -1 || newIndex === -1) return prev;
        return { ...prev, [currentCol]: arrayMove(items, oldIndex, newIndex) };
      });
    }
    const task = project.tasks.find((t) => t.id === activeId);
    if (task && task.status !== targetCol) {
      await handleUpdateTask(activeId, { status: targetCol });
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ color: 'var(--tf-text-muted)' }}>
        Chargement...
      </div>
    );

  if (!project)
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ color: 'var(--tf-text-muted)' }}>
        Projet introuvable
      </div>
    );

  const onlineMembers = project.members;

  const SortableTaskCard = ({ task }: { task: Task }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: task.id,
    });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition: transition ?? 'transform 200ms ease',
      opacity: isDragging ? 0.3 : 1,
    };
    return (
      <div
        id={`task-card-${task.id}`}
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing w-full"
      >
        <TaskCard
          task={task}
          onClick={() => {
            if (!isDragging) setSelectedTask(task);
          }}
          onImageClick={(imgs, idx) => {
            setLightboxImages(imgs);
            setLightboxIndex(idx);
          }}
        />
      </div>
    );
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ color: 'var(--tf-text)' }}>
      <TfBackground />

      {/* Top header */}
      <div className="sticky top-0 z-20 flex items-center justify-between gap-3 px-3 sm:px-6 pt-4">
        <button
          onClick={() => router.push('/dashboard')}
          className="tf-pill flex items-center gap-3 rounded-full pl-2 pr-4 h-[52px] text-left"
        >
          <BrandMark size={36} />
          <div className="flex flex-col leading-tight min-w-0">
            <span className="flex items-center gap-1.5 text-[12px]" style={{ color: 'var(--tf-text-faint)' }}>
              <span>TaskFlow</span>
              <span className="opacity-60">/</span>
              <span>Projets</span>
            </span>
            <span className="text-[15px] font-semibold truncate max-w-[40vw]" style={{ letterSpacing: '-0.01em' }}>
              {project.name}
            </span>
          </div>
        </button>

        <div className="tf-pill flex items-center gap-1 rounded-full px-1.5 h-[52px]">
          <IconButton title="Modifier le projet" onClick={() => setShowEditProject(true)}>
            <Icon.Edit />
          </IconButton>
          <IconButton
            title="Supprimer le projet"
            onClick={async () => {
              if (!confirm('Supprimer ce projet ?')) return;
              setDeletingProject(true);
              try {
                await handleDeleteProject();
                router.push('/dashboard');
              } finally {
                setDeletingProject(false);
              }
            }}
          >
            <Icon.Trash />
          </IconButton>
          <ThemeToggle />
          <button
            onClick={() => setShowCreateTask(true)}
            disabled={deletingProject}
            className="h-10 px-4 rounded-full inline-flex items-center gap-1.5 text-[13.5px] font-semibold ml-1"
            style={{
              background: 'var(--tf-accent-solid)',
              color: 'var(--tf-accent-text)',
              boxShadow: '0 6px 16px -8px rgba(0,0,0,0.3)',
            }}
          >
            <Icon.Plus /> <span className="hidden sm:inline">Nouvelle tâche</span>
          </button>
        </div>
      </div>

      {/* Mobile Kanban */}
      <div className="lg:hidden relative z-[2] flex flex-col px-3 pt-4 pb-28">
        <div className="flex gap-1 overflow-x-auto pb-3" style={{ scrollbarWidth: 'none' }}>
          {COLUMNS.map((col) => {
            const count = project.tasks.filter((t) => t.status === col.key).length;
            const isActive = activeTab === col.key;
            return (
              <button
                key={col.key}
                onClick={() => setActiveTab(col.key)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors"
                style={{
                  background: isActive ? 'var(--tf-card-bg)' : 'transparent',
                  color: isActive ? 'var(--tf-text)' : 'var(--tf-text-muted)',
                  boxShadow: isActive ? 'var(--tf-card-shadow)' : 'none',
                }}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: col.dot }} />
                {col.shortLabel}
                <span className="text-[10px] px-1.5 rounded-full" style={{ background: 'var(--tf-soft)' }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-2.5"
          >
            {project.tasks
              .filter((t) => t.status === activeTab)
              .map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={() => setSelectedTask(task)}
                  onImageClick={(imgs, idx) => {
                    setLightboxImages(imgs);
                    setLightboxIndex(idx);
                  }}
                />
              ))}
            {project.tasks.filter((t) => t.status === activeTab).length === 0 && (
              <div className="flex items-center justify-center py-12">
                <p className="text-sm" style={{ color: 'var(--tf-text-faint)' }}>
                  Aucune tâche
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Desktop Kanban */}
      <div className="hidden lg:block relative z-[2] px-6 pt-6 pb-28 overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
            className="grid grid-cols-4 gap-5 min-w-[900px] items-start"
          >
            {COLUMNS.map((col) => {
              const orderedTasks = getOrderedTasks(col.key);
              return (
                <motion.div
                  key={col.key}
                  variants={columnVariants}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="tf-panel flex flex-col"
                  style={{ borderRadius: 'calc(30px * var(--tf-radius-scale, 1))' }}
                >
                  <div className="flex items-center gap-2.5 px-4 pt-4 pb-3">
                    <span className="w-2 h-2 rounded-full" style={{ background: col.dot, boxShadow: `0 0 8px ${col.dot}99` }} />
                    <span className="text-[13.5px] font-semibold" style={{ letterSpacing: '-0.01em' }}>
                      {col.label}
                    </span>
                    <span
                      className="ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-full min-w-[22px] text-center"
                      style={{ background: 'var(--tf-soft)', color: 'var(--tf-text-muted)' }}
                    >
                      {orderedTasks.length}
                    </span>
                  </div>
                  <SortableContext
                    id={col.key}
                    items={orderedTasks.map((t) => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <DroppableColumn id={col.key}>
                      {orderedTasks.map((task) => (
                        <SortableTaskCard key={task.id} task={task} />
                      ))}
                      {orderedTasks.length === 0 && (
                        <div
                          className="flex-1 flex items-center justify-center py-8 rounded-2xl"
                          style={{ border: '1px dashed var(--tf-hairline)' }}
                        >
                          <p className="text-[12px]" style={{ color: 'var(--tf-text-faint)' }}>
                            Glissez une tâche ici
                          </p>
                        </div>
                      )}
                    </DroppableColumn>
                  </SortableContext>
                </motion.div>
              );
            })}
          </motion.div>
          <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
            {activeTask ? (
              <div className="rotate-[2deg]" style={{ width: activeTaskWidth ? `${activeTaskWidth}px` : '300px' }}>
                <TaskCard task={activeTask} isDragging />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Bottom dock — members */}
      <div className="fixed bottom-5 left-0 right-0 z-20 flex justify-center pointer-events-none px-4">
        <div className="tf-pill flex items-center gap-2.5 rounded-full pl-3 pr-2 h-14 pointer-events-auto">
          <span className="w-[7px] h-[7px] rounded-full bg-[#4ade80]" style={{ boxShadow: '0 0 8px rgba(74,222,128,0.6)' }} />
          <span className="text-[12px] font-medium hidden sm:inline" style={{ color: 'var(--tf-text-muted)' }}>
            {onlineMembers.length} membre(s)
          </span>
          <div className="flex items-center">
            {project.members.slice(0, 4).map((m, i) => (
              <div key={m.id} style={{ marginLeft: i === 0 ? 0 : -10 }}>
                <TfAvatar name={m.user.name} avatar={m.user.avatar} size={32} ring online />
              </div>
            ))}
            {project.members.length > 4 && (
              <div
                className="flex items-center justify-center text-[11px] font-semibold rounded-full"
                style={{
                  marginLeft: -10,
                  width: 32,
                  height: 32,
                  background: 'var(--tf-soft)',
                  color: 'var(--tf-text)',
                  boxShadow: '0 0 0 2px rgba(255,255,255,0.5)',
                }}
              >
                +{project.members.length - 4}
              </div>
            )}
          </div>
          <motion.button
            onClick={() => setShowMembersList(true)}
            whileHover={{ y: -1, scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 24 }}
            className="ml-1 h-10 px-4 rounded-full inline-flex items-center gap-1.5 text-[12.5px] font-semibold"
            style={{
              background: 'var(--tf-accent-solid)',
              color: 'var(--tf-accent-text)',
              boxShadow: '0 6px 16px -8px rgba(0,0,0,0.3)',
            }}
          >
            <Icon.Plus /> Gérer
          </motion.button>
        </div>
      </div>

      {/* Modals */}
      <CreateTaskModal
        open={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        members={project.members}
        onSubmit={async (input, images) => {
          await handleCreateTask({ ...input, projectId }, images);
        }}
      />

      <TaskDetailModal
        task={selectedTask}
        project={project}
        onClose={() => setSelectedTask(null)}
        onUpdateTask={async (taskId, input) => {
          await handleUpdateTask(taskId, input);
          setSelectedTask((prev) => {
            if (!prev) return prev;
            const updated = project?.tasks.find((t) => t.id === taskId);
            return updated ? { ...updated, ...input } : { ...prev, ...input };
          });
        }}
        onDeleteTask={(taskId) => void handleDeleteTask(taskId, () => setSelectedTask(null))}
        onUploadImage={async (file) => {
          setUploadingImage(true);
          try {
            await handleUploadImage(file, selectedTask!, (task, proj) => {
              setSelectedTask(task);
              setProject(proj);
            });
          } finally {
            setUploadingImage(false);
          }
        }}
        onDeleteImage={async (imageId) => {
          await handleDeleteImage(imageId, selectedTask?.id, (task, proj) => {
            if (task) setSelectedTask(task);
            setProject(proj);
          });
        }}
        onLightbox={(imgs, idx) => {
          setLightboxImages(imgs);
          setLightboxIndex(idx);
        }}
        uploadingImage={uploadingImage}
      />

      <MembersModal
        open={showMembersList}
        onClose={() => setShowMembersList(false)}
        project={project}
        currentUserId={currentUserId}
        onInvite={() => {
          setShowMembersList(false);
          setShowMemberModal(true);
        }}
        onUpdateRole={handleUpdateRole}
        onRemoveMember={handleRemoveMember}
      />

      <InviteMemberModal
        open={showMemberModal}
        onClose={() => setShowMemberModal(false)}
        onSubmit={handleAddMember}
      />

      <EditProjectModal
        open={showEditProject}
        onClose={() => setShowEditProject(false)}
        initialName={project.name}
        initialDesc={project.description ?? ''}
        onSubmit={handleUpdateProject}
      />

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxImages.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
            onClick={() => setLightboxImages([])}
          >
            <button
              className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 bg-black/40 w-11 h-11 rounded-full flex items-center justify-center"
              onClick={() => setLightboxImages([])}
            >
              ×
            </button>
            {lightboxIndex > 0 && (
              <button
                className="absolute left-3 lg:left-8 text-white text-3xl lg:text-5xl hover:text-gray-300 bg-black/40 rounded-full w-11 h-11 flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((i) => i - 1);
                }}
              >
                ‹
              </button>
            )}
            <motion.img
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              src={lightboxImages[lightboxIndex]?.url}
              alt=""
              className="max-w-[90vw] lg:max-w-4xl max-h-[80vh] rounded-xl object-contain mx-14 lg:mx-20"
              onClick={(e) => e.stopPropagation()}
            />
            {lightboxIndex < lightboxImages.length - 1 && (
              <button
                className="absolute right-3 lg:right-8 text-white text-3xl lg:text-5xl hover:text-gray-300 bg-black/40 rounded-full w-11 h-11 flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((i) => i + 1);
                }}
              >
                ›
              </button>
            )}
            <div className="absolute bottom-6 text-white text-sm opacity-60">
              {lightboxIndex + 1} / {lightboxImages.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
