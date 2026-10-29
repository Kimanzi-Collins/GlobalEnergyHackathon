'use client';

import { useState } from 'react';
import { KCSE_SCALE } from '@/lib/kcse-scale';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/** Live KCSE grade to US GPA converter using the offline scale. Indicative only. */
export function GpaCard() {
  const [grade, setGrade] = useState('A-');
  const band = KCSE_SCALE.find((b) => b.grade === grade) ?? KCSE_SCALE[1];

  return (
    <div>
      <div role="radiogroup" aria-label="Your KCSE mean grade" className="flex flex-wrap gap-2">
        {KCSE_SCALE.map((b) => {
          const on = b.grade === grade;
          return (
            <button
              key={b.grade}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setGrade(b.grade)}
              className={cn(
                'tnum h-11 min-w-[3rem] rounded-full px-4 text-[15px] font-medium ring-1 ring-inset transition-[transform,background-color,color] duration-200 ease-quart-out active:scale-95',
                on ? 'bg-fg text-bg ring-transparent' : 'bg-bg text-fg ring-line/15 hover:ring-line/35'
              )}
            >
              {b.grade}
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex items-end justify-between gap-4">
        <p key={band.grade} className="tnum animate-rise text-[clamp(4.5rem,9vw,8rem)] font-semibold leading-[0.85] tracking-[-0.05em]">
          {band.gpa40.toFixed(2)}
        </p>
        <div className="pb-2 text-right">
          <Badge kind="indicative" />
          <p className="tnum mt-2 text-sm text-fg2">
            {band.aggregateMin} to {band.aggregateMax} points
          </p>
        </div>
      </div>
    </div>
  );
}
