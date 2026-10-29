'use client';

import { useRef } from 'react';
import { m, useScroll, useTransform } from 'framer-motion';
import { ScrollChapter } from '@/components/motion/scroll-chapter';
import { SplitLines } from '@/components/motion/split-lines';
import { Button } from '@/components/ui/button';
import { useLiteMotion } from '@/components/motion/use-motion-prefs';
import { USSD_SERVICE_CODE } from '@/lib/constants';
import { Countdown } from './countdown';
import { HeroPhone } from './hero-phone';

/**
 * CSS entrance (starts at first paint, before React hydrates). The countdown and lead paragraph are
 * deliberately NOT animated: they must paint on the first frame so LCP is early.
 */
const rise = (delay: number): React.CSSProperties => ({ animationDelay: `${delay}s` });

/** Landing hero: the headline is the hero image, the phone is the product. */
export function Hero() {
  const lite = useLiteMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  // Decorative parallax only (never on text).
  const phoneY = useTransform(scrollYProgress, [0, 1], [0, -70]);

  return (
    <ScrollChapter chapter="light" id="top" className="overflow-hidden pt-[calc(var(--nav-h)+clamp(40px,9vh,120px))]">
      <div ref={ref} className="mx-auto max-w-[1280px] px-[clamp(16px,4vw,48px)]">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-sm text-fg2">
            Early deadlines close in{' '}
            <span className="font-medium text-accent">
              <Countdown />
            </span>
          </p>

          <SplitLines
            as="h1"
            trigger="mount"
            delay={0}
            text={'From 84 points\nto 4.0.'}
            accent={{ words: ['4.0'], className: 'bg-gradient-to-r from-murram via-[#D2581E] to-saffron bg-clip-text text-transparent' }}
            className="mt-5 text-h1 font-semibold"
          />

          <p className="mx-auto mt-6 max-w-2xl text-lead text-fg2">
            Free guidance for Kenyan students applying to US universities. On any phone, in any county.
          </p>

          <div className="mt-9 flex animate-rise flex-wrap items-center justify-center gap-x-8 gap-y-4" style={rise(0.1)}>
            <Button href="#phone" size="lg" magnetic>
              Try it on a phone
            </Button>
            <Button href="#tools" variant="link" className="text-[17px]">
              See the six tools <span aria-hidden="true">&rsaquo;</span>
            </Button>
          </div>

          <p className="mt-4 animate-rise text-sm text-fg2" style={rise(0.2)}>
            <span className="font-mono">{USSD_SERVICE_CODE}</span> works without data.
          </p>
        </div>

        {/* Product peek: the phone rises into view and is cropped by the section edge. */}
        {/* Transform-only entrance: the phone is visible from first paint, which keeps LCP early. */}
        <div className="animate-lift">
          <m.div
            style={{ y: lite ? 0 : phoneY }}
            className="relative mx-auto mt-[clamp(40px,8vh,96px)] h-[clamp(22rem,52vw,34rem)] overflow-hidden [mask-image:linear-gradient(to_bottom,black_72%,transparent)]"
          >
            <HeroPhone />
          </m.div>
        </div>
      </div>
    </ScrollChapter>
  );
}
