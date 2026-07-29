'use client';

import { useRef, type CSSProperties, type ReactNode, type MouseEvent } from 'react';
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';

/* ─────────────────────────────────────────────────────────────
   SpotlightCard — cursor-following glow + optional 3D tilt.
   The glow/tilt are pure CSS vars set on mousemove (no re-render).
   ───────────────────────────────────────────────────────────── */
export function SpotlightCard({
  children,
  className = '',
  style,
  tilt = false,
  maxTilt = 7,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  tilt?: boolean;
  maxTilt?: number;
  onClick?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    el.style.setProperty('--mx', `${x}px`);
    el.style.setProperty('--my', `${y}px`);
    if (tilt && !reduce) {
      el.style.setProperty('--rx', `${((y / r.height) - 0.5) * -2 * maxTilt}deg`);
      el.style.setProperty('--ry', `${((x / r.width) - 0.5) * 2 * maxTilt}deg`);
    }
  };

  const handleLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onClick={onClick}
      className={`tf-spotlight ${tilt ? 'tf-tilt' : ''} ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MagneticButton — gently follows the cursor, springs back.
   Renders a <button>; pass through onClick/type/etc.
   ───────────────────────────────────────────────────────────── */
export function MagneticButton({
  children,
  className = '',
  style,
  onClick,
  type = 'button',
  strength = 0.35,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
  type?: 'button' | 'submit';
  strength?: number;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 250, damping: 18 });
  const sy = useSpring(y, { stiffness: 250, damping: 18 });

  const handleMove = (e: MouseEvent<HTMLButtonElement>) => {
    if (reduce) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      ref={ref}
      type={type}
      onClick={onClick}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      whileTap={{ scale: 0.96 }}
      style={{ x: sx, y: sy, ...style }}
      className={`tf-btn-anim relative overflow-hidden ${className}`}
    >
      <span className="relative z-[1] inline-flex items-center gap-2">{children}</span>
    </motion.button>
  );
}
