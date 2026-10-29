import type { LucideIcon } from 'lucide-react';
import { USSD_SERVICE_CODE } from '@/lib/constants';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  body: string;
  /** One clear action. */
  action?: React.ReactNode;
  /** Show the phone fallback line. */
  ussdHint?: boolean;
}

/** A designed empty state: one sentence, one action, and the numeric phone alternative. */
export function EmptyState({ icon: Icon, title, body, action, ussdHint }: EmptyStateProps) {
  return (
    <div className="grid place-items-center px-6 py-[clamp(40px,8vw,88px)] text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-fg/5 text-fg2 ring-1 ring-inset ring-line/10">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <h3 className="mt-5 text-xl font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-fg2">{body}</p>
      {action && <div className="mt-6">{action}</div>}
      {ussdHint && (
        <p className="mt-5 text-sm text-fg2">
          No data? Dial <span className="font-mono text-fg">{USSD_SERVICE_CODE}</span>
        </p>
      )}
    </div>
  );
}
