'use client';

import { useEffect, useState } from 'react';
import { Phone } from '@/components/ussd/phone';
import { useLiteMotion } from '@/components/motion/use-motion-prefs';
import { USSD_SERVICE_CODE } from '@/lib/constants';

/**
 * Scripted demo of the numeric menu for the hero. It mirrors the target menu in AGENTS.md section 7;
 * the interactive simulator further down talks to the live route.
 */
const SCRIPT: Array<{ typed: string; reply: string }> = [
  {
    typed: USSD_SERVICE_CODE,
    reply: 'Karibu Pepea\n1. Apply guide\n2. KCSE to US GPA\n3. Colleges for me\n4. Financial aid',
  },
  {
    typed: '2',
    reply: 'Your KCSE grade?\n1. A    2. A-\n3. B+   4. B\n5. B-   6. C+',
  },
  {
    typed: '1',
    reply: 'KCSE A is about 4.0 on the US scale (indicative). Next steps sent by SMS.',
  },
];

const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

/** Decorative device for the hero: types the dial code and walks one flow in a loop. */
export function HeroPhone() {
  const lite = useLiteMotion();
  const [typed, setTyped] = useState('');
  const [reply, setReply] = useState('');
  const last = SCRIPT[SCRIPT.length - 1];

  useEffect(() => {
    if (lite) return;
    let cancelled = false;
    (async () => {
      while (!cancelled) {
        for (const step of SCRIPT) {
          setReply('');
          for (let i = 1; i <= step.typed.length; i++) {
            if (cancelled) return;
            setTyped(step.typed.slice(0, i));
            await wait(step.typed.length > 1 ? 85 : 400);
          }
          await wait(450);
          if (cancelled) return;
          setTyped('');
          setReply(step.reply);
          await wait(2600);
        }
        await wait(1400);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lite]);

  const shown = lite ? last.reply : reply;

  const screen = (
    <div className="flex min-h-[15.5rem] flex-col justify-between font-mono text-[13px] leading-relaxed text-phosphor">
      <div className="flex items-center justify-between border-b border-phosphor/15 pb-2 text-[11px] text-phosphor/70">
        <span>SAFARICOM</span>
        <span>USSD</span>
      </div>
      <p className="whitespace-pre-line py-3">{shown || 'Dial the code, then press Call.'}</p>
      <div className="flex items-center justify-end gap-1 border-t border-phosphor/15 pt-2 text-phosphor">
        <span aria-hidden="true" className="mr-auto text-phosphor/60">
          &gt;
        </span>
        <span>{lite ? '' : typed}</span>
        <span aria-hidden="true" className="inline-block h-3.5 w-[7px] animate-blink bg-phosphor" />
      </div>
    </div>
  );

  return <Phone screen={screen} />;
}
