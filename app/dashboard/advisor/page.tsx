'use client';

import React, { useState } from 'react';
import { ArrowUpRight, Building2, ChevronDown, Send } from 'lucide-react';
import { useStudentSession } from '@/lib/session-context';
import { mockUniversityMatches } from '@/lib/fixtures';
import type { MatchTier, UniversityMatch } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Reveal } from '@/components/motion/reveal';
import { PageHero } from '@/components/dashboard/page-hero';
import { Panel } from '@/components/dashboard/panel';
import { ProgressRing } from '@/components/dashboard/progress-ring';
import { cn } from '@/lib/utils';

const TIERS: Array<{ tier: MatchTier; title: string; blurb: string }> = [
  { tier: 'reach', title: 'Reach', blurb: 'Ambitious. Admission is uncertain for almost every applicant.' },
  { tier: 'target', title: 'Target', blurb: 'Your profile is in range for students they usually admit.' },
  { tier: 'likely', title: 'Likely', blurb: 'Your profile is above their usual range. Still not a promise.' },
];

const OUTLOOK: Record<string, string> = {
  full_need: 'Meets full need',
  partial: 'Partial aid',
  merit_only: 'Merit aid only',
  unlikely: 'Aid unlikely',
};

const TEST: Record<string, string> = { required: 'Tests required', optional: 'Tests optional', blind: 'Test blind' };

const SUGGESTIONS = ['Which schools meet full need?', 'Do I need the SAT?', 'Where is Computer Science strongest?'];

const fmt = (d: string) => new Date(`${d}T12:00:00+03:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

function SchoolCard({ m }: { m: UniversityMatch }) {
  const [open, setOpen] = useState(false);
  const u = m.university;
  return (
    <li className="rounded-3xl bg-bg/40 p-5 ring-1 ring-inset ring-line/10 transition-[box-shadow] duration-300 ease-quart-out hover:ring-line/25">
      <div className="flex items-start gap-4">
        <ProgressRing value={m.fitScore / 100} size={56} stroke={5} label={`${m.fitScore} percent fit`}>
          <span className="tnum text-[15px] font-semibold">{m.fitScore}</span>
        </ProgressRing>
        <div className="min-w-0 flex-1">
          <h3 className="text-[17px] font-semibold leading-snug tracking-tight">{u.name}</h3>
          <p className="mt-1 text-sm text-fg2">{OUTLOOK[m.aidOutlook]}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge kind="neutral" className="normal-case">{TEST[u.testPolicy]}</Badge>
        {u.isNeedBlindIntl && <Badge kind="neutral" className="normal-case">Need-blind</Badge>}
        {u.dataVerifiedAt ? <Badge kind="verified" /> : <Badge kind="unverified" />}
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-fg2">Early</dt>
          <dd className="tnum font-medium">{fmt(u.edEaDeadline)}</dd>
        </div>
        <div>
          <dt className="text-fg2">Regular</dt>
          <dd className="tnum font-medium">{fmt(u.rdDeadline)}</dd>
        </div>
      </dl>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="mt-4 flex w-full items-center justify-between rounded-xl text-sm font-medium text-accent"
      >
        Why this school
        <ChevronDown aria-hidden="true" className={cn('h-4 w-4 transition-transform duration-500 ease-expo-out', open && 'rotate-180')} />
      </button>
      <div className={cn('grid transition-[grid-template-rows] duration-500 ease-expo-out', open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
        <div className="overflow-hidden">
          <ul className="space-y-2.5 pt-3 text-sm leading-relaxed text-fg2">
            {m.reasons.map((r, i) => (
              <li key={i} className="flex gap-2.5">
                <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-fg2/60" />
                {r}
              </li>
            ))}
          </ul>
          {u.websiteUrl && (
            <Button href={u.websiteUrl} target="_blank" rel="noopener noreferrer" variant="ghost" size="sm" className="mt-3 -ml-3">
              Admissions site <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </li>
  );
}

/** A reach, target and likely shortlist from the student's profile. The answers are samples until BE-API-08 ships. */
export default function AdvisorPage() {
  const { student } = useStudentSession();
  const [question, setQuestion] = useState('');
  const [asked, setAsked] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);

  const ask = (q: string) => {
    if (!q.trim()) return;
    setQuestion(q);
    setAsking(true);
    setAnswer(null);
    window.setTimeout(() => {
      setAsked(q);
      setAnswer(
        `With KCSE ${student.kcseGrade || 'B+'} and an interest in ${student.intendedMajors?.join(' and ') || 'engineering'}, the schools on your list with the strongest published aid for international students are the ones marked "Meets full need". Each school decides your actual family contribution after you submit its financial forms, so treat this as a direction to check, not a promise. Confirm every policy on the school's own site.`
      );
      setAsking(false);
    }, 1100);
  };

  return (
    <div>
      <PageHero
        eyebrow="College advisor"
        icon={Building2}
        title={'A list that\nfits you.'}
        accentWord="fits"
        description="Reach, target and likely schools from your grades, tests, field and what your family can pay. Every school here is checked for how it treats international aid."
      />

      {/* Three lanes */}
      <div className="grid gap-4 lg:grid-cols-3 lg:gap-5">
        {TIERS.map((t, i) => {
          const list = mockUniversityMatches.filter((m) => m.tier === t.tier);
          return (
            <Reveal key={t.tier} delay={i * 0.07}>
              <Panel className="h-full" bodyClassName="!p-4 sm:!p-5">
                <div className="mb-5 px-1 pt-1">
                  <div className="flex items-center justify-between gap-3">
                    <Badge kind={t.tier} className="px-3 py-1.5" />
                    <span className="tnum text-[2.5rem] font-semibold leading-none tracking-[-0.05em]">{list.length}</span>
                  </div>
                  <p className="mt-3 text-sm leading-snug text-fg2">{t.blurb}</p>
                </div>
                {list.length === 0 ? (
                  <p className="px-1 pb-2 text-sm text-fg2">Nothing here yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {list.map((m) => (
                      <SchoolCard key={m.university.id} m={m} />
                    ))}
                  </ul>
                )}
              </Panel>
            </Reveal>
          );
        })}
      </div>

      {/* Ask */}
      <Reveal className="mt-4 lg:mt-5">
        <Panel eyebrow="Ask the advisor" title="Questions about your list" action={<Badge kind="indicative">Sample answers</Badge>}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(question);
            }}
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <div className="flex-1">
              <Input label="Your question" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="For example: which schools meet full need?" />
            </div>
            <Button type="submit" loading={asking} disabled={!question.trim()} className="sm:mb-px">
              <Send className="h-4 w-4" />
              Ask
            </Button>
          </form>

          <div className="mt-4 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => ask(s)}
                className="rounded-full px-3.5 py-2 text-sm text-fg2 ring-1 ring-inset ring-line/15 transition-[color,box-shadow] duration-300 hover:text-fg hover:ring-line/35"
              >
                {s}
              </button>
            ))}
          </div>

          <div aria-live="polite" className="mt-6">
            {answer && (
              <div className="animate-fade-in rounded-3xl bg-bg/40 p-6 ring-1 ring-inset ring-line/10">
                <p className="text-sm font-medium text-fg2">{asked}</p>
                <p className="mt-3 max-w-3xl text-[16px] leading-[1.7]">{answer}</p>
              </div>
            )}
          </div>
        </Panel>
      </Reveal>
    </div>
  );
}
