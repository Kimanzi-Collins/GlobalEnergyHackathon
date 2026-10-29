'use client';

import React, { useState } from 'react';
import { ArrowUpRight, Check, ChevronDown, Clock, Compass } from 'lucide-react';
import { mockGuideSteps } from '@/lib/fixtures';
import type { GuidePhase, ProgressStatus } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { Reveal } from '@/components/motion/reveal';
import { PageHero } from '@/components/dashboard/page-hero';
import { ProgressRing } from '@/components/dashboard/progress-ring';
import { USSD_SERVICE_CODE } from '@/lib/constants';
import { cn } from '@/lib/utils';

const PHASES: Array<{ key: GuidePhase; title: string; subtitle: string }> = [
  { key: 'prepare', title: 'Foundations', subtitle: 'How holistic admissions work, converting your grades, planning tests.' },
  { key: 'choose', title: 'Choose schools', subtitle: 'A balanced list of reach, target and likely schools that fit your finances.' },
  { key: 'apply', title: 'Apply', subtitle: 'The Common App, essays, recommendations and fee waivers.' },
  { key: 'fund', title: 'Pay for it', subtitle: 'CSS Profile, school aid forms and scholarship applications.' },
  { key: 'decide', title: 'Decide', subtitle: 'Compare aid offers and choose where to enrol.' },
  { key: 'visa', title: 'Visa', subtitle: 'I-20, the SEVIS fee and your interview at the US Embassy in Nairobi.' },
];

const statusText: Record<ProgressStatus, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  done: 'Done',
  skipped: 'Skipped',
};

/** The full application guide as a timeline. Progress is kept in this page until the guide API ships (BE-API-03). */
export default function GuidePage() {
  const { push } = useToast();
  const [steps, setSteps] = useState(mockGuideSteps);
  const [open, setOpen] = useState<string>('step_3');

  const done = steps.filter((s) => s.status === 'done').length;
  const total = steps.length;

  const toggle = (id: string) => {
    const step = steps.find((s) => s.id === id);
    if (!step) return;
    const next: ProgressStatus = step.status === 'done' ? 'todo' : 'done';
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, status: next } : s)));
    if (next === 'done') push({ title: 'Step complete', description: step.title });
  };

  // Number what is on screen: phases without steps are skipped, and steps count 1 to N in reading order.
  const phases = PHASES.filter((p) => steps.some((s) => s.phase === p.key));
  const stepNumber = new Map<string, number>();
  phases.forEach((p) => steps.filter((s) => s.phase === p.key).forEach((s) => stepNumber.set(s.id, stepNumber.size + 1)));

  const go = (key: GuidePhase) => document.getElementById(`phase-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div>
      <PageHero
        eyebrow="Application guide"
        icon={Compass}
        title={'Twelve steps.\nOne at a time.'}
        accentWord="time."
        description="A free, scam-free route from your KCSE results to a US admission, in the order that works. Nothing here needs an agent."
        aside={
          <div className="flex items-center gap-5">
            <ProgressRing value={done / total} size={108} stroke={9} label={`${done} of ${total} steps done`}>
              <span className="tnum text-[1.75rem] font-semibold leading-none tracking-tight">
                {done}
                <span className="text-sm font-medium text-fg2">/{total}</span>
              </span>
            </ProgressRing>
            <p className="max-w-[10rem] text-sm leading-snug text-fg2">
              {done === total ? 'Everything is done. Well played.' : `${total - done} steps to go. Take the next one today.`}
            </p>
          </div>
        }
      />

      <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
        {/* Phase index */}
        <nav aria-label="Phases" className="hidden lg:col-span-3 lg:block">
          <ul className="sticky top-10 space-y-1">
            {phases.map((p, i) => {
              const ps = steps.filter((s) => s.phase === p.key);
              const pd = ps.filter((s) => s.status === 'done').length;
              return (
                <li key={p.key}>
                  <button
                    type="button"
                    onClick={() => go(p.key)}
                    className="group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors duration-300 hover:bg-fg/5"
                  >
                    <span className="tnum w-6 text-sm font-medium text-fg2">{String(i + 1).padStart(2, '0')}</span>
                    <span className="flex-1 text-[15px] font-medium">{p.title}</span>
                    <span className={cn('tnum text-sm', pd === ps.length ? 'text-phosphor' : 'text-fg2')}>
                      {pd}/{ps.length}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Timeline */}
        <div className="space-y-14 lg:col-span-9">
          {phases.map((p, i) => {
            const ps = steps.filter((s) => s.phase === p.key);
            return (
              <section key={p.key} id={`phase-${p.key}`} aria-labelledby={`h-${p.key}`} className="scroll-mt-10">
                <Reveal>
                  <div className="mb-6 flex items-end gap-5">
                    <span aria-hidden="true" className="tnum text-[clamp(3.5rem,2.5rem+4vw,6rem)] font-semibold leading-[0.8] tracking-[-0.06em] text-fg/15">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="pb-1">
                      <h2 id={`h-${p.key}`} className="text-[clamp(1.5rem,1.2rem+1.2vw,2.25rem)] font-semibold leading-tight tracking-[-0.03em]">
                        {p.title}
                      </h2>
                      <p className="mt-1.5 max-w-xl text-[15px] leading-snug text-fg2">{p.subtitle}</p>
                    </div>
                  </div>
                </Reveal>

                <ol>
                  {ps.map((s) => {
                    const isDone = s.status === 'done';
                    const isOpen = open === s.id;
                    return (
                      <li key={s.id} className="relative pl-14">
                        {/* spine */}
                        <span
                          aria-hidden="true"
                          className={cn('absolute bottom-0 left-[19px] top-0 w-px transition-colors duration-700', isDone ? 'bg-phosphor/50' : 'bg-line/15')}
                        />
                        {/* node: big tap target that toggles done */}
                        <button
                          type="button"
                          onClick={() => toggle(s.id)}
                          aria-pressed={isDone}
                          aria-label={isDone ? `Mark "${s.title}" as not done` : `Mark "${s.title}" as done`}
                          className={cn(
                            'absolute left-0 top-5 grid h-10 w-10 place-items-center rounded-full ring-1 ring-inset transition-[background-color,color,transform] duration-500 ease-expo-out active:scale-90',
                            isDone
                              ? 'bg-phosphor text-ink ring-transparent'
                              : s.status === 'in_progress'
                              ? 'bg-bg text-accent ring-accent/70'
                              : 'bg-bg text-fg2 ring-line/25 hover:ring-line/50'
                          )}
                        >
                          {isDone ? <Check className="h-4 w-4" strokeWidth={3} /> : <span className="tnum text-sm font-semibold">{stepNumber.get(s.id)}</span>}
                        </button>

                        <div className={cn('mb-3 rounded-3xl ring-1 ring-inset transition-[background-color,box-shadow] duration-500', isOpen ? 'bg-surface ring-line/20' : 'ring-transparent hover:bg-fg/[0.03]')}>
                          <button
                            type="button"
                            onClick={() => setOpen(isOpen ? '' : s.id)}
                            aria-expanded={isOpen}
                            aria-controls={`body-${s.id}`}
                            className="flex w-full items-start justify-between gap-4 rounded-3xl p-5 text-left"
                          >
                            <span className="min-w-0">
                              <span className={cn('block text-[clamp(1.05rem,1rem+0.4vw,1.25rem)] font-semibold leading-snug tracking-[-0.015em]', isDone && 'text-fg2')}>{s.title}</span>
                              <span className="mt-1.5 block text-[15px] leading-relaxed text-fg2">{s.summary}</span>
                              <span className="mt-3 flex flex-wrap items-center gap-2">
                                <Badge kind="neutral" className="normal-case">
                                  <Clock className="h-3 w-3" aria-hidden="true" />
                                  {s.estMinutes ? `${s.estMinutes} min` : 'Varies'}
                                </Badge>
                                <Badge kind={s.costUsd === 0 ? 'verified' : 'neutral'} className="normal-case">
                                  {s.costUsd === 0 ? 'Free' : s.costUsd ? `$${s.costUsd}` : 'Check the official fee'}
                                </Badge>
                                {s.status === 'in_progress' && <Badge kind="target">{statusText[s.status]}</Badge>}
                              </span>
                            </span>
                            <ChevronDown aria-hidden="true" className={cn('mt-1 h-5 w-5 shrink-0 text-fg2 transition-transform duration-500 ease-expo-out', isOpen && 'rotate-180')} />
                          </button>

                          <div id={`body-${s.id}`} className={cn('grid transition-[grid-template-rows] duration-500 ease-expo-out', isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
                            <div className="overflow-hidden">
                              <div className="px-5 pb-6">
                                <p className="max-w-2xl border-t border-line/10 pt-5 text-[16px] leading-[1.7] text-fg/90">{s.bodyMd}</p>
                                <div className="mt-5 flex flex-wrap items-center gap-3">
                                  <Button size="sm" variant={isDone ? 'secondary' : 'primary'} onClick={() => toggle(s.id)}>
                                    {isDone ? 'Mark as not done' : 'Mark as done'}
                                  </Button>
                                  {s.externalUrl && (
                                    <Button size="sm" variant="ghost" href={s.externalUrl} target="_blank" rel="noopener noreferrer">
                                      Official site <ArrowUpRight className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                </div>
                                {s.ussdCode && (
                                  <p className="mt-5 text-sm text-fg2">
                                    On a phone: dial <span className="font-mono text-fg">{USSD_SERVICE_CODE}</span>, choose <span className="font-medium text-fg">1</span>, then{' '}
                                    <span className="font-medium text-fg">{s.ussdCode}</span>.
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
