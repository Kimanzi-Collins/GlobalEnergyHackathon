'use client';

import { useEffect, useState } from 'react';
import { useLiteMotion } from '@/components/motion/use-motion-prefs';
import { cn } from '@/lib/utils';

interface ProgressRingProps {
  /** 0 to 1. */
  value: number;
  size?: number;
  stroke?: number;
  /** Content in the middle (a number, an icon). */
  children?: React.ReactNode;
  label: string;
  tone?: 'accent' | 'good' | 'warn';
  className?: string;
}

/** Circular progress that draws itself once on mount (stroke-dashoffset only). */
export function ProgressRing({ value, size = 120, stroke = 10, children, label, tone = 'accent', className }: ProgressRingProps) {
  const lite = useLiteMotion();
  const [drawn, setDrawn] = useState(false);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.min(1, Math.max(0, value));

  useEffect(() => {
    const id = requestAnimationFrame(() => setDrawn(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const shown = drawn || lite ? v : 0;

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v * 100)}
      className={cn('relative grid shrink-0 place-items-center', className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity="0.1" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone === 'good' ? 'rgb(var(--phosphor))' : tone === 'warn' ? 'rgb(var(--murram-light))' : 'rgb(var(--accent))'}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - shown)}
          style={{ transition: lite ? 'none' : 'stroke-dashoffset 1.6s cubic-bezier(0.16, 1, 0.3, 1) 0.15s' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}
