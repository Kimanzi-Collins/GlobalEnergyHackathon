import { cn } from '@/lib/utils';

export type Chapter = 'light' | 'paper' | 'dark' | 'wash';

interface ScrollChapterProps {
  chapter: Chapter;
  id?: string;
  className?: string;
  children: React.ReactNode;
  'aria-labelledby'?: string;
}

/**
 * A landing-page section that owns a colour chapter. It sets data-chapter, which re-points the
 * chapter tokens (bg, surface, fg, fg2, line, accent), so every child component adapts automatically.
 * The nav observes these sections and tints itself to match the chapter beneath it.
 */
export function ScrollChapter({ chapter, id, className, children, ...rest }: ScrollChapterProps) {
  return (
    <section id={id} data-chapter={chapter} className={cn('relative bg-bg text-fg', className)} {...rest}>
      {children}
    </section>
  );
}
