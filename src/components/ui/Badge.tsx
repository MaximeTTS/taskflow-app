type Variant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';

type BadgeProps = {
  variant?: Variant;
  children: React.ReactNode;
};

const styles: Record<Variant, string> = {
  default: 'bg-[#2a2a3a] text-[#8888aa]',
  success: 'bg-green-500/10 text-green-400',
  warning: 'bg-amber-500/10 text-amber-400',
  danger: 'bg-red-500/10 text-red-400',
  info: 'bg-blue-500/10 text-blue-400',
  purple: 'bg-indigo-500/10 text-indigo-400',
};

export function Badge({ variant = 'default', children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[variant]}`}
    >
      {children}
    </span>
  );
}
