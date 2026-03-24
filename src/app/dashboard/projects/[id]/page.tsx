'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { gql } from 'graphql-tag';
import { apolloClient } from '@/lib/apollo-client';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/auth-store';
import {
  Sidebar,
  SidebarProvider,
  MobileMenuButton,
  SidebarIcons,
} from '@/components/layout/Sidebar';
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

// ─── GraphQL ───

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
          avatar
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
          avatar
        }
        creator {
          id
          name
        }
        images {
          id
          url
          publicId
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
      priority
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

const UPDATE_PROJECT = gql`
  mutation UpdateProject($id: ID!, $input: UpdateProjectInput!) {
    updateProject(id: $id, input: $input) {
      id
      name
      description
    }
  }
`;

const DELETE_PROJECT = gql`
  mutation DeleteProject($id: ID!) {
    deleteProject(id: $id)
  }
`;

const UPLOAD_IMAGE = gql`
  mutation UploadTaskImage($taskId: ID!, $base64Image: String!) {
    uploadTaskImage(taskId: $taskId, base64Image: $base64Image) {
      id
      url
      publicId
    }
  }
`;

const DELETE_IMAGE = gql`
  mutation DeleteTaskImage($imageId: ID!) {
    deleteTaskImage(imageId: $imageId)
  }
`;

// ─── Types ───

type TaskImage = { id: string; url: string; publicId: string };
type Assignee = { id: string; name: string; avatar?: string };
type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  createdAt: string;
  assignee: Assignee | null;
  creator: { id: string; name: string };
  images: TaskImage[];
};
type Member = {
  id: string;
  role: string;
  user: { id: string; name: string; email: string; avatar?: string };
};
type Project = {
  id: string;
  name: string;
  description: string | null;
  owner: { id: string; name: string; email: string };
  members: Member[];
  tasks: Task[];
};

// ─── Constants ───

const COLUMNS = [
  { key: 'TODO', label: 'À faire', shortLabel: 'À faire', color: 'bg-[#2a2a3a]' },
  { key: 'IN_PROGRESS', label: 'En cours', shortLabel: 'En cours', color: 'bg-indigo-500' },
  { key: 'IN_REVIEW', label: 'En révision', shortLabel: 'Révision', color: 'bg-amber-500' },
  { key: 'DONE', label: 'Terminé', shortLabel: 'Terminé', color: 'bg-green-500' },
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
const PRIORITY_BORDER: Record<string, string> = {
  URGENT: 'border-l-red-500',
  HIGH: 'border-l-amber-500',
  MEDIUM: 'border-l-blue-500',
  LOW: 'border-l-[#2a2a3a]',
};

const SELECT_CLASS =
  'w-full bg-[#16161f] border border-[#2a2a3a] rounded-lg px-4 py-3 text-base text-[#f0f0ff] outline-none focus:border-indigo-500 appearance-none pr-10';

const SelectArrow = () => (
  <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[#8888aa]">
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9l6 6 6-6" />
    </svg>
  </div>
);

// ─── Animation variants ───

const fadeInUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };
const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const fadeIn = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const columnVariants = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } };

// ─── Droppable Column wrapper (accepts drops even when empty) ───

function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`p-3 flex flex-col gap-2 flex-1 min-h-[80px] rounded-b-xl transition-colors duration-200 ${
        isOver ? 'bg-indigo-500/5 ring-1 ring-inset ring-indigo-500/20' : ''
      }`}
    >
      {children}
    </div>
  );
}

// ─── Main Component ───

export default function ProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const { logout } = useAuthStore();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState('TODO');

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState('MEDIUM');
  const [newStatus, setNewStatus] = useState('TODO');
  const [newAssignee, setNewAssignee] = useState('');
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const newFileInputRef = useRef<HTMLInputElement>(null);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingDesc, setEditingDesc] = useState('');
  const [savingDesc, setSavingDesc] = useState(false);

  const [showMemberModal, setShowMemberModal] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('MEMBER');
  const [addingMember, setAddingMember] = useState(false);

  const [showEditProject, setShowEditProject] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [savingProject, setSavingProject] = useState(false);
  const [deletingProject, setDeletingProject] = useState(false);

  const [lightboxImages, setLightboxImages] = useState<TaskImage[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // ─── Drag & Drop state ───
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeTaskWidth, setActiveTaskWidth] = useState<number | null>(null);
  const [taskOrder, setTaskOrder] = useState<Record<string, string[]>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // ─── Effects ───

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const projectTasksKey = project?.tasks.map((t) => `${t.id}:${t.status}`).join(',') ?? '';

  useEffect(() => {
    if (!project) return;
    const order: Record<string, string[]> = {};
    COLUMNS.forEach((col) => {
      order[col.key] = project.tasks.filter((t) => t.status === col.key).map((t) => t.id);
    });
    setTaskOrder((prev) => {
      const merged: Record<string, string[]> = {};
      let changed = false;
      COLUMNS.forEach((col) => {
        const prevCol = prev[col.key] ?? [];
        const orderCol = order[col.key] ?? [];
        if (prevCol.length > 0) {
          const existing = prevCol.filter((id) => orderCol.includes(id));
          const newIds = orderCol.filter((id) => !existing.includes(id));
          merged[col.key] = [...existing, ...newIds];
        } else {
          merged[col.key] = orderCol;
        }
        if ((merged[col.key] ?? []).join(',') !== prevCol.join(',')) changed = true;
      });
      return changed ? merged : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectTasksKey]);

  // ─── Data fetching & mutations ───

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

  const handleNewImageSelect = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setNewImages((prev) => [...prev, file]);
      setNewImagePreviews((prev) => [...prev, reader.result as string]);
    };
    reader.readAsDataURL(file);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    const userStr = localStorage.getItem('user');
    const cu = userStr ? (JSON.parse(userStr) as { id: string }) : null;
    if (!cu?.id) return;
    try {
      const { data } = await apolloClient.mutate({
        mutation: CREATE_TASK,
        variables: {
          input: {
            title: newTitle,
            description: newDesc,
            priority: newPriority,
            status: newStatus,
            projectId,
            creatorId: cu.id,
            assigneeId: newAssignee === '' ? undefined : newAssignee,
          },
        },
      });
      const createdTask = (data as { createTask: { id: string } }).createTask;
      for (const file of newImages) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result as string);
          r.onerror = reject;
          r.readAsDataURL(file);
        });
        await apolloClient.mutate({
          mutation: UPLOAD_IMAGE,
          variables: { taskId: createdTask.id, base64Image: base64 },
        });
      }
      setNewTitle('');
      setNewDesc('');
      setNewPriority('MEDIUM');
      setNewStatus('TODO');
      setNewAssignee('');
      setNewImages([]);
      setNewImagePreviews([]);
      setShowTaskModal(false);
      void fetchProject();
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateTask = async (taskId: string, input: Record<string, string | null>) => {
    try {
      await apolloClient.mutate({ mutation: UPDATE_TASK, variables: { id: taskId, input } });
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

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProject(true);
    try {
      await apolloClient.mutate({
        mutation: UPDATE_PROJECT,
        variables: { id: projectId, input: { name: editName, description: editDesc } },
      });
      setShowEditProject(false);
      void fetchProject();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingProject(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!confirm('Supprimer ce projet ? Cette action est irréversible.')) return;
    setDeletingProject(true);
    try {
      await apolloClient.mutate({ mutation: DELETE_PROJECT, variables: { id: projectId } });
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingProject(false);
    }
  };

  const handleUploadImage = async (file: File) => {
    if (!selectedTask) return;
    setUploadingImage(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      await apolloClient.mutate({
        mutation: UPLOAD_IMAGE,
        variables: { taskId: selectedTask.id, base64Image: base64 },
      });
      const { data } = await apolloClient.query({
        query: GET_PROJECT,
        variables: { id: projectId },
        fetchPolicy: 'network-only',
      });
      const up = (data as { project: Project }).project;
      const ut = up.tasks.find((t) => t.id === selectedTask.id);
      if (ut) setSelectedTask(ut);
      setProject(up);
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    try {
      await apolloClient.mutate({ mutation: DELETE_IMAGE, variables: { imageId } });
      const { data } = await apolloClient.query({
        query: GET_PROJECT,
        variables: { id: projectId },
        fetchPolicy: 'network-only',
      });
      const up = (data as { project: Project }).project;
      const ut = up.tasks.find((t) => t.id === selectedTask?.id);
      if (ut) setSelectedTask(ut);
      setProject(up);
    } catch (err) {
      console.error(err);
    }
  };

  // ─── Early returns ───

  if (loading)
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-[#8888aa] text-base">Chargement...</div>
      </div>
    );

  if (!project)
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-[#8888aa] text-base">Projet introuvable</div>
      </div>
    );

  // ─── Nav items ───

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

  // ─── Drag & Drop logic ───

  const getOrderedTasks = (status: string): Task[] => {
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
    const task = project.tasks.find((t) => t.id === taskId);
    return task?.status ?? null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = project.tasks.find((t) => t.id === event.active.id);
    if (task) {
      setActiveTask(task);
      // LECTURE INFAILLIBLE : On mesure directement la carte dans la page web
      const node = document.getElementById(`task-card-${task.id}`);
      if (node) {
        setActiveTaskWidth(node.getBoundingClientRect().width);
      }
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeCol = findColumnOfTask(activeId);

    let overCol: string | null = null;
    if (COLUMNS.some((c) => c.key === overId)) {
      overCol = overId;
    } else {
      overCol = findColumnOfTask(overId);
    }

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

    // On réinitialise la tâche ET la largeur
    setActiveTask(null);
    setActiveTaskWidth(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const currentCol = findColumnOfTask(activeId);
    if (!currentCol) return;

    let targetCol: string | null = null;
    if (COLUMNS.some((c) => c.key === overId)) {
      targetCol = overId;
    } else {
      targetCol = findColumnOfTask(overId);
    }
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
      try {
        await apolloClient.mutate({
          mutation: UPDATE_TASK,
          variables: { id: activeId, input: { status: targetCol } },
        });
        void fetchProject();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // ─── Task card content (shared between sortable & mobile) ───
  // AJOUT MAJEUR : Ajout de "w-full" dans les classes pour être sûr que ça ne se recroqueville pas !
  const TaskCardContent = ({ task, isDragging = false }: { task: Task; isDragging?: boolean }) => (
    <div
      className={`w-full bg-[#16161f] border border-[#2a2a3a] border-l-2 ${PRIORITY_BORDER[task.priority] ?? 'border-l-[#2a2a3a]'} rounded-lg p-3 ${isDragging ? 'shadow-xl shadow-indigo-500/10 border-indigo-500/30 ring-1 ring-indigo-500/20' : 'hover:border-[#3a3a50]'} transition-colors min-w-0 overflow-hidden box-border`}
    >
      <p className="text-base lg:text-lg font-semibold text-[#ffffff] mb-2 leading-snug break-words">
        {task.title}
      </p>
      {task.description && (
        <p className="text-sm lg:text-md text-[#ffffff] mb-2 line-clamp-2 leading-relaxed break-words">
          {task.description}
        </p>
      )}
      {task.images.length > 0 && (
        <div className="flex gap-1 mb-2 flex-wrap">
          {task.images.slice(0, 3).map((img) => (
            <img
              key={img.id}
              src={img.url}
              alt=""
              className="w-16 h-16 lg:w-20 lg:h-20 rounded object-cover border border-[#2a2a3a]"
            />
          ))}
          {task.images.length > 3 && (
            <div className="w-16 h-16 lg:w-20 lg:h-20 rounded bg-[#2a2a3a] flex items-center justify-center text-xs text-[#8888aa]">
              +{task.images.length - 3}
            </div>
          )}
        </div>
      )}
      <div className="flex items-center justify-between mt-1">
        <Badge variant={PRIORITY_BADGE[task.priority] ?? 'default'}>
          {PRIORITY_LABEL[task.priority] ?? task.priority}
        </Badge>
        {task.assignee ? (
          <Avatar name={task.assignee.name} avatar={task.assignee.avatar} size="sm" />
        ) : (
          <span className="text-xs lg:text-[14px] text-[#80808f]">Non assigné</span>
        )}
      </div>
    </div>
  );

  // ─── Sortable card (desktop) ───

  const SortableTaskCard = ({ task }: { task: Task }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: task.id,
    });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition: transition ?? 'transform 200ms ease',
      opacity: isDragging ? 0.3 : 1,
      zIndex: isDragging ? 50 : ('auto' as const),
    };
    return (
      <div
        id={`task-card-${task.id}`} // <--- AJOUT MAJEUR : permet de cibler la carte pour mesurer sa vraie largeur
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={() => {
          if (!isDragging) {
            setSelectedTask(task);
            setEditingDesc(task.description ?? '');
          }
        }}
        className="cursor-grab active:cursor-grabbing w-full"
      >
        <TaskCardContent task={task} />
      </div>
    );
  };

  // ─── Mobile card (no drag) ───

  const renderTaskCard = (task: Task) => (
    <motion.div
      key={task.id}
      variants={fadeInUp}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      onClick={() => {
        setSelectedTask(task);
        setEditingDesc(task.description ?? '');
      }}
      className={`bg-[#16161f] border border-[#2a2a3a] border-l-2 ${PRIORITY_BORDER[task.priority] ?? 'border-l-[#2a2a3a]'} rounded-lg p-3 cursor-pointer hover:border-[#3a3a50] transition-colors min-w-0 overflow-hidden`}
    >
      <p className="text-base lg:text-lg font-semibold text-[#ffffff] mb-2 leading-snug hover:text-indigo-300 transition-colors break-words">
        {task.title}
      </p>
      {task.description && (
        <p className="text-sm lg:text-md text-[#ffffff] mb-2 line-clamp-2 leading-relaxed break-words">
          {task.description}
        </p>
      )}
      {task.images.length > 0 && (
        <div className="flex gap-1 mb-2 flex-wrap">
          {task.images.slice(0, 3).map((img) => (
            <img
              key={img.id}
              src={img.url}
              alt=""
              className="w-16 h-16 lg:w-20 lg:h-20 rounded object-cover border border-[#2a2a3a]"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxImages(task.images);
                setLightboxIndex(task.images.indexOf(img));
              }}
            />
          ))}
          {task.images.length > 3 && (
            <div className="w-16 h-16 lg:w-20 lg:h-20 rounded bg-[#2a2a3a] flex items-center justify-center text-xs text-[#8888aa]">
              +{task.images.length - 3}
            </div>
          )}
        </div>
      )}
      <div className="flex items-center justify-between mt-1">
        <Badge variant={PRIORITY_BADGE[task.priority] ?? 'default'}>
          {PRIORITY_LABEL[task.priority] ?? task.priority}
        </Badge>
        {task.assignee ? (
          <Avatar name={task.assignee.name} avatar={task.assignee.avatar} size="sm" />
        ) : (
          <span className="text-xs lg:text-[14px] text-[#80808f]">Non assigné</span>
        )}
      </div>
    </motion.div>
  );

  // ─── Render ───

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-[#0a0a0f] flex overflow-x-hidden">
        <Sidebar navItems={navItems}>
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
                        className="text-[#55556a] hover:text-red-400 active:text-red-400 transition-all text-lg leading-none w-7 h-7 flex items-center justify-center rounded hover:bg-red-500/10"
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
          {/* MOBILE Header */}
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
                  onClick={() => {
                    setEditName(project.name);
                    setEditDesc(project.description ?? '');
                    setShowEditProject(true);
                  }}
                  className="p-2 text-[#55556a] hover:text-[#8888aa] active:text-[#f0f0ff] transition-colors"
                  aria-label="Modifier le projet"
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
                  onClick={() => void handleDeleteProject()}
                  disabled={deletingProject}
                  className="p-2 text-[#55556a] hover:text-red-400 active:text-red-400 transition-colors disabled:opacity-50"
                  aria-label="Supprimer le projet"
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
                <Button size="sm" onClick={() => setShowTaskModal(true)}>
                  + Tâche
                </Button>
              </div>
            </div>
          </motion.div>

          {/* DESKTOP Header */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.4 }}
            className="hidden lg:flex px-8 py-5 items-center justify-between"
          >
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-[#f0f0ff] truncate">{project.name}</h1>
              {project.description && (
                <p className="text-sm text-[#8888aa] mt-0.5 line-clamp-1">{project.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  setEditName(project.name);
                  setEditDesc(project.description ?? '');
                  setShowEditProject(true);
                }}
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
                onClick={() => void handleDeleteProject()}
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
              <Button onClick={() => setShowTaskModal(true)}>+ Nouvelle tâche</Button>
            </div>
          </motion.div>

          <div className="hidden lg:block border-b border-[#2a2a3a]" />

          {/* MOBILE: Tab Kanban */}
          <div className="lg:hidden flex flex-col flex-1">
            <div
              className="flex border-b border-[#2a2a3a] overflow-x-auto scrollbar-hide"
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
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={staggerContainer}
                  className="flex flex-col gap-3"
                >
                  {project.tasks
                    .filter((t) => t.status === activeTab)
                    .map((task) => renderTaskCard(task))}
                  {project.tasks.filter((t) => t.status === activeTab).length === 0 && (
                    <div className="flex items-center justify-center py-12">
                      <p className="text-sm text-[#2a2a3a]">Aucune tâche</p>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* DESKTOP: Drag & Drop Kanban */}
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
                  const taskIds = orderedTasks.map((t) => t.id);
                  return (
                    <motion.div
                      key={col.key}
                      variants={columnVariants}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                      className="bg-[#111118] border border-[#2a2a3a] rounded-xl flex flex-col"
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
                        items={taskIds}
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
                    // AJOUT MAJEUR : On applique en dur la largeur exacte récupérée dans le DOM
                    style={{ width: activeTaskWidth ? `${activeTaskWidth}px` : '300px' }}
                  >
                    <TaskCardContent task={activeTask} isDragging />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </main>

        {/* ─── Modals ─── */}

        <Modal open={showTaskModal} onClose={() => setShowTaskModal(false)} title="Nouvelle tâche">
          <form onSubmit={handleCreateTask} className="flex flex-col gap-5">
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
            <div className="flex flex-col gap-2">
              <label className="text-md font-medium text-[#8888aa]">Priorité</label>
              <div className="relative">
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  className={SELECT_CLASS}
                >
                  <option value="LOW">Basse</option>
                  <option value="MEDIUM">Moyenne</option>
                  <option value="HIGH">Haute</option>
                  <option value="URGENT">Urgente</option>
                </select>
                <SelectArrow />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-md font-medium text-[#8888aa]">Statut</label>
              <div className="relative">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className={SELECT_CLASS}
                >
                  {COLUMNS.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <SelectArrow />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-md font-medium text-[#8888aa]">Assigné à</label>
              <div className="relative">
                <select
                  value={newAssignee}
                  onChange={(e) => setNewAssignee(e.target.value)}
                  className={SELECT_CLASS}
                >
                  <option value="">Non assigné</option>
                  {project.members.map((m) => (
                    <option key={m.user.id} value={m.user.id}>
                      {m.user.name}
                    </option>
                  ))}
                </select>
                <SelectArrow />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <label className="text-md font-medium text-[#8888aa]">Images</label>
              {newImagePreviews.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {newImagePreviews.map((preview, idx) => (
                    <div key={idx} className="relative">
                      <img
                        src={preview}
                        alt=""
                        className="w-full h-32 object-cover rounded-lg border border-[#2a2a3a]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setNewImages((p) => p.filter((_, i) => i !== idx));
                          setNewImagePreviews((p) => p.filter((_, i) => i !== idx));
                        }}
                        className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full w-7 h-7 text-sm flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <input
                ref={newFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleNewImageSelect(e.target.files[0]);
                }}
              />
              <Button
                variant="secondary"
                size="md"
                type="button"
                onClick={() => newFileInputRef.current?.click()}
              >
                + Ajouter une image
              </Button>
            </div>
            <div className="flex gap-3 justify-end pt-2 border-t border-[#2a2a3a]">
              <Button
                variant="ghost"
                type="button"
                onClick={() => {
                  setShowTaskModal(false);
                  setNewImages([]);
                  setNewImagePreviews([]);
                }}
              >
                Annuler
              </Button>
              <Button type="submit" loading={creating}>
                Créer
              </Button>
            </div>
          </form>
        </Modal>

        <Modal
          open={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          title={selectedTask?.title ?? ''}
        >
          {selectedTask && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant={PRIORITY_BADGE[selectedTask.priority] ?? 'default'}>
                  {PRIORITY_LABEL[selectedTask.priority]}
                </Badge>
                {selectedTask.assignee && (
                  <div className="flex items-center gap-2">
                    <Avatar
                      name={selectedTask.assignee.name}
                      avatar={selectedTask.assignee.avatar}
                      size="sm"
                    />
                    <span className="text-base text-[#8888aa]">{selectedTask.assignee.name}</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-md font-medium text-[#8888aa]">Description</label>
                <textarea
                  value={editingDesc}
                  onChange={(e) => setEditingDesc(e.target.value)}
                  placeholder="Ajouter une description..."
                  rows={3}
                  className="w-full bg-[#16161f] border border-[#2a2a3a] rounded-lg px-4 py-3 text-base text-[#f0f0ff] placeholder-[#55556a] outline-none focus:border-indigo-500 resize-none transition-colors"
                />
                {editingDesc !== (selectedTask.description ?? '') && (
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setEditingDesc(selectedTask.description ?? '')}
                      className="text-xs text-[#55556a] hover:text-[#f0f0ff] transition-colors px-2 py-1"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        setSavingDesc(true);
                        await handleUpdateTask(selectedTask.id, { description: editingDesc });
                        setSelectedTask({ ...selectedTask, description: editingDesc });
                        setSavingDesc(false);
                      }}
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors px-2 py-1"
                    >
                      {savingDesc ? 'Sauvegarde...' : 'Sauvegarder'}
                    </button>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-md font-medium text-[#8888aa]">Priorité</label>
                <div className="relative">
                  <select
                    value={selectedTask.priority}
                    onChange={(e) => {
                      void handleUpdateTask(selectedTask.id, { priority: e.target.value });
                      setSelectedTask({ ...selectedTask, priority: e.target.value });
                    }}
                    className={SELECT_CLASS}
                  >
                    <option value="LOW">Basse</option>
                    <option value="MEDIUM">Moyenne</option>
                    <option value="HIGH">Haute</option>
                    <option value="URGENT">Urgente</option>
                  </select>
                  <SelectArrow />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-md font-medium text-[#8888aa]">Statut</label>
                <div className="relative">
                  <select
                    value={selectedTask.status}
                    onChange={(e) => {
                      void handleUpdateTask(selectedTask.id, { status: e.target.value });
                      setSelectedTask({ ...selectedTask, status: e.target.value });
                    }}
                    className={SELECT_CLASS}
                  >
                    {COLUMNS.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <SelectArrow />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-md font-medium text-[#8888aa]">Assigné à</label>
                <div className="relative">
                  <select
                    value={selectedTask.assignee?.id ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      void handleUpdateTask(selectedTask.id, {
                        assigneeId: val === '' ? null : val,
                      } as Record<string, string | null>);
                      const member = project.members.find((m) => m.user.id === val);
                      setSelectedTask({
                        ...selectedTask,
                        assignee: member ? { id: member.user.id, name: member.user.name } : null,
                      });
                    }}
                    className={SELECT_CLASS}
                  >
                    <option value="">Non assigné</option>
                    {project.members.map((m) => (
                      <option key={m.user.id} value={m.user.id}>
                        {m.user.name}
                      </option>
                    ))}
                  </select>
                  <SelectArrow />
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <label className="text-md font-medium text-[#8888aa]">Images</label>
                {selectedTask.images.length > 0 && (
                  <div className="grid grid-cols-2 gap-3">
                    {selectedTask.images.map((img, idx) => (
                      <div key={img.id} className="relative">
                        <img
                          src={img.url}
                          alt=""
                          className="w-full h-32 object-cover rounded-lg border border-[#2a2a3a] cursor-pointer hover:border-indigo-500 transition-colors"
                          onClick={() => {
                            setLightboxImages(selectedTask.images);
                            setLightboxIndex(idx);
                          }}
                        />
                        <button
                          onClick={() => void handleDeleteImage(img.id)}
                          className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full w-7 h-7 text-sm flex items-center justify-center"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) void handleUploadImage(e.target.files[0]);
                  }}
                />
                <Button
                  variant="secondary"
                  size="md"
                  loading={uploadingImage}
                  onClick={() => fileInputRef.current?.click()}
                >
                  + Ajouter une image
                </Button>
              </div>
              <div className="flex justify-between pt-3 border-t border-[#2a2a3a]">
                <Button
                  variant="danger"
                  size="md"
                  onClick={() => void handleDeleteTask(selectedTask.id)}
                >
                  Supprimer
                </Button>
                <Button variant="ghost" size="md" onClick={() => setSelectedTask(null)}>
                  Fermer
                </Button>
              </div>
            </div>
          )}
        </Modal>

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
              <div className="relative">
                <select
                  value={memberRole}
                  onChange={(e) => setMemberRole(e.target.value)}
                  className={SELECT_CLASS}
                >
                  <option value="ADMIN">Admin</option>
                  <option value="MEMBER">Member</option>
                  <option value="VIEWER">Viewer</option>
                </select>
                <SelectArrow />
              </div>
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

        <Modal
          open={showEditProject}
          onClose={() => setShowEditProject(false)}
          title="Modifier le projet"
        >
          <form onSubmit={handleUpdateProject} className="flex flex-col gap-4">
            <Input
              label="Nom"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Nom du projet"
              required
            />
            <Input
              label="Description"
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              placeholder="Description (optionnel)"
            />
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" type="button" onClick={() => setShowEditProject(false)}>
                Annuler
              </Button>
              <Button type="submit" loading={savingProject}>
                Enregistrer
              </Button>
            </div>
          </form>
        </Modal>

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
                  className="absolute left-3 lg:left-8 text-white text-3xl lg:text-5xl hover:text-gray-300 bg-black/40 rounded-full w-11 h-11 lg:w-12 lg:h-12 flex items-center justify-center"
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
                  className="absolute right-3 lg:right-8 text-white text-3xl lg:text-5xl hover:text-gray-300 bg-black/40 rounded-full w-11 h-11 lg:w-12 lg:h-12 flex items-center justify-center"
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
