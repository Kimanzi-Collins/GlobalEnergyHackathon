'use client';

import { useRef } from 'react';
import { cn } from '@/lib/utils';

interface Option<T extends string> {
  value: T;
  label: string;
  /** Small second line under the label (a word limit, a count). */
  hint?: string;
}

interface SegmentedProps<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  /** 'pill' is a compact switch; 'wrap' lets many options flow onto several rows. */
  layout?: 'pill' | 'wrap';
  className?: string;
}

/** Single-choice control built as a radio group, with arrow-key navigation. */
export function Segmented<T extends string>({ options, value, onChange, ariaLabel, layout = 'pill', className }: SegmentedProps<T>) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    const last = options.length - 1;
    let next = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = i === last ? 0 : i + 1;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = i === 0 ? last : i - 1;
    if (next >= 0) {
      e.preventDefault();
      onChange(options[next].value);
      refs.current[next]?.focus();
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        layout === 'pill' ? 'inline-flex rounded-full bg-fg/5 p-1 ring-1 ring-inset ring-line/10' : 'flex flex-wrap gap-2',
        className
      )}
    >
      {options.map((o, i) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              'tnum text-left text-sm font-medium transition-[background-color,color,transform,box-shadow] duration-300 ease-quart-out active:scale-[0.97]',
              layout === 'pill'
                ? 'rounded-full px-4 py-2'
                : 'rounded-2xl px-4 py-2.5 ring-1 ring-inset',
              on
                ? layout === 'pill'
                  ? 'bg-fg text-bg'
                  : 'bg-fg text-bg ring-transparent'
                : layout === 'pill'
                ? 'text-fg2 hover:text-fg'
                : 'bg-bg/40 text-fg ring-line/15 hover:ring-line/35'
            )}
          >
            <span className="block leading-tight">{o.label}</span>
            {o.hint && <span className={cn('mt-0.5 block text-xs font-normal', on ? 'text-bg/60' : 'text-fg2')}>{o.hint}</span>}
          </button>
        );
      })}
    </div>
  );
}
