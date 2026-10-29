'use client';

import { useMemo, useState } from 'react';
import { m } from 'framer-motion';
import { ScrollChapter } from '@/components/motion/scroll-chapter';
import { Reveal } from '@/components/motion/reveal';
import { SplitLines } from '@/components/motion/split-lines';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useLiteMotion } from '@/components/motion/use-motion-prefs';
import { ESSAY_CATALOG, SAMPLE_SCORES, totalOf } from '@/lib/fixtures/essays';
import { EASE } from '@/lib/motion';
import { cn } from '@/lib/utils';
import type { EssayTypeCode } from '@/lib/types';

const SCOPE_LABEL = {
  common: 'Same for every school',
  school_specific: 'Different at each school',
  scholarship: 'For a scholarship',
  aid: 'For financial aid',
} as const;

/** Interactive picker that shows how essays split by type and by school. Mirrors the dashboard flow. */
export function EssaysSection() {
  const lite = useLiteMotion();
  const [typeCode, setTypeCode] = useState<EssayTypeCode>('why_us');
  const [schoolId, setSchoolId] = useState<string | null>(null);

  const type = ESSAY_CATALOG.types.find((t) => t.code === typeCode)!;
  const needsSchool = type.scope === 'school_specific';

  const schools = useMemo(
    () => ESSAY_CATALOG.schools.filter((s) => s.prompts.some((p) => p.essayType === typeCode)),
    [typeCode]
  );

  const activeSchool = needsSchool ? schools.find((s) => s.university.id === schoolId) ?? schools[0] : null;
  const prompt = activeSchool?.prompts.find((p) => p.essayType === typeCode);
  const scores = SAMPLE_SCORES[typeCode] ?? {};
  const total = totalOf(type.rubric, scores);
  const wordLimit = prompt?.wordLimit ?? type.defaultWordLimit;
  const replayKey = `${typeCode}-${activeSchool?.university.id ?? 'any'}`;

  return (
    <ScrollChapter chapter="light" id="essays" aria-labelledby="essays-title" className="px-[clamp(16px,4vw,48px)] py-[clamp(72px,12vw,176px)]">
      <div className="mx-auto max-w-[1280px]">
        <Reveal as="p" className="text-micro font-medium uppercase text-accent">
          Essays
        </Reveal>
        <SplitLines id="essays-title" as="h2" text={'By type.\nBy school.'} className="mt-4 text-h2 font-semibold" />
        <Reveal delay={0.1} as="p" className="mt-6 max-w-xl text-lead text-fg2">
          A personal statement is judged one way. A &ldquo;why us&rdquo; essay another. Pepea reviews each against its own rubric and its own prompt.
        </Reveal>

        <div className="mt-[clamp(40px,6vw,88px)] grid gap-5 lg:grid-cols-12">
          {/* Pickers */}
          <Reveal className="lg:col-span-5">
            <Card className="h-full p-[clamp(20px,2.5vw,36px)]">
              <p className="text-micro font-medium uppercase text-fg2">1. Pick the essay</p>
              <div role="radiogroup" aria-label="Essay type" className="mt-4 flex flex-wrap gap-2">
                {ESSAY_CATALOG.types.map((t) => {
                  const on = t.code === typeCode;
                  return (
                    <button
                      key={t.code}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => {
                        setTypeCode(t.code);
                        setSchoolId(null);
                      }}
                      className={cn(
                        'h-11 rounded-full px-4 text-[15px] font-medium ring-1 ring-inset transition-[transform,background-color,color] duration-200 ease-quart-out active:scale-95',
                        on ? 'bg-fg text-bg ring-transparent' : 'bg-bg text-fg ring-line/15 hover:ring-line/35'
                      )}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-sm text-fg2">{SCOPE_LABEL[type.scope]}</p>

              <p className="mt-9 text-micro font-medium uppercase text-fg2">2. Pick the school</p>
              {needsSchool ? (
                <div role="radiogroup" aria-label="School" className="mt-4 flex flex-wrap gap-2">
                  {schools.map((s) => {
                    const on = s.university.id === activeSchool?.university.id;
                    return (
                      <button
                        key={s.university.id}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => setSchoolId(s.university.id)}
                        className={cn(
                          'h-11 rounded-full px-4 text-[15px] font-medium ring-1 ring-inset transition-[transform,background-color,color] duration-200 ease-quart-out active:scale-95',
                          on ? 'bg-accent text-accent-fg ring-transparent' : 'bg-bg text-fg ring-line/15 hover:ring-line/35'
                        )}
                      >
                        {s.university.name}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-4 text-[15px] text-fg2">No school needed. You write this one once and use it everywhere it applies.</p>
              )}
            </Card>
          </Reveal>

          {/* Preview */}
          <Reveal delay={0.08} className="lg:col-span-7">
            <Card className="h-full p-[clamp(20px,2.5vw,36px)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-micro font-medium uppercase text-fg2">
                    {activeSchool ? `${activeSchool.university.name} · ${prompt?.title}` : type.label}
                  </p>
                  <p key={replayKey} className="mt-3 min-h-[6.5rem] max-w-xl animate-rise font-medium leading-snug tracking-tight text-[clamp(1.1rem,0.9rem+0.9vw,1.5rem)]">
                    {prompt
                      ? `“${prompt.promptText}”`
                      : 'One story, told through a small, specific moment. Explain anything a US reader would not know.'}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="tnum text-[clamp(2.5rem,5vw,4rem)] font-semibold leading-none tracking-tight">{total}</p>
                  <p className="mt-1 text-micro uppercase text-fg2">Sample score</p>
                </div>
              </div>

              <p className="tnum mt-4 text-sm text-fg2">
                {wordLimit ? `${wordLimit} words` : ''}
                {prompt && prompt.dataVerifiedAt === null && (
                  <Badge kind="unverified" className="ml-3">
                    Unverified prompt
                  </Badge>
                )}
              </p>

              <div key={replayKey} className="mt-7 space-y-4">
                {type.rubric.map((r, i) => {
                  const v = scores[r.key] ?? 0;
                  return (
                    <div key={r.key}>
                      <div className="mb-1.5 flex justify-between text-[13px] text-fg2">
                        <span>{r.label}</span>
                        <span className="tnum">
                          {v} / {r.max}
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-fg/10">
                        <m.div
                          className="h-full origin-left rounded-full bg-accent"
                          style={{ width: `${(v / r.max) * 100}%` }}
                          initial={lite ? false : { scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ duration: 1.1, delay: 0.1 + i * 0.08, ease: EASE.expoOut }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="mt-8 text-sm text-fg2">
                Sample scores for illustration. Pepea points to what to fix and never writes your essay.
              </p>
            </Card>
          </Reveal>
        </div>
      </div>
    </ScrollChapter>
  );
}
