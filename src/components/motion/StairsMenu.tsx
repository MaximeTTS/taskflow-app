'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { DUR, EASE, SplitText, gsap, reduced, registerMotion } from '@/lib/motion';
import { Icon } from '@/components/ui/Icon';

const BANDS = 5;

/**
 * Navigation plein écran révélée par colonnes.
 *
 * Les bandes qui descendent sont des colonnes : le même motif que le voile
 * de transition et que le tableau lui-même. Un panneau qui glisse depuis la
 * droite aurait fait le même travail sans rien dire du produit.
 *
 * Les bandes descendent en décalé puis les intitulés se dévoilent — deux
 * temps plutôt qu'un, pour que le fond soit posé avant qu'on ait à lire.
 */
export function StairsMenu({ links }: { links: { label: string; href: string }[] }) {
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const bands = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const el = panel.current;
    if (!el) return;

    registerMotion();

    if (!open) {
      gsap.set(el, { pointerEvents: 'none' });
      gsap.set(bands.current!.children, { yPercent: -100 });
      return;
    }

    gsap.set(el, { pointerEvents: 'auto' });

    if (reduced()) {
      gsap.set(bands.current!.children, { yPercent: 0 });
      return;
    }

    const tl = gsap.timeline();

    tl.to(bands.current!.children, {
      yPercent: 0,
      duration: DUR.slow,
      ease: EASE.veil,
      stagger: { each: 0.06, from: 'start' },
    });

    const split = new SplitText(list.current!.querySelectorAll('a'), {
      type: 'lines',
      linesClass: 'tf-line',
    });

    tl.from(
      split.lines,
      {
        yPercent: 110,
        duration: DUR.base,
        ease: EASE.veil,
        stagger: 0.05,
        onComplete: () => split.revert(),
      },
      '-=0.35',
    );

    return () => {
      tl.kill();
      split.revert();
    };
  }, [open]);

  // Échap referme, et le défilement de la page est bloqué tant que le
  // panneau est ouvert.
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);

    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="tf-btn tf-btn-ghost tf-icon-btn md:hidden"
        style={{ width: 36, height: 36 }}
        aria-label="Ouvrir le menu"
        aria-expanded={open}
      >
        <Icon.Layers size={17} />
      </button>

      <div
        ref={panel}
        className="fixed inset-0 z-50"
        // `inert` retire tout le sous-arbre du parcours clavier et de l'arbre
        // d'accessibilité quand le panneau est fermé — plus fiable que de
        // couper les seuls `pointer-events`, qui laissent le focus entrer.
        inert={!open}
      >
        <div ref={bands} className="absolute inset-0 flex" aria-hidden="true">
          {Array.from({ length: BANDS }, (_, i) => (
            <span key={i} style={{ flex: 1, background: 'var(--surface-1)' }} />
          ))}
        </div>

        <div className="relative flex h-full flex-col p-5 sm:p-8">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="tf-btn tf-btn-ghost tf-icon-btn"
              style={{ width: 40, height: 40 }}
              aria-label="Fermer le menu"
            >
              <Icon.Close size={18} />
            </button>
          </div>

          <ul ref={list} className="mt-auto mb-[12vh] flex flex-col gap-2">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="tf-display block text-[clamp(2rem,11vw,3.4rem)]"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
