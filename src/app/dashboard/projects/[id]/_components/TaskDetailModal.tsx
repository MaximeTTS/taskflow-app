import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { DatePicker } from '@/components/ui/DatePicker';
import { Modal } from '@/components/ui/Modal';
import { SelectArrow } from './SelectArrow';
import { COLUMNS, PRIORITY_BADGE, PRIORITY_LABEL, SELECT_CLASS } from '../_constants';
import type { Task, TaskImage, Project } from '../_types';

type Props = {
  task: Task | null;
  project: Project;
  onClose: () => void;
  onUpdateTask: (taskId: string, input: Record<string, string | null>) => Promise<void>;
  onDeleteTask: (taskId: string) => void;
  onUploadImage: (file: File) => void;
  onDeleteImage: (imageId: string) => void;
  onLightbox: (images: TaskImage[], index: number) => void;
  uploadingImage: boolean;
};

export function TaskDetailModal({
  task,
  project,
  onClose,
  onUpdateTask,
  onDeleteTask,
  onUploadImage,
  onDeleteImage,
  onLightbox,
  uploadingImage,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingDesc, setEditingDesc] = useState(task?.description ?? '');
  const [savingDesc, setSavingDesc] = useState(false);

  useEffect(() => {
    setEditingDesc(task?.description ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.id]);

  if (!task) return null;

  return (
    <Modal open={!!task} onClose={onClose} title={task.title}>
      <div className="flex flex-col gap-5">
        {/* Badge + assignee */}
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant={PRIORITY_BADGE[task.priority] ?? 'default'}>
            {PRIORITY_LABEL[task.priority]}
          </Badge>
          {task.assignee && (
            <div className="flex items-center gap-2">
              <Avatar name={task.assignee.name} avatar={task.assignee.avatar} size="sm" />
              <span className="text-base text-[#8888aa]">{task.assignee.name}</span>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="flex flex-col gap-2">
          <label className="text-md font-medium text-[#8888aa]">Description</label>
          <textarea
            value={editingDesc}
            onChange={(e) => setEditingDesc(e.target.value)}
            placeholder="Ajouter une description..."
            rows={3}
            className="w-full bg-[#16161f] border border-[#2a2a3a] rounded-lg px-4 py-3 text-base text-[#f0f0ff] placeholder-[#55556a] outline-none hover:border-indigo-500 focus:border-indigo-500 resize-none transition-colors"
          />
          {editingDesc !== (task.description ?? '') && (
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setEditingDesc(task.description ?? '')}
                className="text-xs text-[#55556a] hover:text-[#f0f0ff] transition-colors px-2 py-1"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={async () => {
                  setSavingDesc(true);
                  await onUpdateTask(task.id, { description: editingDesc });
                  setSavingDesc(false);
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors px-2 py-1"
              >
                {savingDesc ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
          )}
        </div>

        {/* Priorité */}
        <div className="flex flex-col gap-2">
          <label className="text-md font-medium text-[#8888aa]">Priorité</label>
          <div className="relative">
            <select
              value={task.priority}
              onChange={(e) => onUpdateTask(task.id, { priority: e.target.value })}
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

        {/* Statut */}
        <div className="flex flex-col gap-2">
          <label className="text-md font-medium text-[#8888aa]">Statut</label>
          <div className="relative">
            <select
              value={task.status}
              onChange={(e) => onUpdateTask(task.id, { status: e.target.value })}
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

        {/* Assigné à */}
        <div className="flex flex-col gap-2">
          <label className="text-md font-medium text-[#8888aa]">Assigné à</label>
          <div className="relative">
            <select
              value={task.assignee?.id ?? ''}
              onChange={(e) => {
                const val = e.target.value;
                onUpdateTask(task.id, { assigneeId: val === '' ? null : val } as Record<
                  string,
                  string | null
                >);
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

        <div className="flex flex-col gap-2">
          <label className="text-md font-medium text-[#8888aa]">Deadline</label>
          <DatePicker
            value={task.dueDate}
            onChange={(date) => onUpdateTask(task.id, { dueDate: date })}
            placeholder="Choisir une deadline"
          />
        </div>

        {/* Images */}
        <div className="flex flex-col gap-3">
          <label className="text-md font-medium text-[#8888aa]">Images</label>
          {task.images.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {task.images.map((img, idx) => (
                <div key={img.id} className="relative">
                  <img
                    src={img.url}
                    alt=""
                    className="w-full h-32 object-cover rounded-lg border border-[#2a2a3a] cursor-pointer hover:border-indigo-500 transition-colors"
                    onClick={() => onLightbox(task.images, idx)}
                  />
                  <button
                    onClick={() => onDeleteImage(img.id)}
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
              if (e.target.files?.[0]) onUploadImage(e.target.files[0]);
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
          <Button variant="danger" size="md" onClick={() => onDeleteTask(task.id)}>
            Supprimer
          </Button>
          <Button variant="ghost" size="md" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>
    </Modal>
  );
}
