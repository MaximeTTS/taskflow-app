import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { TfAvatar } from '@/components/tf/atoms';
import { SelectArrow } from './SelectArrow';
import { SELECT_CLASS } from '../_constants';
import type { Project } from '../_types';

type InviteMemberModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (email: string, role: string) => Promise<void>;
};

export function InviteMemberModal({ open, onClose, onSubmit }: InviteMemberModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [adding, setAdding] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      await onSubmit(email, role);
      setEmail('');
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Inviter un membre">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="alice@exemple.com"
          required
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#8888aa]">Rôle</label>
          <div className="relative">
            <select value={role} onChange={(e) => setRole(e.target.value)} className={SELECT_CLASS}>
              <option value="ADMIN">Admin</option>
              <option value="MEMBER">Member</option>
              <option value="VIEWER">Viewer</option>
            </select>
            <SelectArrow />
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" type="button" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" loading={adding}>
            Inviter
          </Button>
        </div>
      </form>
    </Modal>
  );
}

type MembersModalProps = {
  open: boolean;
  onClose: () => void;
  project: Project;
  currentUserId: string | null;
  onInvite: () => void;
  onUpdateRole: (userId: string, role: string) => Promise<void> | void;
  onRemoveMember: (userId: string) => Promise<void> | void;
};

export function MembersModal({
  open,
  onClose,
  project,
  currentUserId,
  onInvite,
  onUpdateRole,
  onRemoveMember,
}: MembersModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Membres du projet">
      <div className="flex flex-col gap-3">
        {project.members.map((m) => {
          const isOwner = m.user.id === project.owner.id;
          return (
            <div
              key={m.id}
              className="flex items-center gap-3 p-2.5 rounded-2xl"
              style={{ background: 'var(--tf-soft)' }}
            >
              <TfAvatar name={m.user.name} avatar={m.user.avatar} size={36} ring />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{m.user.name}</div>
                <div className="text-xs truncate" style={{ color: 'var(--tf-text-faint)' }}>
                  {m.user.email}
                </div>
              </div>
              {isOwner ? (
                <span
                  className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
                  style={{ background: 'rgba(167,139,250,0.18)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.3)' }}
                >
                  Owner
                </span>
              ) : (
                <>
                  <div className="relative">
                    <select
                      value={m.role}
                      onChange={(e) => void onUpdateRole(m.user.id, e.target.value)}
                      className={`${SELECT_CLASS} !w-auto !py-1.5 !pr-9 !text-xs`}
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="MEMBER">Member</option>
                      <option value="VIEWER">Viewer</option>
                    </select>
                    <SelectArrow />
                  </div>
                  {m.user.id !== currentUserId && (
                    <button
                      onClick={() => void onRemoveMember(m.user.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-500/10 hover:text-red-400 transition-colors text-lg leading-none"
                      style={{ color: 'var(--tf-text-faint)' }}
                      title="Retirer"
                    >
                      ×
                    </button>
                  )}
                </>
              )}
            </div>
          );
        })}
        <div className="flex justify-end pt-1">
          <Button onClick={onInvite}>+ Inviter un membre</Button>
        </div>
      </div>
    </Modal>
  );
}

type EditProjectModalProps = {
  open: boolean;
  onClose: () => void;
  initialName: string;
  initialDesc: string;
  onSubmit: (name: string, desc: string) => Promise<void>;
};

export function EditProjectModal({
  open,
  onClose,
  initialName,
  initialDesc,
  onSubmit,
}: EditProjectModalProps) {
  const [name, setName] = useState(initialName);
  const [desc, setDesc] = useState(initialDesc);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit(name, desc);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Modifier le projet">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Nom"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom du projet"
          required
        />
        <Input
          label="Description"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Description (optionnel)"
        />
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" type="button" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" loading={saving}>
            Enregistrer
          </Button>
        </div>
      </form>
    </Modal>
  );
}
