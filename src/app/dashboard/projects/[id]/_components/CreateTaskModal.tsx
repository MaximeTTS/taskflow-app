import { useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { DatePicker } from '@/components/ui/DatePicker';
import { SelectArrow } from './SelectArrow';
import { COLUMNS, SELECT_CLASS } from '../_constants';
import type { Member } from '../_types';

type Props = {
  open: boolean;
  onClose: () => void;
  members: Member[];
  onSubmit: (input: Record<string, unknown>, images: File[]) => Promise<void>;
};

export function CreateTaskModal({ open, onClose, members, onSubmit }: Props) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [status, setStatus] = useState('TODO');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setImages((p) => [...p, file]);
      setPreviews((p) => [...p, reader.result as string]);
    };
    reader.readAsDataURL(file);
  };

  const reset = () => {
    setTitle('');
    setDesc('');
    setPriority('MEDIUM');
    setStatus('TODO');
    setAssignee('');
    setDueDate('');
    setImages([]);
    setPreviews([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await onSubmit(
        {
          title,
          description: desc,
          priority,
          status,
          projectId: undefined, // sera injecté depuis page.tsx
          // Le créateur est déterminé côté serveur à partir du jeton : le
          // laisser choisir au client permettait d'attribuer une tâche à
          // n'importe qui.
          assigneeId: assignee === '' ? undefined : assignee,
          dueDate: dueDate === '' ? undefined : dueDate,
        },
        images,
      );
      reset();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Nouvelle tâche"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Input
          label="Titre"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titre de la tâche"
          required
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium" style={{ color: 'var(--tf-text-muted)' }}>
            Description
          </label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Description (optionnel) — les sauts de ligne sont conservés"
            rows={4}
            className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none resize-y transition-colors placeholder:opacity-50 focus:ring-2 focus:ring-[color:var(--tf-accent)]/30"
            style={{
              background: 'var(--tf-input-bg)',
              border: '1px solid var(--tf-input-border)',
              color: 'var(--tf-text)',
            }}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-md font-medium text-[#8888aa]">Priorité</label>
          <div className="relative">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
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
              value={status}
              onChange={(e) => setStatus(e.target.value)}
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
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className={SELECT_CLASS}
            >
              <option value="">Non assigné</option>
              {members.map((m) => (
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
            value={dueDate}
            onChange={(date) => setDueDate(date ?? '')}
            placeholder="Choisir une deadline"
          />
        </div>

        <div className="flex flex-col gap-3">
          <label className="text-md font-medium text-[#8888aa]">Images</label>
          {previews.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {previews.map((preview, idx) => (
                <div key={idx} className="relative">
                  {/* Apercu local : `preview` est une data URI produite par
                      FileReader, que next/image ne peut pas optimiser. La
                      balise native est ici le bon choix.
                      eslint-disable-next-line @next/next/no-img-element */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview}
                    alt=""
                    className="w-full h-32 object-cover rounded-lg border border-[#2a2a3a]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImages((p) => p.filter((_, i) => i !== idx));
                      setPreviews((p) => p.filter((_, i) => i !== idx));
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
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleImageSelect(e.target.files[0]);
            }}
          />
          <Button
            variant="secondary"
            size="md"
            type="button"
            onClick={() => fileInputRef.current?.click()}
          >
            + Ajouter une image
          </Button>
        </div>

        <div className="flex gap-3 justify-end pt-2 border-t border-[#2a2a3a]">
          <Button
            variant="ghost"
            type="button"
            onClick={() => {
              reset();
              onClose();
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
  );
}
