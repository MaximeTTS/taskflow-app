'use client';

import { useState, type CSSProperties, type ReactNode, type SVGProps } from 'react';
import { motion } from 'framer-motion';
import { useTfTheme } from './theme';

/* ─────────────────────────────────────────────────────────────
   Inline SVG icons (Lucide-ish)
   ───────────────────────────────────────────────────────────── */
export const Icon = {
  Plus: (p: SVGProps<SVGSVGElement>) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" {...p}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  Search: (p: SVGProps<SVGSVGElement>) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  ),
  Bell: (p: SVGProps<SVGSVGElement>) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </svg>
  ),
  Sun: (p: SVGProps<SVGSVGElement>) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  ),
  Moon: (p: SVGProps<SVGSVGElement>) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  ),
  Trash: (p: SVGProps<SVGSVGElement>) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="m19 6-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    </svg>
  ),
  Edit: (p: SVGProps<SVGSVGElement>) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  ),
  Close: (p: SVGProps<SVGSVGElement>) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  ),
  Logout: (p: SVGProps<SVGSVGElement>) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}>
      <path d="M15 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
      <path d="m10 17-5-5 5-5M5 12h12" />
    </svg>
  ),
  Dashboard: (p: SVGProps<SVGSVGElement>) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  ),
  Board: (p: SVGProps<SVGSVGElement>) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}>
      <rect x="3" y="4" width="6" height="16" rx="1.5" />
      <rect x="11" y="4" width="6" height="11" rx="1.5" />
      <rect x="19" y="4" width="2" height="7" rx="1" />
    </svg>
  ),
  User: (p: SVGProps<SVGSVGElement>) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}>
      <circle cx="12" cy="8" r="4" />
      <path d="M3 21c1.6-4 5-6 9-6s7.4 2 9 6" />
    </svg>
  ),
  Logo: (p: SVGProps<SVGSVGElement>) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" {...p}>
      <rect x="3" y="3" width="18" height="18" rx="6" fill="currentColor" opacity="0.16" />
      <path d="M7 9.5h7.5M7 13h10M7 16.5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="17.5" cy="9.5" r="1.5" fill="currentColor" />
    </svg>
  ),
};

/* ─────────────────────────────────────────────────────────────
   Brand mark (gradient square + TaskFlow wordmark)
   ───────────────────────────────────────────────────────────── */
export function BrandMark({ size = 36 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.32,
        background: 'var(--tf-brand)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 10px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.4)',
        flexShrink: 0,
      }}
    >
      <Icon.Logo width={size * 0.6} height={size * 0.6} />
    </div>
  );
}

export function Wordmark({ size = 16 }: { size?: number }) {
  return (
    <span style={{ fontSize: size, fontWeight: 700, letterSpacing: '-0.015em' }}>
      Task
      <span
        style={{
          backgroundImage: 'linear-gradient(135deg,#a78bfa,#6366f1)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        Flow
      </span>
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────
   Glass icon button
   ───────────────────────────────────────────────────────────── */
export function IconButton({
  children,
  onClick,
  size = 40,
  title,
  style = {},
}: {
  children: ReactNode;
  onClick?: () => void;
  size?: number;
  title?: string;
  style?: CSSProperties;
}) {
  const { isDark } = useTfTheme();
  const [hover, setHover] = useState(false);
  return (
    <motion.button
      type="button"
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      whileHover={{ scale: 1.12 }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 18 }}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: 0,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--tf-text)',
        background: hover
          ? isDark
            ? 'rgba(255,255,255,0.14)'
            : 'rgba(255,255,255,0.85)'
          : isDark
            ? 'rgba(255,255,255,0.05)'
            : 'rgba(255,255,255,0.45)',
        boxShadow: isDark ? 'inset 0 1px 0 rgba(255,255,255,0.08)' : 'inset 0 1px 0 rgba(255,255,255,0.85)',
        transition: 'background-color .18s ease',
        ...style,
      }}
    >
      {children}
    </motion.button>
  );
}

/** Sun/Moon theme toggle bound to the global theme. */
export function ThemeToggle({ size = 40 }: { size?: number }) {
  const { isDark, toggle } = useTfTheme();
  return (
    <IconButton size={size} title="Thème" onClick={toggle}>
      {isDark ? <Icon.Sun /> : <Icon.Moon />}
    </IconButton>
  );
}

/* ─────────────────────────────────────────────────────────────
   Glass card
   ───────────────────────────────────────────────────────────── */
export function GlassCard({
  children,
  style = {},
  className = '',
}: {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <div
      className={`tf-card-glass ${className}`}
      style={{ borderRadius: 'calc(24px * var(--tf-radius-scale, 1))', ...style }}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Gradient avatar (initials, deterministic hue), with optional presence
   ───────────────────────────────────────────────────────────── */
function hueFromString(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
}

export function TfAvatar({
  name,
  avatar,
  size = 32,
  ring = true,
  online = false,
}: {
  name: string;
  avatar?: string | null;
  size?: number;
  ring?: boolean;
  online?: boolean;
}) {
  const ringShadow = ring
    ? '0 0 0 2px rgba(255,255,255,0.7), 0 2px 6px rgba(0,0,0,0.18)'
    : '0 2px 6px rgba(0,0,0,0.18)';

  const inner = avatar ? (
    <img
      src={avatar}
      alt={name}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        objectFit: 'cover',
        boxShadow: ringShadow,
      }}
    />
  ) : (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `linear-gradient(135deg, hsl(${hueFromString(name)}, 75%, 62%) 0%, hsl(${(hueFromString(name) + 30) % 360}, 70%, 48%) 100%)`,
        color: '#fff',
        fontWeight: 600,
        fontSize: size * 0.42,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: ringShadow,
      }}
    >
      {name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)}
    </div>
  );

  return (
    <div style={{ position: 'relative', display: 'inline-block', width: size, height: size }} title={name}>
      {inner}
      {online && (
        <span
          className="tf-presence"
          style={{
            position: 'absolute',
            bottom: -1,
            right: -1,
            width: Math.max(8, size * 0.28),
            height: Math.max(8, size * 0.28),
            borderRadius: '50%',
            background: '#4ade80',
            border: '2px solid rgba(255,255,255,0.85)',
          }}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Priority pill — keyed by app priority codes
   ───────────────────────────────────────────────────────────── */
export const TF_PRIORITIES: Record<string, { label: string; bg: string; glow: string }> = {
  URGENT: { label: 'Urgent', bg: '#ef4444', glow: 'rgba(239,68,68,0.5)' },
  HIGH: { label: 'Haute', bg: '#f59e0b', glow: 'rgba(245,158,11,0.5)' },
  MEDIUM: { label: 'Moyenne', bg: '#3b82f6', glow: 'rgba(59,130,246,0.5)' },
  LOW: { label: 'Basse', bg: '#94a3b8', glow: 'rgba(148,163,184,0.5)' },
};

export function PriorityPill({ priority }: { priority: string }) {
  const p = TF_PRIORITIES[priority];
  if (!p) return null;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 9px 3px 8px',
        borderRadius: 999,
        fontSize: 11.5,
        fontWeight: 600,
        color: '#fff',
        background: p.bg,
        boxShadow: `0 1px 0 rgba(255,255,255,0.25) inset, 0 4px 10px -4px ${p.glow}`,
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.85)' }} />
      {p.label}
    </span>
  );
}
