'use client';

import { m } from 'framer-motion';
import { EASE, STAGGER } from '@/lib/motion';
import { useLiteMotion } from './use-motion-prefs';

interface SplitLinesProps {
  /** Text to reveal. Use "\n" for a manual line break. */
  text: string;
  className?: string;
  id?: string;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  /** Seconds before the first word starts. */
  delay?: number;
  /** 'mount' plays on load with CSS (hero, starts before hydration); 'view' plays when scrolled into view. */
  trigger?: 'mount' | 'view';
  /** Words (without punctuation) to style differently, for example the one gradient word in a headline. */
  accent?: { words: string[]; className: string };
}

/**
 * Slides each word up out of a mask, staggered 80ms. Words wrap naturally so lines reveal in sequence.
 * The full text stays available to screen readers through aria-label.
 */
export function SplitLines({ text, className, id, as = 'h2', delay = 0, trigger = 'view', accent }: SplitLinesProps) {
  const lite = useLiteMotion();
  const Tag = as;
  const lines = text.split('\n');
  let index = 0;

  const isAccent = (word: string) =>
    Boolean(accent?.words.includes(word.replace(/[,;:!?"'()]/g, '').replace(/\.$/, '')));
  const wordClass = (word: string) =>
    `inline-block will-change-transform ${isAccent(word) ? accent?.className ?? '' : ''}`;

  // In lite mode every scroll-triggered word goes straight to its end state.
  const animate = lite ? { y: '0%' } : undefined;
  const whileInView = !lite && trigger === 'view' ? { y: '0%' } : undefined;

  return (
    <Tag id={id} className={className} aria-label={text.replace(/\n/g, ' ')}>
      {lines.map((line, li) => {
        const words = line.split(' ');
        return (
          <span key={li} className="block" aria-hidden="true">
            {words.map((word, wi) => {
              const i = index++;
              const gap = wi < words.length - 1 ? ' ' : '';
              return (
                <span key={`${li}-${wi}`} className="-mb-[0.14em] inline-block overflow-hidden pb-[0.14em] align-bottom">
                  {trigger === 'mount' ? (
                    // CSS-driven so the headline animates from first paint, before React hydrates (keeps LCP early).
                    <span
                      data-reveal
                      className={`${wordClass(word)} animate-word`}
                      style={{ animationDelay: `${delay + i * STAGGER}s` }}
                    >
                      {word}
                      {gap}
                    </span>
                  ) : (
                    <m.span
                      data-reveal
                      className={wordClass(word)}
                      initial={lite ? false : { y: '110%' }}
                      animate={animate}
                      whileInView={whileInView}
                      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
                      transition={lite ? { duration: 0 } : { duration: 1, delay: delay + i * STAGGER, ease: EASE.expoOut }}
                    >
                      {word}
                      {gap}
                    </m.span>
                  )}
                </span>
              );
            })}
          </span>
        );
      })}
    </Tag>
  );
}
