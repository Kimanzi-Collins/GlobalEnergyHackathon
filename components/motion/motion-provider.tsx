'use client';

import { LazyMotion, domAnimation } from 'framer-motion';

/** Loads only the DOM animation features of Framer Motion (keeps the initial bundle small). */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <LazyMotion features={domAnimation}>{children}</LazyMotion>;
}
