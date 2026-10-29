import { cn } from '@/lib/utils';

export type BadgeKind = 'verified' | 'unverified' | 'indicative' | 'reach' | 'target' | 'likely' | 'neutral';

const labels: Record<Exclude<BadgeKind, 'neutral'>, string> = {
  verified: 'Verified',
  unverified: 'Unverified',
  indicative: 'Indicative',
  reach: 'Reach',
  target: 'Target',
  likely: 'Likely',
};

const styles: Record<BadgeKind, string> = {
  verified: 'bg-acacia/25 text-[#8CF2A6] ring-1 ring-inset ring-acacia/50',
  unverified: 'text-accent ring-1 ring-inset ring-accent/60 bg-accent/10',
  indicative: 'text-fg2 ring-1 ring-inset ring-line/30 [border-style:dashed]',
  reach: 'bg-murram/20 text-murram-light ring-1 ring-inset ring-murram/40',
  target: 'bg-saffron/20 text-saffron ring-1 ring-inset ring-saffron/40',
  likely: 'bg-acacia/30 text-emerald-300 ring-1 ring-inset ring-acacia-light/50',
  neutral: 'bg-fg/5 text-fg2 ring-1 ring-inset ring-line/15',
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  kind?: BadgeKind;
  /** Alias for kind to support dashboard props. */
  variant?: BadgeKind | 'default';
  /** Overrides the default label. Always include text, never colour alone. */
  children?: React.ReactNode;
  className?: string;
}

/** Status chip. Verified, Unverified (data not yet checked against official source), Indicative, or Match Tiers. */
export function Badge({ kind, variant, children, className, ...props }: BadgeProps) {
  const resolvedKind: BadgeKind = (kind || (variant === 'default' ? 'neutral' : variant) || 'neutral') as BadgeKind;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-micro font-medium uppercase tracking-wide',
        styles[resolvedKind] || styles.neutral,
        className
      )}
      {...props}
    >
      {resolvedKind === 'verified' && (
        <svg aria-hidden="true" viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M2.5 6.3l2.2 2.2 4.8-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {resolvedKind === 'unverified' && (
        <svg aria-hidden="true" viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M6 2.2v4.2M6 9v.01" strokeLinecap="round" />
        </svg>
      )}
      {children ?? (resolvedKind !== 'neutral' ? labels[resolvedKind] : null)}
    </span>
  );
}
