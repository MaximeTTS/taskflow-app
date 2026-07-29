import type { ElementType, ReactNode } from 'react';

type Radius = 'sm' | 'md' | 'lg' | 'xl' | 'full';
type Lift = 'none' | 'sm' | 'md' | 'lg';

const RADIUS: Record<Radius, string> = {
  sm: 'var(--r-1)',
  md: 'var(--r-1)',
  lg: 'var(--r-2)',
  xl: 'var(--r-3)',
  full: 'var(--r-full)',
};

const LIFT: Record<Lift, string> = {
  none: '',
  sm: 'tf-lift-1',
  md: 'tf-lift-2',
  lg: 'tf-lift-3',
};

type Props = {
  children: ReactNode;
  /** Élément rendu. `section`, `article`, `aside`… selon le sens. */
  as?: ElementType;
  radius?: Radius;
  lift?: Lift;
  /**
   * Surface translucide. À réserver aux couches qui flottent au-dessus du
   * contenu — barre de navigation collante, panneau. Ailleurs une surface
   * opaque est plus lisible et moins chère à composer.
   */
  glass?: boolean;
  className?: string;
};

/**
 * La brique de surface.
 *
 * Toute zone de contenu passe par ici : c'est ce qui garantit que deux
 * panneaux distants se ressemblent. Elle ne connaît que des rôles —
 * `--surface-1`, `--border`, `--shadow-*` — donc elle suit le thème sans
 * rien savoir de lui.
 */
export function Surface({
  children,
  as: Tag = 'div',
  radius = 'lg',
  lift = 'sm',
  glass = false,
  className = '',
}: Props) {
  const classes = [glass ? 'tf-glass' : 'tf-surface', LIFT[lift], className]
    .filter(Boolean)
    .join(' ');

  return (
    <Tag className={classes} style={{ borderRadius: RADIUS[radius] }}>
      {children}
    </Tag>
  );
}
