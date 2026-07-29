'use client';

import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { gsap, mount } from '@/lib/motion';

/**
 * Décalage au défilement.
 *
 * `scrub: true` lie la position de l'élément à celle du scroll au lieu de
 * jouer une durée : le mouvement suit le doigt, donc il se lit comme de la
 * profondeur et non comme une animation qui se déclenche.
 *
 * L'amplitude est en pourcentage de la hauteur de l'élément, pas en pixels :
 * la même valeur donne le même effet sur mobile et sur grand écran.
 */
export function Parallax({
  children,
  amount = 12,
  className = '',
}: {
  children: ReactNode;
  /** Décalage total, en % de la hauteur. Négatif = remonte. */
  amount?: number;
  className?: string;
}) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(
    () =>
      mount(host.current, () => {
        gsap.fromTo(
          host.current!,
          { yPercent: -amount / 2 },
          {
            yPercent: amount / 2,
            ease: 'none',
            scrollTrigger: {
              trigger: host.current,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          },
        );
      }),
    [amount],
  );

  return (
    <div ref={host} className={className} style={{ willChange: 'transform' }}>
      {children}
    </div>
  );
}
