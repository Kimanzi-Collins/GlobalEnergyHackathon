'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Check, LayoutDashboard, MailCheck, ChevronRight } from 'lucide-react';
import { useStudentSession } from '@/lib/session-context';
import { mockGuideSteps, mockUniversityMatches, mockAidMatches, mockEssays, mockEssayTypes } from '@/lib/fixtures';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/motion/reveal';
import { PageHero } from '@/components/dashboard/page-hero';
import { Panel } from '@/components/dashboard/panel';
import { Stat } from '@/components/dashboard/stat';
import { ProgressRing } from '@/components/dashboard/progress-ring';
import { Meter } from '@/components/dashboard/meter';
import { cn } from '@/lib/utils';

const DAY = 86_400_000;
const roundLabel = (kind: 'ed' | 'rd') => (kind === 'ed' ? 'Early deadline' : 'Regular deadline');

const outlook: Record<string, string> = {
  full_need: 'Full need met',
  partial: 'Partial aid',
  merit_only: 'Merit only',
  unlikely: 'Aid unlikely',
};

const statusLabel: Record<string, string> = {
  in_review: 'In review',
  drafting: 'Drafting',
  brainstorm: 'Brainstorm',
  final: 'Final',
};

/** The earliest upcoming deadline across the student's matched schools, from the real clock. */
function useNextDeadline() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => setNow(Date.now()), []);

  return useMemo(() => {
    if (now === null) return null;
    const dates = mockUniversityMatches.flatMap((m) => [
      { school: m.university.name, date: m.university.edEaDeadline, kind: 'ed' as const },
      { school: m.university.name, date: m.university.rdDeadline, kind: 'rd' as const },
    ]);
    const upcoming = dates
      .map((d) => ({ ...d, at: new Date(`${d.date}T23:59:00+03:00`).getTime() }))
      .filter((d) => d.at >= now)
      .sort((a, b) => a.at - b.at)[0];
    if (!upcoming) return { none: true as const };
    return { none: false as const, ...upcoming, days: Math.max(0, Math.ceil((upcoming.at - now) / DAY)) };
  }, [now]);
}

export default function DashboardHome() {
  const { student } = useStudentSession();
  const deadline = useNextDeadline();

  const done = mockGuideSteps.filter((s) => s.status === 'done').length;
  const total = mockGuideSteps.length;
  const nextStep = mockGuideSteps.find((s) => s.status !== 'done');
  const firstName = student.fullName.split(' ')[0];
  const gpa = student.gpaEquivalent?.toFixed(2);

  const context = [
    { k: 'KCSE', v: `${student.kcseGrade ?? 'Not set'}`, sub: student.kcsePoints ? `${student.kcsePoints} of 84 points` : 'Add your result' },
    { k: 'Intended majors', v: student.intendedMajors?.[0] ?? 'Not set', sub: student.intendedMajors?.slice(1).join(', ') || 'Add a field' },
    { k: 'Financial aid', v: student.needsFullAid ? 'Full aid' : 'Partial aid', sub: 'Shapes your list and forms' },
    { k: 'Tests', v: student.satScore ? `SAT ${student.satScore}` : 'None yet', sub: student.satScore ? 'Reported by you' : 'Check each school' },
  ];

  return (
    <div>
      <PageHero
        eyebrow="Overview"
        icon={LayoutDashboard}
        title={`Habari,\n${firstName}.`}
        accentWord={firstName}
        description={
          <>
            Applying from {student.schoolName || 'Kenya'}. KCSE {student.kcseGrade ?? 'grade not set'}
            {gpa && (
              <>
                , about <span className="tnum font-medium text-fg">{gpa}</span> on the US scale (indicative)
              </>
            )}
            .
          </>
        }
      />

      {/* Readiness: the number that matters, and the plan behind it */}
      <div className="grid gap-4 lg:grid-cols-12 lg:gap-5">
        <Reveal className="lg:col-span-7">
          <Panel glow eyebrow="Next deadline" className="h-full" bodyClassName="flex h-full flex-col justify-between gap-10">
            <div className="min-h-[11rem]">
              {deadline === null ? (
                <p className="text-stat font-semibold text-fg/20">--</p>
              ) : deadline.none ? (
                <p className="text-h3 font-semibold">No upcoming deadlines on your list.</p>
              ) : (
                <>
                  <Stat label={`${deadline.school} · ${roundLabel(deadline.kind)}`} value={String(deadline.days)} unit={deadline.days === 1 ? 'day' : 'days'} size="hero" gradient />
                  <p className="mt-5 text-[15px] text-fg2">
                    Closes{' '}
                    <span className="font-medium text-fg">
                      {new Date(deadline.at).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </span>{' '}
                    at 23:59 East Africa Time.
                  </p>
                </>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button href="/dashboard/guide">Open your guide</Button>
              <Button href="/dashboard/essays" variant="secondary">
                Work on an essay
              </Button>
            </div>
          </Panel>
        </Reveal>

        <Reveal delay={0.08} className="lg:col-span-5">
          <Panel eyebrow="Your plan" className="h-full" bodyClassName="flex h-full flex-col justify-between gap-8">
            <div className="flex items-center gap-6">
              <ProgressRing value={done / total} size={132} stroke={11} label={`${done} of ${total} guide steps done`}>
                <span className="tnum text-[2rem] font-semibold leading-none tracking-tight">
                  {done}
                  <span className="text-base font-medium text-fg2">/{total}</span>
                </span>
              </ProgressRing>
              <div className="min-w-0">
                <p className="text-micro font-medium uppercase tracking-[0.1em] text-fg2">Up next</p>
                <p className="mt-1.5 text-lg font-semibold leading-snug tracking-tight">{nextStep?.title ?? 'All steps complete'}</p>
                {nextStep?.estMinutes && <p className="mt-1.5 text-sm text-fg2">About {nextStep.estMinutes} minutes</p>}
              </div>
            </div>
            <Button href="/dashboard/guide" variant="secondary" className="self-start">
              Resume guide <ChevronRight className="h-4 w-4" />
            </Button>
          </Panel>
        </Reveal>
      </div>

      {/* Context: one row, no boxes inside boxes */}
      <Reveal className="mt-4 lg:mt-5">
        <Panel
          eyebrow="Student context"
          title="What Pepea knows about you"
          action={
            <Button href="/dashboard/context" variant="ghost" size="sm">
              Edit <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>
          }
        >
          <dl className="grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-4 lg:gap-y-0 lg:divide-x lg:divide-line/10">
            {context.map((c, i) => (
              <div key={c.k} className={cn('min-w-0', i > 0 && 'lg:pl-8')}>
                <dt className="text-micro font-medium uppercase tracking-[0.1em] text-fg2">{c.k}</dt>
                <dd className="mt-2 text-[clamp(1.4rem,1.1rem+1vw,1.9rem)] font-semibold leading-tight tracking-tight">{c.v}</dd>
                <dd className="mt-1 text-sm text-fg2">{c.sub}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-7 border-t border-line/10 pt-5 text-sm text-fg2">
            The same profile follows your number across USSD, WhatsApp and the web. You can see and delete every fact in{' '}
            <Link href="/dashboard/context" className="text-accent underline-offset-4 hover:underline">
              Student context
            </Link>
            .
          </p>
        </Panel>
      </Reveal>

      {/* Work areas */}
      <div className="mt-4 grid gap-4 lg:mt-5 lg:grid-cols-12 lg:gap-5">
        <Reveal className="lg:col-span-7">
          <Panel
            eyebrow="Application guide"
            title="The next four steps"
            className="h-full"
            action={
              <Button href="/dashboard/guide" variant="ghost" size="sm">
                All {total} <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            }
          >
            <ol>
              {mockGuideSteps.slice(0, 4).map((s, i) => {
                const isDone = s.status === 'done';
                return (
                  <li key={s.id} className="border-t border-line/10 first:border-t-0">
                    <Link
                      href="/dashboard/guide"
                      className="group -mx-3 flex items-start gap-4 rounded-2xl px-3 py-4 transition-colors duration-300 hover:bg-fg/[0.04]"
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          'mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold ring-1 ring-inset',
                          isDone ? 'bg-phosphor/15 text-phosphor ring-phosphor/30' : 'text-fg2 ring-line/25'
                        )}
                      >
                        {isDone ? <Check className="h-3.5 w-3.5" /> : i + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={cn('block text-[16px] font-medium leading-snug', isDone && 'text-fg2')}>{s.title}</span>
                        <span className="mt-1 line-clamp-1 block text-sm text-fg2">{s.summary}</span>
                      </span>
                      <span className="shrink-0 pt-0.5 text-sm text-fg2">
                        {isDone ? 'Done' : s.status === 'in_progress' ? 'In progress' : `${s.estMinutes ?? 0} min`}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </Panel>
        </Reveal>

        <Reveal delay={0.08} className="lg:col-span-5">
          <Panel
            eyebrow="College advisor"
            title="Your shortlist"
            className="h-full"
            action={
              <Button href="/dashboard/advisor" variant="ghost" size="sm">
                View all <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            }
          >
            <ul>
              {mockUniversityMatches.slice(0, 3).map((m) => (
                <li key={m.university.id} className="border-t border-line/10 first:border-t-0">
                  <Link href="/dashboard/advisor" className="group -mx-3 flex items-center gap-4 rounded-2xl px-3 py-3.5 transition-colors duration-300 hover:bg-fg/[0.04]">
                    <ProgressRing value={m.fitScore / 100} size={48} stroke={4} label={`${m.fitScore} percent fit`}>
                      <span className="tnum text-[13px] font-semibold">{m.fitScore}</span>
                    </ProgressRing>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-medium">{m.university.name}</span>
                      <span className="mt-0.5 block text-sm text-fg2">{outlook[m.aidOutlook]}</span>
                    </span>
                    <Badge kind={m.tier} />
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        </Reveal>

        <Reveal className="lg:col-span-6">
          <Panel
            eyebrow="Essays"
            title="In progress"
            className="h-full"
            action={
              <Button href="/dashboard/essays" variant="ghost" size="sm">
                Open studio <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            }
          >
            <ul className="space-y-3">
              {mockEssays.map((e) => (
                <li key={e.id}>
                  <Link
                    href="/dashboard/essays"
                    className="flex items-center gap-5 rounded-3xl bg-fg/[0.04] p-4 ring-1 ring-inset ring-line/10 transition-[background-color,box-shadow] duration-300 ease-quart-out hover:bg-fg/[0.07] hover:ring-line/25"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-micro font-medium uppercase tracking-[0.1em] text-fg2">
                        {mockEssayTypes.find((t) => t.code === e.essayType)?.label ?? e.essayType}
                      </p>
                      <p className="mt-1.5 truncate text-[16px] font-medium">{e.title}</p>
                      <p className="mt-1 text-sm text-fg2">
                        Version {e.latestVersionNo} · {statusLabel[e.status] ?? e.status}
                      </p>
                    </div>
                    {e.latestScore !== undefined && (
                      <div className="text-right">
                        <p className="tnum text-[2.25rem] font-semibold leading-none tracking-[-0.04em]">{e.latestScore}</p>
                        <p className="mt-1 text-xs text-fg2">of 100</p>
                      </div>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        </Reveal>

        <Reveal delay={0.08} className="lg:col-span-6">
          <Panel
            eyebrow="Financial aid"
            title="Best matches"
            className="h-full"
            action={
              <Button href="/dashboard/aid" variant="ghost" size="sm">
                Explore <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            }
          >
            <ul className="space-y-5">
              {mockAidMatches.map((m, i) => (
                <li key={m.program.id}>
                  <div className="mb-2.5 flex items-center justify-between gap-3">
                    <p className="min-w-0 truncate text-[15px] font-medium">{m.program.name}</p>
                    {m.program.dataVerifiedAt === null && <Badge kind="unverified" />}
                  </div>
                  <Meter label={m.program.provider} value={m.matchScore} max={100} valueLabel={`${m.matchScore}% match`} delay={0.1 + i * 0.1} />
                </li>
              ))}
            </ul>
          </Panel>
        </Reveal>
      </div>

      {/* Teacher letters */}
      <Reveal className="mt-4 lg:mt-5">
        <Panel>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent/15 text-accent ring-1 ring-inset ring-accent/30">
                <MailCheck className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Has a teacher written your letter?</h2>
                <p className="mt-1.5 max-w-xl text-[15px] leading-relaxed text-fg2">
                  Paste the draft and see where a US reader will need more detail or Kenyan context. Pepea never writes the letter for them.
                </p>
              </div>
            </div>
            <Button href="/dashboard/lor" variant="secondary" className="shrink-0">
              Review a letter
            </Button>
          </div>
        </Panel>
      </Reveal>
    </div>
  );
}

