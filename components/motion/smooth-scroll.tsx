'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import { useLiteMotion } from './use-motion-prefs';

/**
 * Weighted smooth scroll (Lenis) for the landing page. Disabled for reduced-motion and Save-Data.
 * Native scroll is kept everywhere else, so keyboard, anchors and assistive tech keep working.
 */
export function SmoothScroll() {
  const lite = useLiteMotion();

  useEffect(() => {
    if (lite) return;
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true, anchors: true });
    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, [lite]);

  return null;
}
