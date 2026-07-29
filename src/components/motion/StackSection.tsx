'use client';

import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { EASE, gsap, mount } from '@/lib/motion';

/**
 * Cartes qui s'empilent en défilant.
 *
 * Chaque enfant se colle en haut de l'écran puis se laisse recouvrir par le
 * suivant, en reculant légèrement — l'empilement d'une colonne qui se
 * remplit. C'est le geste du produit appliqué à la page.
 *
 * L'effet repose sur `position: sticky` pour le collage et sur ScrollTrigger
 * pour la mise à l'échelle. Faire les deux en JavaScript coûterait un calcul
 * par image là où le navigateur sait déjà coller un élément.
 */
export function StackSection({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(
    () =>
      mount(host.current, () => {
        const cards = gsap.utils.toArray<HTMLElement>('[data-stack-card]', host.current);

        cards.forEach((card, i) => {
          // La dernière carte n'a rien au-dessus d'elle : la réduire ferait
          // rétrécir la pile sans que rien ne vienne la recouvrir.
          if (i === cards.length - 1) return;

          gsap.to(card, {
            scale: 1 - (cards.length - 1 - i) * 0.02,
            filter: 'brightness(0.82)',
            ease: EASE.inOut,
            scrollTrigger: {
              trigger: cards[i + 1],
              start: 'top bottom',
              end: 'top top',
              scrub: true,
            },
          });
        });
      }),
    [],
  );

  return (
    <div ref={host} className={className}>
      {children}
    </div>
  );
}

/** Une carte de la pile. Le collage est porté ici, pas par le parent. */
export function StackCard({
  children,
  index,
  className = '',
  offset = 22,
}: {
  children: ReactNode;
  /** Rang dans la pile : décale le point de collage pour laisser voir les bords. */
  index: number;
  className?: string;
  offset?: number;
}) {
  return (
    <div
      data-stack-card
      className={className}
      style={{
        position: 'sticky',
        top: `calc(12vh + ${index * offset}px)`,
        willChange: 'transform',
      }}
    >
      {children}
    </div>
  );
}
