'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button, IconButton } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Select, Textarea } from '@/components/ui/Select';
import { Alert } from '@/components/ui/Alert';
import { Avatar } from '@/components/ui/Avatar';
import { RolePill, STATUS, PRIORITY, STATUS_ORDER } from '@/components/ui/Pill';
import { Icon } from '@/components/ui/Icon';
import { ROLE_HIERARCHY } from '@/lib/role-utils';
import type { Role } from '@/lib/role-utils';
import type { Project } from '../_types';

const ROLE_OPTIONS = [
  { value: 'VIEWER', label: 'Lecture' },
  { value: 'MEMBER', label: 'Membre' },
  { value: 'ADMIN', label: 'Admin' },
];

const STATUS_OPTIONS = STATUS_ORDER.map((s) => ({ value: s, label: STATUS[s].label }));
const PRIORITY_OPTIONS = (['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const).map((p) => ({
  value: p,
  label: PRIORITY[p].label,
}));

/* ═══════════════════════════════════════════════════════════════════
   Nouvelle tâche
   ═══════════════════════════════════════════════════════════════════ */

export function NewTaskModal({
  open,
  onClose,
  project,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  project: Project;
  onCreate: (input: Record<string, unknown>, images: File[]) => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('TODO');
  const [priority, setPriority] = useState('MEDIUM');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setTitle('');
    setDescription('');
    setStatus('TODO');
    setPriority('MEDIUM');
    setAssigneeId('');
    setDueDate('');
    setImages([]);
    setError('');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onCreate(
        {
          title,
          description: description || undefined,
          projectId: project.id,
          status,
          priority,
          assigneeId: assigneeId || undefined,
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        },
        images,
      );
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Création impossible');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nouvelle tâche"
      width={600}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="form-tache"
            loading={busy}
            disabled={title.trim().length === 0}
          >
            Créer la tâche
          </Button>
        </>
      }
    >
      <form id="form-tache" onSubmit={submit} className="flex flex-col gap-4">
        {error && <Alert tone="danger">{error}</Alert>}

        <Field
          label="Titre"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Corriger l'affichage des échéances"
          maxLength={200}
          autoFocus
          required
        />

        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ce qu'il y a à faire, et comment savoir que c'est fait."
          maxLength={5000}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Statut"
            value={status}
            options={STATUS_OPTIONS}
            onChange={(e) => setStatus(e.target.value)}
          />
          <Select
            label="Priorité"
            value={priority}
            options={PRIORITY_OPTIONS}
            onChange={(e) => setPriority(e.target.value)}
          />
          <Select
            label="Assigné à"
            value={assigneeId}
            options={[
              { value: '', label: 'Personne' },
              ...project.members.map((m) => ({
                value: m.user.id,
                label: m.user.name || m.user.email,
              })),
            ]}
            onChange={(e) => setAssigneeId(e.target.value)}
          />
          <Field
            label="Échéance"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        <div>
          <span className="tf-label">Images</span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            multiple
            className="tf-file"
            onChange={(e) => setImages(Array.from(e.target.files ?? []))}
          />
          {images.length > 0 && (
            <p className="mt-2 text-[12.5px]" style={{ color: 'var(--text-2)' }}>
              {images.length} image(s) seront jointes après création.
            </p>
          )}
        </div>
      </form>
    </Modal>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Membres
   ═══════════════════════════════════════════════════════════════════ */

export function MembersModal({
  open,
  onClose,
  project,
  myRole,
  myUserId,
  onAdd,
  onRemove,
  onUpdateRole,
}: {
  open: boolean;
  onClose: () => void;
  project: Project;
  myRole: Role;
  myUserId: string;
  onAdd: (email: string, role: string) => Promise<void>;
  onRemove: (userId: string) => Promise<void>;
  onUpdateRole: (userId: string, role: string) => Promise<void>;
}) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const isAdmin = ROLE_HIERARCHY[myRole] >= ROLE_HIERARCHY.ADMIN;

  /** Reflète la règle du serveur : on n'agit que sur un rang inférieur. */
  const canManage = (targetRole: string) =>
    isAdmin && ROLE_HIERARCHY[targetRole as Role] < ROLE_HIERARCHY[myRole];

  /** Idem pour l'attribution : jamais un rôle supérieur ou égal au sien. */
  const assignable = ROLE_OPTIONS.filter(
    (o) => ROLE_HIERARCHY[o.value as Role] < ROLE_HIERARCHY[myRole],
  );

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onAdd(email, role);
      setEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ajout impossible');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Membres" width={580}>
      <div className="flex flex-col gap-5">
        {isAdmin && (
          <form onSubmit={add} className="flex flex-col gap-3">
            {error && <Alert tone="danger">{error}</Alert>}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <Field
                label="Inviter par email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="collegue@exemple.com"
                className="flex-1"
                required
              />
              <Select
                label="Rôle"
                value={role}
                options={assignable}
                onChange={(e) => setRole(e.target.value)}
                className="sm:w-40"
              />
              <Button type="submit" variant="primary" loading={busy} className="sm:mb-0">
                Inviter
              </Button>
            </div>
            <p className="text-[12.5px]" style={{ color: 'var(--text-3)' }}>
              La personne doit déjà avoir un compte TaskFlow.
            </p>
          </form>
        )}

        <ul className="flex flex-col" style={{ borderTop: '1px solid var(--border)' }}>
          {project.members.map((m) => {
            const nom = m.user.name || m.user.email;
            const moi = m.user.id === myUserId;
            return (
              <li
                key={m.id}
                className="flex items-center gap-3 py-3"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <Avatar name={nom} avatar={m.user.avatar} size={36} />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium">
                    {nom}
                    {moi && (
                      <span className="ml-2 text-[12px]" style={{ color: 'var(--text-3)' }}>
                        vous
                      </span>
                    )}
                  </p>
                  <p className="truncate text-[12.5px]" style={{ color: 'var(--text-3)' }}>
                    {m.user.email}
                  </p>
                </div>

                {canManage(m.role) && !moi ? (
                  <>
                    <Select
                      value={m.role}
                      options={assignable}
                      onChange={(e) => void onUpdateRole(m.user.id, e.target.value)}
                      className="w-32"
                      aria-label={`Rôle de ${nom}`}
                    />
                    <IconButton
                      label={`Retirer ${nom} du projet`}
                      onClick={() => void onRemove(m.user.id)}
                    >
                      <Icon.Close size={15} />
                    </IconButton>
                  </>
                ) : (
                  <RolePill role={m.role} />
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </Modal>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Réglages du projet
   ═══════════════════════════════════════════════════════════════════ */

export function SettingsModal({
  open,
  onClose,
  project,
  isOwner,
  onSave,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  project: Project;
  isOwner: boolean;
  onSave: (name: string, description: string) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Réglages du projet"
      width={560}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Fermer
          </Button>
          <Button
            variant="primary"
            loading={busy}
            disabled={name.trim().length === 0}
            onClick={async () => {
              setBusy(true);
              setError('');
              try {
                await onSave(name, description);
                onClose();
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Enregistrement impossible');
              } finally {
                setBusy(false);
              }
            }}
          >
            Enregistrer
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {error && <Alert tone="danger">{error}</Alert>}

        <Field
          label="Nom du projet"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
        />
        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={2000}
        />

        {isOwner && (
          <div className="mt-2 pt-5" style={{ borderTop: '1px solid var(--border)' }}>
            <p className="mb-1.5 text-[14px] font-semibold" style={{ color: 'var(--danger-text)' }}>
              Supprimer le projet
            </p>
            <p className="mb-4 text-[13px]" style={{ color: 'var(--text-2)' }}>
              Toutes les tâches et les images seront supprimées. C’est irréversible.
            </p>

            {/* Faire retaper le nom : une action irréversible ne doit jamais
                tenir à un seul clic. */}
            <Field
              label={`Saisissez « ${project.name} » pour confirmer`}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={project.name}
            />

            <div className="mt-3">
              <Button
                variant="danger"
                loading={deleting}
                disabled={confirmText !== project.name}
                onClick={async () => {
                  setDeleting(true);
                  try {
                    await onDelete();
                  } finally {
                    setDeleting(false);
                  }
                }}
              >
                <Icon.Trash size={15} />
                Supprimer définitivement
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
