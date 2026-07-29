'use client';

import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { DUR, EASE, canHover, gsap, reduced, registerMotion } from '@/lib/motion';

/**
 * Inclinaison 3D suivant le curseur.
 *
 * La perspective est portée par le parent et la rotation par l'enfant : les
 * appliquer au même nœud écrase la perspective à chaque nouvelle matrice, et
 * l'inclinaison devient plate.
 *
 * L'amplitude reste faible — au-delà de six degrés, le texte de la carte
 * devient pénible à lire pendant le mouvement, et une carte de tâche est
 * faite pour être lue.
 */
export function TiltCard({
  children,
  max = 6,
  className = '',
}: {
  children: ReactNode;
  /** Rotation maximale, en degrés. */
  max?: number;
  className?: string;
}) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    if (reduced() || !canHover()) return;

    registerMotion();

    const inner = el.firstElementChild as HTMLElement | null;
    if (!inner) return;

    const rx = gsap.quickTo(inner, 'rotationX', { duration: DUR.base, ease: EASE.out });
    const ry = gsap.quickTo(inner, 'rotationY', { duration: DUR.base, ease: EASE.out });

    function onMove(e: MouseEvent) {
      const box = el!.getBoundingClientRect();
      // Normalisé sur [-1, 1] depuis le centre.
      const nx = (e.clientX - box.left) / box.width * 2 - 1;
      const ny = (e.clientY - box.top) / box.height * 2 - 1;
      // L'axe est croisé : bouger vers la droite fait pivoter autour de Y.
      ry(nx * max);
      rx(-ny * max);
    }

    function onLeave() {
      rx(0);
      ry(0);
    }

    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);

    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
      gsap.killTweensOf(inner);
    };
  }, [max]);

  return (
    <div ref={host} className={className} style={{ perspective: 900 }}>
      <div style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}>{children}</div>
    </div>
  );
}
