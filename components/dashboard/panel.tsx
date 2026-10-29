import { cn } from '@/lib/utils';

interface PanelProps {
  /** Small label above the title. */
  eyebrow?: string;
  title?: React.ReactNode;
  /** Right side of the header row (a link, a button, a badge). */
  action?: React.ReactNode;
  /** Soft accent light from the top-right corner, for the one panel on a page that should lead. */
  glow?: boolean;
  /** Lift on hover, for panels that are links. */
  interactive?: boolean;
  className?: string;
  bodyClassName?: string;
  children?: React.ReactNode;
  id?: string;
}

/**
 * The dashboard's surface. Rounded, flat, with a hairline highlight on its top edge so dark panels read as
 * glass without shadows. Use one `glow` panel per page, not more.
 */
export function Panel({ eyebrow, title, action, glow, interactive, className, bodyClassName, children, id }: PanelProps) {
  return (
    <section
      id={id}
      className={cn(
        'panel-edge relative overflow-hidden rounded-4xl bg-surface ring-1 ring-inset ring-line/10',
        interactive && 'transition-[transform,box-shadow] duration-500 ease-expo-out hover:-translate-y-1 hover:ring-line/25',
        className
      )}
    >
      {glow && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/20 blur-3xl"
        />
      )}
      <div className={cn('relative p-[clamp(20px,2.4vw,32px)]', bodyClassName)}>
        {(eyebrow || title || action) && (
          <div className="mb-[clamp(16px,2vw,24px)] flex items-start justify-between gap-4">
            <div className="min-w-0">
              {eyebrow && <p className="text-micro font-medium uppercase tracking-[0.1em] text-fg2">{eyebrow}</p>}
              {title && (
                <h2 className={cn('font-semibold tracking-[-0.025em]', 'text-[clamp(1.3rem,1.05rem+0.9vw,1.85rem)] leading-tight', eyebrow && 'mt-1.5')}>
                  {title}
                </h2>
              )}
            </div>
            {action && <div className="shrink-0">{action}</div>}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
