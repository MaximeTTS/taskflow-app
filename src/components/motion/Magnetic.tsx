'use client';

import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { DUR, EASE, canHover, gsap, reduced, registerMotion } from '@/lib/motion';

/**
 * Attire son contenu vers le curseur quand il s'en approche.
 *
 * `quickTo` plutôt qu'un `gsap.to` par mouvement de souris : il réutilise le
 * même tween au lieu d'en créer un nouveau à chaque événement, ce qui compte
 * à soixante `mousemove` par seconde.
 *
 * L'écoute est posée sur une zone plus large que l'élément lui-même, sinon
 * l'attraction ne commencerait qu'une fois le curseur déjà dessus — donc
 * trop tard pour qu'on la remarque.
 */
export function Magnetic({
  children,
  strength = 0.4,
  radius = 22,
  className = '',
}: {
  children: ReactNode;
  /** Part du déplacement du curseur reportée sur l'élément. */
  strength?: number;
  /** Amplitude maximale, en pixels. */
  radius?: number;
  className?: string;
}) {
  const host = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    if (reduced() || !canHover()) return;

    registerMotion();

    const inner = el.firstElementChild as HTMLElement | null;
    if (!inner) return;

    const moveX = gsap.quickTo(inner, 'x', { duration: DUR.base, ease: EASE.out });
    const moveY = gsap.quickTo(inner, 'y', { duration: DUR.base, ease: EASE.out });

    function onMove(e: MouseEvent) {
      const box = el!.getBoundingClientRect();
      const dx = e.clientX - (box.left + box.width / 2);
      const dy = e.clientY - (box.top + box.height / 2);
      moveX(gsap.utils.clamp(-radius, radius, dx * strength));
      moveY(gsap.utils.clamp(-radius, radius, dy * strength));
    }

    function onLeave() {
      moveX(0);
      moveY(0);
    }

    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);

    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
      gsap.killTweensOf(inner);
    };
  }, [strength, radius]);

  return (
    // Le rembourrage crée la zone d'approche, et il est compensé par une
    // marge négative pour ne pas décaler la mise en page autour.
    <span
      ref={host}
      className={className}
      style={{ display: 'inline-flex', padding: 18, margin: -18 }}
    >
      <span style={{ display: 'inline-flex', willChange: 'transform' }}>{children}</span>
    </span>
  );
}
