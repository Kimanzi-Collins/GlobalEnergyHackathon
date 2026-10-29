'use client';

import React from 'react';
import Link from 'next/link';
import {
  Calendar,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  FileText,
  Clock,
  Shield,
  Phone,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { useStudentSession } from '@/lib/session-context';
import {
  mockGuideSteps,
  mockUniversityMatches,
  mockAidMatches,
  mockEssays,
  mockStudentFacts,
} from '@/lib/fixtures';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { USSD_SERVICE_CODE } from '@/lib/constants';

export default function DashboardHome() {
  const { student } = useStudentSession();

  // Compute guide progress
  const completedSteps = mockGuideSteps.filter((s) => s.status === 'done').length;
  const totalSteps = mockGuideSteps.length;
  const progressPercent = Math.round((completedSteps / totalSteps) * 100);

  // SVG Progress Ring calculations
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. Top Band: Greeting, Next Deadline Ticker & Guide Ring */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-line/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-accent uppercase tracking-widest mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Admissions Portal • Cycle 2026-2027</span>
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-fg">
            Habari, {student.fullName.split(' ')[0]}
          </h1>
          <p className="text-sm font-sans text-fg2 mt-1">
            Applying from {student.schoolName || 'Kenya'} • KCSE Grade{' '}
            <span className="font-mono text-fg font-semibold">{student.kcseGrade || 'B+'}</span> (
            <span className="font-mono text-accent">{student.gpaEquivalent?.toFixed(2) || '3.50'} GPA</span>{' '}
            <Badge kind="indicative" className="text-[10px] ml-1">Indicative</Badge>)
          </p>
        </div>

        {/* Right Cards: Deadline Countdown & Progress Ring */}
        <div className="flex items-center gap-4 self-start md:self-auto">
          {/* Urgent Deadline Card */}
          <div className="bg-surface ring-1 ring-inset ring-murram/40 rounded-2xl px-4 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-murram/20 ring-1 ring-inset ring-murram/40 flex items-center justify-center text-murram-light">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-mono uppercase text-fg2 tracking-wider">Next Deadline</p>
              <p className="text-sm font-medium text-fg">Dartmouth (ED)</p>
              <p className="text-xs font-mono text-murram-light font-bold">In 3 days • Nov 1</p>
            </div>
          </div>

          {/* Guide Progress Ring */}
          <div className="bg-surface ring-1 ring-inset ring-line/10 rounded-2xl px-4 py-2.5 flex items-center gap-3">
            <div className="relative w-14 h-14 flex items-center justify-center">
              <svg className="w-14 h-14 transform -rotate-90">
                <circle
                  cx="28"
                  cy="28"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="5"
                  className="text-line/10"
                  fill="transparent"
                />
                <circle
                  cx="28"
                  cy="28"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="text-accent transition-all duration-700 ease-out"
                  fill="transparent"
                />
              </svg>
              <span className="absolute text-xs font-mono font-bold text-fg">
                {progressPercent}%
              </span>
            </div>
            <div>
              <p className="text-[11px] font-mono uppercase text-fg2 tracking-wider">Guide</p>
              <p className="text-sm font-medium text-fg">
                {completedSteps} of {totalSteps} Steps
              </p>
              <Link href="/dashboard/guide" className="text-xs font-mono text-accent hover:underline flex items-center gap-0.5">
                Resume <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Student Context Summary Card & Transparency Disclosure */}
      <Card className="bg-surface ring-1 ring-inset ring-line/10 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-line/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-acacia/30 ring-1 ring-inset ring-acacia/50 flex items-center justify-center text-[#8CF2A6]">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-fg">
                Student Context &amp; Verified Identity
              </h2>
              <p className="text-xs text-fg2">
                One profile synced across USSD dialler, WhatsApp, and Web.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-fg2">Phone:</span>
            <span className="text-xs font-mono text-phosphor bg-screen px-2.5 py-1 rounded-full ring-1 ring-inset ring-phosphor/20">
              {student.phoneNumber}
            </span>
            <Link href="/dashboard/context">
              <Button variant="secondary" size="sm" className="ml-2 text-xs">
                Edit Profile
              </Button>
            </Link>
          </div>
        </div>

        {/* Fact Pills Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
          <div className="p-3 rounded-xl bg-bg/50 ring-1 ring-inset ring-line/10">
            <p className="text-[11px] font-mono text-fg2 uppercase">KCSE Performance</p>
            <p className="text-sm font-semibold text-fg mt-0.5">
              Grade {student.kcseGrade} ({student.kcsePoints} Points)
            </p>
            <p className="text-xs font-mono text-accent mt-0.5">
              ~{student.gpaEquivalent?.toFixed(2)} US 4.0 Equivalent
            </p>
          </div>

          <div className="p-3 rounded-xl bg-bg/50 ring-1 ring-inset ring-line/10">
            <p className="text-[11px] font-mono text-fg2 uppercase">Intended Majors</p>
            <p className="text-sm font-semibold text-fg mt-0.5 truncate">
              {student.intendedMajors?.join(', ') || 'Not specified'}
            </p>
            <p className="text-xs font-mono text-fg2 mt-0.5">Engineering &amp; CS</p>
          </div>

          <div className="p-3 rounded-xl bg-bg/50 ring-1 ring-inset ring-line/10">
            <p className="text-[11px] font-mono text-fg2 uppercase">Financial Aid Need</p>
            <p className="text-sm font-semibold text-fg mt-0.5">
              {student.needsFullAid ? '100% Full Aid Needed' : 'Partial Aid'}
            </p>
            <p className="text-xs font-mono text-fg2 mt-0.5">Under $5k household income</p>
          </div>

          <div className="p-3 rounded-xl bg-bg/50 ring-1 ring-inset ring-line/10">
            <p className="text-[11px] font-mono text-fg2 uppercase">Standardized Tests</p>
            <p className="text-sm font-semibold text-fg mt-0.5">
              SAT {student.satScore || 'Not taken'}
            </p>
            <p className="text-xs font-mono text-fg2 mt-0.5">Math 760 / ERW 680</p>
          </div>
        </div>

        {/* Gemini Disclosure Note */}
        <div className="mt-4 pt-3 border-t border-line/10 flex items-center justify-between text-xs font-mono text-fg2">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>Pepea injects {mockStudentFacts.length} context facts into Gemini 2.5 Flash for personalized admissions advice.</span>
          </span>
          <Link href="/dashboard/context" className="text-accent hover:underline flex items-center gap-0.5">
            View disclosure <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </Card>

      {/* 3. Asymmetric Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Guide Checklist & Essays Studio */}
        <div className="lg:col-span-8 space-y-6">
          {/* Guide Checklist Preview */}
          <Card className="bg-surface ring-1 ring-inset ring-line/10">
            <div className="flex items-center justify-between pb-4 border-b border-line/10">
              <div>
                <h3 className="font-editorial text-2xl font-bold text-fg">Admissions Roadmap</h3>
                <p className="text-xs text-fg2">
                  12 sequential steps from KCSE to US F-1 visa.
                </p>
              </div>
              <Link href="/dashboard/guide">
                <Button variant="secondary" size="sm">
                  Full Guide
                </Button>
              </Link>
            </div>

            <div className="divide-y divide-line/10 mt-2">
              {mockGuideSteps.slice(0, 4).map((step) => (
                <div key={step.id} className="py-3 flex items-start justify-between gap-4 group">
                  <div className="flex items-start gap-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono mt-0.5 shrink-0 ${
                        step.status === 'done'
                          ? 'bg-acacia text-[#8CF2A6]'
                          : step.status === 'in_progress'
                          ? 'bg-accent/20 text-accent ring-1 ring-inset ring-accent'
                          : 'bg-fg/5 text-fg2'
                      }`}
                    >
                      {step.status === 'done' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        step.order
                      )}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-fg group-hover:text-accent transition-colors">
                        {step.title}
                      </p>
                      <p className="text-xs text-fg2 line-clamp-1 mt-0.5">
                        {step.summary}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {step.costUsd === 0 && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-acacia/30 text-[#8CF2A6] ring-1 ring-inset ring-acacia/50">
                        FREE
                      </span>
                    )}
                    <span className="text-xs font-mono text-fg2 capitalize">
                      {step.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* USSD hint */}
            <div className="mt-4 pt-3 border-t border-line/10 flex items-center justify-between text-xs font-mono text-fg2">
              <span>On a 2G feature phone? Dial {USSD_SERVICE_CODE} &gt; 1 to browse steps offline.</span>
            </div>
          </Card>

          {/* Essays Studio Quick Access */}
          <Card className="bg-surface ring-1 ring-inset ring-line/10">
            <div className="flex items-center justify-between pb-4 border-b border-line/10">
              <div>
                <h3 className="font-editorial text-2xl font-bold text-fg">Essays &amp; Statements</h3>
                <p className="text-xs text-fg2">
                  Drafting, word counter, and admissions officer rubric roast.
                </p>
              </div>
              <Link href="/dashboard/essays">
                <Button variant="primary" size="sm">
                  Write / Roast
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              {mockEssays.map((essay) => (
                <div
                  key={essay.id}
                  className="p-4 rounded-2xl bg-bg/60 ring-1 ring-inset ring-line/10 hover:ring-accent/40 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs font-mono text-fg2 mb-2">
                    <span className="uppercase">{essay.essayType.replace('_', ' ')}</span>
                    <span className="text-accent font-bold">
                      {essay.latestScore ? `${essay.latestScore}/100` : 'Draft'}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-fg line-clamp-1">
                    {essay.title || 'Untitled Draft'}
                  </h4>
                  <p className="text-xs font-mono text-fg2 mt-1">
                    Version #{essay.latestVersionNo} • Status: {essay.status}
                  </p>
                  <div className="mt-3 pt-3 border-t border-line/10 flex items-center justify-between">
                    <Link
                      href={`/dashboard/essays`}
                      className="text-xs font-mono text-accent hover:underline flex items-center gap-1"
                    >
                      Open in Studio <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column (4 cols): College Matches & Financial Aid */}
        <div className="lg:col-span-4 space-y-6">
          {/* Top College Matches */}
          <Card className="bg-surface ring-1 ring-inset ring-line/10">
            <div className="flex items-center justify-between pb-3 border-b border-line/10">
              <h3 className="font-editorial text-xl font-bold text-fg">College Advisory</h3>
              <Link href="/dashboard/advisor" className="text-xs font-mono text-accent hover:underline">
                View all
              </Link>
            </div>

            <div className="space-y-3 mt-3">
              {mockUniversityMatches.map((match) => (
                <div
                  key={match.university.id}
                  className="p-3 rounded-2xl bg-bg/60 ring-1 ring-inset ring-line/10 hover:ring-line/25 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-semibold text-fg leading-snug">
                      {match.university.name}
                    </h4>
                    <Badge kind={match.tier} className="text-[10px] shrink-0">
                      {match.tier}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-[11px] font-mono text-fg2">
                    <span>Fit: {match.fitScore}%</span>
                    <span>•</span>
                    <span className="text-[#8CF2A6]">
                      {match.university.isNeedBlindIntl ? 'Need-Blind' : 'Need-Aware'}
                    </span>
                  </div>
                  <div className="mt-2">
                    {match.university.dataVerifiedAt ? (
                      <Badge kind="verified" className="text-[9px] py-0.5">
                        Verified
                      </Badge>
                    ) : (
                      <Badge kind="unverified" className="text-[9px] py-0.5">
                        Unverified
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Financial Aid Scout */}
          <Card className="bg-surface ring-1 ring-inset ring-line/10">
            <div className="flex items-center justify-between pb-3 border-b border-line/10">
              <h3 className="font-editorial text-xl font-bold text-fg">Aid Programs</h3>
              <Link href="/dashboard/aid" className="text-xs font-mono text-accent hover:underline">
                Explore
              </Link>
            </div>

            <div className="space-y-3 mt-3">
              {mockAidMatches.map((match) => (
                <div
                  key={match.program.id}
                  className="p-3 rounded-2xl bg-bg/60 ring-1 ring-inset ring-line/10"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-fg truncate">
                      {match.program.name}
                    </h4>
                    <span className="text-xs font-mono text-accent font-bold">
                      {match.matchScore}%
                    </span>
                  </div>
                  <p className="text-[11px] text-fg2 line-clamp-2 mt-1">
                    {match.reasons[0]}
                  </p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-line/10">
                    <span className="text-[10px] font-mono text-fg2 uppercase">
                      {match.program.provider}
                    </span>
                    {match.program.dataVerifiedAt ? (
                      <Badge kind="verified" className="text-[9px] py-0.5">Verified</Badge>
                    ) : (
                      <Badge kind="unverified" className="text-[9px] py-0.5">Unverified</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Teacher LOR Callout */}
          <div className="p-4 rounded-3xl bg-acacia/20 ring-1 ring-inset ring-acacia/50 text-fg">
            <h4 className="font-editorial text-lg font-bold text-fg">Teacher Recommendations</h4>
            <p className="text-xs text-fg2 mt-1 leading-relaxed">
              Have a draft letter from your high school teacher? Run it through Pepea’s 4-axis rubric to detect missing Kenyan context.
            </p>
            <Link href="/dashboard/lor" className="inline-block mt-3">
              <Button variant="secondary" size="sm" className="text-xs">
                Review Teacher Letter
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
