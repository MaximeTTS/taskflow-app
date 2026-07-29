'use client';

import type { ElementType, ReactNode } from 'react';
import { useSpecular } from './useSpecular';

type Radius = 'sm' | 'md' | 'lg' | 'xl' | 'full';
type Lift = 'none' | 'md' | 'lg';

const RADIUS: Record<Radius, string> = {
  sm: 'var(--r-sm)',
  md: 'var(--r-md)',
  lg: 'var(--r-lg)',
  xl: 'var(--r-xl)',
  full: '999px',
};

type Props = {
  children: ReactNode;
  /** Élément rendu. `section`, `article`, `aside`… selon le sens. */
  as?: ElementType;
  radius?: Radius;
  lift?: Lift;
  /** Teinte plus soutenue, pour les surfaces au premier plan. */
  raised?: boolean;
  /** Flou renforcé, pour les grands panneaux qui doivent isoler leur contenu. */
  panel?: boolean;
  /** Distorsion SVG. Coûteuse : à réserver aux surfaces peu nombreuses. */
  distort?: boolean;
  /** Reflet suivant le curseur. */
  specular?: boolean;
  className?: string;
};

/**
 * La brique de verre.
 *
 * Empile les quatre couches décrites dans globals.css. Tout le verre de
 * l'application passe par ici : c'est ce qui garantit que deux panneaux
 * distants se ressemblent.
 */
export function Surface({
  children,
  as: Tag = 'div',
  radius = 'lg',
  lift = 'md',
  raised = false,
  panel = false,
  distort = false,
  specular = false,
  className = '',
}: Props) {
  const { ref, handlers } = useSpecular<HTMLDivElement>();

  const classes = [
    'g',
    raised && 'g-raised',
    panel && 'g-panel',
    distort && 'g-distort',
    lift === 'md' && 'g-lift',
    lift === 'lg' && 'g-lift-lg',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Tag
      ref={specular ? ref : undefined}
      className={classes}
      style={{ borderRadius: RADIUS[radius] }}
      {...(specular ? handlers : {})}
    >
      <span className="g-refract" />
      <span className="g-tint" />
      {specular && <span className="g-spec" />}
      <span className="g-rim" />
      <div className="g-body">{children}</div>
    </Tag>
  );
}
