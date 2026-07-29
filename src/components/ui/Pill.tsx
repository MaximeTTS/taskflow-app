/**
 * Pastilles de statut et de priorité.
 *
 * Les couleurs sont celles du système, et chaque pastille porte un mot,
 * jamais une couleur seule : une personne daltonienne doit pouvoir lire le
 * statut.
 *
 * Les valeurs pointent vers les rôles `-text`, pas vers les teintes pleines :
 * une pastille est du texte, elle doit donc respecter le seuil de contraste
 * de 4,5:1 dans les deux thèmes.
 */

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'CANCELLED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export const STATUS: Record<TaskStatus, { label: string; color: string }> = {
  TODO: { label: 'À faire', color: 'var(--text-2)' },
  IN_PROGRESS: { label: 'En cours', color: 'var(--info-text)' },
  IN_REVIEW: { label: 'En revue', color: 'var(--warning-text)' },
  DONE: { label: 'Terminé', color: 'var(--success-text)' },
  CANCELLED: { label: 'Annulé', color: 'var(--text-3)' },
};

/**
 * L'ordre des priorités est aussi celui de la barre gauche des cartes :
 * urgente en rouge, haute en ambre, moyenne en violet, basse en gris.
 */
export const PRIORITY: Record<Priority, { label: string; color: string }> = {
  LOW: { label: 'Basse', color: 'var(--text-3)' },
  MEDIUM: { label: 'Moyenne', color: 'var(--accent-2-text)' },
  HIGH: { label: 'Haute', color: 'var(--warning-text)' },
  URGENT: { label: 'Urgente', color: 'var(--danger-text)' },
};

export const STATUS_ORDER: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];

export function StatusPill({ status }: { status: TaskStatus }) {
  const s = STATUS[status] ?? STATUS.TODO;
  return (
    <span className="tf-pill" style={{ color: s.color }}>
      <span className="tf-dot" />
      {s.label}
    </span>
  );
}

export function PriorityPill({ priority }: { priority: Priority }) {
  const p = PRIORITY[priority] ?? PRIORITY.MEDIUM;
  return (
    <span className="tf-pill" style={{ color: p.color }}>
      {p.label}
    </span>
  );
}

/** Étiquette de rôle dans un projet. */
export function RolePill({ role }: { role: string }) {
  const colors: Record<string, string> = {
    OWNER: 'var(--accent-text)',
    ADMIN: 'var(--info-text)',
    MEMBER: 'var(--text-2)',
    VIEWER: 'var(--text-3)',
  };
  const labels: Record<string, string> = {
    OWNER: 'Propriétaire',
    ADMIN: 'Admin',
    MEMBER: 'Membre',
    VIEWER: 'Lecture',
  };
  return (
    <span className="tf-pill" style={{ color: colors[role] ?? 'var(--text-3)' }}>
      {labels[role] ?? role}
    </span>
  );
}
