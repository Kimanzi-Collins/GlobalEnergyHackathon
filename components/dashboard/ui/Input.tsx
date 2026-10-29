import React from 'react';
import { clsx } from 'clsx';
import { AlertCircle } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-mono font-medium tracking-wider text-bone-muted uppercase"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            id={inputId}
            ref={ref}
            className={clsx(
              'w-full bg-ink-surface border rounded-lg px-4 py-3 text-bone font-display placeholder-bone-muted/40 transition-colors duration-160 focus:outline-none focus:ring-1 focus:ring-saffron focus:border-saffron',
              error ? 'border-murram focus:ring-murram focus:border-murram' : 'border-white/10 hover:border-white/20',
              className
            )}
            {...props}
          />
        </div>
        {error ? (
          <p className="flex items-center gap-1.5 text-xs font-mono text-saffron mt-1">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{error}</span>
          </p>
        ) : hint ? (
          <p className="text-xs font-mono text-bone-muted/70">{hint}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

