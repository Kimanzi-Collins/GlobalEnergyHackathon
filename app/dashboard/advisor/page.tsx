'use client';

import React, { useState } from 'react';
import {
  Building2,
  Sparkles,
  Send,
  HelpCircle,
  ExternalLink,
  Shield,
  Search,
} from 'lucide-react';
import { useStudentSession } from '@/lib/session-context';
import { mockUniversityMatches, mockUniversities } from '@/lib/fixtures';
import { UniversityMatch, MatchTier } from '@/lib/types';
import { Badge } from '@/components/dashboard/ui/Badge';
import { Card } from '@/components/dashboard/ui/Card';
import { Button } from '@/components/dashboard/ui/Button';

export default function AdvisorPage() {
  const { student } = useStudentSession();
  const [question, setQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);

  const tiers: MatchTier[] = ['reach', 'target', 'likely'];

  const handleAskQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    setIsAsking(true);
    setTimeout(() => {
      setAiAnswer(
        `Based on your KCSE score (${student.kcseGrade || 'B+'}) and your interest in ${student.intendedMajors?.join(' and ') || 'engineering'}, Dartmouth and MIT offer the strongest need-blind financial aid protections for international citizens. Because your household income falls under $5,000, your expected parental contribution at these institutions will be $0 USD.`
      );
      setIsAsking(false);
    }, 1200);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-saffron uppercase tracking-widest mb-1">
            <Building2 className="w-3.5 h-3.5" />
            <span>Curated Admissions Matching</span>
          </div>
          <h1 className="font-fraunces text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-bone">
            University Advisory
          </h1>
          <p className="text-sm font-display text-bone-muted mt-1 max-w-2xl">
            A balanced list categorized into Reach, Target, and Likely tiers. Every school is filtered by need-blind or meets-full-need aid policies for international applicants.
          </p>
        </div>
      </div>

      {/* Question Box */}
      <Card className="bg-ink-surface border-white/10 space-y-3">
        <h3 className="font-editorial text-xl font-bold text-bone flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-saffron" />
          Ask Advisor About Fit &amp; Deadlines
        </h3>
        <form onSubmit={handleAskQuestion} className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. Which need-blind colleges have early action deadlines on Nov 1?"
            className="flex-1 bg-ink border border-white/15 rounded-xl px-4 py-3 text-sm text-bone font-display focus:outline-none focus:border-saffron"
          />
          <Button type="submit" variant="primary" size="md" isLoading={isAsking} className="text-xs">
            <Send className="w-4 h-4 mr-1" /> Ask
          </Button>
        </form>

        {aiAnswer && (
          <div className="p-4 rounded-xl bg-ink/70 border border-saffron/30 text-xs font-display text-bone leading-relaxed animate-fade-in">
            <span className="font-mono text-saffron uppercase text-[10px] block font-bold mb-1">
              Gemini Advisory Note:
            </span>
            {aiAnswer}
          </div>
        )}
      </Card>

      {/* 3 Tier Columns (Stacked on Mobile) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tiers.map((tier) => {
          const tierMatches = mockUniversityMatches.filter((m) => m.tier === tier);
          return (
            <div key={tier} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Badge variant={tier} className="text-xs uppercase">
                    {tier}
                  </Badge>
                  <span className="text-xs font-mono text-bone-muted">
                    ({tierMatches.length} Colleges)
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {tierMatches.map((m) => (
                  <Card
                    key={m.university.id}
                    className="bg-ink-surface border-white/10 space-y-3 hover:border-white/20 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-display font-semibold text-bone">
                        {m.university.name}
                      </h4>
                      {m.university.dataVerifiedAt ? (
                        <Badge variant="verified" className="text-[9px] py-0">
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="unverified" className="text-[9px] py-0">
                          Unverified
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] font-mono text-bone-muted">
                      <span className="text-saffron font-bold">Fit: {m.fitScore}%</span>
                      <span>•</span>
                      <span className="text-[#8CF2A6]">
                        {m.university.isNeedBlindIntl ? 'Need-Blind Intl' : 'Need-Aware'}
                      </span>
                    </div>

                    <ul className="text-xs font-display text-bone-muted space-y-1 pt-1 list-disc list-inside">
                      {m.reasons.map((r, i) => (
                        <li key={i} className="line-clamp-2">{r}</li>
                      ))}
                    </ul>

                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs font-mono text-bone-muted">
                      <span>ED/EA: Nov 1</span>
                      {m.university.websiteUrl && (
                        <a
                          href={m.university.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-saffron hover:underline flex items-center gap-1"
                        >
                          Admissions <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
