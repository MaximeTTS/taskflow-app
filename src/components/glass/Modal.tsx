'use client';

import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { IconButton } from './Button';
import { Icon } from './Icon';

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Description courte sous le titre. */
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
};

/**
 * Modale de verre.
 *
 * Le voile derrière elle est flouté : la modale devient une couche de verre
 * supplémentaire au lieu d'un rectangle posé sur un écran assombri.
 *
 * Trois comportements que les modales oublient souvent : Échap referme, le
 * focus part sur le panneau à l'ouverture et revient à son point de départ
 * à la fermeture, et le défilement de la page est bloqué.
 */
export function Modal({ open, onClose, title, subtitle, children, footer, width = 560 }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    previousFocus.current = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      // Rendre le focus évite que la navigation clavier reparte du haut
      // de la page après chaque fermeture.
      previousFocus.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="tf-modal-root" role="presentation">
      <div className="tf-veil" onClick={onClose} />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="tf-modal g g-panel g-lift-lg tf-in"
        style={{ maxWidth: width, borderRadius: 'var(--r-xl)' }}
      >
        <span className="g-refract" />
        <span className="g-tint" />
        <span className="g-rim" />

        <div className="g-body flex max-h-[88vh] flex-col">
          <header className="flex items-start justify-between gap-4 px-7 pt-6 pb-4">
            <div>
              <h2 className="tf-display text-[22px]">{title}</h2>
              {subtitle && (
                <p className="mt-1 text-[13px]" style={{ color: 'var(--color-haze)' }}>
                  {subtitle}
                </p>
              )}
            </div>
            <IconButton label="Fermer" onClick={onClose}>
              <Icon.Close size={16} />
            </IconButton>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-7 pb-6">{children}</div>

          {footer && (
            <footer
              className="flex items-center justify-end gap-2.5 px-7 py-4"
              style={{ borderTop: '1px solid var(--rim)' }}
            >
              {footer}
            </footer>
          )}
        </div>
      </div>
    </div>
  );
}
