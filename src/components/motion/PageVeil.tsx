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
 * chargement, donc à ajouter une latence artificielle à chaque clic.
 *
 * Le conteneur est remis en place à chaque changement de route. Une première
 * version le masquait en `display: none` à la fin sans jamais le rétablir :
 * la transition ne jouait qu'une fois, puis plus jamais.
 */
export function PageVeil() {
  const pathname = usePathname();
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    if (reduced()) {
      gsap.set(el, { autoAlpha: 0 });
      return;
    }

    registerMotion();

    // Remise à l'état couvrant avant chaque sortie, sinon la deuxième
    // navigation animerait des bandes déjà remontées.
    gsap.set(el, { autoAlpha: 1 });
    gsap.set(el.children, { yPercent: 0 });

    const tween = gsap.to(el.children, {
      yPercent: -100,
      duration: DUR.slow,
      ease: EASE.veil,
      stagger: { each: 0.05, from: 'start' },
      // `autoAlpha` coupe aussi `visibility`, donc le nœud sort de l'arbre
      // d'accessibilité au lieu de rester un calque plein écran invisible.
      onComplete: () => gsap.set(el, { autoAlpha: 0 }),
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
        <span key={i} style={{ flex: 1, background: 'var(--bg-canvas)', willChange: 'transform' }} />
      ))}
    </div>
  );
}
