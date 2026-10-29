'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useLiteMotion } from './use-motion-prefs';

interface OdometerProps {
  /** String such as "5,337" or "$0.00". Digits roll, other characters stay fixed. */
  value: string;
  className?: string;
  /** Seconds between the start of each digit's roll. */
  stagger?: number;
}

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

/** Rolling-digit counter. Rolls once when scrolled into view; static in lite mode. */
export function Odometer({ value, className, stagger = 0.09 }: OdometerProps) {
  const lite = useLiteMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const [go, setGo] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setGo(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const active = go || lite;
  let digitIndex = 0;

  return (
    <span ref={ref} className={cn('tnum inline-flex', className)} aria-label={value} role="img">
      {value.split('').map((char, i) => {
        if (!DIGITS.includes(char)) {
          return (
            <span key={i} aria-hidden="true">
              {char}
            </span>
          );
        }
        const d = Number(char);
        const order = digitIndex++;
        return (
          <span key={i} aria-hidden="true" className="relative inline-block h-[1em] overflow-hidden leading-none">
            <span className="invisible block leading-none">0</span>
            <span
              className="absolute inset-x-0 top-0 block will-change-transform"
              style={{
                transform: active ? `translate3d(0, ${-d * 10}%, 0)` : 'translate3d(0, 0, 0)',
                transition: lite ? 'none' : `transform 1.6s cubic-bezier(0.16, 1, 0.3, 1) ${order * stagger}s`,
              }}
            >
              {DIGITS.map((n) => (
                <span key={n} className="block h-[1em] leading-none">
                  {n}
                </span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
}
