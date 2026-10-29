import { ScrollChapter } from '@/components/motion/scroll-chapter';
import { Reveal } from '@/components/motion/reveal';
import { SplitLines } from '@/components/motion/split-lines';
import { UssdSimulator } from '@/components/ussd/simulator';
import { USSD_SERVICE_CODE } from '@/lib/constants';

const POINTS = [
  { k: 'No data, no app', v: 'Works on any phone that can make a call, on any network.' },
  { k: 'Numbers only', v: 'Every menu is a number, because every Kenyan phone can dial one.' },
  { k: 'Under three seconds', v: 'Answers come from our database, not an AI, so the session never times out.' },
  { k: 'One profile', v: 'Pick up the same plan later on WhatsApp or the web.' },
];

/** The numeric USSD section: copy on the left, the live simulator on the right. */
export function UssdSection() {
  return (
    <ScrollChapter chapter="dark" id="phone" aria-labelledby="phone-title" className="px-[clamp(16px,4vw,48px)] py-[clamp(72px,12vw,176px)]">
      <div className="mx-auto grid max-w-[1280px] items-start gap-[clamp(40px,6vw,96px)] lg:grid-cols-12">
        <div className="lg:sticky lg:top-[calc(var(--nav-h)+48px)] lg:col-span-6">
          <Reveal as="p" className="text-micro font-medium uppercase text-accent">
            On any phone
          </Reveal>
          <SplitLines id="phone-title" as="h2" text={'Dial.\nNumbers only.'} className="mt-4 text-h2 font-semibold" />
          <Reveal delay={0.1} as="p" className="mt-6 max-w-lg text-lead text-fg2">
            In Kitui or Turkana, no laptop and no Wi-Fi should not mean no future. Dial{' '}
            <span className="whitespace-nowrap font-mono text-fg">{USSD_SERVICE_CODE}</span> and press call.
          </Reveal>

          <dl className="mt-12 grid gap-x-8 gap-y-7 sm:grid-cols-2">
            {POINTS.map((p, i) => (
              <Reveal key={p.k} delay={0.05 * i}>
                <dt className="text-[17px] font-semibold tracking-tight">{p.k}</dt>
                <dd className="mt-1.5 text-[15px] leading-relaxed text-fg2">{p.v}</dd>
              </Reveal>
            ))}
          </dl>
        </div>

        <div className="lg:col-span-6">
          <UssdSimulator />
        </div>
      </div>
    </ScrollChapter>
  );
}
