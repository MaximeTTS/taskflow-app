'use client';

import { useEffect, useId, useRef } from 'react';
import { DUR, EASE, gsap, reduced, registerMotion } from '@/lib/motion';

/**
 * Interrupteur.
 *
 * La pastille dépasse légèrement sa position avant de revenir : c'est ce
 * léger excès qui donne la sensation mécanique d'un cran qui se ferme. Une
 * translation linéaire se lit comme un curseur qu'on glisse, pas comme un
 * interrupteur qu'on bascule.
 *
 * Comme pour la case à cocher, l'`<input>` natif reste seul responsable de
 * l'état et du focus.
 */
export function Toggle({
  checked,
  onChange,
  label,
  className = '',
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  className?: string;
}) {
  const id = useId();
  const knob = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = knob.current;
    if (!el) return;

    const travel = 18;

    if (reduced()) {
      gsap.set(el, { x: checked ? travel : 0 });
      return;
    }

    registerMotion();

    gsap.to(el, {
      x: checked ? travel : 0,
      duration: DUR.base,
      ease: EASE.spring,
      overwrite: 'auto',
    });
  }, [checked]);

  return (
    <label
      htmlFor={id}
      className={`inline-flex cursor-pointer items-center gap-3 text-[13.5px] ${className}`}
    >
      <input
        id={id}
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <span className="tf-switch" data-checked={checked ? 'true' : undefined}>
        <span ref={knob} className="tf-switch-knob" />
      </span>
      {label}
    </label>
  );
}
