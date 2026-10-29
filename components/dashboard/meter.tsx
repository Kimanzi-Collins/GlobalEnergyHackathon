'use client';

import { useEffect, useState } from 'react';
import { useLiteMotion } from '@/components/motion/use-motion-prefs';
import { cn } from '@/lib/utils';

interface MeterProps {
  label: string;
  value: number;
  max: number;
  /** Override the right-hand text (defaults to "value / max"). */
  valueLabel?: string;
  tone?: 'accent' | 'good' | 'warn';
  /** Seconds before the bar starts to fill, for staggering a list. */
  delay?: number;
  className?: string;
}

const fill = {
  accent: 'bg-accent',
  good: 'bg-phosphor',
  warn: 'bg-murram-light',
} as const;

/** A labelled bar that fills once on mount with scaleX (transform only). Used for rubrics and match scores. */
export function Meter({ label, value, max, valueLabel, tone = 'accent', delay = 0, className }: MeterProps) {
  const lite = useLiteMotion();
  const [on, setOn] = useState(false);
  const ratio = Math.min(1, Math.max(0, value / max));

  useEffect(() => {
    setOn(false);
    const id = requestAnimationFrame(() => setOn(true));
    return () => cancelAnimationFrame(id);
  }, [value, max]);

  return (
    <div className={className}>
      <div className="mb-2 flex items-baseline justify-between gap-3 text-sm">
        <span className="text-fg">{label}</span>
        <span className="tnum shrink-0 font-medium text-fg2">{valueLabel ?? `${value} / ${max}`}</span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        className="h-2 overflow-hidden rounded-full bg-fg/10"
      >
        <div
          className={cn('h-full origin-left rounded-full', fill[tone])}
          style={{
            width: `${ratio * 100}%`,
            transform: on || lite ? 'scaleX(1)' : 'scaleX(0)',
            transition: lite ? 'none' : `transform 1.2s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
          }}
        />
      </div>
    </div>
  );
}
