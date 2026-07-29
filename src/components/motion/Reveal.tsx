'use client';

import { useEffect, useRef } from 'react';
import type { ElementType, ReactNode } from 'react';
import { DUR, EASE, gsap, mount } from '@/lib/motion';

/**
 * Révélation par masque — **pour du texte uniquement**.
 *
 * Le contenu monte depuis sous un cache plutôt que d'apparaître en fondu :
 * un fondu dit « ceci se charge », un masque dit « ceci se dévoile ».
 *
 * Le cache impose `overflow: hidden`, donc tout ce qui dépasse au survol est
 * coupé. Ne jamais y enfermer une carte qui se soulève ou qui porte une
 * ombre — utiliser `Rise`. Une première version enveloppait les cartes du
 * tableau ici : leur survol fonctionnait et ne se voyait pas.
 *
 * La compensation verticale évite que le cache coupe les jambages (g, p, y).
 */
export function Reveal({
  children,
  as: Tag = 'div',
  delay = 0,
  className = '',
  start = 'top 88%',
}: {
  children: ReactNode;
  as?: ElementType;
  delay?: number;
  className?: string;
  /** Position de déclenchement, syntaxe ScrollTrigger. */
  start?: string;
}) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(
    () =>
      mount(host.current, () => {
        const inner = host.current!.firstElementChild;
        if (!inner) return;

        gsap.fromTo(
          inner,
          { yPercent: 105 },
          {
            yPercent: 0,
            duration: DUR.slow,
            ease: EASE.veil,
            delay,
            scrollTrigger: { trigger: host.current, start, once: true },
          },
        );
      }),
    [delay, start],
  );

  return (
    <span
      ref={host}
      className={className}
      style={{
        display: 'block',
        overflow: 'hidden',
        paddingBottom: '0.14em',
        marginBottom: '-0.14em',
      }}
    >
      <Tag style={{ display: 'block', willChange: 'transform' }}>{children}</Tag>
    </span>
  );
}

/**
 * Montée simple, sans masque — pour les blocs.
 *
 * Aucun `overflow` n'est posé, donc les ombres, les survols qui soulèvent et
 * les rotations 3D des enfants ne sont pas rognés. C'est la révélation à
 * utiliser partout sauf sur du texte.
 */
export function Rise({
  children,
  delay = 0,
  y = 18,
  className = '',
  start = 'top 90%',
}: {
  children: ReactNode;
  delay?: number;
  /** Distance de départ, en pixels. */
  y?: number;
  className?: string;
  start?: string;
}) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(
    () =>
      mount(
        host.current,
        () => {
          gsap.fromTo(
            host.current!,
            { opacity: 0, y },
            {
              opacity: 1,
              y: 0,
              duration: DUR.base,
              ease: EASE.board,
              delay,
              scrollTrigger: { trigger: host.current, start, once: true },
              // Le style inline posé par GSAP est retiré à la fin : laisser
              // un `transform` résiduel créerait un contexte d'empilement qui
              // interfère avec le `position: sticky` des enfants.
              clearProps: 'transform,opacity',
            },
          );
        },
        () => {},
      ),
    [delay, y, start],
  );

  return (
    <div ref={host} className={className}>
      {children}
    </div>
  );
}
