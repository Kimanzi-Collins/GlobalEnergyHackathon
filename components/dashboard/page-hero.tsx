import type { LucideIcon } from 'lucide-react';
import { SplitLines } from '@/components/motion/split-lines';

interface PageHeroProps {
  /** Short label above the title, for example "Guide". */
  eyebrow: string;
  icon?: LucideIcon;
  /** Title. Use "\n" for a manual line break. */
  title: string;
  description?: React.ReactNode;
  /** Right-hand side on desktop (a stat, a switch, buttons). Stacks below on phones. */
  aside?: React.ReactNode;
  /** Optional gradient word inside the title. */
  accentWord?: string;
}

/**
 * The top of every dashboard page: a small label, a large tight headline that slides in word by word,
 * one supporting sentence, and an optional aside. Keep titles to two to five words.
 */
export function PageHero({ eyebrow, icon: Icon, title, description, aside, accentWord }: PageHeroProps) {
  return (
    <header className="flex flex-col gap-8 pb-[clamp(28px,4vw,56px)] lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        <div className="flex animate-rise items-center gap-2.5">
          {Icon && (
            <span className="grid h-8 w-8 place-items-center rounded-full bg-accent/15 text-accent ring-1 ring-inset ring-accent/30">
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
          )}
          <span className="text-micro font-medium uppercase tracking-[0.1em] text-fg2">{eyebrow}</span>
        </div>

        <SplitLines
          as="h1"
          trigger="mount"
          text={title}
          accent={
            accentWord
              ? { words: [accentWord], className: 'bg-gradient-to-r from-saffron via-[#F08A3C] to-[#E8623A] bg-clip-text text-transparent' }
              : undefined
          }
          className="mt-5 text-dash font-semibold"
        />

        {description && (
          // Plain text on purpose: it must paint on the first frame (JS-driven reveals wait for hydration and delay LCP).
          <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-fg2">{description}</p>
        )}
      </div>

      {aside && (
        <div className="shrink-0 animate-rise" style={{ animationDelay: '0.15s' }}>
          {aside}
        </div>
      )}
    </header>
  );
}
