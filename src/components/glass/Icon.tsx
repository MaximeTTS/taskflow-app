import type { SVGProps } from 'react';

/**
 * Jeu d'icônes.
 *
 * Tracées à la main plutôt qu'importées d'une bibliothèque : un trait
 * uniforme de 1,6 px et des extrémités arrondies s'accordent au verre, là
 * où un jeu générique apporterait des épaisseurs disparates. Aucune
 * dépendance, aucun poids ajouté au bundle.
 */

type Props = SVGProps<SVGSVGElement> & { size?: number };

function Base({ size = 18, children, ...rest }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const Icon = {
  Board: (p: Props) => (
    <Base {...p}>
      <rect x="3" y="3" width="7" height="18" rx="1.6" />
      <rect x="14" y="3" width="7" height="11" rx="1.6" />
    </Base>
  ),
  User: (p: Props) => (
    <Base {...p}>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </Base>
  ),
  Users: (p: Props) => (
    <Base {...p}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 19a6 6 0 0 1 12 0" />
      <path d="M16 5.6a3.2 3.2 0 0 1 0 5.8M17.5 19a6 6 0 0 0-2-4.5" />
    </Base>
  ),
  Logout: (p: Props) => (
    <Base {...p}>
      <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
      <path d="M10 16l-4-4 4-4M6 12h11" />
    </Base>
  ),
  Plus: (p: Props) => (
    <Base {...p}>
      <path d="M12 5v14M5 12h14" />
    </Base>
  ),
  Close: (p: Props) => (
    <Base {...p}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Base>
  ),
  Check: (p: Props) => (
    <Base {...p}>
      <path d="M4 12.5l5 5L20 6.5" />
    </Base>
  ),
  Calendar: (p: Props) => (
    <Base {...p}>
      <rect x="3" y="5" width="18" height="16" rx="2.2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </Base>
  ),
  Clock: (p: Props) => (
    <Base {...p}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </Base>
  ),
  Trash: (p: Props) => (
    <Base {...p}>
      <path d="M4 7h16M9 7V5.2A1.2 1.2 0 0 1 10.2 4h3.6A1.2 1.2 0 0 1 15 5.2V7" />
      <path d="M6 7l1 12.2A1.8 1.8 0 0 0 8.8 21h6.4A1.8 1.8 0 0 0 17 19.2L18 7" />
    </Base>
  ),
  Image: (p: Props) => (
    <Base {...p}>
      <rect x="3" y="4" width="18" height="16" rx="2.2" />
      <circle cx="8.8" cy="9.6" r="1.6" />
      <path d="M3.5 17l4.8-4.4a2 2 0 0 1 2.7 0l6.4 5.8" />
    </Base>
  ),
  Chevron: (p: Props) => (
    <Base {...p}>
      <path d="M6 9.5l6 6 6-6" />
    </Base>
  ),
  Arrow: (p: Props) => (
    <Base {...p}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Base>
  ),
  Sparkle: (p: Props) => (
    <Base {...p}>
      <path d="M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9L12 17.5l-1.9-5.1L5 10.5l5.1-1.9z" />
    </Base>
  ),
  Flag: (p: Props) => (
    <Base {...p}>
      <path d="M5 21V4M5 4.5h11l-2 3.5 2 3.5H5" />
    </Base>
  ),
  Search: (p: Props) => (
    <Base {...p}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" />
    </Base>
  ),
  Shield: (p: Props) => (
    <Base {...p}>
      <path d="M12 3l7 3v6c0 4.2-2.9 7.6-7 9-4.1-1.4-7-4.8-7-9V6z" />
      <path d="M9 12l2 2 4-4" />
    </Base>
  ),
  Layers: (p: Props) => (
    <Base {...p}>
      <path d="M12 3l9 5-9 5-9-5z" />
      <path d="M3 13l9 5 9-5" />
    </Base>
  ),
};
