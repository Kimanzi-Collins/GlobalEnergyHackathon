'use client';

import React, { useState } from 'react';
import {
  MailCheck,
  Sparkles,
  Send,
  AlertTriangle,
  Award,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { mockSampleLorResult } from '@/lib/fixtures';
import { LorReviewResult } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

export default function LorReviewPage() {
  const [recommenderName, setRecommenderName] = useState('Mwalimu John Mwangi');
  const [recommenderRole, setRecommenderRole] = useState('Head of Science / Physics Teacher');
  const [letterDraft, setLetterDraft] = useState(
    'I have known Kwame for over three years as his Form 3 and Form 4 Physics instructor. He is an exceptionally disciplined, polite, and hardworking student who consistently completed all laboratory practicals. In our county mock examinations, he placed in the top 1% of candidates. Whenever other students struggled with electricity and magnetism concepts, Kwame patiently explained the calculations after prep hours. I recommend him without reservation for admission.'
  );

  const [isReviewing, setIsReviewing] = useState(false);
  const [result, setResult] = useState<LorReviewResult | null>(mockSampleLorResult);

  const handleReview = () => {
    setIsReviewing(true);
    setTimeout(() => {
      setResult(mockSampleLorResult);
      setIsReviewing(false);
    }, 1200);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-accent uppercase tracking-widest mb-1">
            <MailCheck className="w-3.5 h-3.5" />
            <span>Teacher Recommendation Analysis • Gemini 2.5</span>
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-fg">
            Teacher LOR Review
          </h1>
          <p className="text-sm text-fg2 mt-1 max-w-2xl">
            Evaluate teacher recommendation drafts against US holistic standards. Pepea never ghostwrites letters; it helps teachers highlight concrete classroom anecdotes and explain the Kenyan grading curve.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recommender details and draft letter */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="bg-surface ring-1 ring-inset ring-line/10 space-y-4">
            <h3 className="font-editorial text-xl font-bold text-fg">
              Recommender Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Teacher / Recommender Name"
                value={recommenderName}
                onChange={(e) => setRecommenderName(e.target.value)}
              />
              <Input
                label="Role / Subject Taught"
                value={recommenderRole}
                onChange={(e) => setRecommenderRole(e.target.value)}
              />
            </div>

            <div className="pt-2">
              <Textarea
                label="Letter Draft Text"
                value={letterDraft}
                onChange={(e) => setLetterDraft(e.target.value)}
                className="min-h-[220px]"
                hint="Draft provided by your teacher for review prior to official Common App submission."
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-mono text-fg2">
                Evaluates 4 axes: Specificity, Endorsement, Tone, Context.
              </span>
              <Button
                variant="primary"
                size="md"
                onClick={handleReview}
                isLoading={isReviewing}
                disabled={!letterDraft.trim()}
                className="text-xs"
              >
                <Sparkles className="w-4 h-4 mr-1.5" />
                Analyze Draft
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Column: 4-Axis Rubric Score & Actionable Gaps */}
        <div className="lg:col-span-5 space-y-4">
          {result && (
            <Card className="bg-surface ring-1 ring-inset ring-line/10 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-line/10">
                <div>
                  <span className="text-[11px] font-mono uppercase text-fg2 tracking-wider">
                    Assessment
                  </span>
                  <h4 className="font-editorial text-2xl font-bold text-fg">
                    {result.verdict}
                  </h4>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-editorial font-bold text-accent">
                    {result.overallScore}
                  </span>
                  <span className="text-xs font-mono text-fg2 block">/ 100</span>
                </div>
              </div>

              {/* 4-Axis Scores */}
              <div className="space-y-2.5">
                {[
                  { key: 'specificity', label: 'Concrete Details & Anecdotes', score: result.rubricScores.specificity, max: 25 },
                  { key: 'endorsement', label: 'Comparative Endorsement', score: result.rubricScores.endorsement, max: 25 },
                  { key: 'tone', label: 'Genuine, Uninflated Tone', score: result.rubricScores.tone, max: 25 },
                  { key: 'context', label: 'Kenyan Classroom Context', score: result.rubricScores.context, max: 25 },
                ].map((item) => (
                  <div key={item.key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-fg">{item.label}</span>
                      <span className="font-mono text-accent">{item.score}/{item.max}</span>
                    </div>
                    <div className="w-full h-1.5 bg-bg rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full"
                        style={{ width: `${(item.score / item.max) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* What to Add About Kenya */}
              <div className="p-3.5 rounded-2xl bg-acacia/20 ring-1 ring-inset ring-acacia/50 space-y-2 text-xs">
                <span className="font-mono text-[#8CF2A6] font-bold text-[10px] uppercase block">
                  What Mwalimu Should Add About Kenya:
                </span>
                <ul className="list-disc list-inside space-y-1 text-fg">
                  {result.kenyaContextToAdd.map((gap, i) => (
                    <li key={i}>{gap}</li>
                  ))}
                </ul>
              </div>

              {/* Gaps to Address */}
              <div className="p-3.5 rounded-2xl bg-bg/70 ring-1 ring-inset ring-line/10 space-y-1.5 text-xs">
                <span className="font-mono text-accent font-bold text-[10px] uppercase block">
                  Missing Evidence Gaps:
                </span>
                <ul className="list-disc list-inside space-y-1 text-fg2">
                  {result.gaps.map((g, i) => (
                    <li key={i}>{g}</li>
                  ))}
                </ul>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
