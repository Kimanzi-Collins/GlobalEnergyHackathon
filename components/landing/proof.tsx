import { ScrollChapter } from '@/components/motion/scroll-chapter';
import { Reveal } from '@/components/motion/reveal';
import { Odometer } from '@/components/motion/odometer';

const STATS = [
  { value: '5,337', k: 'Kenyans studying in the US', src: 'Open Doors report' },
  { value: '20', k: 'illegal agencies flagged by CUE', src: 'January 2026' },
  { value: '0', k: 'dollars to submit a Common App', src: 'Free with a fee waiver, where eligible' },
];

/** Three numbers in monumental type. Digits roll once when scrolled into view. */
export function Proof() {
  return (
    <ScrollChapter chapter="paper" aria-label="Why Pepea" className="px-[clamp(16px,4vw,48px)] py-[clamp(72px,12vw,176px)]">
      <div className="mx-auto grid max-w-[1280px] gap-14 md:grid-cols-3 md:gap-8">
        {STATS.map((s, i) => (
          <Reveal key={s.k} delay={0.08 * i}>
            <p className="text-[clamp(4.5rem,2rem+9vw,10rem)] font-semibold leading-[0.9] tracking-[-0.05em]">
              <Odometer value={s.value} />
            </p>
            <p className="mt-4 text-lead font-medium">{s.k}</p>
            <p className="mt-1 text-sm text-fg2">{s.src}</p>
          </Reveal>
        ))}
      </div>
    </ScrollChapter>
  );
}
