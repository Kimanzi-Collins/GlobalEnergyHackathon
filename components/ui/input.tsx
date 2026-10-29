import { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';

interface FieldShellProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}

/** Label, hint and error wrapper shared by Input and Textarea. */
export function FieldShell({ id, label, hint, error, children }: FieldShellProps) {
  return (
    <div className="w-full">
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-fg">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-2 flex items-start gap-1.5 text-sm text-accent">
          <svg aria-hidden="true" viewBox="0 0 16 16" className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6">
            <circle cx="8" cy="8" r="6.5" />
            <path d="M8 4.5v4M8 11v.01" strokeLinecap="round" />
          </svg>
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-2 text-sm text-fg2">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export const fieldClasses =
  'w-full rounded-2xl bg-surface px-4 text-base text-fg ring-1 ring-inset ring-line/15 placeholder:text-fg2/70 transition-shadow duration-200 ease-quart-out focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

/** Text input with a visible label, hint and an error message that says how to fix it. */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, className, id, ...props },
  ref
) {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <FieldShell id={fieldId} label={label} hint={hint} error={error}>
      <input
        ref={ref}
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        className={cn(fieldClasses, 'h-12', error && 'ring-accent', className)}
        {...props}
      />
    </FieldShell>
  );
});
