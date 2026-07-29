'use client';

import { useEffect, useState } from 'react';
import { animate, useReducedMotion } from 'framer-motion';

/** Animated integer count-up, runs on mount and whenever the value changes. */
export function CountUp({ value, duration = 1.1 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplay(value);
      return;
    }
    const controls = animate(0, value, {
      duration,
      ease: [0.2, 0.7, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [value, duration, reduce]);

  return <>{display}</>;
}
