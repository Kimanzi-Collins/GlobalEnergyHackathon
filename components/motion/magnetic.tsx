'use client';

import { useRef } from 'react';
import { m, useMotionValue, useSpring } from 'framer-motion';
import { useLiteMotion } from './use-motion-prefs';

interface MagneticProps {
  children: React.ReactNode;
  /** Maximum pull in pixels. */
  strength?: number;
  className?: string;
}

/** Pulls its child a few pixels toward the pointer. Mouse pointers only; never affects layout. */
export function Magnetic({ children, strength = 8, className }: MagneticProps) {
  const lite = useLiteMotion();
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 20, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 260, damping: 20, mass: 0.4 });

  const onMove = (e: React.PointerEvent) => {
    if (lite || e.pointerType !== 'mouse' || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set(((e.clientX - (r.left + r.width / 2)) / (r.width / 2)) * strength);
    y.set(((e.clientY - (r.top + r.height / 2)) / (r.height / 2)) * strength);
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <m.div
      ref={ref}
      className={className}
      style={{ x: sx, y: sy, display: 'inline-block' }}
      onPointerMove={onMove}
      onPointerLeave={reset}
    >
      {children}
    </m.div>
  );
}
