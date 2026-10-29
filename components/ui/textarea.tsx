import { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';
import { FieldShell, fieldClasses } from './input';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
  error?: string;
  /** When set, shows a live word count against this limit. */
  wordLimit?: number;
}

function countWords(text: string): number {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

/**
 * Multi-line input. With `wordLimit`, shows a live counter that turns accent near the limit and
 * says "over by N" (never colour alone) once past it.
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, wordLimit, className, id, value, ...props },
  ref
) {
  const auto = useId();
  const fieldId = id ?? auto;
  const words = typeof value === 'string' ? countWords(value) : 0;
  const near = wordLimit ? words >= wordLimit * 0.9 : false;
  const over = wordLimit ? words > wordLimit : false;

  return (
    <FieldShell id={fieldId} label={label} hint={hint} error={error}>
      <textarea
        ref={ref}
        id={fieldId}
        value={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        className={cn(fieldClasses, 'min-h-[160px] resize-y py-3 leading-relaxed', error && 'ring-accent', className)}
        {...props}
      />
      {wordLimit ? (
        <p className={cn('tnum mt-2 text-right text-sm', near ? 'font-medium text-accent' : 'text-fg2')} aria-live="polite">
          {over ? `${words} words, over by ${words - wordLimit}` : `${words} / ${wordLimit} words`}
        </p>
      ) : null}
    </FieldShell>
  );
});
