'use client';

import { useEffect, useRef } from 'react';
import { DUR, EASE, canHover, gsap, reduced, registerMotion } from '@/lib/motion';

/**
 * Curseur d'appoint.
 *
 * Un disque qui suit le pointeur avec du retard, et qui s'élargit au-dessus
 * de ce qui est cliquable. Il ne remplace pas le curseur système — le masquer
 * priverait d'un repère universel quiconque a un réglage d'accessibilité
 * dessus. Il s'y ajoute.
 *
 * Rien n'est monté sur tactile ni quand le mouvement est refusé : sans
 * survol il n'y aurait rien à signaler, et le suivi serait payé pour rien.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = dot.current;
    if (!el) return;
    if (reduced() || !canHover()) return;

    registerMotion();

    const x = gsap.quickTo(el, 'x', { duration: DUR.base, ease: EASE.out });
    const y = gsap.quickTo(el, 'y', { duration: DUR.base, ease: EASE.out });

    function onMove(e: MouseEvent) {
      x(e.clientX);
      y(e.clientY);

      // `closest` plutôt qu'un test sur la cible : le pointeur est souvent
      // au-dessus du texte d'un bouton, pas du bouton lui-même.
      const overTarget = (e.target as Element | null)?.closest(
        'a, button, [role="button"], input, select, textarea',
      );

      gsap.to(el, {
        scale: overTarget ? 2.4 : 1,
        opacity: overTarget ? 0.28 : 0.5,
        duration: DUR.fast,
        ease: EASE.out,
        overwrite: 'auto',
      });
    }

    function onLeave() {
      gsap.to(el, { opacity: 0, duration: DUR.fast, overwrite: 'auto' });
    }

    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseleave', onLeave);

    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      gsap.killTweensOf(el);
    };
  }, []);

  return (
    <div
      ref={dot}
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: 14,
        height: 14,
        marginTop: -7,
        marginLeft: -7,
        borderRadius: '50%',
        background: 'var(--accent)',
        opacity: 0,
        pointerEvents: 'none',
        zIndex: 80,
        willChange: 'transform',
      }}
    />
  );
}
