import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Lift and tighten the border on hover (for interactive cards). */
  interactive?: boolean;
}

/** Flat rounded surface. No shadows: depth comes from chapter contrast. */
export function Card({ interactive = false, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-4xl bg-surface ring-1 ring-inset ring-line/10',
        interactive &&
          'transition-[transform,box-shadow] duration-500 ease-expo-out hover:-translate-y-1 hover:ring-line/25',
        className
      )}
      {...props}
    />
  );
}
