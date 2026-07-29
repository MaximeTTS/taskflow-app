'use client';

import { useCallback, useRef } from 'react';

/**
 * Spéculaire suivant le curseur.
 *
 * Le reflet sur une surface de verre se déplace avec le point de vue. On
 * reproduit ça en posant la position du curseur sur deux variables CSS que
 * le dégradé radial de `.g-spec` consomme.
 *
 * Écrit directement dans le style de l'élément plutôt que dans un état
 * React : un `setState` par mouvement de souris déclencherait un rendu à
 * chaque pixel parcouru. Ici rien ne re-rend, le navigateur se contente de
 * repeindre un dégradé.
 */
export function useSpecular<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  /** Identifiant de frame, pour ne peindre qu'une fois par rafraîchissement. */
  const frame = useRef<number | null>(null);

  const onPointerMove = useCallback((event: React.PointerEvent<T>) => {
    const element = ref.current;
    if (!element) return;

    // Un stylet ou un doigt n'a pas de survol : le reflet n'aurait pas de
    // sens et masquerait le contenu sous le doigt.
    if (event.pointerType !== 'mouse') return;

    const { clientX, clientY } = event;

    if (frame.current !== null) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      const rect = element.getBoundingClientRect();
      element.style.setProperty('--mx', `${clientX - rect.left}px`);
      element.style.setProperty('--my', `${clientY - rect.top}px`);
    });
  }, []);

  const onPointerEnter = useCallback((event: React.PointerEvent<T>) => {
    if (event.pointerType !== 'mouse') return;
    ref.current?.style.setProperty('--spec', '1');
  }, []);

  const onPointerLeave = useCallback(() => {
    if (frame.current !== null) {
      cancelAnimationFrame(frame.current);
      frame.current = null;
    }
    ref.current?.style.setProperty('--spec', '0');
  }, []);

  return { ref, handlers: { onPointerMove, onPointerEnter, onPointerLeave } };
}
