import { ScrollChapter } from '@/components/motion/scroll-chapter';
import { Reveal } from '@/components/motion/reveal';
import { SplitLines } from '@/components/motion/split-lines';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { GpaCard } from './gpa-card';

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-micro font-medium uppercase text-accent">{children}</p>;
}

function Title({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-3 text-h3 font-semibold">{children}</h3>;
}

function Body({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 max-w-md text-body text-fg2">{children}</p>;
}

const GUIDE_STEPS = [
  { t: 'Understand how US admissions work', done: true },
  { t: 'Convert your KCSE to a US GPA', done: true },
  { t: 'Build your college list', done: false },
  { t: 'Create your Common App account', done: false },
  { t: 'Write your personal statement', done: false },
];

const PROGRAMS = [
  { n: 'Need-based aid', k: 'Per school' },
  { n: 'Application fee waivers', k: 'Common App' },
  { n: 'Free advising', k: 'EducationUSA' },
];

const CHANNELS = ['USSD', 'SMS', 'WhatsApp', 'Web'];

/** Bento of the six tools. Asymmetric spans, one interactive tile, no icon cards. */
export function Tools() {
  return (
    <ScrollChapter chapter="paper" id="tools" aria-labelledby="tools-title" className="px-[clamp(16px,4vw,48px)] py-[clamp(72px,12vw,176px)]">
      <div className="mx-auto max-w-[1280px]">
        <SplitLines id="tools-title" as="h2" text={'Six tools.\nOne assistant.'} className="text-h2 font-semibold" />
        <Reveal delay={0.1} as="p" className="mt-5 max-w-xl text-lead text-fg2">
          Everything between your KCSE results and a US admission letter, in one place, remembered across every phone and app you use.
        </Reveal>

        <div className="mt-[clamp(40px,6vw,88px)] grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-5">
          {/* 1. Guide */}
          <Reveal className="md:col-span-7">
            <Card interactive className="h-full p-[clamp(24px,3vw,44px)]">
              <Label>Application guide</Label>
              <Title>Twelve steps. One at a time.</Title>
              <Body>From how US admissions work to your student visa, with what each step costs and how long it takes.</Body>
              <ol className="mt-8 space-y-3">
                {GUIDE_STEPS.map((s, i) => (
                  <li key={s.t} className="flex items-center gap-3 text-[15px]">
                    <span
                      aria-hidden="true"
                      className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs ring-1 ring-inset ${
                        s.done ? 'bg-accent text-accent-fg ring-transparent' : 'text-fg2 ring-line/25'
                      }`}
                    >
                      {s.done ? '✓' : i + 1}
                    </span>
                    <span className={s.done ? 'text-fg2 line-through decoration-line/30' : 'text-fg'}>{s.t}</span>
                  </li>
                ))}
              </ol>
            </Card>
          </Reveal>

          {/* 2. GPA converter (interactive) */}
          <Reveal delay={0.08} className="md:col-span-5">
            <Card interactive className="h-full p-[clamp(24px,3vw,44px)]">
              <Label>GPA converter</Label>
              <Title>Pick your grade.</Title>
              <Body>See where a KCSE mean grade lands on the US scale.</Body>
              <div className="mt-8">
                <GpaCard />
              </div>
            </Card>
          </Reveal>

          {/* 3. Aid */}
          <Reveal className="md:col-span-4">
            <Card interactive className="h-full p-[clamp(24px,3vw,44px)]">
              <Label>Financial aid scout</Label>
              <Title>Find the money, and the forms.</Title>
              <Body>Matched to your family&apos;s situation, with deadlines and the official link for each.</Body>
              <ul className="mt-8 divide-y divide-line/10 text-[15px]">
                {PROGRAMS.map((p) => (
                  <li key={p.n} className="flex items-center justify-between gap-3 py-3">
                    <span>{p.n}</span>
                    <span className="text-fg2">{p.k}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </Reveal>

          {/* 4. Essays and LOR */}
          <Reveal delay={0.08} className="md:col-span-8">
            <Card interactive className="h-full overflow-hidden p-[clamp(24px,3vw,44px)]">
              <div className="grid gap-8 md:grid-cols-2">
                <div>
                  <Label>Essays and recommendations</Label>
                  <Title>Read like an admissions officer would.</Title>
                  <Body>
                    Feedback by essay type and by school, plus a check of your teachers&apos; letters. It shows you what to fix. It never writes for you.
                  </Body>
                </div>
                <div className="space-y-3 self-center" aria-hidden="true">
                  {[
                    ['Specific moments', 84],
                    ['Authentic voice', 76],
                    ['Clear to a US reader', 91],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <div className="mb-1.5 flex justify-between text-[13px] text-fg2">
                        <span>{k}</span>
                        <span className="tnum">{v}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-fg/10">
                        <div className="h-full origin-left rounded-full bg-accent" style={{ width: `${v}%` }} />
                      </div>
                    </div>
                  ))}
                  <p className="pt-1 text-micro uppercase text-fg2">Sample review</p>
                </div>
              </div>
            </Card>
          </Reveal>

          {/* 5. Advisor */}
          <Reveal className="md:col-span-5">
            <Card interactive className="h-full p-[clamp(24px,3vw,44px)]">
              <Label>University advisory</Label>
              <Title>A list that fits you.</Title>
              <Body>Reach, target and likely schools from your grades, tests, field and what your family can pay.</Body>
              <div className="mt-8 grid grid-cols-3 gap-2 text-center" aria-hidden="true">
                {[
                  ['Reach', '2'],
                  ['Target', '4'],
                  ['Likely', '3'],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-2xl bg-bg py-4 ring-1 ring-inset ring-line/10">
                    <p className="tnum text-h3 font-semibold">{v}</p>
                    <p className="text-micro uppercase text-fg2">{k}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-micro uppercase text-fg2">Example shortlist</p>
            </Card>
          </Reveal>

          {/* 6. Context */}
          <Reveal delay={0.08} className="md:col-span-7">
            <Card interactive className="h-full p-[clamp(24px,3vw,44px)]">
              <Label>Student context</Label>
              <Title>It remembers you. Everywhere.</Title>
              <Body>
                Start on a feature phone, continue on WhatsApp, finish on the web. One profile, tied to your number, that every tool reads.
              </Body>
              <div className="mt-8 flex flex-wrap items-center gap-2">
                {CHANNELS.map((c) => (
                  <span key={c} className="rounded-full bg-bg px-4 py-2 text-sm font-medium ring-1 ring-inset ring-line/15">
                    {c}
                  </span>
                ))}
                <Badge kind="neutral" className="ml-1">
                  Your data, your control
                </Badge>
              </div>
            </Card>
          </Reveal>
        </div>
      </div>
    </ScrollChapter>
  );
}
