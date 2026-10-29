'use client';

import React from 'react';
import { clsx } from 'clsx';
import { AlertCircle } from 'lucide-react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  wordLimit?: number;
  error?: string;
  hint?: string;
  value?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, wordLimit, error, hint, value = '', onChange, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    // Compute live word count
    const wordCount = React.useMemo(() => {
      if (!value) return 0;
      const trimmed = value.trim();
      return trimmed ? trimmed.split(/\s+/).length : 0;
    }, [value]);

    const isNearLimit = wordLimit ? wordCount >= Math.floor(wordLimit * 0.9) && wordCount <= wordLimit : false;
    const isOverLimit = wordLimit ? wordCount > wordLimit : false;
    const overBy = wordLimit && isOverLimit ? wordCount - wordLimit : 0;

    return (
      <div className="w-full space-y-1.5">
        <div className="flex items-center justify-between">
          {label && (
            <label
              htmlFor={inputId}
              className="block text-xs font-mono font-medium tracking-wider text-bone-muted uppercase"
            >
              {label}
            </label>
          )}

          {wordLimit && (
            <span
              className={clsx(
                'text-xs font-mono transition-colors',
                isOverLimit
                  ? 'text-murram-light font-bold'
                  : isNearLimit
                  ? 'text-saffron font-medium'
                  : 'text-bone-muted'
              )}
            >
              {wordCount} / {wordLimit} words
              {isOverLimit && ` (over by ${overBy})`}
            </span>
          )}
        </div>

        <textarea
          id={inputId}
          ref={ref}
          value={value}
          onChange={onChange}
          className={clsx(
            'w-full bg-ink-surface border rounded-xl p-4 text-bone font-editorial text-lg leading-relaxed placeholder-bone-muted/30 transition-colors duration-160 focus:outline-none focus:ring-1 focus:ring-saffron focus:border-saffron min-h-[180px]',
            isOverLimit
              ? 'border-murram/80 focus:ring-murram focus:border-murram'
              : 'border-white/10 hover:border-white/20',
            className
          )}
          {...props}
        />

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

Textarea.displayName = 'Textarea';

