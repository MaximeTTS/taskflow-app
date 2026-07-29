'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { DUR, EASE, gsap, reduced, registerMotion } from '@/lib/motion';

const BANDS = 5;

/**
 * Transition de page en bandes verticales.
 *
 * Les bandes sont le motif du produit : ce sont des colonnes. Un fondu aurait
 * fait le même travail sans rien dire du tableau.
 *
 * Le voile se retire à l'arrivée plutôt que de se poser au départ. Poser un
 * voile avant la navigation obligerait à retenir la transition le temps du
 * chargement, donc à ajouter une latence artificielle à chaque clic — et sur
 * une navigation instantanée, à faire clignoter l'écran pour rien.
 */
export function PageVeil() {
  const pathname = usePathname();
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    if (reduced()) {
      gsap.set(el.children, { yPercent: -100 });
      return;
    }

    registerMotion();

    const tween = gsap.to(el.children, {
      yPercent: -100,
      duration: DUR.slow,
      ease: EASE.veil,
      stagger: { each: 0.05, from: 'start' },
      // Les bandes ne captent jamais le clic, mais on coupe aussi le nœud
      // parent une fois sorties : un élément plein écran en `pointer-events:
      // none` reste dans l'arbre d'accessibilité si on l'oublie.
      onComplete: () => gsap.set(el, { display: 'none' }),
    });

    return () => {
      tween.kill();
    };
  }, [pathname]);

  return (
    <div
      ref={host}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 90,
        display: 'flex',
        pointerEvents: 'none',
      }}
    >
      {Array.from({ length: BANDS }, (_, i) => (
        <span
          key={i}
          style={{
            flex: 1,
            background: 'var(--bg-canvas)',
            willChange: 'transform',
          }}
        />
      ))}
    </div>
  );
}
