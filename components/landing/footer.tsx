import { ScrollChapter } from '@/components/motion/scroll-chapter';
import { USSD_SERVICE_CODE } from '@/lib/constants';

/** Footer with a monumental wordmark cropped by the page edge. */
export function Footer() {
  return (
    <ScrollChapter chapter="dark" className="overflow-hidden px-[clamp(16px,4vw,48px)] pt-[clamp(64px,9vw,128px)]">
      <div className="mx-auto max-w-[1280px]">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="text-h3 font-semibold">Free for every Kenyan student.</p>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-fg2">
              Named for the Kennedy-Mboya Airlift of 1959 to 1963, which sent Kenya&apos;s first generation of scholars to US universities. <em className="not-italic">Ng&apos;ambo</em> means the other side.
            </p>
          </div>

          <dl className="grid gap-6 sm:grid-cols-3 md:col-span-7">
            <div>
              <dt className="text-micro font-medium uppercase text-fg2">Any phone</dt>
              <dd className="mt-2 font-mono text-[15px]">{USSD_SERVICE_CODE}</dd>
            </div>
            <div>
              <dt className="text-micro font-medium uppercase text-fg2">Messaging</dt>
              <dd className="mt-2 text-[15px]">WhatsApp and SMS</dd>
            </div>
            <div>
              <dt className="text-micro font-medium uppercase text-fg2">Online</dt>
              <dd className="mt-2 text-[15px]">Web dashboard</dd>
            </div>
          </dl>
        </div>

        <p className="mt-14 max-w-3xl text-sm leading-relaxed text-fg2">
          Pepea gives guidance, not guarantees. GPA conversions are indicative. Check every school, fee and deadline on the official website. Built for the Africa&apos;s Talking Hackathon, October 2026.
        </p>
      </div>

      {/* Wordmark, cropped at the bottom edge */}
      <div
        aria-hidden="true"
        data-wordmark="Pepea"
        className="wordmark mx-auto mt-10 max-w-[1280px] select-none text-center text-[clamp(7rem,28vw,26rem)] font-semibold leading-[0.74] tracking-[-0.07em] text-fg/[0.09] [margin-bottom:-0.12em]"
      />
    </ScrollChapter>
  );
}
