import React from 'react';
import { clsx } from 'clsx';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  variant?: 'surface' | 'elevated' | 'acacia' | 'screen';
}

export function Card({
  className,
  hoverEffect = false,
  variant = 'surface',
  children,
  ...props
}: CardProps) {
  const variantStyles = {
    surface: 'bg-ink-surface border-white/10 text-bone',
    elevated: 'bg-ink-elevated border-white/15 text-bone',
    acacia: 'bg-acacia/40 border-acacia/60 text-bone',
    screen: 'bg-screen border-phosphor/20 text-phosphor font-mono',
  };

  return (
    <div
      className={clsx(
        'rounded-xl border p-5 transition-all duration-240 ease-quart-out',
        variantStyles[variant],
        hoverEffect && 'hover:border-saffron/80 hover:-translate-y-0.5 cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

