'use client';

import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { gsap, mount } from '@/lib/motion';

/**
 * Bandeau défilant en boucle.
 *
 * Le contenu est rendu deux fois et la piste translate de exactement -50 % :
 * au moment où la première copie sort, la seconde occupe sa place, donc la
 * boucle est invisible. Animer une position absolue obligerait à mesurer la
 * largeur et à la recalculer à chaque redimensionnement.
 *
 * La seconde copie est masquée aux technologies d'assistance : elle ne dit
 * rien de plus, et la faire lire deux fois serait du bruit.
 */
export function Marquee({
  children,
  speed = 28,
  reverse = false,
  className = '',
}: {
  children: ReactNode;
  /** Durée d'un cycle complet, en secondes. Plus haut = plus lent. */
  speed?: number;
  reverse?: boolean;
  className?: string;
}) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(
    () =>
      mount(host.current, () => {
        const track = host.current!.firstElementChild;
        if (!track) return;

        gsap.to(track, {
          xPercent: reverse ? 0 : -50,
          duration: speed,
          ease: 'none',
          repeat: -1,
          // Départ décalé quand on inverse : sans ça la piste commencerait
          // hors champ et le bandeau paraîtrait vide une demi-boucle.
          ...(reverse ? { startAt: { xPercent: -50 } } : {}),
        });
      }),
    [speed, reverse],
  );

  return (
    <div ref={host} className={className} style={{ overflow: 'hidden' }}>
      <div style={{ display: 'flex', width: 'max-content', willChange: 'transform' }}>
        <div style={{ display: 'flex', flexShrink: 0 }}>{children}</div>
        <div style={{ display: 'flex', flexShrink: 0 }} aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
