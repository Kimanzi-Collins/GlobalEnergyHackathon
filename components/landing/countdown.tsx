'use client';

import { useEffect, useState } from 'react';

/** Early Action / Early Decision close: 1 November 2026, 23:59 East Africa Time (UTC+3). */
const DEADLINE = new Date('2026-11-01T23:59:00+03:00').getTime();

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
  };
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Live countdown to the 1 November early deadline. Renders after mount so server and client never disagree. */
export function Countdown() {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setLeft(DEADLINE - Date.now());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  // The page is prerendered, so the real time is unknown until mount. Same-width dashes reserve the space,
  // avoid layout shift, and keep the first paint the same size as the final one (better LCP).
  if (left === null) return <span className="tnum font-mono">-d --h --m --s</span>;
  if (left <= 0) return <span className="text-fg2">Early deadlines have passed. Regular deadlines are in January.</span>;

  const p = parts(left);
  return (
    <span className="tnum font-mono" aria-label={`${p.d} days ${p.h} hours ${p.m} minutes left`}>
      {p.d}d {pad(p.h)}h {pad(p.m)}m {pad(p.s)}s
    </span>
  );
}
