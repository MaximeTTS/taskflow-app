'use client';

import { useCallback, useRef } from 'react';
import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from 'react';

type Variant = 'primary' | 'neutral' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const SIZE: Record<Size, { h: number; px: number; fs: number }> = {
  sm: { h: 32, px: 13, fs: 12.5 },
  md: { h: 40, px: 18, fs: 14 },
  lg: { h: 48, px: 26, fs: 15 },
};

/**
 * Pose un halo qui part du point exact du clic, puis le retire.
 *
 * Le nœud est créé à la demande plutôt que rendu en permanence : sans
 * interaction, il n'existe pas, donc il ne coûte rien. Il se supprime à la
 * fin de son animation, ce qui évite d'empiler des éléments morts sur un
 * bouton cliqué vingt fois.
 */
function useRipple<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  const spawn = useCallback((e: MouseEvent<T>) => {
    const host = ref.current;
    if (!host) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const box = host.getBoundingClientRect();
    const node = document.createElement('span');
    node.className = 'tf-ripple';
    node.style.setProperty('--rx', `${e.clientX - box.left}px`);
    node.style.setProperty('--ry', `${e.clientY - box.top}px`);
    node.addEventListener('animationend', () => node.remove(), { once: true });
    host.appendChild(node);
  }, []);

  return { ref, spawn };
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  /** Occupe toute la largeur disponible. */
  block?: boolean;
};

/**
 * Bouton.
 *
 * Deux retours au clic et pas un de plus : un enfoncement d'un demi-pixel,
 * immédiat, et un halo qui part du doigt. Le geste doit se sentir
 * mécanique — pas de rebond, pas de `scale` exagéré.
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  block = false,
  disabled,
  className = '',
  onClick,
  ...rest
}: Props) {
  const { ref, spawn } = useRipple<HTMLButtonElement>();
  const s = SIZE[size];
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      disabled={isDisabled}
      className={`tf-btn tf-btn-${variant} ${className}`}
      style={{
        height: s.h,
        paddingInline: s.px,
        fontSize: s.fs,
        width: block ? '100%' : undefined,
      }}
      onClick={(e) => {
        spawn(e);
        onClick?.(e);
      }}
      {...rest}
    >
      <span className="tf-btn-label">
        {loading && <span className="tf-spinner" aria-hidden="true" />}
        {children}
      </span>
    </button>
  );
}

/** Bouton carré ne portant qu'une icône. */
export function IconButton({
  children,
  label,
  size = 36,
  className = '',
  onClick,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  /** Nom accessible : une icône seule n'en a aucun. */
  label: string;
  size?: number;
}) {
  const { ref, spawn } = useRipple<HTMLButtonElement>();

  return (
    <button
      ref={ref}
      aria-label={label}
      title={label}
      className={`tf-btn tf-btn-ghost tf-icon-btn ${className}`}
      style={{ width: size, height: size }}
      onClick={(e) => {
        spawn(e);
        onClick?.(e);
      }}
      {...rest}
    >
      <span className="tf-btn-label">{children}</span>
    </button>
  );
}
