import { Odometer } from '@/components/motion/odometer';
import { cn } from '@/lib/utils';

interface StatProps {
  label: string;
  /** Digits roll once when scrolled into view. Pass a string such as "12", "3.85" or "86". */
  value: string;
  /** Small unit after the number, for example "days" or "/ 100". */
  unit?: string;
  caption?: React.ReactNode;
  /** 'hero' is the monumental page numeral; 'md' is a supporting figure; 'sm' sits in tight spaces. */
  size?: 'hero' | 'md' | 'sm';
  /** Accent colour on the numeral. One per page. (A text gradient cannot clip through the Odometer's transformed digits, so this is a solid colour.) */
  gradient?: boolean;
  align?: 'left' | 'right';
  className?: string;
}

const sizes = {
  hero: 'text-stat font-semibold',
  md: 'text-[clamp(2.5rem,1.8rem+2.4vw,4rem)] font-semibold leading-[0.92] tracking-[-0.05em]',
  sm: 'text-[clamp(1.75rem,1.4rem+1vw,2.25rem)] font-semibold leading-none tracking-[-0.04em]',
} as const;

/** A labelled figure in monumental type. The number is the design; the label and caption are quiet. */
export function Stat({ label, value, unit, caption, size = 'md', gradient, align = 'left', className }: StatProps) {
  return (
    <div className={cn(align === 'right' && 'text-right', className)}>
      <p className="text-micro font-medium uppercase tracking-[0.1em] text-fg2">{label}</p>
      <p
        className={cn(
          'mt-2 flex items-baseline gap-2',
          align === 'right' && 'justify-end',
          sizes[size],
          gradient && 'text-accent'
        )}
      >
        <Odometer value={value} />
        {unit && <span className="text-[0.28em] font-medium tracking-normal text-fg2">{unit}</span>}
      </p>
      {caption && <p className="mt-2.5 text-sm leading-snug text-fg2">{caption}</p>}
    </div>
  );
}
