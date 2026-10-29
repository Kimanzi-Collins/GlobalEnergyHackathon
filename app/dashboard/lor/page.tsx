'use client';

import React, { useState } from 'react';
import { MailCheck, Sparkles } from 'lucide-react';
import { mockSampleLorResult } from '@/lib/fixtures';
import type { LorReviewResult } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { Reveal } from '@/components/motion/reveal';
import { PageHero } from '@/components/dashboard/page-hero';
import { Panel } from '@/components/dashboard/panel';
import { Stat } from '@/components/dashboard/stat';
import { Meter } from '@/components/dashboard/meter';
import { EmptyState } from '@/components/dashboard/empty-state';

const AXES: Array<{ key: keyof LorReviewResult['rubricScores']; label: string; hint: string }> = [
  { key: 'specificity', label: 'Concrete scenes and evidence', hint: 'Stories, not adjectives' },
  { key: 'context', label: 'Kenyan classroom context', hint: 'KCSE, class size, resources' },
  { key: 'endorsement', label: 'Comparative endorsement', hint: 'Where the student ranks' },
  { key: 'tone', label: 'Genuine, uninflated tone', hint: 'Believable praise' },
];

const DEFAULT_LETTER =
  'I have known Kwame for over three years as his Form 3 and Form 4 Physics instructor. He is an exceptionally disciplined, polite, and hardworking student who consistently completed all laboratory practicals. In our county mock examinations, he placed in the top 1% of candidates. Whenever other students struggled with electricity and magnetism concepts, Kwame patiently explained the calculations after prep hours. I recommend him without reservation for admission.';

const countWords = (t: string) => (t.trim() ? t.trim().split(/\s+/).length : 0);

function Bullets({ items, tone }: { items: string[]; tone: 'good' | 'accent' }) {
  return (
    <ul className="space-y-3.5">
      {items.map((t, i) => (
        <li key={i} className="flex gap-3 text-[15px] leading-relaxed">
          <span aria-hidden="true" className={tone === 'good' ? 'mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-phosphor' : 'mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent'} />
          {t}
        </li>
      ))}
    </ul>
  );
}

/** Review a teacher's recommendation draft. Pepea never writes the letter; it shows what a US reader will miss. */
export default function LorReviewPage() {
  const { push } = useToast();
  const [name, setName] = useState('Mwalimu John Mwangi');
  const [role, setRole] = useState('Head of Science, Physics teacher');
  const [letter, setLetter] = useState(DEFAULT_LETTER);
  const [reviewing, setReviewing] = useState(false);
  const [result, setResult] = useState<LorReviewResult | null>(mockSampleLorResult);

  const words = countWords(letter);

  const review = () => {
    setReviewing(true);
    window.setTimeout(() => {
      setResult(mockSampleLorResult);
      setReviewing(false);
      push({ title: 'Sample review ready', description: 'The live Gemini review arrives with the letters API.' });
    }, 1200);
  };

  return (
    <div>
      <PageHero
        eyebrow="Teacher letters"
        icon={MailCheck}
        title={'Strong letters\ntell stories.'}
        accentWord="stories."
        description="Paste your teacher's draft and see where a US reader will want more detail or Kenyan context. Pepea never writes the letter. The words must be theirs."
      />

      <div className="grid gap-4 lg:grid-cols-12 lg:gap-5">
        <Reveal className="lg:col-span-7">
          <Panel eyebrow="The letter" title="Your teacher's draft" className="h-full">
            <div className="grid gap-5 sm:grid-cols-2">
              <Input label="Recommender" value={name} onChange={(e) => setName(e.target.value)} />
              <Input label="Role and subject" value={role} onChange={(e) => setRole(e.target.value)} />
            </div>
            <div className="mt-5">
              <Textarea label="Draft letter" value={letter} onChange={(e) => setLetter(e.target.value)} className="min-h-[300px] text-[16px] leading-[1.7]" />
            </div>
            <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="tnum text-sm text-fg2">{words} words · checked on four things below</p>
              <Button onClick={review} loading={reviewing} disabled={words < 30}>
                <Sparkles className="h-4 w-4" />
                Review this letter
              </Button>
            </div>
          </Panel>
        </Reveal>

        <Reveal delay={0.08} className="lg:col-span-5">
          <div className="lg:sticky lg:top-8">
            {result ? (
              <Panel glow eyebrow="Assessment" title={result.verdict} action={<Badge kind="indicative">Sample review</Badge>}>
                <Stat label="Overall" value={String(result.overallScore)} unit="/ 100" size="md" gradient />
                <div className="mt-8 space-y-5">
                  {AXES.map((a, i) => (
                    <div key={a.key}>
                      <Meter label={a.label} value={result.rubricScores[a.key]} max={25} delay={0.1 + i * 0.08} />
                      <p className="mt-1.5 text-xs text-fg2">{a.hint}</p>
                    </div>
                  ))}
                </div>
              </Panel>
            ) : (
              <Panel>
                <EmptyState icon={MailCheck} title="Your assessment appears here" body="Paste a draft of at least 30 words, then choose Review this letter." ussdHint />
              </Panel>
            )}
          </div>
        </Reveal>
      </div>

      {result && (
        <div className="mt-4 grid gap-4 lg:mt-5 lg:grid-cols-3 lg:gap-5">
          <Reveal>
            <Panel eyebrow="Working well" title="Strengths" className="h-full">
              <Bullets items={result.strengths} tone="good" />
            </Panel>
          </Reveal>
          <Reveal delay={0.06}>
            <Panel eyebrow="Missing evidence" title="Gaps" className="h-full">
              <Bullets items={result.gaps} tone="accent" />
            </Panel>
          </Reveal>
          <Reveal delay={0.12}>
            <Panel eyebrow="For a US reader" title="What to add about Kenya" className="h-full">
              <Bullets items={result.kenyaContextToAdd} tone="good" />
            </Panel>
          </Reveal>
        </div>
      )}

      {result && result.rewrites.length > 0 && (
        <Reveal className="mt-4 lg:mt-5">
          <Panel eyebrow="Sentence level" title="Where to be specific">
            <ul className="grid gap-4 md:grid-cols-2">
              {result.rewrites.map((w, i) => (
                <li key={i} className="rounded-3xl bg-bg/40 p-5 ring-1 ring-inset ring-line/10">
                  <p className="text-[15px] italic text-fg2 line-through decoration-murram-light/60">&ldquo;{w.original}&rdquo;</p>
                  <p className="mt-3 text-[16px] font-medium leading-snug">{w.suggestion}</p>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm text-fg2">These show a technique. Your teacher writes the real sentence.</p>
          </Panel>
        </Reveal>
      )}
    </div>
  );
}
