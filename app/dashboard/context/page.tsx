'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, Plus, Save, Trash2, UserCheck } from 'lucide-react';
import { useStudentSession } from '@/lib/session-context';
import { mockStudentFacts, mockStudentContext } from '@/lib/fixtures';
import type { Activity, IncomeBand, StudentFact, StudentProfile } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fieldClasses } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { Reveal } from '@/components/motion/reveal';
import { PageHero } from '@/components/dashboard/page-hero';
import { Panel } from '@/components/dashboard/panel';
import { EmptyState } from '@/components/dashboard/empty-state';
import { cn } from '@/lib/utils';

const SCHOOL_TYPES: Array<{ value: NonNullable<StudentProfile['schoolType']>; label: string }> = [
  { value: 'national', label: 'National school' },
  { value: 'extra_county', label: 'Extra-county school' },
  { value: 'county', label: 'County school' },
  { value: 'sub_county', label: 'Sub-county school' },
  { value: 'private', label: 'Private school' },
  { value: 'other', label: 'Other' },
];

const INCOME: Array<{ value: IncomeBand; label: string }> = [
  { value: 'under_5k', label: 'Under $5,000 a year' },
  { value: '5k_20k', label: '$5,000 to $20,000' },
  { value: '20k_60k', label: '$20,000 to $60,000' },
  { value: '60k_100k', label: '$60,000 to $100,000' },
  { value: 'over_100k', label: 'Over $100,000' },
  { value: 'unknown', label: 'Prefer not to say' },
];

const humanize = (key: string) => key.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());

function Select({ label, value, onChange, name, children }: { label: string; value: string; onChange: React.ChangeEventHandler<HTMLSelectElement>; name: string; children: React.ReactNode }) {
  return (
    <div className="w-full">
      <label htmlFor={name} className="mb-2 block text-sm font-medium text-fg">
        {label}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className={cn(fieldClasses, "h-11 appearance-none pr-10 [color-scheme:dark]")}
        style={{
          backgroundColor: "rgb(var(--bg) / 0.5)",
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%23A1A1A6' stroke-width='1.6'%3E%3Cpath d='M4 6l4 4 4-4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 1rem center",
          backgroundSize: "16px",
        }}
      >
        {children}
      </select>
    </div>
  );
}

/** Student context: the profile every channel and every AI call reads, fully visible and editable by the student. */
export default function StudentContextPage() {
  const { student, phoneNumber, updateProfile } = useStudentSession();
  const { push } = useToast();

  const [form, setForm] = useState({
    fullName: student.fullName || '',
    county: student.county || '',
    schoolName: student.schoolName || '',
    schoolType: student.schoolType || 'national',
    kcseYear: String(student.kcseYear || 2025),
    satScore: student.satScore ? String(student.satScore) : '',
    intendedMajors: student.intendedMajors?.join(', ') || '',
    needsFullAid: student.needsFullAid,
    familyIncomeBand: (student.familyIncomeBand || 'under_5k') as IncomeBand,
  });
  const [activities, setActivities] = useState<Activity[]>(student.activities || []);
  const [facts, setFacts] = useState<StudentFact[]>(mockStudentFacts);
  const [showRaw, setShowRaw] = useState(false);

  const set = (name: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((p) => ({ ...p, [name]: e.target.value }));

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      fullName: form.fullName,
      county: form.county,
      schoolName: form.schoolName,
      schoolType: form.schoolType as StudentProfile['schoolType'],
      kcseYear: Number(form.kcseYear),
      satScore: form.satScore ? Number(form.satScore) : undefined,
      intendedMajors: form.intendedMajors.split(',').map((m) => m.trim()).filter(Boolean),
      needsFullAid: form.needsFullAid,
      familyIncomeBand: form.familyIncomeBand,
      activities,
    });
    push({ title: 'Profile saved', description: 'Every tool and channel now uses these details.' });
  };

  const removeFact = (key: string) => {
    setFacts((p) => p.filter((f) => f.key !== key));
    push({ title: 'Fact deleted', description: 'Pepea will no longer use it.' });
  };

  const updateActivity = (i: number, u: Partial<Activity>) => setActivities((p) => p.map((a, idx) => (idx === i ? { ...a, ...u } : a)));

  // The exact payload the AI receives (see lib/prompts/system-prompt.ts, STUDENT CONTEXT).
  const payload = {
    profile: {
      fullName: student.fullName,
      phoneNumber: student.phoneNumber,
      schoolName: student.schoolName,
      schoolType: student.schoolType,
      kcseGrade: student.kcseGrade,
      kcsePoints: student.kcsePoints,
      gpaEquivalent: student.gpaEquivalent,
      satScore: student.satScore,
      intendedMajors: student.intendedMajors,
      needsFullAid: student.needsFullAid,
      familyIncomeBand: student.familyIncomeBand,
    },
    facts,
  };

  const consent = student.consentGivenAt ? new Date(student.consentGivenAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : null;

  return (
    <div>
      <PageHero
        eyebrow="Student context"
        icon={UserCheck}
        title={'What Pepea\nknows about you.'}
        accentWord="you."
        description="One profile, tied to your phone number, shared across USSD, SMS, WhatsApp and the web. You can see all of it, change any of it, and delete any fact."
        aside={
          <div className="text-sm text-fg2 sm:text-right">
            <p className="font-mono text-fg">{phoneNumber}</p>
            <p className="mt-1">{consent ? `Saved with your consent on ${consent}` : 'No consent recorded yet'}</p>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-12 lg:gap-5">
        {/* Profile */}
        <Reveal className="lg:col-span-7">
          <Panel eyebrow="Profile" title="About you" className="h-full">
            <form onSubmit={save} className="space-y-7">
              <div className="grid gap-5 sm:grid-cols-2">
                <Input label="Full name" name="fullName" value={form.fullName} onChange={set('fullName')} required />
                <Input label="Phone number" value={phoneNumber} readOnly hint="Change it from your profile in the menu." className="font-mono text-fg2" />
                <Input label="County" name="county" value={form.county} onChange={set('county')} />
                <Input label="School" name="schoolName" value={form.schoolName} onChange={set('schoolName')} />
                <Select label="School type" name="schoolType" value={form.schoolType} onChange={set('schoolType')}>
                  {SCHOOL_TYPES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </Select>
                <Input label="KCSE year" name="kcseYear" type="number" inputMode="numeric" value={form.kcseYear} onChange={set('kcseYear')} />
                <Input label="SAT score" name="satScore" type="number" inputMode="numeric" value={form.satScore} onChange={set('satScore')} hint="Leave empty if you have not taken it." />
                <Input label="Intended majors" name="intendedMajors" value={form.intendedMajors} onChange={set('intendedMajors')} hint="Separate with commas." />
              </div>

              <div className="border-t border-line/10 pt-7">
                <p className="mb-4 text-sm font-medium text-fg">Paying for it</p>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Select label="Family income" name="familyIncomeBand" value={form.familyIncomeBand} onChange={set('familyIncomeBand')}>
                    {INCOME.map((i) => (
                      <option key={i.value} value={i.value}>{i.label}</option>
                    ))}
                  </Select>
                  <div>
                    <p className="mb-2 text-sm font-medium text-fg">I need full financial aid</p>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={form.needsFullAid}
                      aria-label="I need full financial aid"
                      onClick={() => setForm((p) => ({ ...p, needsFullAid: !p.needsFullAid }))}
                      className={cn('relative h-11 w-[4.5rem] rounded-full ring-1 ring-inset transition-colors duration-300', form.needsFullAid ? 'bg-accent ring-transparent' : 'bg-fg/10 ring-line/15')}
                    >
                      <span className={cn('absolute left-1 top-1 h-9 w-9 rounded-full bg-bg shadow transition-transform duration-500 ease-expo-out', form.needsFullAid && 'translate-x-[1.75rem]')} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit">
                  <Save className="h-4 w-4" />
                  Save profile
                </Button>
              </div>
            </form>
          </Panel>
        </Reveal>

        {/* Transparency + facts */}
        <div className="space-y-4 lg:col-span-5 lg:space-y-5">
          <Reveal delay={0.06}>
            <Panel
              glow
              eyebrow="Transparency"
              title="What the AI sees"
              action={
                <Button variant="secondary" size="sm" onClick={() => setShowRaw((v) => !v)}>
                  {showRaw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showRaw ? 'Hide' : 'Show'}
                </Button>
              }
            >
              <p className="text-[15px] leading-relaxed text-fg2">
                Each time you ask Pepea something, these details are sent with your question so answers fit you. Nothing else about you is shared, and it is never sold.
              </p>
              {showRaw && (
                <pre className="thin-scroll animate-fade-in mt-5 max-h-72 overflow-auto rounded-2xl bg-screen p-4 font-mono text-xs leading-relaxed text-phosphor ring-1 ring-inset ring-phosphor/20">
                  {JSON.stringify(payload, null, 2)}
                </pre>
              )}
            </Panel>
          </Reveal>

          <Reveal delay={0.1}>
            <Panel eyebrow="Facts" title="Things Pepea remembers" action={<Badge kind="neutral" className="normal-case">{facts.length} facts</Badge>}>
              {facts.length === 0 ? (
                <EmptyState icon={UserCheck} title="No facts saved" body="As you chat, Pepea may remember useful details. You will see them here and can delete them." />
              ) : (
                <ul className="space-y-3">
                  {facts.map((f) => (
                    <li key={f.key} className="group flex items-start gap-3 rounded-3xl bg-bg/40 p-4 ring-1 ring-inset ring-line/10">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{humanize(f.key)}</p>
                        <p className="mt-1 text-sm leading-relaxed text-fg2">{f.value}</p>
                        <p className="mt-2 text-xs text-fg2">{f.source === 'ai_inferred' ? 'Inferred by Pepea' : 'You said this'} · {Math.round(f.confidence * 100)}% sure</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFact(f.key)}
                        aria-label={`Delete fact: ${humanize(f.key)}`}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-fg2 transition-colors duration-300 hover:bg-murram/20 hover:text-murram-light"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </Reveal>
        </div>
      </div>

      {/* Activities */}
      <Reveal className="mt-4 lg:mt-5">
        <Panel
          eyebrow="Activities"
          title="What you do outside class"
          action={
            <Button variant="secondary" size="sm" onClick={() => setActivities((p) => [...p, { title: '', role: '', years: 1, summary: '' }])}>
              <Plus className="h-4 w-4" />
              Add
            </Button>
          }
        >
          {activities.length === 0 ? (
            <EmptyState icon={Plus} title="No activities yet" body="Add clubs, projects, jobs or responsibilities at home. Admissions officers read these closely." />
          ) : (
            <ul className="grid gap-4 md:grid-cols-2">
              {activities.map((a, i) => (
                <li key={i} className="rounded-3xl bg-bg/40 p-5 ring-1 ring-inset ring-line/10">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-micro font-medium uppercase tracking-[0.1em] text-fg2">Activity {i + 1}</p>
                    <button type="button" onClick={() => setActivities((p) => p.filter((_, idx) => idx !== i))} aria-label={`Remove activity ${i + 1}`} className="-mr-1 -mt-1 grid h-8 w-8 place-items-center rounded-full text-fg2 transition-colors hover:bg-murram/20 hover:text-murram-light">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-3 space-y-4">
                    <Input label="Title" value={a.title} onChange={(e) => updateActivity(i, { title: e.target.value })} />
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <Input label="Your role" value={a.role ?? ''} onChange={(e) => updateActivity(i, { role: e.target.value })} />
                      </div>
                      <Input label="Years" type="number" min={0} value={a.years ?? 0} onChange={(e) => updateActivity(i, { years: Number(e.target.value) })} />
                    </div>
                    <Input label="What you did" value={a.summary ?? ''} onChange={(e) => updateActivity(i, { summary: e.target.value })} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </Reveal>

      {/* Conversation */}
      <Reveal className="mt-4 lg:mt-5">
        <Panel eyebrow="Conversation" title="Recent messages, on every channel">
          <ul className="space-y-4">
            {mockStudentContext.recentMessages.map((m, i) => (
              <li key={i} className={cn('flex flex-col', m.role === 'student' ? 'items-end' : 'items-start')}>
                <p className="mb-1.5 text-xs text-fg2">
                  {m.role === 'student' ? 'You' : 'Pepea'} · {m.channel}
                  {m.module ? ` · ${m.module}` : ''}
                </p>
                <p className={cn('max-w-2xl rounded-3xl px-5 py-3.5 text-[15px] leading-relaxed', m.role === 'student' ? 'bg-accent text-accent-fg' : 'bg-fg/[0.06] ring-1 ring-inset ring-line/10')}>{m.content}</p>
              </li>
            ))}
          </ul>
        </Panel>
      </Reveal>
    </div>
  );
}
