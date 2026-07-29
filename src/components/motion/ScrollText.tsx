'use client';

import { useEffect, useRef } from 'react';
import { SplitText, gsap, mount } from '@/lib/motion';

/**
 * Paragraphe qui s'éclaircit mot à mot au défilement.
 *
 * `scrub` lie l'opacité à la position du scroll : le texte se révèle au
 * rythme de la lecture au lieu de se jouer tout seul. C'est la seule
 * révélation de texte qui a du sens sur un paragraphe long — un stagger
 * automatique force une vitesse qui ne sera celle de personne.
 *
 * Les mots partent à opacité réduite et non nulle : à zéro, quelqu'un qui
 * arrive par un lien d'ancrage verrait un bloc vide, et le texte serait
 * illisible tant qu'il ne bouge pas.
 */
export function ScrollText({
  children,
  className = '',
}: {
  children: string;
  className?: string;
}) {
  const host = useRef<HTMLParagraphElement>(null);

  useEffect(
    () =>
      mount(host.current, () => {
        const split = new SplitText(host.current!, { type: 'words' });

        gsap.fromTo(
          split.words,
          { opacity: 0.16 },
          {
            opacity: 1,
            ease: 'none',
            stagger: 0.1,
            scrollTrigger: {
              trigger: host.current,
              start: 'top 78%',
              end: 'bottom 55%',
              scrub: true,
            },
          },
        );
      }),
    [],
  );

  return (
    <p ref={host} className={className}>
      {children}
    </p>
  );
}
