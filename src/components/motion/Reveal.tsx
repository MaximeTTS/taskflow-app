'use client';

import { useEffect, useRef } from 'react';
import type { ElementType, ReactNode } from 'react';
import { DUR, EASE, gsap, mount } from '@/lib/motion';

/**
 * Révélation par masque, déclenchée à l'entrée dans le viewport.
 *
 * Le contenu monte depuis sous un cache plutôt que d'apparaître en fondu :
 * un fondu dit « ceci se charge », un masque dit « ceci se dévoile ». Le
 * second est le geste juste quand l'élément était déjà là, en dessous.
 *
 * Le cache porte une compensation verticale : sans elle il coupe les
 * jambages des lettres descendantes (g, p, y) au repos.
 */
export function Reveal({
  children,
  as: Tag = 'div',
  delay = 0,
  y = '105%',
  className = '',
  start = 'top 88%',
}: {
  children: ReactNode;
  as?: ElementType;
  delay?: number;
  /** Distance de départ, sous le cache. */
  y?: string;
  className?: string;
  /** Position de déclenchement, syntaxe ScrollTrigger. */
  start?: string;
}) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(
    () =>
      mount(
        host.current,
        () => {
          const inner = host.current!.firstElementChild;
          if (!inner) return;

          gsap.set(inner, { yPercent: parseFloat(y) });
          gsap.to(inner, {
            yPercent: 0,
            duration: DUR.slow,
            ease: EASE.veil,
            delay,
            scrollTrigger: { trigger: host.current, start, once: true },
          });
        },
        // État final si le mouvement est refusé : rien à faire, le contenu
        // est déjà à sa place dans le flux.
        () => {},
      ),
    [delay, y, start],
  );

  return (
    <div
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
    </div>
  );
}
