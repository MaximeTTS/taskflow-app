'use client';

import { useEffect, useRef } from 'react';
import type { ElementType, ReactNode } from 'react';
import { DUR, EASE, SplitText, gsap, mount } from '@/lib/motion';

/**
 * Titre révélé caractère par caractère, ligne par ligne.
 *
 * Le texte est rendu normalement côté serveur et n'est découpé qu'après
 * hydratation : un titre livré en fragments serait illisible pour un moteur
 * d'indexation comme pour un lecteur d'écran, et resterait invisible si le
 * JavaScript ne partait jamais.
 *
 * Le découpage est défait à la fin. Sans ça, la structure en `span` survit à
 * l'animation et casse la sélection de texte, le retour à la ligne et la
 * recherche dans la page.
 */
export function SplitHeading({
  children,
  as: Tag = 'h1',
  className = '',
  delay = 0,
  /** Déclencher au scroll plutôt qu'au montage. */
  onScroll = false,
}: {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  delay?: number;
  onScroll?: boolean;
}) {
  const host = useRef<HTMLElement>(null);

  useEffect(
    () =>
      mount(host.current, () => {
        const split = new SplitText(host.current!, {
          type: 'lines,chars',
          // Le masque par ligne : chaque ligne devient sa propre fenêtre, donc
          // les caractères montent de sous leur ligne et non du bas du bloc.
          linesClass: 'tf-line',
        });

        gsap.from(split.chars, {
          yPercent: 120,
          opacity: 0,
          duration: DUR.slow,
          ease: EASE.veil,
          stagger: { each: 0.018, from: 'start' },
          delay,
          ...(onScroll
            ? { scrollTrigger: { trigger: host.current, start: 'top 85%', once: true } }
            : {}),
          onComplete: () => split.revert(),
        });
      }),
    [delay, onScroll],
  );

  return (
    <Tag ref={host} className={className}>
      {children}
    </Tag>
  );
}
