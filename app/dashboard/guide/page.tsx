'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Compass,
  CheckCircle2,
  Circle,
  Clock,
  Coins,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Phone,
} from 'lucide-react';
import { mockGuideSteps } from '@/lib/fixtures';
import { GuideStep, GuidePhase, ProgressStatus } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { USSD_SERVICE_CODE } from '@/lib/constants';

const phaseLabels: Record<GuidePhase, { title: string; subtitle: string }> = {
  prepare: { title: 'Phase 1: Foundations & Evaluation', subtitle: 'Demystifying holistic admissions, converting grades, and testing strategy.' },
  choose: { title: 'Phase 2: College Selection', subtitle: 'Curating a balanced list of reach, target, and likely schools with financial fit.' },
  apply: { title: 'Phase 3: The Common Application', subtitle: 'Accounts, fee waiver requests, personal statements, and teacher recommendations.' },
  fund: { title: 'Phase 4: Financial Aid & Scholarships', subtitle: 'CSS Profile submission, ISFAA forms, and merit award applications.' },
  decide: { title: 'Phase 5: Decision & Financial Review', subtitle: 'Comparing financial aid award letters and selecting your enrollment institution.' },
  visa: { title: 'Phase 6: Visa & Pre-Departure', subtitle: 'I-20 issuance, SEVIS I-901 fee payment, and US Embassy Nairobi interview.' },
};

export default function GuidePage() {
  const [steps, setSteps] = useState(mockGuideSteps);
  const [expandedStepId, setExpandedStepId] = useState<string>('step_1');

  // Toggle step progress status
  const handleToggleStepStatus = (id: string) => {
    setSteps((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const nextStatus: ProgressStatus = s.status === 'done' ? 'todo' : 'done';
          return { ...s, status: nextStatus };
        }
        return s;
      })
    );
  };

  const completedCount = steps.filter((s) => s.status === 'done').length;
  const totalCount = steps.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  // Group steps by phase
  const groupedPhases: GuidePhase[] = ['prepare', 'choose', 'apply', 'fund', 'decide', 'visa'];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-accent uppercase tracking-widest mb-1">
            <Compass className="w-3.5 h-3.5" />
            <span>Official Roadmap • 12 Steps</span>
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-fg">
            Application Guide
          </h1>
          <p className="text-sm text-fg2 mt-1 max-w-2xl">
            A comprehensive, scam-free timeline designed for Kenyan KCSE students applying to US universities. Everything can be prepared for free without paying costly commercial agencies.
          </p>
        </div>

        {/* Progress Bar Badge */}
        <div className="bg-surface ring-1 ring-inset ring-line/10 rounded-2xl p-4 flex items-center gap-4 self-start sm:self-auto min-w-[200px]">
          <div className="w-full space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-fg font-semibold">Progress</span>
              <span className="text-accent font-bold">{progressPercent}%</span>
            </div>
            <div className="w-full h-2 bg-bg rounded-full overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-fg2 block text-right">
              {completedCount} of {totalCount} completed
            </span>
          </div>
        </div>
      </div>

      {/* 2. USSD Offline Tip Banner */}
      <div className="p-4 rounded-2xl bg-screen ring-1 ring-inset ring-phosphor/20 text-phosphor flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Phone className="w-5 h-5 shrink-0" />
          <p className="text-xs font-mono leading-relaxed">
            Need to browse steps offline on a 2G handset? Dial{' '}
            <strong className="underline">{USSD_SERVICE_CODE}</strong> and select option 1 to read and complete steps via SMS.
          </p>
        </div>
      </div>

      {/* 3. Phased Vertical Stepper */}
      <div className="space-y-8">
        {groupedPhases.map((phaseKey) => {
          const phaseMeta = phaseLabels[phaseKey];
          const phaseSteps = steps.filter((s) => s.phase === phaseKey);
          if (phaseSteps.length === 0) return null;

          return (
            <div key={phaseKey} className="space-y-3">
              <div className="pb-2 border-b border-line/10">
                <h2 className="font-editorial text-2xl font-bold text-fg">
                  {phaseMeta.title}
                </h2>
                <p className="text-xs text-fg2">{phaseMeta.subtitle}</p>
              </div>

              <div className="space-y-3">
                {phaseSteps.map((step) => {
                  const isDone = step.status === 'done';
                  const isExpanded = expandedStepId === step.id;

                  return (
                    <Card
                      key={step.id}
                      className={`bg-surface ring-1 ring-inset transition-all ${
                        isDone
                          ? 'ring-acacia/40 bg-acacia/10'
                          : 'ring-line/10 hover:ring-line/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        {/* Step Checkbox & Title */}
                        <div className="flex items-start gap-3.5 flex-1">
                          <button
                            type="button"
                            onClick={() => handleToggleStepStatus(step.id)}
                            className="mt-0.5 text-fg2 hover:text-accent transition-colors"
                            title={isDone ? 'Mark as todo' : 'Mark as done'}
                          >
                            {isDone ? (
                              <CheckCircle2 className="w-6 h-6 text-[#8CF2A6]" />
                            ) : (
                              <Circle className="w-6 h-6 text-line/20 hover:text-line/60" />
                            )}
                          </button>

                          <div className="space-y-1 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-mono text-accent font-bold">
                                Step {step.order}
                              </span>
                              <h3
                                className={`text-base font-semibold transition-colors cursor-pointer ${
                                  isDone ? 'line-through text-fg2' : 'text-fg'
                                }`}
                                onClick={() => setExpandedStepId(isExpanded ? '' : step.id)}
                              >
                                {step.title}
                              </h3>
                            </div>

                            <p className="text-xs text-fg2 leading-relaxed">
                              {step.summary}
                            </p>
                          </div>
                        </div>

                        {/* Metadata Chips & Accordion Toggle */}
                        <div className="flex items-center gap-2 shrink-0">
                          {step.costUsd === 0 ? (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-acacia/30 text-[#8CF2A6] ring-1 ring-inset ring-acacia/40">
                              $0 Free
                            </span>
                          ) : step.costUsd ? (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-fg/5 text-fg2 ring-1 ring-inset ring-line/10">
                              ${step.costUsd} USD
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent/10 text-accent ring-1 ring-inset ring-accent/30">
                              Fee Waiver
                            </span>
                          )}

                          {step.estMinutes && (
                            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-fg2 bg-fg/5 px-2 py-0.5 rounded-full ring-1 ring-inset ring-line/10">
                              <Clock className="w-3 h-3" />
                              {step.estMinutes}m
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => setExpandedStepId(isExpanded ? '' : step.id)}
                            className="p-1 text-fg2 hover:text-fg rounded-lg"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Step Body */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-line/10 space-y-3 animate-fade-in">
                          <div className="text-xs text-fg leading-relaxed whitespace-pre-line bg-bg/50 p-4 rounded-2xl ring-1 ring-inset ring-line/10">
                            {step.bodyMd}
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                            {step.externalUrl && (
                              <a
                                href={step.externalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-mono text-accent hover:underline"
                              >
                                Official Resource Link <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}

                            <span className="text-[10px] font-mono text-fg2">
                              USSD shortcut: {USSD_SERVICE_CODE} &gt; 1 &gt; {step.ussdCode}
                            </span>
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
