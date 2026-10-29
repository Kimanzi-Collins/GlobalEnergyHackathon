import { cn } from '@/lib/utils';

/** Placeholder shaped like the content it stands in for. Give it the final width and height. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-shimmer rounded-2xl bg-[length:200%_100%] bg-gradient-to-r from-fg/5 via-fg/10 to-fg/5',
        className
      )}
    />
  );
}
