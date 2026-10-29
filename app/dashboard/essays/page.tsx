'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, FileEdit, Lock, Sparkles } from 'lucide-react';
import { mockEssayTypes, mockUniversities, mockSchoolEssayPrompts, mockSampleReviewResult } from '@/lib/fixtures';
import type { EssayReviewResult, EssayScope, EssayTypeCode } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { Reveal } from '@/components/motion/reveal';
import { PageHero } from '@/components/dashboard/page-hero';
import { Panel } from '@/components/dashboard/panel';
import { Stat } from '@/components/dashboard/stat';
import { Meter } from '@/components/dashboard/meter';
import { Segmented } from '@/components/dashboard/segmented';
import { ProgressRing } from '@/components/dashboard/progress-ring';
import { EmptyState } from '@/components/dashboard/empty-state';
import { cn } from '@/lib/utils';

type Persona = 'ivy_committee_chair' | 'kensap_mentor';

const SCOPE_LABEL: Record<EssayScope, string> = {
  common: 'The same for every school',
  school_specific: 'Different at each school',
  scholarship: 'For a scholarship',
  aid: 'For financial aid',
};

const SAMPLE_DRAFT =
  'The soldering iron was too hot for the copper wire, but in Kericho, you do not replace broken tools. You adapt them. In Form 3, when our school dormitory experienced power fluctuations during mock examinations, I used a bicycle dynamo to assemble an emergency battery charger for our study lamps.';

const countWords = (t: string) => (t.trim() ? t.trim().split(/\s+/).length : 0);

/** A numbered step in the header: done, current or upcoming. */
function Step({ n, label, state }: { n: number; label: string; state: 'done' | 'current' | 'todo' | 'skipped' }) {
  return (
    <li className="flex flex-1 items-center gap-3">
      <span
        aria-hidden="true"
        className={cn(
          'grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-semibold ring-1 ring-inset transition-[background-color,color] duration-500',
          state === 'done' && 'bg-phosphor/15 text-phosphor ring-phosphor/30',
          state === 'current' && 'bg-accent text-accent-fg ring-transparent',
          (state === 'todo' || state === 'skipped') && 'text-fg2 ring-line/25'
        )}
      >
        {state === 'done' ? <Check className="h-4 w-4" /> : n}
      </span>
      <span className={cn('hidden text-sm font-medium sm:block', state === 'current' ? 'text-fg' : 'text-fg2')}>
        {label}
        {state === 'skipped' && <span className="ml-2 font-normal text-fg2">Not needed</span>}
      </span>
      <span aria-hidden="true" className="ml-1 hidden h-px flex-1 bg-line/15 sm:block" />
    </li>
  );
}

/**
 * Essays by type and by school. Pick the essay, then (for school essays) the school and its exact prompt, then
 * write with a live word limit and review the draft against that type's rubric.
 * The review is a sample until BE-API-05 ships; it says so on screen.
 */
export default function EssaysStudioPage() {
  const { push } = useToast();

  const [typeCode, setTypeCode] = useState<EssayTypeCode>('personal_statement');
  const [universityId, setUniversityId] = useState('');
  const [promptId, setPromptId] = useState('');
  const [persona, setPersona] = useState<Persona>('ivy_committee_chair');
  const [draft, setDraft] = useState(SAMPLE_DRAFT);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [review, setReview] = useState<EssayReviewResult | null>(mockSampleReviewResult);
  const loadedKey = useRef<string>('');

  const type = mockEssayTypes.find((t) => t.code === typeCode) ?? mockEssayTypes[0];
  const schoolSpecific = type.scope === 'school_specific';

  // Only offer schools that actually ask this kind of essay.
  const schools = useMemo(
    () => mockUniversities.filter((u) => mockSchoolEssayPrompts.some((p) => p.universityId === u.id && p.essayType === typeCode)),
    [typeCode]
  );
  const prompts = useMemo(
    () => mockSchoolEssayPrompts.filter((p) => p.universityId === universityId && p.essayType === typeCode),
    [universityId, typeCode]
  );
  const prompt = mockSchoolEssayPrompts.find((p) => p.id === promptId);

  const limit = prompt?.wordLimit ?? type.defaultWordLimit ?? 650;
  const unlocked = !schoolSpecific || (Boolean(universityId) && Boolean(promptId));
  const words = countWords(draft);
  const over = words > limit;

  // Real autosave: one draft per essay (type, plus the prompt for school essays), kept on this phone.
  const draftKey = `pepea_draft:${typeCode}:${schoolSpecific ? promptId || 'none' : 'common'}`;
  useEffect(() => {
    if (!unlocked) return;
    try {
      const saved = localStorage.getItem(draftKey);
      setDraft(saved ?? (typeCode === 'personal_statement' ? SAMPLE_DRAFT : ''));
    } catch {
      /* storage blocked: the draft still works, it just is not remembered */
    }
    loadedKey.current = draftKey;
    setSavedAt(null);
  }, [draftKey, unlocked, typeCode]);

  useEffect(() => {
    if (!unlocked || loadedKey.current !== draftKey) return;
    const id = window.setTimeout(() => {
      try {
        localStorage.setItem(draftKey, draft);
        setSavedAt(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
      } catch {
        /* ignore */
      }
    }, 700);
    return () => window.clearTimeout(id);
  }, [draft, draftKey, unlocked]);

  const chooseType = (code: EssayTypeCode) => {
    setTypeCode(code);
    setUniversityId('');
    setPromptId('');
    setReview(null);
  };

  const runReview = () => {
    setReviewing(true);
    window.setTimeout(() => {
      setReview({ ...mockSampleReviewResult, overallScore: Math.min(94, Math.max(68, 75 + Math.floor(Math.random() * 15))) });
      setReviewing(false);
      push({ title: 'Sample review ready', description: 'The live Gemini review arrives with the essays API.' });
    }, 1400);
  };

  const groups: Array<{ scope: EssayScope; label: string }> = [
    { scope: 'common', label: 'Common App' },
    { scope: 'school_specific', label: 'Each school asks its own' },
    { scope: 'scholarship', label: 'Scholarships' },
    { scope: 'aid', label: 'Financial aid' },
  ];

  const step2: 'done' | 'current' | 'skipped' = !schoolSpecific ? 'skipped' : unlocked ? 'done' : 'current';
  const step3: 'current' | 'todo' = unlocked ? 'current' : 'todo';

  return (
    <div>
      <PageHero
        eyebrow="Essays"
        icon={FileEdit}
        title={'Write it.\nThen hear it.'}
        accentWord="hear"
        description="Pick the essay, write it, and see it the way an admissions officer will. Pepea points at what to fix. It never writes for you."
        aside={
          <Segmented
            ariaLabel="Reviewer voice"
            value={persona}
            onChange={setPersona}
            options={[
              { value: 'ivy_committee_chair', label: 'Strict reader' },
              { value: 'kensap_mentor', label: 'Kenyan mentor' },
            ]}
          />
        }
      />

      {/* Progress through the flow */}
      <Reveal>
        <ol aria-label="Essay steps" className="mb-5 flex items-center gap-2 rounded-full bg-surface px-5 py-3 ring-1 ring-inset ring-line/10">
          <Step n={1} label="Choose the essay" state="done" />
          <Step n={2} label="School and prompt" state={step2} />
          <Step n={3} label="Write and review" state={step3} />
        </ol>
      </Reveal>

      {/* 1. Type */}
      <Reveal>
        <Panel eyebrow="Step 1" title="Which essay?">
          <div className="grid gap-x-10 gap-y-7 lg:grid-cols-2">
            {groups.map((g) => {
              const items = mockEssayTypes.filter((t) => t.scope === g.scope);
              if (items.length === 0) return null;
              return (
                <div key={g.scope}>
                  <p className="mb-3 text-sm font-medium text-fg2">{g.label}</p>
                  <Segmented
                    layout="wrap"
                    ariaLabel={g.label}
                    value={items.some((t) => t.code === typeCode) ? typeCode : ('' as EssayTypeCode)}
                    onChange={chooseType}
                    options={items.map((t) => ({
                      value: t.code,
                      label: t.label.replace(' (Common App)', ''),
                      hint: t.defaultWordLimit ? `${t.defaultWordLimit} words` : undefined,
                    }))}
                  />
                </div>
              );
            })}
          </div>
          <p className="mt-6 text-sm text-fg2">{SCOPE_LABEL[type.scope]}.</p>
        </Panel>
      </Reveal>

      {/* 2. School and prompt */}
      <Reveal className="mt-4 lg:mt-5">
        <Panel eyebrow="Step 2" title={schoolSpecific ? 'Which school, which question?' : 'No school needed'}>
          {!schoolSpecific ? (
            <p className="flex items-center gap-3 text-[15px] text-fg2">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-phosphor/15 text-phosphor ring-1 ring-inset ring-phosphor/30">
                <Check className="h-3.5 w-3.5" />
              </span>
              You write this one once and use it wherever it applies.
            </p>
          ) : (
            <div className="space-y-7">
              <div>
                <p className="mb-3 text-sm font-medium text-fg2">School</p>
                {schools.length === 0 ? (
                  <p className="text-[15px] text-fg2">No school on your list asks this essay yet.</p>
                ) : (
                  <Segmented
                    layout="wrap"
                    ariaLabel="School"
                    value={universityId as string}
                    onChange={(v) => {
                      setUniversityId(v);
                      setPromptId('');
                      setReview(null);
                    }}
                    options={schools.map((u) => ({ value: u.id, label: u.name.replace(/ \(.*\)/, '') }))}
                  />
                )}
              </div>

              {universityId && (
                <div role="radiogroup" aria-label="Prompt" className="animate-fade-in space-y-3">
                  <p className="text-sm font-medium text-fg2">Prompt</p>
                  {prompts.map((p) => {
                    const on = p.id === promptId;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => {
                          setPromptId(p.id);
                          setReview(null);
                        }}
                        className={cn(
                          'w-full rounded-3xl p-5 text-left ring-1 ring-inset transition-[background-color,box-shadow] duration-300 ease-quart-out',
                          on ? 'bg-accent/10 ring-accent/60' : 'bg-bg/40 ring-line/15 hover:ring-line/35'
                        )}
                      >
                        <span className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[16px] font-semibold tracking-tight">{p.title}</span>
                          <span className="flex items-center gap-2">
                            <span className="tnum text-sm text-fg2">{p.wordLimit} words</span>
                            {p.dataVerifiedAt === null && <Badge kind="unverified" />}
                          </span>
                        </span>
                        <span className="mt-2 block text-[15px] leading-relaxed text-fg2">&ldquo;{p.promptText}&rdquo;</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </Panel>
      </Reveal>

      {/* 3. Write and review */}
      <div className="mt-4 grid gap-4 lg:mt-5 lg:grid-cols-12 lg:gap-5">
        <Reveal className="lg:col-span-7">
          <Panel
            eyebrow="Step 3"
            title="Your draft"
            className="h-full"
            action={
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className={cn('tnum text-sm font-medium', over ? 'text-murram-light' : 'text-fg')}>
                    {words} / {limit}
                  </p>
                  <p className="text-xs text-fg2">{over ? `over by ${words - limit}` : 'words'}</p>
                </div>
                <ProgressRing value={Math.min(1, words / limit)} size={44} stroke={4} tone={over ? 'warn' : 'accent'} label={`${words} of ${limit} words`} />
              </div>
            }
          >
            {!unlocked ? (
              <EmptyState
                icon={Lock}
                title="Choose the school and prompt first"
                body={`${type.label} is different at every school, so Pepea needs the exact question before you start. Pick one above.`}
              />
            ) : (
              <>
                <Textarea
                  label="Draft"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="min-h-[340px] text-[17px] leading-[1.75]"
                  placeholder="Start in the middle of a scene. Skip the generic opening."
                />
                <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-fg2" aria-live="polite">
                    {savedAt ? `Saved on this phone at ${savedAt}` : 'Saved on this phone as you type'}
                  </p>
                  <Button onClick={runReview} loading={reviewing} disabled={words < 15 || over}>
                    <Sparkles className="h-4 w-4" />
                    Review my draft
                  </Button>
                </div>
              </>
            )}
          </Panel>
        </Reveal>

        <Reveal delay={0.08} className="lg:col-span-5">
          <div className="lg:sticky lg:top-8">
            {review ? (
              <Panel
                glow
                eyebrow="Review"
                title={persona === 'ivy_committee_chair' ? 'Strict reader' : 'Kenyan mentor'}
                action={<Badge kind="indicative">Sample review</Badge>}
              >
                <div key={review.overallScore} className="flex items-end justify-between gap-4">
                  <Stat label="Overall" value={String(review.overallScore)} unit="/ 100" size="md" gradient />
                  <p className="pb-1 text-right text-lg font-semibold tracking-tight">{review.verdict}</p>
                </div>

                <blockquote className="mt-6 border-l-2 border-accent/60 pl-4 text-[15px] leading-relaxed text-fg/90">{review.committeeSummary}</blockquote>

                <div className="mt-7 space-y-5">
                  {type.rubric.map((r, i) => (
                    <Meter key={r.key} label={r.label} value={review.rubricScores[r.key] ?? 0} max={r.max} delay={0.1 + i * 0.08} />
                  ))}
                </div>

                {review.clichesDetected.length > 0 && (
                  <div className="mt-7">
                    <p className="mb-2.5 text-micro font-medium uppercase tracking-[0.1em] text-fg2">Clichés spotted</p>
                    <ul className="flex flex-wrap gap-2">
                      {review.clichesDetected.map((c) => (
                        <li key={c} className="rounded-full px-3 py-1.5 text-sm text-murram-light ring-1 ring-inset ring-murram/40">
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Panel>
            ) : (
              <Panel>
                <EmptyState
                  icon={Sparkles}
                  title="Your review appears here"
                  body="Write at least 15 words, then choose Review my draft."
                  ussdHint
                />
              </Panel>
            )}
          </div>
        </Reveal>
      </div>

      {/* Detail: line edits and context */}
      {review && (
        <div className="mt-4 grid gap-4 lg:mt-5 lg:grid-cols-2 lg:gap-5">
          <Reveal>
            <Panel eyebrow="Line by line" title="Where it sounds like an Insha" className="h-full">
              <ul className="space-y-4">
                {review.lineEdits.map((e, i) => (
                  <li key={i} className="rounded-3xl bg-bg/40 p-5 ring-1 ring-inset ring-line/10">
                    <p className="text-[15px] italic text-fg2 line-through decoration-murram-light/60">&ldquo;{e.original}&rdquo;</p>
                    <p className="mt-3 text-[16px] font-medium leading-snug">{e.suggestion}</p>
                    <p className="mt-2 text-sm leading-relaxed text-fg2">{e.issue}</p>
                  </li>
                ))}
              </ul>
            </Panel>
          </Reveal>

          <Reveal delay={0.08}>
            <Panel eyebrow="For a US reader" title="Explain this about Kenya" className="h-full">
              <ul className="space-y-3">
                {review.kenyanContextTips
                  .split('\n')
                  .filter(Boolean)
                  .map((tip, i) => (
                    <li key={i} className="flex gap-3 text-[15px] leading-relaxed">
                      <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-phosphor" />
                      {tip}
                    </li>
                  ))}
              </ul>
              <div className="mt-7 rounded-3xl bg-accent/10 p-5 ring-1 ring-inset ring-accent/30">
                <p className="text-micro font-medium uppercase tracking-[0.1em] text-accent">One technique to try</p>
                <p className="mt-2 text-[15px] leading-relaxed">{review.rewriteExample}</p>
              </div>
            </Panel>
          </Reveal>
        </div>
      )}
    </div>
  );
}
