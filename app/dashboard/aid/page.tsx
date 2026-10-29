'use client';

import React, { useMemo, useState } from 'react';
import { ArrowUpRight, ChevronDown, Coins, ShieldAlert } from 'lucide-react';
import { mockAidMatches } from '@/lib/fixtures';
import type { AidMatch, AidProgramType } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/motion/reveal';
import { PageHero } from '@/components/dashboard/page-hero';
import { Panel } from '@/components/dashboard/panel';
import { Meter } from '@/components/dashboard/meter';
import { Segmented } from '@/components/dashboard/segmented';
import { EmptyState } from '@/components/dashboard/empty-state';
import { cn } from '@/lib/utils';

type Filter = 'all' | AidProgramType;

const TYPE_LABEL: Record<AidProgramType, string> = {
  fee_waiver: 'Fee waiver',
  institutional_need: 'Need-based aid',
  institutional_merit: 'Merit aid',
  external_scholarship: 'Scholarship',
  pathway_program: 'Free programme',
};

const usd = (n: number) => `$${n.toLocaleString('en-US')}`;
const date = (d: string) => new Date(`${d}T12:00:00+03:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

function ProgramCard({ m, first, index }: { m: AidMatch; first: boolean; index: number }) {
  const [open, setOpen] = useState(first);
  const p = m.program;
  const facts: Array<{ k: string; v: string }> = [];
  if (p.coversFullCost) facts.push({ k: 'Covers', v: 'Full cost' });
  if (p.amountUsdMin && p.amountUsdMax) facts.push({ k: 'Amount', v: `${usd(p.amountUsdMin)} to ${usd(p.amountUsdMax)}` });
  facts.push({ k: 'CSS Profile', v: p.requiresCssProfile ? 'Required' : 'Not required' });
  if (p.deadline) facts.push({ k: 'Deadline', v: date(p.deadline) });

  return (
    <Panel glow={first} className="h-full" bodyClassName="!p-5 sm:!p-7">
      <div className="flex flex-wrap items-center gap-2">
        <Badge kind="neutral" className="normal-case">{TYPE_LABEL[p.programType]}</Badge>
        {p.dataVerifiedAt ? <Badge kind="verified" /> : <Badge kind="unverified" />}
        {first && <Badge kind="target">Best match</Badge>}
      </div>

      <h2 className="mt-4 text-[clamp(1.4rem,1.1rem+1.2vw,2rem)] font-semibold leading-tight tracking-[-0.03em]">{p.name}</h2>
      <p className="mt-1.5 text-[15px] text-fg2">{p.provider}</p>

      <div className="mt-6">
        <Meter label="Match with your profile" value={m.matchScore} max={100} valueLabel={`${m.matchScore}%`} delay={0.15 + index * 0.1} />
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
        {facts.map((f) => (
          <div key={f.k}>
            <dt className="text-sm text-fg2">{f.k}</dt>
            <dd className="mt-0.5 text-[15px] font-medium leading-snug">{f.v}</dd>
          </div>
        ))}
      </dl>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="mt-6 flex w-full items-center justify-between rounded-xl border-t border-line/10 pt-5 text-[15px] font-medium text-accent"
      >
        Who qualifies and how to apply
        <ChevronDown aria-hidden="true" className={cn('h-4 w-4 transition-transform duration-500 ease-expo-out', open && 'rotate-180')} />
      </button>
      <div className={cn('grid transition-[grid-template-rows] duration-500 ease-expo-out', open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
        <div className="overflow-hidden">
          <div className="grid gap-6 pt-4 md:grid-cols-2">
            {p.eligibilityMd && (
              <div>
                <p className="text-micro font-medium uppercase tracking-[0.1em] text-fg2">Who qualifies</p>
                <p className="mt-2 text-[15px] leading-relaxed">{p.eligibilityMd}</p>
              </div>
            )}
            {p.howToApplyMd && (
              <div>
                <p className="text-micro font-medium uppercase tracking-[0.1em] text-fg2">How to apply</p>
                <p className="mt-2 text-[15px] leading-relaxed">{p.howToApplyMd}</p>
              </div>
            )}
          </div>
          {m.reasons.length > 0 && <p className="mt-5 text-sm leading-relaxed text-fg2">Why it matches you: {m.reasons.join(' ')}</p>}
          {p.officialUrl && (
            <Button href={p.officialUrl} target="_blank" rel="noopener noreferrer" variant="secondary" size="sm" className="mt-5">
              Official page <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </Panel>
  );
}

/** Aid programmes ranked for this student. The ranking is a sample until the aid API ships (BE-API-09). */
export default function FinancialAidPage() {
  const [filter, setFilter] = useState<Filter>('all');

  const present = useMemo(() => Array.from(new Set(mockAidMatches.map((m) => m.program.programType))), []);
  const list = mockAidMatches.filter((m) => filter === 'all' || m.program.programType === filter);
  const needForms = mockAidMatches.filter((m) => m.program.requiresCssProfile).length;

  return (
    <div>
      <PageHero
        eyebrow="Financial aid"
        icon={Coins}
        title={'Find the money,\nand the forms.'}
        accentWord="money"
        description="Fee waivers, need-based aid and free programmes, ranked for your family's situation, with the exact forms and deadlines for each."
        aside={
          <div className="flex gap-8">
            <div>
              <p className="tnum text-[2.5rem] font-semibold leading-none tracking-[-0.05em]">{mockAidMatches.length}</p>
              <p className="mt-2 text-sm text-fg2">matches</p>
            </div>
            <div>
              <p className="tnum text-[2.5rem] font-semibold leading-none tracking-[-0.05em]">{needForms}</p>
              <p className="mt-2 text-sm text-fg2">need the CSS Profile</p>
            </div>
          </div>
        }
      />

      <Reveal>
        <Segmented
          layout="pill"
          ariaLabel="Filter by type"
          value={filter}
          onChange={setFilter}
          className="mb-5 max-w-full overflow-x-auto"
          options={[{ value: 'all' as Filter, label: 'All' }, ...present.map((t) => ({ value: t as Filter, label: TYPE_LABEL[t] }))]}
        />
      </Reveal>

      {list.length === 0 ? (
        <Panel>
          <EmptyState icon={Coins} title="Nothing here yet" body="No programme of this type matches your profile. Try another filter." action={<Button variant="secondary" onClick={() => setFilter('all')}>Show everything</Button>} />
        </Panel>
      ) : (
        <div className="grid gap-4 lg:gap-5">
          {list.map((m, i) => (
            <Reveal key={m.program.id} delay={i * 0.06}>
              <ProgramCard m={m} first={i === 0 && filter === 'all'} index={i} />
            </Reveal>
          ))}
        </div>
      )}

      <Reveal className="mt-4 lg:mt-5">
        <Panel>
          <div className="flex items-start gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-murram/15 text-murram-light ring-1 ring-inset ring-murram/40">
              <ShieldAlert className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Never pay to find or win aid</h2>
              <p className="mt-1.5 max-w-2xl text-[15px] leading-relaxed text-fg2">
                Every programme above is free to apply to. If someone asks for a fee to submit an application, secure a scholarship or &ldquo;guarantee&rdquo; a waiver, walk away and check their name on the{' '}
                <a href="/#safety" className="text-accent underline-offset-4 hover:underline">
                  scam radar
                </a>
                .
              </p>
            </div>
          </div>
        </Panel>
      </Reveal>
    </div>
  );
}
