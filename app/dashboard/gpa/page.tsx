'use client';

import React, { useMemo, useState } from 'react';
import { Calculator, Copy, Check, Save } from 'lucide-react';
import { useStudentSession } from '@/lib/session-context';
import { mockGradeBands } from '@/lib/fixtures';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { Reveal } from '@/components/motion/reveal';
import { PageHero } from '@/components/dashboard/page-hero';
import { Panel } from '@/components/dashboard/panel';
import { Stat } from '@/components/dashboard/stat';
import { Segmented } from '@/components/dashboard/segmented';
import { USSD_SERVICE_CODE } from '@/lib/constants';
import { cn } from '@/lib/utils';

type Mode = 'grade' | 'points';

const MIN_POINTS = 7;
const MAX_POINTS = 84;

/** KCSE mean grade or aggregate points to an indicative US GPA, with the sentence to paste into an application. */
export default function GpaConverterPage() {
  const { student, updateProfile } = useStudentSession();
  const { push } = useToast();

  const [mode, setMode] = useState<Mode>('grade');
  const [selectedGrade, setSelectedGrade] = useState<string>(student.kcseGrade || 'B+');
  const [points, setPoints] = useState<number>(student.kcsePoints || 70);
  const [copied, setCopied] = useState(false);

  const band = useMemo(
    () =>
      mode === 'grade'
        ? mockGradeBands.find((b) => b.grade === selectedGrade) ?? mockGradeBands[2]
        : mockGradeBands.find((b) => points >= b.aggregateMin && points <= b.aggregateMax) ?? mockGradeBands[mockGradeBands.length - 1],
    [mode, selectedGrade, points]
  );

  const selectGrade = (grade: string) => {
    setSelectedGrade(grade);
    const b = mockGradeBands.find((x) => x.grade === grade);
    if (b) setPoints(b.aggregateMax);
  };

  const changePoints = (value: number) => {
    setPoints(value);
    const b = mockGradeBands.find((x) => value >= x.aggregateMin && value <= x.aggregateMax);
    if (b) setSelectedGrade(b.grade);
  };

  const save = () => {
    updateProfile({ kcseGrade: band.grade, kcsePoints: points, gpaEquivalent: band.gpa40 });
    push({ title: 'Saved to your profile', description: `KCSE ${band.grade}, about ${band.gpa40.toFixed(2)} GPA. Every tool will use it.` });
  };

  const snippet = `In Kenya's KCSE examination (taken at Form 4), candidate scores are evaluated on an 84-point aggregate across 7 subjects, with an A representing under 2% of test-takers nationally. My KCSE mean grade of ${band.grade} (${points}/84 aggregate points) translates to an indicative unweighted US 4.0 GPA equivalent of approximately ${band.gpa40.toFixed(2)}. Official KNEC certificates and verified secondary school transcripts are provided directly by my school headteacher.`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      push({ title: 'Copied', description: 'Paste it into the Additional Information section of the Common App.' });
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      push({ title: 'Could not copy', description: 'Select the text and copy it by hand.' });
    }
  };

  const fill = ((points - MIN_POINTS) / (MAX_POINTS - MIN_POINTS)) * 100;
  const ordered = [...mockGradeBands].reverse(); // E on the left, A on the right: the chart climbs

  return (
    <div>
      <PageHero
        eyebrow="KCSE to GPA"
        icon={Calculator}
        title={'Your 84 points,\nin US terms.'}
        accentWord="US"
        description="An honest, indicative conversion for the Common App. It is an estimate, not an official evaluation, so always report your real KCSE grades."
        aside={<Badge kind="indicative" className="px-3 py-1.5" />}
      />

      <div className="grid gap-4 lg:grid-cols-12 lg:gap-5">
        {/* Input */}
        <Reveal className="lg:col-span-5">
          <Panel eyebrow="Your result" title="Choose your grade" className="h-full">
            <Segmented
              ariaLabel="How do you want to enter your result?"
              value={mode}
              onChange={setMode}
              options={[
                { value: 'grade', label: 'Mean grade' },
                { value: 'points', label: 'Total points' },
              ]}
            />

            {mode === 'grade' ? (
              <div role="radiogroup" aria-label="KCSE mean grade" className="mt-7 grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                {mockGradeBands.map((b) => {
                  const on = b.grade === selectedGrade;
                  return (
                    <button
                      key={b.grade}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => selectGrade(b.grade)}
                      className={cn(
                        'group rounded-2xl px-3 py-3.5 text-left ring-1 ring-inset transition-[background-color,color,transform,box-shadow] duration-300 ease-quart-out active:scale-[0.96]',
                        on ? 'bg-fg text-bg ring-transparent' : 'bg-bg/40 text-fg ring-line/15 hover:ring-line/35'
                      )}
                    >
                      <span className="block text-[1.6rem] font-semibold leading-none tracking-tight">{b.grade}</span>
                      <span className={cn('tnum mt-2 block text-xs', on ? 'text-bg/60' : 'text-fg2')}>{b.gpa40.toFixed(2)}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="mt-7">
                <p className="tnum flex items-baseline gap-2 text-[clamp(3.5rem,2.5rem+4vw,5.5rem)] font-semibold leading-none tracking-[-0.05em]">
                  {points}
                  <span className="text-lg font-medium tracking-normal text-fg2">/ {MAX_POINTS}</span>
                </p>
                <label htmlFor="points" className="sr-only">
                  KCSE aggregate points, from {MIN_POINTS} to {MAX_POINTS}
                </label>
                <input
                  id="points"
                  type="range"
                  min={MIN_POINTS}
                  max={MAX_POINTS}
                  value={points}
                  onChange={(e) => changePoints(parseInt(e.target.value, 10))}
                  className="pepea-range mt-8"
                  style={{ '--p': `${fill}%` } as React.CSSProperties}
                />
                <div className="mt-3 flex justify-between text-sm text-fg2">
                  <span>{MIN_POINTS}</span>
                  <span>{MAX_POINTS}</span>
                </div>
              </div>
            )}

            <p className="mt-7 text-sm leading-relaxed text-fg2">
              On a phone? Dial <span className="font-mono text-fg">{USSD_SERVICE_CODE}</span> and choose <span className="font-medium text-fg">2</span>.
            </p>
          </Panel>
        </Reveal>

        {/* Result */}
        <Reveal delay={0.08} className="lg:col-span-7">
          <Panel glow eyebrow="Your US GPA" className="h-full" bodyClassName="flex h-full flex-col">
            <div key={band.grade + points} className="flex flex-wrap items-end justify-between gap-6">
              <Stat label="Indicative, unweighted" value={band.gpa40.toFixed(2)} size="hero" gradient />
              <div className="pb-2 sm:text-right">
                <p className="text-[clamp(2rem,1.6rem+1.6vw,3rem)] font-semibold leading-none tracking-[-0.04em]">KCSE {band.grade}</p>
                <p className="tnum mt-2 text-sm text-fg2">
                  {band.aggregateMin} to {band.aggregateMax} points · {band.pointsPerSubject} per subject
                </p>
              </div>
            </div>

            {/* Band chart: the whole scale at a glance; click a bar to choose it */}
            <div className="mt-auto pt-10">
              <div className="flex h-36 items-end gap-1.5 sm:gap-2" role="group" aria-label="All KCSE grade bands">
                {ordered.map((b) => {
                  const on = b.grade === band.grade;
                  return (
                    <button
                      key={b.grade}
                      type="button"
                      onClick={() => {
                        setMode('grade');
                        selectGrade(b.grade);
                      }}
                      aria-label={`KCSE ${b.grade}, ${b.gpa40.toFixed(2)} GPA`}
                      aria-pressed={on}
                      className="group relative flex h-full flex-1 items-end"
                    >
                      <span
                        className={cn(
                          'block w-full rounded-t-xl transition-[background-color,transform] duration-500 ease-expo-out group-hover:bg-fg/25',
                          on ? 'bg-accent' : 'bg-fg/15'
                        )}
                        style={{ height: `${Math.max(4, (b.gpa40 / 4) * 100)}%` }}
                      />
                    </button>
                  );
                })}
              </div>
              <div className="mt-2.5 flex gap-1.5 sm:gap-2">
                {ordered.map((b) => (
                  <span key={b.grade} className={cn('flex-1 text-center text-[11px] font-medium', b.grade === band.grade ? 'text-accent' : 'text-fg2')}>
                    {b.grade}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button onClick={save}>
                <Save className="h-4 w-4" />
                Save to my profile
              </Button>
            </div>
          </Panel>
        </Reveal>
      </div>

      {/* The sentence */}
      <Reveal className="mt-4 lg:mt-5">
        <Panel
          eyebrow="For your application"
          title="Say it to a US reader"
          action={
            <Button variant="secondary" size="sm" onClick={copy}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          }
        >
          <blockquote className="max-w-3xl border-l-2 border-accent/60 pl-5 text-[17px] leading-[1.7] text-fg/90">{snippet}</blockquote>
          <p className="mt-6 text-sm text-fg2">
            Paste this into the Additional Information section. A US admissions officer has never seen the 84-point scale, so one sentence of context helps.
          </p>
        </Panel>
      </Reveal>
    </div>
  );
}
