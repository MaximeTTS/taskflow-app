import type { Variants, Transition } from 'framer-motion';

/** Shared easing — a soft, Apple-like ease-out. */
export const EASE: [number, number, number, number] = [0.2, 0.7, 0.3, 1];

export const spring: Transition = { type: 'spring', stiffness: 260, damping: 26 };

/** Container that staggers its children in. */
export const stagger = (stagger = 0.07, delayChildren = 0.05): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: stagger, delayChildren } },
});

/** Fade + rise. Pair with a `stagger` parent or use standalone. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5, ease: EASE } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 10 },
  visible: { opacity: 1, scale: 1, y: 0, transition: spring },
};

/** Hover lift for interactive cards. */
export const hoverLift = {
  whileHover: { y: -4, transition: { duration: 0.25, ease: EASE } },
  whileTap: { scale: 0.99 },
};
