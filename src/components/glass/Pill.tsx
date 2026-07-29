/**
 * Pastilles de statut et de priorité.
 *
 * Les couleurs sont celles du système : le cyan de l'accent marque
 * l'achèvement, le rose de la dispersion marque l'urgence. Rien n'est
 * inventé pour l'occasion.
 *
 * Chaque pastille porte aussi un mot, jamais une couleur seule : une
 * personne daltonienne doit pouvoir lire le statut.
 */

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'CANCELLED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export const STATUS: Record<TaskStatus, { label: string; color: string }> = {
  TODO: { label: 'À faire', color: 'var(--color-mute)' },
  IN_PROGRESS: { label: 'En cours', color: 'var(--color-azure)' },
  IN_REVIEW: { label: 'En revue', color: 'var(--color-amber)' },
  DONE: { label: 'Terminé', color: 'var(--color-aqua)' },
  CANCELLED: { label: 'Annulé', color: '#4a5570' },
};

export const PRIORITY: Record<Priority, { label: string; color: string }> = {
  LOW: { label: 'Basse', color: 'var(--color-mute)' },
  MEDIUM: { label: 'Moyenne', color: 'var(--color-azure)' },
  HIGH: { label: 'Haute', color: 'var(--color-amber)' },
  URGENT: { label: 'Urgente', color: 'var(--color-rose)' },
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
    OWNER: 'var(--color-aqua)',
    ADMIN: 'var(--color-azure)',
    MEMBER: 'var(--color-haze)',
    VIEWER: 'var(--color-mute)',
  };
  const labels: Record<string, string> = {
    OWNER: 'Propriétaire',
    ADMIN: 'Admin',
    MEMBER: 'Membre',
    VIEWER: 'Lecture',
  };
  return (
    <span className="tf-pill" style={{ color: colors[role] ?? 'var(--color-mute)' }}>
      {labels[role] ?? role}
    </span>
  );
}
