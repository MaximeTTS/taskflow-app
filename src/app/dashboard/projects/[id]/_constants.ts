export const COLUMNS = [
  {
    key: 'TODO',
    label: 'À faire',
    shortLabel: 'À faire',
    color: 'bg-[#2a2a3a]',
    border: 'border-[#2a2a3a]',
  },
  {
    key: 'IN_PROGRESS',
    label: 'En cours',
    shortLabel: 'En cours',
    color: 'bg-indigo-500',
    border: 'border-[#2a2a3a]',
  },
  {
    key: 'IN_REVIEW',
    label: 'En révision',
    shortLabel: 'Révision',
    color: 'bg-amber-500',
    border: 'border-[#2a2a3a]',
  },
  {
    key: 'DONE',
    label: 'Terminé',
    shortLabel: 'Terminé',
    color: 'bg-green-500',
    border: 'border-[#2a2a3a]',
  },
];
export const PRIORITY_BADGE: Record<string, 'danger' | 'warning' | 'info' | 'default'> = {
  URGENT: 'danger',
  HIGH: 'warning',
  MEDIUM: 'info',
  LOW: 'default',
};

export const PRIORITY_LABEL: Record<string, string> = {
  URGENT: 'Urgent',
  HIGH: 'Haute',
  MEDIUM: 'Moyenne',
  LOW: 'Basse',
};

export const PRIORITY_BORDER: Record<string, string> = {
  URGENT: 'border-l-red-500',
  HIGH: 'border-l-amber-500',
  MEDIUM: 'border-l-blue-500',
  LOW: 'border-l-[#2a2a3a]',
};

export const SELECT_CLASS =
  'w-full bg-[#16161f] border border-[#2a2a3a] rounded-lg px-4 py-3 text-base text-[#f0f0ff] outline-none hover:border-indigo-500 focus:border-indigo-500 appearance-none pr-10 transition-colors';

export const fadeInUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };
export const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
export const fadeIn = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
export const columnVariants = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } };
