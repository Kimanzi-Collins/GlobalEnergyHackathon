'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileEdit,
  Sparkles,
  Lock,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  RotateCcw,
  BookOpen,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import { useStudentSession } from '@/lib/session-context';
import {
  mockEssayTypes,
  mockUniversities,
  mockSchoolEssayPrompts,
  mockSampleReviewResult,
  mockEssays,
} from '@/lib/fixtures';
import {
  EssayTypeCode,
  EssayScope,
  EssayReviewResult,
  SchoolEssayPrompt,
} from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';

export default function EssaysStudioPage() {
  const { student } = useStudentSession();

  // Step 1: Selected Essay Type
  const [selectedType, setSelectedType] = useState<EssayTypeCode>('personal_statement');

  // Step 2: For school-specific types: selected school and selected prompt
  const [selectedUniversityId, setSelectedUniversityId] = useState<string>('');
  const [selectedPromptId, setSelectedPromptId] = useState<string>('');

  // Step 3: Draft & Review State
  const [draft, setDraft] = useState<string>(
    'The soldering iron was too hot for the copper wire, but in Kericho, you do not replace broken tools—you adapt them. In Form 3, when our school dormitory experienced power fluctuations during mock examinations, I used a bicycle dynamo to assemble an emergency battery charger for our study lamps.'
  );
  const [persona, setPersona] = useState<'ivy_committee_chair' | 'kensap_mentor'>('ivy_committee_chair');
  const [isReviewing, setIsReviewing] = useState<boolean>(false);
  const [reviewResult, setReviewResult] = useState<EssayReviewResult | null>(mockSampleReviewResult);

  // Active essay type metadata
  const currentTypeObj = mockEssayTypes.find((t) => t.code === selectedType) || mockEssayTypes[0];
  const isSchoolSpecific = currentTypeObj.scope === 'school_specific';

  // Prompts filtered by selected university and essay type
  const availablePrompts = mockSchoolEssayPrompts.filter(
    (p) =>
      (!selectedUniversityId || p.universityId === selectedUniversityId) &&
      p.essayType === selectedType
  );

  const activePrompt: SchoolEssayPrompt | undefined = mockSchoolEssayPrompts.find(
    (p) => p.id === selectedPromptId
  );

  // Determine current active word limit
  const activeWordLimit = activePrompt?.wordLimit || currentTypeObj.defaultWordLimit || 650;

  // Editor lock rule (FE-TEST-02): If school-specific, requires university and prompt selected
  const isEditorUnlocked = !isSchoolSpecific || (Boolean(selectedUniversityId) && Boolean(selectedPromptId));

  // Word count computation
  const wordCount = React.useMemo(() => {
    if (!draft) return 0;
    const trimmed = draft.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
  }, [draft]);

  const isOverLimit = wordCount > activeWordLimit;
  const isNearLimit = wordCount >= Math.floor(activeWordLimit * 0.9) && wordCount <= activeWordLimit;

  // Trigger Gemini Roast Review
  const handleRunReview = async () => {
    setIsReviewing(true);
    // Simulate AI committee scoring with brief authentic feedback transition
    setTimeout(() => {
      setReviewResult({
        ...mockSampleReviewResult,
        overallScore: Math.min(94, Math.max(68, 75 + Math.floor(Math.random() * 15))),
      });
      setIsReviewing(false);
    }, 1500);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-saffron uppercase tracking-widest mb-1">
            <FileEdit className="w-3.5 h-3.5" />
            <span>Admissions Officer Roast Studio • Gemini 2.5 Flash</span>
          </div>
          <h1 className="font-fraunces text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-bone">
            Essays Studio
          </h1>
          <p className="text-sm font-display text-bone-muted mt-1 max-w-2xl">
            Pick your prompt, draft with live word bounds, and receive tough Ivy League admissions committee feedback. Pepea diagnoses generic <em>Insha</em> style and highlights missing Kenyan context.
          </p>
        </div>

        {/* Persona Selector */}
        <div className="flex items-center gap-2 p-1 bg-ink-surface border border-white/10 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setPersona('ivy_committee_chair')}
            className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-colors ${
              persona === 'ivy_committee_chair'
                ? 'bg-saffron text-ink font-bold'
                : 'text-bone-muted hover:text-bone'
            }`}
          >
            Ivy AO Chair
          </button>
          <button
            type="button"
            onClick={() => setPersona('kensap_mentor')}
            className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-colors ${
              persona === 'kensap_mentor'
                ? 'bg-saffron text-ink font-bold'
                : 'text-bone-muted hover:text-bone'
            }`}
          >
            Kenyan Mentor
          </button>
        </div>
      </div>

      {/* 2. Step 1: Essay Type Selector */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-mono uppercase tracking-wider text-bone-muted flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-saffron text-ink font-bold inline-flex items-center justify-center text-[10px]">
              1
            </span>
            <span>Choose Essay Type:</span>
          </label>
          <span className="text-xs font-mono text-bone-muted">
            Scope: <span className="text-saffron capitalize">{currentTypeObj.scope.replace('_', ' ')}</span>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {mockEssayTypes.map((t) => {
            const isSelected = selectedType === t.code;
            return (
              <button
                key={t.code}
                type="button"
                onClick={() => {
                  setSelectedType(t.code);
                  setSelectedPromptId('');
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-saffron/15 border-saffron text-bone shadow-md'
                    : 'bg-ink-surface border-white/10 text-bone-muted hover:border-white/30 hover:text-bone'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                  <span
                    className={`px-1.5 py-0.5 rounded uppercase ${
                      t.scope === 'common'
                        ? 'bg-acacia/40 text-[#8CF2A6]'
                        : t.scope === 'school_specific'
                        ? 'bg-murram/30 text-murram-light'
                        : 'bg-white/10 text-bone-muted'
                    }`}
                  >
                    {t.scope.replace('_', ' ')}
                  </span>
                  <span>{t.defaultWordLimit}w</span>
                </div>
                <p className="text-xs font-display font-semibold line-clamp-1 text-bone">
                  {t.label}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Step 2 (Mandatory if school-specific): School & Prompt Pickers */}
      {isSchoolSpecific && (
        <Card className="bg-ink-surface border-white/10 space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-bone-muted">
            <span className="w-5 h-5 rounded-full bg-saffron text-ink font-bold inline-flex items-center justify-center text-[10px]">
              2
            </span>
            <span>Select University &amp; School Prompt:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* School Selector */}
            <div>
              <label className="block text-xs font-mono text-bone-muted uppercase mb-1.5">
                Target University:
              </label>
              <select
                value={selectedUniversityId}
                onChange={(e) => {
                  setSelectedUniversityId(e.target.value);
                  setSelectedPromptId('');
                }}
                className="w-full bg-ink border border-white/20 rounded-lg px-4 py-2.5 text-bone text-sm font-display focus:outline-none focus:ring-1 focus:ring-saffron"
              >
                <option value="">-- Select School --</option>
                {mockUniversities.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Prompt Selector */}
            <div>
              <label className="block text-xs font-mono text-bone-muted uppercase mb-1.5">
                Specific Supplemental Prompt:
              </label>
              <select
                value={selectedPromptId}
                onChange={(e) => setSelectedPromptId(e.target.value)}
                disabled={!selectedUniversityId}
                className="w-full bg-ink border border-white/20 rounded-lg px-4 py-2.5 text-bone text-sm font-display focus:outline-none focus:ring-1 focus:ring-saffron disabled:opacity-40"
              >
                <option value="">
                  {selectedUniversityId ? '-- Choose School Prompt --' : '-- First Select a University --'}
                </option>
                {availablePrompts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.wordLimit} words)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {activePrompt && (
            <div className="p-3 rounded-lg bg-ink/70 border border-saffron/30 text-xs font-display space-y-1">
              <span className="text-[11px] font-mono text-saffron uppercase font-bold">Official Prompt Text:</span>
              <p className="text-bone italic">&ldquo;{activePrompt.promptText}&rdquo;</p>
              <span className="text-[10px] font-mono text-bone-muted block pt-1">
                Word Limit: {activePrompt.wordLimit} words • Cycle: {activePrompt.admissionCycle}
              </span>
            </div>
          )}
        </Card>
      )}

      {/* 4. Step 3: Editor & Review Split Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Draft Editor */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="bg-ink-surface border-white/10 relative">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-saffron text-ink font-bold inline-flex items-center justify-center text-[10px]">
                  3
                </span>
                <h3 className="font-editorial text-xl font-bold text-bone">
                  Drafting Canvas
                </h3>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-mono font-medium ${
                    isOverLimit
                      ? 'text-murram-light font-bold'
                      : isNearLimit
                      ? 'text-saffron'
                      : 'text-bone-muted'
                  }`}
                >
                  {wordCount} / {activeWordLimit} words
                  {isOverLimit && ` (over by ${wordCount - activeWordLimit})`}
                </span>
              </div>
            </div>

            {/* Lock Guard for School-Specific Types */}
            {!isEditorUnlocked ? (
              <div className="py-16 text-center space-y-3 bg-ink/40 rounded-xl border border-dashed border-white/10 p-6 my-4">
                <div className="w-12 h-12 rounded-full bg-murram/20 border border-murram/40 flex items-center justify-center mx-auto text-murram-light">
                  <Lock className="w-6 h-6" />
                </div>
                <h4 className="font-editorial text-lg font-bold text-bone">
                  Prompt Selection Required
                </h4>
                <p className="text-xs font-display text-bone-muted max-w-md mx-auto">
                  This is a school-specific essay type ({currentTypeObj.label}). To prevent generic drafting, you must select your target university and exact prompt above before the editor unlocks.
                </p>
              </div>
            ) : (
              <div className="pt-3 space-y-3">
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  wordLimit={activeWordLimit}
                  className="min-h-[280px]"
                  placeholder="Start drafting your scene here. Avoid generic Insha openings..."
                />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <span className="text-xs font-mono text-bone-muted">
                    Autosaved to local memory
                  </span>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleRunReview}
                    isLoading={isReviewing}
                    disabled={wordCount < 15 || isOverLimit}
                    className="text-xs"
                  >
                    <Sparkles className="w-4 h-4 mr-1.5" />
                    Roast with Gemini 2.5
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column (5 cols): Rubric & Roast Results */}
        <div className="lg:col-span-5 space-y-4">
          {reviewResult ? (
            <Card className="bg-ink-surface border-white/10 space-y-5">
              {/* Committee Verdict & Overall Score */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div>
                  <span className="text-[11px] font-mono uppercase text-bone-muted tracking-wider">
                    Committee Verdict
                  </span>
                  <h4 className="font-editorial text-2xl font-bold text-bone">
                    {reviewResult.verdict}
                  </h4>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-fraunces font-bold text-saffron">
                    {reviewResult.overallScore}
                  </span>
                  <span className="text-xs font-mono text-bone-muted block">/ 100 pts</span>
                </div>
              </div>

              {/* Rubric Score Bars */}
              <div className="space-y-3">
                <p className="text-xs font-mono uppercase text-bone-muted tracking-wider">
                  Rubric Breakdown ({currentTypeObj.label}):
                </p>
                {currentTypeObj.rubric.map((r) => {
                  const score = reviewResult.rubricScores[r.key] || Math.round(r.max * 0.85);
                  const percent = Math.round((score / r.max) * 100);
                  return (
                    <div key={r.key} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-display">
                        <span className="text-bone">{r.label}</span>
                        <span className="font-mono text-saffron">
                          {score}/{r.max}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-ink rounded-full overflow-hidden">
                        <div
                          className="h-full bg-saffron transition-all duration-500 rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Committee Summary */}
              <div className="p-3.5 rounded-xl bg-ink/70 border border-white/5 space-y-1.5 text-xs font-display">
                <span className="font-mono text-saffron font-semibold uppercase text-[10px] block">
                  Admissions Chair Note:
                </span>
                <p className="text-bone leading-relaxed">{reviewResult.committeeSummary}</p>
              </div>

              {/* Line Edits & Insha Warning */}
              {reviewResult.lineEdits && reviewResult.lineEdits.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-mono uppercase text-murram-light tracking-wider font-semibold block">
                    Insha Register vs US Voice:
                  </span>
                  {reviewResult.lineEdits.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-murram/10 border border-murram/30 text-xs font-display space-y-1">
                      <p className="line-through text-bone-muted italic">&ldquo;{item.originalText}&rdquo;</p>
                      <p className="text-bone font-medium">{item.suggestion}</p>
                      <p className="text-[11px] text-bone-muted pt-0.5">{item.explanation}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Missing Kenyan Context Gaps */}
              {reviewResult.kenyanContextGaps && reviewResult.kenyanContextGaps.length > 0 && (
                <div className="p-3 rounded-lg bg-acacia/20 border border-acacia text-xs font-display space-y-1">
                  <span className="font-mono text-[#8CF2A6] font-semibold text-[10px] uppercase block">
                    Kenyan Context to Clarify:
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-bone">
                    {reviewResult.kenyanContextGaps.map((gap, i) => (
                      <li key={i}>{gap}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          ) : (
            <Card className="bg-ink-surface border-white/10 text-center py-16 space-y-3">
              <Sparkles className="w-8 h-8 text-saffron mx-auto opacity-40" />
              <h4 className="font-editorial text-lg font-bold text-bone">
                No Active Review
              </h4>
              <p className="text-xs font-display text-bone-muted max-w-xs mx-auto">
                Type or paste your draft on the left and click &ldquo;Roast with Gemini 2.5&rdquo; to evaluate rubric strengths and word economy.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

