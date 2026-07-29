import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { Draggable } from 'gsap/Draggable';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { Flip } from 'gsap/Flip';
import { InertiaPlugin } from 'gsap/InertiaPlugin';
import { Observer } from 'gsap/Observer';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

/**
 * Socle du mouvement.
 *
 * Un seul endroit enregistre les greffons et fixe le vocabulaire. Sans ça
 * chaque composant réinvente ses durées et ses courbes, et l'ensemble cesse
 * de paraître d'une seule main — c'est le premier symptôme d'une interface
 * animée par accumulation.
 *
 * Tout ici touche au document : le module n'est importé que par des
 * composants clients.
 */

let registered = false;

/**
 * Deux courbes maison, et elles portent l'identité du produit.
 *
 * `board` est la courbe d'une carte qu'on lâche : départ franc, arrivée qui
 * s'écrase sans rebondir. `veil` est celle d'un rideau : lente à démarrer,
 * rapide à finir, pour que la révélation se sente comme un dévoilement et
 * non comme un fondu.
 */
export const EASE = {
  board: 'tf-board',
  veil: 'tf-veil',
  out: 'power3.out',
  inOut: 'power2.inOut',
  spring: 'elastic.out(1, 0.5)',
} as const;

export function registerMotion(): void {
  if (registered || typeof window === 'undefined') return;

  gsap.registerPlugin(
    CustomEase,
    Draggable,
    DrawSVGPlugin,
    Flip,
    InertiaPlugin,
    Observer,
    ScrollTrigger,
    SplitText,
  );

  CustomEase.create(EASE.board, 'M0,0 C0.13,0.4 0.16,1 1,1');
  CustomEase.create(EASE.veil, 'M0,0 C0.6,0 0.24,1 1,1');

  registered = true;
}

/**
 * Durées, en secondes — l'unité de GSAP.
 *
 * Elles doublent celles de `globals.css` parce qu'aucune des deux ne peut
 * lire l'autre : le CSS ne sait pas exposer une courbe à JavaScript, et
 * JavaScript ne peut pas parser une custom property en easing GSAP. Le
 * doublon est assumé mais déclaré à un seul endroit, donc il ne diverge
 * qu'ici.
 */
export const DUR = {
  /** Le premier retour visuel reste sous 100 ms. */
  instant: 0.09,
  fast: 0.2,
  base: 0.45,
  slow: 0.8,
  veil: 1.1,
} as const;

/**
 * L'utilisateur demande-t-il moins de mouvement ?
 *
 * Lu à chaque appel plutôt que mis en cache : le réglage système peut
 * changer pendant la session, et une valeur figée au chargement continuerait
 * d'animer quelqu'un qui vient de demander l'inverse.
 */
export function reduced(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Le pointeur permet-il un survol ? Rien à animer au survol sur tactile. */
export function canHover(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

/**
 * Monte une animation dans un contexte GSAP nettoyable.
 *
 * `gsap.context` est la seule façon fiable de tout défaire à la sortie :
 * tweens, ScrollTriggers et découpages de texte créés dedans sont annulés
 * d'un seul `revert()`. Sans lui, un ScrollTrigger survit au démontage du
 * composant et continue de piloter des nœuds qui n'existent plus.
 *
 * Quand le mouvement est refusé, `build` n'est pas appelé du tout et
 * `settle` pose l'état final : respecter le réglage ne veut pas dire
 * laisser la page vide.
 */
export function mount(
  scope: Element | null,
  build: (ctx: gsap.Context) => void,
  settle?: () => void,
): () => void {
  if (!scope) return () => {};

  registerMotion();

  if (reduced()) {
    settle?.();
    return () => {};
  }

  const ctx = gsap.context(build, scope);
  return () => ctx.revert();
}

export {
  gsap,
  CustomEase,
  Draggable,
  DrawSVGPlugin,
  Flip,
  InertiaPlugin,
  Observer,
  ScrollTrigger,
  SplitText,
};
