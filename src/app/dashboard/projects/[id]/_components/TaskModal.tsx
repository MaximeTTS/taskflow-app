'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Modal } from '@/components/glass/Modal';
import { Button, IconButton } from '@/components/glass/Button';
import { Field } from '@/components/glass/Field';
import { Select, Textarea } from '@/components/glass/Select';
import { Alert } from '@/components/glass/Alert';
import { Icon } from '@/components/glass/Icon';
import { STATUS, PRIORITY, STATUS_ORDER } from '@/components/glass/Pill';
import type { Task, Project } from '../_types';

const STATUS_OPTIONS = [...STATUS_ORDER, 'CANCELLED' as const].map((s) => ({
  value: s,
  label: STATUS[s].label,
}));

const PRIORITY_OPTIONS = (['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const).map((p) => ({
  value: p,
  label: PRIORITY[p].label,
}));

/** Convertit l'échéance du serveur en valeur pour `<input type="date">`. */
function toDateInput(due: string | null): string {
  if (!due) return '';
  const ts = /^\d+$/.test(due) ? Number(due) : Date.parse(due);
  if (!Number.isFinite(ts)) return '';
  return new Date(ts).toISOString().slice(0, 10);
}

type Props = {
  task: Task | null;
  project: Project;
  canEdit: boolean;
  onClose: () => void;
  onUpdate: (taskId: string, input: Record<string, string | null>) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
  onUploadImage: (file: File) => Promise<void>;
  onDeleteImage: (imageId: string) => Promise<void>;
};

/**
 * Détail d'une tâche.
 *
 * Chaque champ s'enregistre à la validation plutôt que via un bouton global :
 * changer un statut ne devrait pas demander de penser à sauvegarder.
 */
export function TaskModal({
  task,
  project,
  canEdit,
  onClose,
  onUpdate,
  onDelete,
  onUploadImage,
  onDeleteImage,
}: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setDescription(task.description ?? '');
    setConfirmDelete(false);
    setError('');
  }, [task]);

  if (!task) return null;

  const save = async (input: Record<string, string | null>) => {
    setError('');
    try {
      await onUpdate(task.id, input);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enregistrement impossible');
    }
  };

  const assigneeOptions = [
    { value: '', label: 'Personne' },
    ...project.members.map((m) => ({
      value: m.user.id,
      label: m.user.name || m.user.email,
    })),
  ];

  return (
    <Modal
      open
      onClose={onClose}
      title="Détail de la tâche"
      subtitle={canEdit ? undefined : 'Vous êtes en lecture seule sur ce projet.'}
      width={620}
      footer={
        canEdit ? (
          confirmDelete ? (
            <>
              <span className="mr-auto text-[13px]" style={{ color: 'var(--color-haze)' }}>
                Supprimer définitivement cette tâche ?
              </span>
              <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
                Annuler
              </Button>
              <Button
                variant="danger"
                loading={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await onDelete(task.id);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Supprimer
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setConfirmDelete(true)}>
                <Icon.Trash size={15} />
                Supprimer
              </Button>
              <Button variant="primary" onClick={onClose}>
                Fermer
              </Button>
            </>
          )
        ) : (
          <Button variant="primary" onClick={onClose}>
            Fermer
          </Button>
        )
      }
    >
      <div className="flex flex-col gap-4">
        {error && <Alert tone="danger">{error}</Alert>}

        <Field
          label="Titre"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => title.trim() && title !== task.title && save({ title })}
          disabled={!canEdit}
          maxLength={200}
        />

        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={() => description !== (task.description ?? '') && save({ description })}
          placeholder="Ce qu'il y a à faire, et comment savoir que c'est fait."
          disabled={!canEdit}
          maxLength={5000}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Statut"
            value={task.status}
            options={STATUS_OPTIONS}
            disabled={!canEdit}
            onChange={(e) => save({ status: e.target.value })}
          />
          <Select
            label="Priorité"
            value={task.priority}
            options={PRIORITY_OPTIONS}
            disabled={!canEdit}
            onChange={(e) => save({ priority: e.target.value })}
          />
          <Select
            label="Assigné à"
            value={task.assignee?.id ?? ''}
            options={assigneeOptions}
            disabled={!canEdit}
            onChange={(e) => save({ assigneeId: e.target.value || null })}
          />
          <Field
            label="Échéance"
            type="date"
            defaultValue={toDateInput(task.dueDate)}
            disabled={!canEdit}
            // Une date effacée envoie `null`, ce qui retire l'échéance.
            onChange={(e) =>
              save({ dueDate: e.target.value ? new Date(e.target.value).toISOString() : null })
            }
          />
        </div>

        {/* ── Images ──────────────────────────────────────────── */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="tf-label mb-0">Images</span>
            {canEdit && (
              <Button variant="ghost" size="sm" onClick={() => fileInput.current?.click()}>
                <Icon.Plus size={14} />
                Ajouter
              </Button>
            )}
          </div>

          {task.images.length === 0 ? (
            <p className="text-[13px]" style={{ color: 'var(--color-mute)' }}>
              Aucune image jointe.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {task.images.map((img) => (
                <div key={img.id} className="group relative">
                  <Image
                    src={img.url}
                    alt=""
                    width={220}
                    height={130}
                    sizes="(max-width: 640px) 45vw, 200px"
                    className="h-[110px] w-full rounded-[10px] object-cover"
                    style={{ boxShadow: 'inset 0 0 0 1px var(--rim)' }}
                  />
                  {canEdit && (
                    <span className="absolute right-1.5 top-1.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                      <IconButton
                        label="Supprimer cette image"
                        size={28}
                        onClick={() => void onDeleteImage(img.id)}
                      >
                        <Icon.Close size={13} />
                      </IconButton>
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          <input
            ref={fileInput}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (!file) return;
              setBusy(true);
              setError('');
              try {
                await onUploadImage(file);
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Envoi impossible');
              } finally {
                setBusy(false);
              }
            }}
          />
        </div>

        <p className="tf-num text-[11.5px]" style={{ color: 'var(--color-mute)' }}>
          Créée par {task.creator.name}
        </p>
      </div>
    </Modal>
  );
}
