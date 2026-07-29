'use client';

import Image from 'next/image';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Avatar } from '@/components/glass/Avatar';
import { PriorityPill } from '@/components/glass/Pill';
import type { Priority } from '@/components/glass/Pill';
import { Icon } from '@/components/glass/Icon';
import type { Task } from '../_types';

/** Nombre de jours restants avant l'échéance. Négatif si dépassée. */
function daysLeft(dueDate: string): number | null {
  // Le serveur renvoie l'échéance en millisecondes depuis l'époque, sous
  // forme de chaîne. Une date ISO reste acceptée par sécurité.
  const timestamp = /^\d+$/.test(dueDate) ? Number(dueDate) : Date.parse(dueDate);
  if (!Number.isFinite(timestamp)) return null;

  const jour = 86_400_000;
  const echeance = Math.floor(timestamp / jour);
  const aujourdhui = Math.floor(Date.now() / jour);
  return echeance - aujourdhui;
}

/** Échéance en clair, avec la couleur qui correspond à son urgence. */
function DueBadge({ dueDate }: { dueDate: string }) {
  const reste = daysLeft(dueDate);
  if (reste === null) return null;

  const { texte, couleur } =
    reste < 0
      ? { texte: `En retard de ${Math.abs(reste)} j`, couleur: 'var(--color-rose)' }
      : reste === 0
        ? { texte: "Aujourd'hui", couleur: 'var(--color-rose)' }
        : reste === 1
          ? { texte: 'Demain', couleur: 'var(--color-amber)' }
          : reste <= 7
            ? { texte: `Dans ${reste} j`, couleur: 'var(--color-amber)' }
            : {
                texte: new Date(
                  /^\d+$/.test(dueDate) ? Number(dueDate) : dueDate,
                ).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
                couleur: 'var(--color-mute)',
              };

  return (
    <span className="inline-flex items-center gap-1.5 text-[11.5px]" style={{ color: couleur }}>
      <Icon.Clock size={12} />
      {texte}
    </span>
  );
}

export function TaskCard({ task, onOpen }: { task: Task; onOpen: (task: Task) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.35 : 1,
      }}
      {...attributes}
      {...listeners}
      className="tf-task g g-raised g-lift touch-none"
    >
      <span className="g-refract" />
      <span className="g-tint" />
      <span className="g-rim" />

      {/* Un bouton, pas un div cliquable : la tâche s'ouvre aussi au clavier. */}
      <button
        type="button"
        onClick={() => onOpen(task)}
        className="g-body w-full cursor-pointer p-3.5 text-left"
      >
        <p className="mb-2.5 text-[13.5px] font-medium leading-snug">{task.title}</p>

        {task.images.length > 0 && (
          <div className="mb-2.5 flex gap-1.5">
            {task.images.slice(0, 3).map((img) => (
              <Image
                key={img.id}
                src={img.url}
                alt=""
                width={44}
                height={44}
                sizes="44px"
                className="h-11 w-11 rounded-[8px] object-cover"
                style={{ boxShadow: 'inset 0 0 0 1px var(--rim)' }}
              />
            ))}
            {task.images.length > 3 && (
              <span
                className="tf-num flex h-11 w-11 items-center justify-center rounded-[8px] text-[11px]"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--color-mute)' }}
              >
                +{task.images.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <PriorityPill priority={(task.priority as Priority) ?? 'MEDIUM'} />
          {task.assignee && <Avatar name={task.assignee.name} avatar={task.assignee.avatar} size={22} />}
        </div>

        {task.dueDate && (
          <div className="mt-2.5 pt-2.5" style={{ borderTop: '1px solid var(--rim)' }}>
            <DueBadge dueDate={task.dueDate} />
          </div>
        )}
      </button>
    </div>
  );
}
