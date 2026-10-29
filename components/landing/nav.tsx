'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { Chapter } from '@/components/motion/scroll-chapter';

const LINKS = [
  { href: '#tools', label: 'Tools' },
  { href: '#phone', label: 'On any phone' },
  { href: '#essays', label: 'Essays' },
  { href: '#safety', label: 'Stay safe' },
];

/** The Pepea mark: a dotted crossing between two points. */
export function Mark({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 28 28" className={className} fill="none">
      <path d="M3 21C8 5 20 5 25 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="0.1 4.6" />
      <circle cx="3" cy="21" r="2.4" fill="currentColor" />
      <circle cx="25" cy="21" r="2.4" fill="currentColor" />
    </svg>
  );
}

/**
 * Frosted, 52px navigation bar. It tints itself to the colour chapter of the section beneath it,
 * and hides when scrolling down so content has the screen (returns on scroll up).
 */
export function Nav() {
  const [chapter, setChapter] = useState<Chapter>('light');
  const [hidden, setHidden] = useState(false);
  const last = useRef(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      setHidden(y > 240 && y > last.current + 4);
      if (y < last.current - 4 || y <= 240) setHidden(false);
      last.current = y;

      // Find the chapter under the nav (skip the nav itself).
      const stack = document.elementsFromPoint(window.innerWidth / 2, 26);
      for (const el of stack) {
        const section = (el as HTMLElement).closest?.('[data-chapter]') as HTMLElement | null;
        if (section && !section.closest('header')) {
          setChapter(section.dataset.chapter as Chapter);
          break;
        }
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <header
      data-chapter={chapter}
      className="glass fixed inset-x-0 top-0 z-50 border-b border-line/10 text-fg transition-[transform,background-color] duration-500 ease-expo-out"
      style={{ height: 'var(--nav-h)', transform: hidden ? 'translate3d(0,-100%,0)' : 'translate3d(0,0,0)' }}
    >
      <nav aria-label="Main" className="mx-auto flex h-full max-w-[1280px] items-center justify-between px-[clamp(16px,4vw,48px)]">
        <a href="#top" className="flex items-center gap-2 text-[17px] font-semibold tracking-tight">
          <Mark className="h-6 w-6 text-accent" />
          Pepea
        </a>

        <ul className="hidden items-center gap-8 text-[13px] text-fg2 md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="transition-colors duration-200 hover:text-fg">
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <Button href="/dashboard" size="md" className="h-8 px-4 text-[13px]">
          Dashboard
        </Button>
      </nav>
    </header>
  );
}
