type Variant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';

type BadgeProps = {
  variant?: Variant;
  children: React.ReactNode;
};

const styles: Record<Variant, { bg: string; fg: string; border: string }> = {
  default: { bg: 'rgba(148,163,184,0.16)', fg: '#94a3b8', border: 'rgba(148,163,184,0.3)' },
  success: { bg: 'rgba(34,197,94,0.16)', fg: '#22c55e', border: 'rgba(34,197,94,0.3)' },
  warning: { bg: 'rgba(245,158,11,0.16)', fg: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
  danger: { bg: 'rgba(239,68,68,0.16)', fg: '#ef4444', border: 'rgba(239,68,68,0.3)' },
  info: { bg: 'rgba(59,130,246,0.16)', fg: '#3b82f6', border: 'rgba(59,130,246,0.3)' },
  purple: { bg: 'rgba(167,139,250,0.18)', fg: '#a78bfa', border: 'rgba(167,139,250,0.3)' },
};

export function Badge({ variant = 'default', children }: BadgeProps) {
  const s = styles[variant];
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold"
      style={{ background: s.bg, color: s.fg, border: `1px solid ${s.border}` }}
    >
      {children}
    </span>
  );
}
