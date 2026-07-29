'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { useSpecular } from './useSpecular';

type Variant = 'primary' | 'glass' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const SIZE: Record<Size, { h: number; px: number; fs: number; r: string }> = {
  sm: { h: 34, px: 14, fs: 13, r: 'var(--r-sm)' },
  md: { h: 42, px: 20, fs: 14, r: 'var(--r-md)' },
  lg: { h: 52, px: 28, fs: 15, r: 'var(--r-md)' },
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  /** Occupe toute la largeur disponible. */
  block?: boolean;
};

/**
 * Bouton de verre.
 *
 * Trois choses se produisent au survol, et pas une de plus :
 *  - le reflet spéculaire suit le curseur (le verre renvoie la lumière)
 *  - une arête lumineuse balaie la surface de gauche à droite
 *  - l'élément se soulève de 1 px
 *
 * L'appui l'enfonce et resserre l'ombre. Le geste doit se sentir mécanique,
 * pas élastique : pas de rebond, pas de `scale` exagéré.
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  block = false,
  disabled,
  className = '',
  ...rest
}: Props) {
  const { ref, handlers } = useSpecular<HTMLButtonElement>();
  const s = SIZE[size];
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      disabled={isDisabled}
      className={`tf-btn tf-btn-${variant} ${block ? 'w-full' : ''} ${className}`}
      style={{
        height: s.h,
        paddingInline: s.px,
        fontSize: s.fs,
        borderRadius: s.r,
        width: block ? '100%' : undefined,
      }}
      {...handlers}
      {...rest}
    >
      <span className="g-refract" />
      <span className="g-tint" />
      <span className="g-spec" />
      <span className="tf-btn-sweep" aria-hidden="true" />
      <span className="g-rim" />

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
  size = 38,
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  /** Nom accessible : une icône seule n'en a aucun. */
  label: string;
  size?: number;
}) {
  const { ref, handlers } = useSpecular<HTMLButtonElement>();

  return (
    <button
      ref={ref}
      aria-label={label}
      title={label}
      className={`tf-btn tf-btn-glass tf-icon-btn ${className}`}
      style={{ width: size, height: size, borderRadius: 'var(--r-sm)' }}
      {...handlers}
      {...rest}
    >
      <span className="g-refract" />
      <span className="g-tint" />
      <span className="g-spec" />
      <span className="g-rim" />
      <span className="tf-btn-label">{children}</span>
    </button>
  );
}
