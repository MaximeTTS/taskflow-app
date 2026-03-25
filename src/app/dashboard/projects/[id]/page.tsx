'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
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
import {
  Sidebar,
  SidebarProvider,
  MobileMenuButton,
  SidebarIcons,
} from '@/components/layout/Sidebar';

import { useProject } from './_hooks/useProject';
import { TaskCard } from './_components/TaskCard';
import { CreateTaskModal } from './_components/CreateTaskModal';
import { TaskDetailModal } from './_components/TaskDetailModal';
import { InviteMemberModal, EditProjectModal } from './_components/OtherModals';
import { COLUMNS, fadeIn, columnVariants } from './_constants';
import type { Task, TaskImage } from './_types';

function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`p-3 flex flex-col gap-2 flex-1 min-h-[80px] rounded-b-xl transition-colors duration-200 ${isOver ? 'bg-indigo-500/5 ring-1 ring-inset ring-indigo-500/20' : ''}`}
    >
      {children}
    </div>
  );
}

export default function ProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const { logout } = useAuthStore();

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

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) setCurrentUserId((JSON.parse(userStr) as { id: string }).id);
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      router.push('/login');
      return;
    }
    const { initFromStorage } = useAuthStore.getState();
    initFromStorage();
    void fetchProject();
  }, [projectId]);

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
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-[#8888aa]">Chargement...</div>
      </div>
    );

  if (!project)
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-[#8888aa]">Projet introuvable</div>
      </div>
    );

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: SidebarIcons.dashboard },
    { label: project.name, icon: SidebarIcons.project, active: true },
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
    <SidebarProvider>
      <div className="min-h-screen bg-[#0a0a0f] flex overflow-x-hidden">
        <Sidebar navItems={navItems}>
          {/* Membres */}
          <div className="p-3 border-t border-[#2a2a3a] mt-2">
            <div className="flex items-center justify-between px-2 mb-3">
              <div className="text-[11px] font-medium text-[#55556a] uppercase tracking-wider">
                Membres
              </div>
              <button
                onClick={() => setShowMemberModal(true)}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                + Inviter
              </button>
            </div>
            <div className="flex flex-col gap-1">
              {project.members.map((m) => (
                <div
                  key={m.id}
                  className="flex flex-col gap-1 px-2 py-2 rounded-lg hover:bg-[#1e1e2a]"
                >
                  <div className="flex items-center gap-2">
                    <Avatar name={m.user.name} avatar={m.user.avatar} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-[#f0f0ff] truncate">
                        {m.user.name}
                      </div>
                    </div>
                    {m.user.id !== project.owner.id && m.user.id !== currentUserId && (
                      <button
                        onClick={() => void handleRemoveMember(m.user.id)}
                        className="text-[#55556a] hover:text-red-400 transition-all text-lg leading-none w-7 h-7 flex items-center justify-center rounded hover:bg-red-500/10"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  {m.user.id !== project.owner.id ? (
                    <select
                      value={m.role}
                      onChange={(e) => void handleUpdateRole(m.user.id, e.target.value)}
                      className="w-full bg-[#2a2a3a] border border-[#3a3a50] rounded px-2 py-1 text-xs text-[#f0f0ff] outline-none mt-1"
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="MEMBER">Member</option>
                      <option value="VIEWER">Viewer</option>
                    </select>
                  ) : (
                    <div className="text-[10px] text-indigo-400 px-0.5">Owner</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Sidebar>

        <main className="lg:ml-60 flex-1 flex flex-col min-w-0 overflow-x-hidden">
          {/* Mobile Header */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.3 }}
            className="lg:hidden border-b border-[#2a2a3a] px-4 py-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <MobileMenuButton />
                <h1 className="text-lg font-bold text-[#f0f0ff] truncate">{project.name}</h1>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setShowEditProject(true)}
                  className="p-2 text-[#55556a] hover:text-[#8888aa] transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button
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
                  disabled={deletingProject}
                  className="p-2 text-[#55556a] hover:text-red-400 transition-colors disabled:opacity-50"
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4h6v2" />
                  </svg>
                </button>
                <Button size="sm" onClick={() => setShowCreateTask(true)}>
                  + Tâche
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Desktop Header */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.4 }}
            className="hidden lg:flex px-8 py-5 items-center justify-between border-b border-[#2a2a3a]"
          >
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-[#f0f0ff] truncate">{project.name}</h1>
              {project.description && (
                <p className="text-sm text-[#8888aa] mt-0.5 line-clamp-1">{project.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowEditProject(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-[#8888aa] hover:text-[#f0f0ff] hover:bg-[#1e1e2a] transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Modifier
              </button>
              <button
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
                disabled={deletingProject}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-[#8888aa] hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4h6v2" />
                </svg>
                Supprimer
              </button>
              <Button onClick={() => setShowCreateTask(true)}>+ Nouvelle tâche</Button>
            </div>
          </motion.div>

          {/* Mobile Kanban */}
          <div className="lg:hidden flex flex-col flex-1">
            <div
              className="flex border-b border-[#2a2a3a] overflow-x-auto"
              style={{ scrollbarWidth: 'none' }}
            >
              {COLUMNS.map((col) => {
                const count = project.tasks.filter((t) => t.status === col.key).length;
                return (
                  <button
                    key={col.key}
                    onClick={() => setActiveTab(col.key)}
                    className={`flex items-center gap-1 px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === col.key ? 'border-indigo-400 text-indigo-400' : 'border-transparent text-[#8888aa] hover:text-[#f0f0ff]'}`}
                  >
                    <div className={`w-2 h-2 rounded-full ${col.color}`} />
                    {col.shortLabel}
                    <span className="bg-[#2a2a3a] text-[#8888aa] text-xs px-1.5 py-0.5 rounded-full">
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
                className="p-4 flex-1 overflow-y-auto"
              >
                <div className="flex flex-col gap-3">
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
                      <p className="text-sm text-[#2a2a3a]">Aucune tâche</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Desktop Kanban DnD */}
          <div className="hidden lg:block p-8 overflow-x-auto flex-1">
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
                variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
                className="grid grid-cols-4 gap-4 min-w-[900px] items-start"
              >
                {COLUMNS.map((col) => {
                  const orderedTasks = getOrderedTasks(col.key);
                  return (
                    <motion.div
                      key={col.key}
                      variants={columnVariants}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                      className={`bg-[#111118] border-2 ${col.border} rounded-xl flex flex-col`}
                    >
                      <div className="flex items-center gap-2 p-4 border-b border-[#2a2a3a]">
                        <div className={`w-2 h-2 rounded-full ${col.color}`} />
                        <span className="text-md font-medium text-[#8888aa]">{col.label}</span>
                        <span className="ml-auto bg-[#2a2a3a] text-[#8888aa] text-xs px-2 py-0.5 rounded-full">
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
                            <div className="flex-1 flex items-center justify-center py-8">
                              <p className="text-md text-[#55556a]">Déposez une tâche ici</p>
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
                  <div
                    className="rotate-[2deg]"
                    style={{ width: activeTaskWidth ? `${activeTaskWidth}px` : '300px' }}
                  >
                    <TaskCard task={activeTask} isDragging />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </main>

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
            setSelectedTask((prev) => (prev ? { ...prev, ...input } : prev));
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
    </SidebarProvider>
  );
}
