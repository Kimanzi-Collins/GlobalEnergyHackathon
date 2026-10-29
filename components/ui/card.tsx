import { cn } from '@/lib/utils';

export type CardVariant = 'surface' | 'elevated' | 'acacia' | 'screen';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Lift and tighten the border on hover (for interactive cards). */
  interactive?: boolean;
  /** Alias for interactive. */
  hoverEffect?: boolean;
  /** Surface style variant. */
  variant?: CardVariant;
}

const variants: Record<CardVariant, string> = {
  surface: 'bg-surface text-fg ring-line/10',
  elevated: 'bg-ink-elevated text-fg ring-line/15',
  acacia: 'bg-acacia/30 text-fg ring-acacia/50',
  screen: 'bg-screen text-phosphor ring-phosphor/20 font-mono',
};

/** Flat rounded surface. No heavy drop-shadows: depth comes from chapter contrast. */
export function Card({
  interactive = false,
  hoverEffect = false,
  variant = 'surface',
  className,
  ...props
}: CardProps) {
  const isHoverable = interactive || hoverEffect;

  return (
    <div
      className={cn(
        'rounded-3xl p-5 sm:p-6 ring-1 ring-inset transition-all duration-240 ease-quart-out',
        variants[variant],
        isHoverable &&
          'hover:-translate-y-0.5 hover:ring-line/25 cursor-pointer',
        className
      )}
      {...props}
    />
  );
}
