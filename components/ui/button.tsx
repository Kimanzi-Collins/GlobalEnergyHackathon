'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Magnetic } from '@/components/motion/magnetic';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'link' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Pull toward the pointer on desktop. */
  magnetic?: boolean;
  loading?: boolean;
  /** Alias for loading. */
  isLoading?: boolean;
  className?: string;
  children: React.ReactNode;
}

export type ButtonProps = CommonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps> & { href?: undefined };
export type AnchorProps = CommonProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonProps> & { href: string };

const base =
  'group relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-medium tracking-tight transition-[transform,background-color,color,box-shadow,opacity] duration-200 ease-quart-out active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50';

const variants: Record<ButtonVariant, string> = {
  primary: 'rounded-full bg-accent text-accent-fg hover:brightness-110 shadow-sm',
  secondary: 'rounded-full bg-surface text-fg ring-1 ring-inset ring-line/15 hover:ring-line/30',
  ghost: 'rounded-full text-fg hover:bg-fg/5',
  link: 'rounded-md px-0 text-accent hover:underline underline-offset-4',
  danger: 'rounded-full bg-murram text-snow hover:brightness-110 shadow-sm',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-xs font-medium',
  md: 'h-11 px-5 text-[15px]',
  lg: 'h-14 px-7 text-base',
};

/** Pill button / link. Renders an anchor when `href` is given. */
export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps | AnchorProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    magnetic = false,
    loading = false,
    isLoading = false,
    className,
    children,
    ...props
  },
  ref
) {
  const isBusy = loading || isLoading;
  const classes = cn(base, variants[variant], variant === 'link' ? 'h-auto' : sizes[size], className);
  const content = (
    <>
      {isBusy && (
        <span
          aria-hidden="true"
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent shrink-0"
        />
      )}
      {children}
    </>
  );

  const el =
    'href' in props && props.href !== undefined ? (
      <a ref={ref as React.Ref<HTMLAnchorElement>} className={classes} {...(props as AnchorProps)}>
        {content}
      </a>
    ) : (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        className={classes}
        disabled={isBusy || (props as ButtonProps).disabled}
        aria-busy={isBusy || undefined}
        {...(props as ButtonProps)}
      >
        {content}
      </button>
    );

  return magnetic ? <Magnetic>{el}</Magnetic> : el;
});
