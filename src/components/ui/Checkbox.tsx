'use client';

import { useEffect, useId, useRef } from 'react';
import { DUR, EASE, gsap, reduced, registerMotion } from '@/lib/motion';

/**
 * Case à cocher dont la coche se trace.
 *
 * Le trait est dessiné par `strokeDashoffset` plutôt qu'affiché d'un coup :
 * le geste rappelle un coup de crayon, donc il dit « c'est toi qui viens de
 * le faire » là où une icône qui apparaît dit seulement « c'est coché ».
 *
 * L'`<input>` natif reste dans le DOM, seulement masqué visuellement : il
 * porte le focus, l'état pour les technologies d'assistance et la
 * participation au formulaire. Le SVG n'est qu'un habillage.
 */
export function Checkbox({
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
  const path = useRef<SVGPathElement>(null);
  const box = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const p = path.current;
    if (!p) return;

    const length = p.getTotalLength();
    gsap.set(p, { strokeDasharray: length });

    if (reduced()) {
      gsap.set(p, { strokeDashoffset: checked ? 0 : length });
      return;
    }

    registerMotion();

    gsap.to(p, {
      strokeDashoffset: checked ? 0 : length,
      duration: checked ? DUR.base : DUR.fast,
      ease: checked ? EASE.out : EASE.inOut,
      overwrite: 'auto',
    });

    // Le cadre se resserre puis revient : l'accusé de réception du clic, dans
    // la même course que la coche.
    if (checked && box.current) {
      gsap.fromTo(
        box.current,
        { scale: 0.86 },
        { scale: 1, duration: DUR.base, ease: EASE.spring, overwrite: 'auto' },
      );
    }
  }, [checked]);

  return (
    <label
      htmlFor={id}
      className={`inline-flex cursor-pointer items-center gap-2.5 text-[13.5px] ${className}`}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <span
        ref={box}
        className="tf-check peer-focus-visible:outline-2"
        data-checked={checked ? 'true' : undefined}
      >
        <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
          <path
            ref={path}
            d="M4 12.5l5 5L20 6.5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {label}
    </label>
  );
}
