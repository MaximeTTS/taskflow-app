'use client';

import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { EASE, gsap, mount } from '@/lib/motion';

/**
 * Cartes qui s'empilent en défilant.
 *
 * Chaque enfant se colle en haut de l'écran puis se laisse recouvrir par le
 * suivant en reculant légèrement — l'empilement d'une colonne qui se
 * remplit. C'est le geste du produit appliqué à la page.
 *
 * Le collage est fait par `position: sticky` et non en JavaScript : le
 * navigateur sait déjà coller un élément, et ScrollTrigger ne sert qu'à la
 * mise à l'échelle.
 *
 * **L'empilement est désactivé sous 768 px.** Une carte plus haute que la
 * fenêtre ne peut pas coller : elle défile hors champ et l'effet se casse au
 * lieu de se dégrader. Sur mobile les cartes se suivent simplement.
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
        if (!window.matchMedia('(min-width: 768px)').matches) return;

        const cards = gsap.utils.toArray<HTMLElement>('[data-stack-card]', host.current);

        cards.forEach((card, i) => {
          // La dernière carte n'a rien au-dessus d'elle : la réduire ferait
          // rétrécir la pile sans que rien ne vienne la recouvrir.
          if (i === cards.length - 1) return;

          gsap.to(card, {
            scale: 1 - (cards.length - 1 - i) * 0.018,
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

/**
 * Une carte de la pile.
 *
 * Le collage est porté ici et non par le parent, et il ne s'active qu'à
 * partir de `md` — en dessous, `position: static` laisse les cartes se
 * suivre normalement.
 */
export function StackCard({
  children,
  index,
  className = '',
}: {
  children: ReactNode;
  /** Rang dans la pile : décale le point de collage pour laisser voir les bords. */
  index: number;
  className?: string;
}) {
  return (
    <div
      data-stack-card
      className={`tf-stack-card ${className}`}
      style={{ '--stack-i': index } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
