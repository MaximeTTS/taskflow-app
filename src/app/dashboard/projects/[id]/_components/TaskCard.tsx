import { TfAvatar, PriorityPill } from '@/components/tf/atoms';
import { DueDateBadge } from './DueDateBadge';
import type { Task, TaskImage } from '../_types';

type Props = {
  task: Task;
  isDragging?: boolean;
  onClick?: () => void;
  onImageClick?: (images: TaskImage[], index: number) => void;
};

export function TaskCard({ task, isDragging = false, onClick, onImageClick }: Props) {
  return (
    <div
      onClick={onClick}
      className={`tf-card-glass w-full p-3.5 ${isDragging ? '' : 'tf-hover-card'}`}
      style={{
        borderRadius: 'calc(22px * var(--tf-radius-scale, 1))',
        boxShadow: isDragging ? 'var(--tf-card-shadow-hover)' : undefined,
        color: 'var(--tf-text)',
      }}
    >
      <p className="text-[13.5px] font-semibold leading-snug break-words" style={{ letterSpacing: '-0.01em' }}>
        {task.title}
      </p>
      {task.description && (
        <p
          className="text-[12px] mt-1.5 leading-relaxed break-words whitespace-pre-line"
          style={{ color: 'var(--tf-text-muted)' }}
        >
          {task.description}
        </p>
      )}
      {task.images.length > 0 && (
        <div className="flex gap-1 mt-2.5 flex-wrap">
          {task.images.slice(0, 3).map((img, i) => (
            <img
              key={img.id}
              src={img.url}
              alt=""
              className="w-16 h-16 rounded-xl object-cover"
              style={{ border: '1px solid var(--tf-hairline)' }}
              onClick={(e) => {
                e.stopPropagation();
                onImageClick?.(task.images, i);
              }}
            />
          ))}
          {task.images.length > 3 && (
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center text-xs"
              style={{ background: 'var(--tf-soft)', color: 'var(--tf-text-muted)' }}
            >
              +{task.images.length - 3}
            </div>
          )}
        </div>
      )}
      <div className="mt-3">
        <DueDateBadge dueDate={task.dueDate} />
      </div>
      <div className="flex items-center justify-between mt-1 gap-2">
        <PriorityPill priority={task.priority} />
        {task.assignee ? (
          <TfAvatar name={task.assignee.name} avatar={task.assignee.avatar} size={24} ring={false} />
        ) : (
          <span className="text-[11px]" style={{ color: 'var(--tf-text-faint)' }}>
            Non assigné
          </span>
        )}
      </div>
    </div>
  );
}
