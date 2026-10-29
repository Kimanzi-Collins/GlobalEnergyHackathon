import { cn } from '@/lib/utils';

type BadgeKind = 'verified' | 'unverified' | 'indicative' | 'neutral';

const labels: Record<Exclude<BadgeKind, 'neutral'>, string> = {
  verified: 'Verified',
  unverified: 'Unverified',
  indicative: 'Indicative',
};

const styles: Record<BadgeKind, string> = {
  verified: 'bg-fg/5 text-fg ring-1 ring-inset ring-line/20',
  unverified: 'text-accent ring-1 ring-inset ring-accent/60',
  indicative: 'text-fg2 ring-1 ring-inset ring-line/30 [border-style:dashed]',
  neutral: 'bg-fg/5 text-fg2',
};

interface BadgeProps {
  kind?: BadgeKind;
  /** Overrides the default label. Always include text, never colour alone. */
  children?: React.ReactNode;
  className?: string;
}

/** Status chip. Verified, Unverified (data not yet checked against the official source) or Indicative (estimate). */
export function Badge({ kind = 'neutral', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-micro font-medium uppercase',
        styles[kind],
        className
      )}
    >
      {kind === 'verified' && (
        <svg aria-hidden="true" viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M2.5 6.3l2.2 2.2 4.8-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {kind === 'unverified' && (
        <svg aria-hidden="true" viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M6 2.2v4.2M6 9v.01" strokeLinecap="round" />
        </svg>
      )}
      {children ?? (kind !== 'neutral' ? labels[kind] : null)}
    </span>
  );
}
