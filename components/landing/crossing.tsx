'use client';

import { useRef } from 'react';
import { m, useScroll, useTransform } from 'framer-motion';
import { ScrollChapter } from '@/components/motion/scroll-chapter';
import { Reveal } from '@/components/motion/reveal';
import { useLiteMotion } from '@/components/motion/use-motion-prefs';
import { USSD_SERVICE_CODE } from '@/lib/constants';
import { RouteArc } from './route-arc';

/** Display numerals scale with viewport height so caption and route never collide; padding keeps the last glyph from clipping. */
const NUMERAL = 'tnum pr-[0.08em] text-[clamp(4.5rem,min(16vw,24vh),17rem)] font-semibold leading-[0.88] tracking-[-0.06em]';

const GRADIENT = 'bg-gradient-to-r from-saffron via-[#F08A3C] to-[#E8623A] bg-clip-text text-transparent';

const CAPTIONS = [
  'An A. 82 out of 84. In Kenya, that is the top of the country.',
  'In Cambridge, nobody has seen that scale before.',
  'Pepea makes it readable. Free, on any phone.',
];

/**
 * THE CROSSING (signature moment). A pinned scroll sequence: the KCSE result 82/84 rolls into 4.0
 * while a dotted route is drawn from Nairobi to Cambridge. Transform and opacity only.
 * Reduced-motion and Save-Data visitors get a static version with the same content.
 */
export function Crossing() {
  const lite = useLiteMotion();
  return lite ? <CrossingStatic /> : <CrossingStage />;
}

function CrossingStage() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] });

  // Numeral A: 82/84 enters, holds, then rolls up and out. Numeral B: 4.0 rolls in from below.
  const aOpacity = useTransform(p, [0.04, 0.18, 0.34, 0.5], [0, 1, 1, 0]);
  const aY = useTransform(p, [0.04, 0.18, 0.34, 0.5], ['5vh', '0vh', '0vh', '-6vh']);
  const aScale = useTransform(p, [0.34, 0.5], [1, 0.93]);
  const bOpacity = useTransform(p, [0.4, 0.58], [0, 1]);
  const bY = useTransform(p, [0.4, 0.58], ['6vh', '0vh']);
  const bScale = useTransform(p, [0.4, 0.58], [1.07, 1]);

  const c1 = useTransform(p, [0.03, 0.12, 0.28, 0.36], [0, 1, 1, 0]);
  const c2 = useTransform(p, [0.38, 0.46, 0.64, 0.72], [0, 1, 1, 0]);
  const c3 = useTransform(p, [0.76, 0.84, 1, 1], [0, 1, 1, 1]);
  const c1y = useTransform(p, [0.03, 0.12], [16, 0]);
  const c2y = useTransform(p, [0.38, 0.46], [16, 0]);
  const c3y = useTransform(p, [0.76, 0.84], [16, 0]);

  return (
    <ScrollChapter chapter="dark" id="crossing" aria-labelledby="crossing-title">
      <div ref={ref} className="h-[340vh]">
        <div className="sticky top-0 flex h-[100svh] flex-col justify-between overflow-hidden px-[clamp(16px,4vw,48px)] pb-[4vh] pt-[calc(var(--nav-h)+4vh)]">
          <p id="crossing-title" className="text-micro font-medium uppercase text-fg2">
            The crossing
          </p>

          {/* Numerals */}
          <div className="grid place-items-center text-center">
            <m.div style={{ opacity: aOpacity, y: aY, scale: aScale }} className="col-start-1 row-start-1 will-change-transform">
              <p className="text-lead text-fg2">KCSE mean grade A</p>
              <p className={NUMERAL}>82/84</p>
            </m.div>
            <m.div style={{ opacity: bOpacity, y: bY, scale: bScale }} className="col-start-1 row-start-1 will-change-transform">
              <p className="text-lead text-fg2">US GPA, indicative</p>
              <p className={`${NUMERAL} ${GRADIENT}`}>4.0</p>
            </m.div>
          </div>

          {/* Captions */}
          <div className="relative mx-auto h-[7.5rem] w-full max-w-2xl text-center">
            {[c1, c2, c3].map((opacity, i) => (
              <m.p
                key={i}
                style={{ opacity, y: [c1y, c2y, c3y][i] }}
                className="absolute inset-0 flex flex-col items-center justify-center text-h3 font-medium"
              >
                {CAPTIONS[i]}
                {i === 2 && (
                  <span className="mt-3 font-mono text-base text-accent">Dial {USSD_SERVICE_CODE}</span>
                )}
              </m.p>
            ))}
          </div>

          <div className="mx-auto w-full max-w-5xl text-fg">
            <RouteArc progress={p} from={0.3} to={0.86} className="mx-auto max-h-[28vh]" />
          </div>
        </div>
      </div>
    </ScrollChapter>
  );
}

function CrossingStatic() {
  return (
    <ScrollChapter chapter="dark" id="crossing" aria-labelledby="crossing-title" className="px-[clamp(16px,4vw,48px)] py-[clamp(72px,12vw,176px)]">
      <div className="mx-auto max-w-5xl">
        <p id="crossing-title" className="text-micro font-medium uppercase text-fg2">
          The crossing
        </p>
        <Reveal className="mt-8 text-center">
          <p className="text-lead text-fg2">KCSE mean grade A, 82 out of 84</p>
          <p className={NUMERAL}>
            <span className={GRADIENT}>4.0</span>
          </p>
          <p className="text-lead text-fg2">US GPA, indicative</p>
        </Reveal>
        <div className="mt-12 text-fg">
          <RouteArc />
        </div>
        <ul className="mt-12 grid gap-6 text-center md:grid-cols-3">
          {CAPTIONS.map((c, i) => (
            <li key={i} className="text-h3 font-medium">
              {c}
              {i === 2 && <span className="mt-3 block font-mono text-base text-accent">Dial {USSD_SERVICE_CODE}</span>}
            </li>
          ))}
        </ul>
      </div>
    </ScrollChapter>
  );
}
