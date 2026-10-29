'use client';

import { m } from 'framer-motion';
import { EASE, DURATION } from '@/lib/motion';
import { useLiteMotion } from './use-motion-prefs';

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  /** Seconds to wait after entering the viewport. */
  delay?: number;
  /** Start offset in pixels. */
  y?: number;
  as?: 'div' | 'section' | 'li' | 'p' | 'article' | 'span';
}

/** Fades and lifts content in once when it scrolls into view. Renders the end state in lite mode. */
export function Reveal({ children, className, delay = 0, y = 28, as = 'div' }: RevealProps) {
  const lite = useLiteMotion();
  const Tag = m[as];
  return (
    <Tag
      data-reveal
      className={className}
      initial={lite ? false : { opacity: 0, y }}
      animate={lite ? { opacity: 1, y: 0 } : undefined}
      whileInView={lite ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={lite ? { duration: 0 } : { duration: DURATION.reveal, delay, ease: EASE.expoOut }}
    >
      {children}
    </Tag>
  );
}
