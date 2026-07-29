'use client';

import { useEffect, useRef } from 'react';
import { EASE, gsap, mount } from '@/lib/motion';

/**
 * Nombre qui monte jusqu'à sa valeur, à l'entrée dans le viewport.
 *
 * La valeur finale est écrite dans le HTML servi : si le JavaScript ne part
 * pas, le chiffre juste est déjà là. L'animation ne fait que remplacer un
 * contenu déjà correct.
 *
 * Les chiffres sont tabulaires — sans ça la largeur change à chaque image et
 * tout ce qui suit sur la ligne tremble pendant le décompte.
 */
export function Counter({
  to,
  suffix = '',
  duration = 1.4,
  className = '',
}: {
  to: number;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const host = useRef<HTMLSpanElement>(null);

  useEffect(
    () =>
      mount(host.current, () => {
        const state = { value: 0 };

        gsap.to(state, {
          value: to,
          duration,
          ease: EASE.out,
          scrollTrigger: { trigger: host.current, start: 'top 90%', once: true },
          onUpdate: () => {
            host.current!.textContent = `${Math.round(state.value)}${suffix}`;
          },
        });
      }),
    [to, suffix, duration],
  );

  return (
    <span ref={host} className={`tf-num ${className}`}>
      {to}
      {suffix}
    </span>
  );
}
