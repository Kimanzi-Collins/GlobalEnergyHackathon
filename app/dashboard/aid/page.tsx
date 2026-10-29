'use client';

import React from 'react';
import {
  Coins,
  ExternalLink,
  ShieldAlert,
  Calendar,
  FileCheck,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { mockAidMatches, mockAidPrograms } from '@/lib/fixtures';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function FinancialAidPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-accent uppercase tracking-widest mb-1">
            <Coins className="w-3.5 h-3.5" />
            <span>Need-Based &amp; Merit Scholarships</span>
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-fg">
            Financial Aid Scout
          </h1>
          <p className="text-sm text-fg2 mt-1 max-w-2xl">
            Ranked grant and fee waiver opportunities matched to your household income profile. Over $0 applications with Common App waivers and full-need institutional grants.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {mockAidMatches.map((m) => {
          const prog = m.program;
          return (
            <Card key={prog.id} className="bg-surface ring-1 ring-inset ring-line/10 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-line/10">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-editorial text-2xl font-bold text-fg">
                      {prog.name}
                    </h3>
                    {prog.dataVerifiedAt ? (
                      <Badge kind="verified">Verified</Badge>
                    ) : (
                      <Badge kind="unverified">Unverified</Badge>
                    )}
                  </div>
                  <p className="text-xs font-mono text-fg2">
                    Provider: {prog.provider} • Scope:{' '}
                    <span className="text-accent capitalize">
                      {prog.programType.replace('_', ' ')}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-fg2">Match Fit:</span>
                  <span className="text-xl font-editorial font-bold text-accent">
                    {m.matchScore}%
                  </span>
                </div>
              </div>

              {/* Eligibility & Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5 p-3 rounded-2xl bg-bg/50 ring-1 ring-inset ring-line/10">
                  <span className="font-mono text-fg2 uppercase text-[10px] block">
                    Eligibility &amp; Coverage
                  </span>
                  <p className="text-fg leading-relaxed">{prog.eligibilityMd}</p>
                  {prog.coversFullCost && (
                    <span className="inline-block mt-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-acacia/30 text-[#8CF2A6] ring-1 ring-inset ring-acacia/50">
                      Covers Full Cost of Attendance (100% Need)
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 p-3 rounded-2xl bg-bg/50 ring-1 ring-inset ring-line/10">
                  <span className="font-mono text-fg2 uppercase text-[10px] block">
                    Application Process &amp; Forms
                  </span>
                  <p className="text-fg2 leading-relaxed">
                    {prog.howToApplyMd || 'Submit with regular college application materials.'}
                  </p>
                  <p className="text-[11px] font-mono text-accent pt-1">
                    CSS Profile Required:{' '}
                    {prog.requiresCssProfile ? 'Yes' : 'No (Institution or Common App only)'}
                  </p>
                </div>
              </div>

              {/* Footer Links & Deadlines */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-line/10 text-xs font-mono">
                <div className="flex items-center gap-4 text-fg2">
                  {prog.deadline ? (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-accent" />
                      Deadline: {prog.deadline}
                    </span>
                  ) : (
                    <span>Follows College Application Deadlines</span>
                  )}
                </div>

                {prog.officialUrl && (
                  <a
                    href={prog.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-accent hover:underline"
                  >
                    Official Portal <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
