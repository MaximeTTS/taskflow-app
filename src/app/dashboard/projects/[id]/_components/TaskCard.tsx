import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { DueDateBadge } from './DueDateBadge';
import { PRIORITY_BADGE, PRIORITY_LABEL, PRIORITY_BORDER } from '../_constants';
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
      className={`w-full bg-[#16161f] border border-[#2a2a3a] border-l-2 ${PRIORITY_BORDER[task.priority] ?? 'border-l-[#2a2a3a]'} rounded-lg p-3 ${
        isDragging
          ? 'shadow-xl shadow-indigo-500/10 border-indigo-500/30 ring-1 ring-indigo-500/20'
          : 'hover:border-[#3a3a50] cursor-pointer'
      } transition-colors min-w-0 overflow-hidden box-border`}
    >
      <p className="text-base lg:text-lg font-semibold text-[#ffffff] mb-2 leading-snug break-words group-hover:text-indigo-300 transition-colors">
        {task.title}
      </p>
      {task.description && (
        <p className="text-sm lg:text-md text-[#ffffff] mb-2 line-clamp-2 leading-relaxed break-words">
          {task.description}
        </p>
      )}
      {task.images.length > 0 && (
        <div className="flex gap-1 mb-2 flex-wrap">
          {task.images.slice(0, 3).map((img, i) => (
            <img
              key={img.id}
              src={img.url}
              alt=""
              className="w-16 h-16 lg:w-20 lg:h-20 rounded object-cover border border-[#2a2a3a]"
              onClick={(e) => {
                e.stopPropagation();
                onImageClick?.(task.images, i);
              }}
            />
          ))}
          {task.images.length > 3 && (
            <div className="w-16 h-16 lg:w-20 lg:h-20 rounded bg-[#2a2a3a] flex items-center justify-center text-xs text-[#8888aa]">
              +{task.images.length - 3}
            </div>
          )}
        </div>
      )}
      <DueDateBadge dueDate={task.dueDate} />
      <div className="flex items-center justify-between mt-1">
        <Badge variant={PRIORITY_BADGE[task.priority] ?? 'default'}>
          {PRIORITY_LABEL[task.priority] ?? task.priority}
        </Badge>
        {task.assignee ? (
          <Avatar name={task.assignee.name} avatar={task.assignee.avatar} size="sm" />
        ) : (
          <span className="text-xs lg:text-[14px] text-[#80808f]">Non assigné</span>
        )}
      </div>
    </div>
  );
}
