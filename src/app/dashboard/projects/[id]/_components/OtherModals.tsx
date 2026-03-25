import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { SelectArrow } from './SelectArrow';
import { SELECT_CLASS } from '../_constants';

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
