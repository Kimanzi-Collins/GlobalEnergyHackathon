'use client';

import { useMemo, useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { ScrollChapter } from '@/components/motion/scroll-chapter';
import { Reveal } from '@/components/motion/reveal';
import { SplitLines } from '@/components/motion/split-lines';
import { Input } from '@/components/ui/input';
import { useLiteMotion } from '@/components/motion/use-motion-prefs';
import { MOCK_FLAGGED_AGENCIES } from '@/lib/mock-data';
import { EASE } from '@/lib/motion';

/**
 * Scam radar. Searches the CUE January 2026 flagged list (currently the offline copy in lib/mock-data;
 * BE-API-11 moves this to the database). A name that is NOT on the list is not proof of legitimacy.
 */
export function CueRadar() {
  const lite = useLiteMotion();
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();

  const matches = useMemo(
    () =>
      query.length < 2
        ? []
        : MOCK_FLAGGED_AGENCIES.filter(
            (a) => a.entity_name.toLowerCase().includes(query) || a.location_city.toLowerCase().includes(query)
          ),
    [query]
  );

  return (
    <ScrollChapter chapter="wash" id="safety" aria-labelledby="safety-title" className="px-[clamp(16px,4vw,48px)] py-[clamp(72px,12vw,176px)]">
      <div className="mx-auto grid max-w-[1280px] gap-[clamp(32px,5vw,80px)] lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Reveal as="p" className="text-micro font-medium uppercase text-accent">
            Stay safe
          </Reveal>
          <SplitLines id="safety-title" as="h2" text={'Applying is free.\nNever pay to submit.'} className="mt-4 text-h2 font-semibold" />
          <Reveal delay={0.1} as="p" className="mt-6 max-w-md text-lead text-fg2">
            In January 2026 the Commission for University Education flagged 20 illegal recruitment agencies. Check a name before you pay anyone.
          </Reveal>
        </div>

        <Reveal delay={0.08} className="lg:col-span-7">
          <div className="rounded-4xl bg-surface p-[clamp(20px,2.5vw,36px)] ring-1 ring-inset ring-line/10">
            <Input
              label="Agency or college name"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="For example: Globwise"
              hint="We search the CUE flagged list from January 2026."
              autoComplete="off"
            />

            <div className="mt-6 min-h-[11rem]" aria-live="polite">
              <AnimatePresence mode="wait" initial={false}>
                {query.length < 2 ? (
                  <m.p
                    key="idle"
                    initial={lite ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: EASE.quartOut }}
                    className="text-[15px] text-fg2"
                  >
                    Type at least two letters. Common App is free to submit, and fee waivers and EducationUSA advising are free too.
                  </m.p>
                ) : matches.length > 0 ? (
                  <m.ul
                    key="hit"
                    initial={lite ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: EASE.expoOut }}
                    className="space-y-3"
                  >
                    {matches.map((a) => (
                      <li key={a.id} className="rounded-2xl bg-bg p-4 ring-1 ring-inset ring-accent/40">
                        <p className="flex flex-wrap items-center gap-2 font-semibold">
                          {a.entity_name}
                          <span className="rounded-full bg-accent px-2.5 py-1 text-micro font-medium uppercase text-accent-fg">
                            Flagged by CUE
                          </span>
                        </p>
                        <p className="mt-1 text-sm text-fg2">
                          {a.location_city} · {a.cue_notice_date}
                        </p>
                        <p className="mt-2 text-[15px]">{a.warning_reason}</p>
                      </li>
                    ))}
                    <li className="text-sm text-fg2">Do not pay this organisation. Real application forms are free.</li>
                  </m.ul>
                ) : (
                  <m.div
                    key="miss"
                    initial={lite ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: EASE.expoOut }}
                    className="rounded-2xl bg-bg p-4 ring-1 ring-inset ring-line/15"
                  >
                    <p className="font-semibold">Not on the list</p>
                    <p className="mt-1 text-[15px] text-fg2">
                      That is not proof it is legitimate. Confirm with EducationUSA, and never pay to submit an application.
                    </p>
                  </m.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </Reveal>
      </div>
    </ScrollChapter>
  );
}
