export function DueDateBadge({ dueDate }: { dueDate: string | null }) {
  if (!dueDate) return null;

  let due: Date;
  const num = Number(dueDate);
  if (!isNaN(num) && num > 1000000000000) {
    due = new Date(num);
  } else {
    const str = dueDate.includes('T') ? (dueDate.split('T')[0] ?? dueDate) : dueDate;
    const [y, m, d] = str.split('-').map(Number);
    if (!y || !m || !d) return null;
    due = new Date(y, m - 1, d);
  }
  if (isNaN(due.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const isLate = diff < 0;
  const isUrgent = diff <= 1 && diff >= 0;

  return (
    <div
      className={`flex items-center gap-1 text-[14px] mb-2 ${
        isLate ? 'text-red-400' : isUrgent ? 'text-amber-400' : 'text-[#55556a]'
      }`}
    >
      <svg
        className="w-3 h-3 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
      <span>
        {due.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
        {' · '}
        {isLate
          ? `${Math.abs(diff)}j de retard`
          : diff === 0
            ? "Aujourd'hui"
            : `${diff}j restant${diff > 1 ? 's' : ''}`}
      </span>
    </div>
  );
}
