import { cn } from '@/lib/utils';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'] as const;

interface PhoneProps {
  /** Content of the LCD. */
  screen: React.ReactNode;
  /** Called with the pressed key. When omitted the keypad is decorative and hidden from assistive tech. */
  onKey?: (key: string) => void;
  /** Call (green) and End (red) handlers. */
  onCall?: () => void;
  onEnd?: () => void;
  callLabel?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * A flat, minimal feature phone: LCD, call and end keys, and a digit-only keypad.
 * Keys carry digits, * and # only: Kenyan handsets cannot dial letters, so the simulator never shows them.
 */
export function Phone({ screen, onKey, onCall, onEnd, callLabel = 'Call', disabled, className }: PhoneProps) {
  const interactive = Boolean(onKey);

  return (
    <div
      className={cn(
        'relative mx-auto w-[min(21rem,86vw)] rounded-[3rem] bg-gradient-to-b from-[#2a2a2e] to-[#121214] p-[3px] shadow-[0_30px_60px_-40px_rgb(0_0_0/0.6)]',
        className
      )}
    >
      <div className="rounded-[calc(3rem-3px)] bg-gradient-to-b from-[#19191c] to-[#0b0b0d] px-5 pb-7 pt-6">
        {/* Earpiece */}
        <div aria-hidden="true" className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-black/70 ring-1 ring-white/5" />

        {/* LCD */}
        <div className="lcd rounded-2xl border border-white/5 p-4">{screen}</div>

        {/* Call / End */}
        <div className="mt-5 grid grid-cols-2 gap-3" aria-hidden={!interactive || undefined}>
          <button
            type="button"
            tabIndex={interactive ? 0 : -1}
            onClick={onCall}
            disabled={disabled || !onCall}
            className="h-11 rounded-full bg-[#1f6f3a] text-[13px] font-medium text-snow transition-transform duration-200 ease-quart-out hover:brightness-110 active:scale-95 disabled:opacity-40"
          >
            {callLabel}
          </button>
          <button
            type="button"
            tabIndex={interactive ? 0 : -1}
            onClick={onEnd}
            disabled={!onEnd}
            className="h-11 rounded-full bg-[#7a2418] text-[13px] font-medium text-snow transition-transform duration-200 ease-quart-out hover:brightness-110 active:scale-95 disabled:opacity-40"
          >
            End
          </button>
        </div>

        {/* Keypad */}
        <div className="mt-3 grid grid-cols-3 gap-2" role={interactive ? 'group' : undefined} aria-label={interactive ? 'Keypad' : undefined} aria-hidden={!interactive || undefined}>
          {KEYS.map((key) => (
            <button
              key={key}
              type="button"
              tabIndex={interactive ? 0 : -1}
              onClick={() => onKey?.(key)}
              disabled={disabled || !onKey}
              aria-label={key === '*' ? 'Star' : key === '#' ? 'Hash' : key}
              className="tnum h-12 rounded-2xl bg-white/[0.06] font-mono text-lg text-snow ring-1 ring-inset ring-white/5 transition-[transform,background-color] duration-150 ease-quart-out hover:bg-white/[0.11] active:scale-95 disabled:opacity-60"
            >
              {key}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
