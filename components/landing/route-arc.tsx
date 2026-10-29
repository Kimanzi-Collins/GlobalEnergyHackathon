'use client';

import { useEffect, useRef } from 'react';
import { m, useMotionValue, useMotionValueEvent, useTransform, type MotionValue } from 'framer-motion';

/** Flight path from Nairobi (left) to Cambridge, MA (right), the 1959-63 Airlift route in spirit. */
export const ROUTE_D = 'M 70 330 C 260 40, 720 20, 930 150';

interface RouteArcProps {
  /** Scroll progress 0..1 of the whole sequence. Omit for the fully drawn static version. */
  progress?: MotionValue<number>;
  /** Progress window over which the line is drawn. */
  from?: number;
  to?: number;
  className?: string;
}

/**
 * The dotted flight line. The track is always visible as faint dots; the solid line draws with scroll
 * and a marker rides its tip. Drawing uses stroke-dashoffset (pathLength) only.
 */
export function RouteArc({ progress, from = 0.3, to = 0.86, className }: RouteArcProps) {
  const pathRef = useRef<SVGPathElement>(null);
  const markerRef = useRef<SVGCircleElement>(null);
  const haloRef = useRef<SVGCircleElement>(null);

  const fixed = useMotionValue(1);
  const drawn = useTransform(progress ?? fixed, [from, to], [0, 1], { clamp: true });

  const place = (v: number) => {
    const path = pathRef.current;
    if (!path) return;
    const pt = path.getPointAtLength(path.getTotalLength() * v);
    for (const el of [markerRef.current, haloRef.current]) {
      if (el) {
        el.setAttribute('cx', String(pt.x));
        el.setAttribute('cy', String(pt.y));
      }
    }
  };

  useMotionValueEvent(drawn, 'change', place);
  useEffect(() => place(drawn.get()), [drawn]);

  return (
    <svg viewBox="0 0 1000 400" className={className ?? 'h-auto w-full'} role="img" aria-label="A dotted flight route from Nairobi to Cambridge, Massachusetts">
      {/* Track */}
      <path d={ROUTE_D} fill="none" stroke="currentColor" strokeOpacity="0.28" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="0.1 11" />
      {/* Drawn line */}
      <m.path
        ref={pathRef}
        d={ROUTE_D}
        fill="none"
        stroke="rgb(var(--accent))"
        strokeWidth="3"
        strokeLinecap="round"
        style={{ pathLength: progress ? drawn : 1 }}
      />
      {/* Ends */}
      <circle cx="70" cy="330" r="7" fill="currentColor" />
      <circle cx="930" cy="150" r="7" fill="currentColor" fillOpacity="0.5" />
      <text x="70" y="366" fontSize="20" fill="currentColor" fillOpacity="0.7" textAnchor="start" fontFamily="var(--font-geist-sans)">
        Nairobi
      </text>
      <text x="930" y="186" fontSize="20" fill="currentColor" fillOpacity="0.7" textAnchor="end" fontFamily="var(--font-geist-sans)">
        Cambridge, MA
      </text>
      {/* Marker riding the tip */}
      <circle ref={haloRef} r="16" fill="rgb(var(--accent))" fillOpacity="0.22" cx="70" cy="330" />
      <circle ref={markerRef} r="7" fill="rgb(var(--accent))" cx="70" cy="330" />
    </svg>
  );
}
