'use client';

import React, { useState } from 'react';
import { Sparkles, AlertTriangle, Send, RefreshCw, CheckCircle2, MessageSquare, BookOpen, UserCheck, Flame } from 'lucide-react';
import { MOCK_UNIVERSITIES, SAMPLE_ESSAY_KENYAN_DRAFT } from '@/lib/mock-data';

export default function AOReviewStudio() {
  const [selectedUni, setSelectedUni] = useState(MOCK_UNIVERSITIES[0]);
  const [selectedPrompt, setSelectedPrompt] = useState(MOCK_UNIVERSITIES[0].supplemental_prompts[0]);
  const [persona, setPersona] = useState<'ivy_committee_chair' | 'kensap_mentor'>('ivy_committee_chair');
  const [draft, setDraft] = useState(SAMPLE_ESSAY_KENYAN_DRAFT);
  const [studentPhone, setStudentPhone] = useState('+254712345678');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [smsNotification, setSmsNotification] = useState<string | null>(null);

  const wordCount = draft.trim().length > 0 ? draft.trim().split(/\s+/).length : 0;
  const isOverLimit = wordCount > selectedPrompt.word_limit;

  const handleUniChange = (uniId: string) => {
    const found = MOCK_UNIVERSITIES.find((u) => u.id === uniId) || MOCK_UNIVERSITIES[0];
    setSelectedUni(found);
    setSelectedPrompt(found.supplemental_prompts[0]);
  };

  const handleReview = async () => {
    setLoading(true);
    setSmsNotification(null);
    try {
      const res = await fetch('/api/ao/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: studentPhone,
          universityName: selectedUni.name,
          promptText: selectedPrompt.prompt_text,
          draftContent: draft,
          aoPersona: persona,
          channel: 'web',
        }),
      });
      const data = await res.json();
      if (data.evaluation) {
        setResult(data.evaluation);
        setSmsNotification(
          `PEPEA AO REVIEW (${selectedUni.name.split('(')[0].trim()}): Score ${data.evaluation.overall_score}/100 [${data.evaluation.ao_verdict}]. Check dashboard for paragraph rewrite.`
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="ao-studio" className="py-20 border-b subtle-border bg-canvas relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-savannah-500/10 border border-savannah-500/20 text-savannah-400 text-xs font-mono mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Module 2: Dual-Channel Gemini AO Studio
            </div>
            <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-parchment">
              The Admissions Officer <span className="font-editorial italic text-savannah-400">Roast</span>
            </h2>
            <p className="mt-2 text-base text-parchment/60 max-w-2xl">
              Kenyan students are trained in formal 'Insha' composition. US Admissions Officers want micro-moments.
              Get roasted by an Ivy League Committee Chair before you hit submit on Common App.
            </p>
          </div>

          {/* Persona Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-canvas-surface border subtle-border">
            <button
              onClick={() => setPersona('ivy_committee_chair')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center gap-2 ${
                persona === 'ivy_committee_chair'
                  ? 'bg-crimson-600 text-white shadow-lg shadow-crimson-600/30'
                  : 'text-parchment/60 hover:text-parchment'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              Dean Vance (Ruthless AO)
            </button>
            <button
              onClick={() => setPersona('kensap_mentor')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center gap-2 ${
                persona === 'kensap_mentor'
                  ? 'bg-safari-600 text-white shadow-lg shadow-safari-600/30'
                  : 'text-parchment/60 hover:text-parchment'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              KenSAP Mentor (Harvard Alum)
            </button>
          </div>
        </div>

        {/* Studio Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Editor & Controls (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="p-6 rounded-2xl glass-panel space-y-5">
              {/* Target University Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-parchment/60 mb-2">
                    Target University (100% Aid)
                  </label>
                  <select
                    value={selectedUni.id}
                    onChange={(e) => handleUniChange(e.target.value)}
                    className="w-full bg-canvas-surface border subtle-border rounded-xl px-3.5 py-2.5 text-sm font-medium text-parchment focus:outline-none focus:border-savannah-500"
                  >
                    {MOCK_UNIVERSITIES.map((uni) => (
                      <option key={uni.id} value={uni.id}>
                        {uni.name} ({uni.country})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-parchment/60 mb-2">
                    Official 2026/2027 Prompt
                  </label>
                  <select
                    value={selectedPrompt.prompt_id}
                    onChange={(e) => {
                      const found = selectedUni.supplemental_prompts.find((p) => p.prompt_id === e.target.value);
                      if (found) setSelectedPrompt(found);
                    }}
                    className="w-full bg-canvas-surface border subtle-border rounded-xl px-3.5 py-2.5 text-sm font-medium text-parchment focus:outline-none focus:border-savannah-500"
                  >
                    {selectedUni.supplemental_prompts.map((p) => (
                      <option key={p.prompt_id} value={p.prompt_id}>
                        {p.title} (Max {p.word_limit} words)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Prompt Text Banner */}
              <div className="p-4 rounded-xl bg-canvas-surface/80 border border-white/5 space-y-1">
                <span className="text-[11px] font-mono text-savannah-400 uppercase tracking-widest">
                  Official Supplemental Question:
                </span>
                <p className="text-sm text-parchment/90 italic font-editorial text-base leading-relaxed">
                  "{selectedPrompt.prompt_text}"
                </p>
              </div>

              {/* Essay Draft Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-mono uppercase tracking-wider text-parchment/60">
                    Your Essay Draft
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setDraft(SAMPLE_ESSAY_KENYAN_DRAFT)}
                      className="text-xs text-savannah-400 hover:text-savannah-300 font-medium underline underline-offset-4"
                    >
                      Load Kenyan Sample Essay
                    </button>
                    <span
                      className={`text-xs font-mono px-2 py-0.5 rounded ${
                        isOverLimit
                          ? 'bg-crimson-500/20 text-crimson-400 border border-crimson-500/30 font-bold'
                          : 'bg-white/5 text-parchment/60'
                      }`}
                    >
                      {wordCount} / {selectedPrompt.word_limit} words
                    </span>
                  </div>
                </div>

                <textarea
                  rows={8}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Paste your supplemental or personal statement draft here..."
                  className="w-full bg-canvas-surface border subtle-border rounded-xl p-4 text-sm font-normal text-parchment focus:outline-none focus:border-savannah-500 transition-colors leading-relaxed"
                />
              </div>

              {/* Bottom Phone Bar & Submit CTA */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="w-full sm:w-auto flex items-center gap-2">
                  <span className="text-xs font-mono text-parchment/50">SMS Scorecard to:</span>
                  <input
                    type="text"
                    value={studentPhone}
                    onChange={(e) => setStudentPhone(e.target.value)}
                    className="bg-canvas-surface border subtle-border rounded-lg px-2.5 py-1 text-xs font-mono text-parchment/80 focus:outline-none focus:border-savannah-500"
                    placeholder="+2547XXXXXXXX"
                  />
                </div>

                <button
                  onClick={handleReview}
                  disabled={loading || draft.trim().length === 0}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-savannah-500 hover:bg-savannah-400 disabled:opacity-50 text-canvas font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-savannah-500/20"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Roasting Draft...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 fill-canvas" />
                      Roast with {persona === 'ivy_committee_chair' ? 'Dean Vance' : 'KenSAP Mentor'}
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Instant SMS Dispatch Banner */}
            {smsNotification && (
              <div className="p-4 rounded-xl bg-safari-500/10 border border-safari-500/30 text-xs font-mono text-safari-300 flex items-start gap-3 animate-fade-in">
                <MessageSquare className="w-4 h-4 text-safari-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-safari-400">Africa's Talking SMS Dispatched to {studentPhone}:</strong>
                  <p className="mt-1 text-parchment/80 text-[11px] font-sans">{smsNotification}</p>
                </div>
              </div>
            )}
          </div>

          {/* Right: AO Scorecard & Rubric (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            {result ? (
              <div className="p-6 rounded-2xl glass-panel space-y-6">
                {/* Score & Verdict Banner */}
                <div className="flex items-center justify-between pb-4 border-b subtle-border">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-parchment/50">
                      Committee Verdict
                    </span>
                    <h3
                      className={`text-xl font-bold font-display ${
                        result.overall_score >= 75
                          ? 'text-safari-400'
                          : result.overall_score >= 55
                          ? 'text-savannah-400'
                          : 'text-crimson-400'
                      }`}
                    >
                      {result.ao_verdict}
                    </h3>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-parchment/50">
                      Overall Rubric
                    </span>
                    <div className="font-display text-4xl font-extrabold text-parchment">
                      {result.overall_score}
                      <span className="text-base text-parchment/40 font-normal">/100</span>
                    </div>
                  </div>
                </div>

                {/* 4-Part Rubric Metrics */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-canvas-surface border subtle-border">
                    <div className="text-parchment/50 font-mono text-[10px]">Micro-Moment Hook</div>
                    <div className="font-bold text-parchment text-sm mt-0.5">
                      {result.specificity_score || 18} / 25
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-canvas-surface border subtle-border">
                    <div className="text-parchment/50 font-mono text-[10px]">Authentic Voice vs Insha</div>
                    <div className="font-bold text-parchment text-sm mt-0.5">
                      {result.voice_score || 16} / 25
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-canvas-surface border subtle-border">
                    <div className="text-parchment/50 font-mono text-[10px]">Named School Fit</div>
                    <div className="font-bold text-parchment text-sm mt-0.5">
                      {result.school_fit_score || 12} / 25
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-canvas-surface border subtle-border">
                    <div className="text-parchment/50 font-mono text-[10px]">Reflection & Growth</div>
                    <div className="font-bold text-parchment text-sm mt-0.5">
                      {result.reflection_score || 15} / 25
                    </div>
                  </div>
                </div>

                {/* Blunt AO Committee Critique */}
                <div className="space-y-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-parchment/60 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-crimson-400" />
                    Blunt Admissions Committee Readout
                  </span>
                  <div className="p-4 rounded-xl bg-crimson-500/10 border border-crimson-500/20 text-xs text-parchment/90 leading-relaxed font-sans">
                    "{result.committee_summary}"
                  </div>
                </div>

                {/* Cliches Detected */}
                {result.cliches_detected && result.cliches_detected.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-parchment/60">
                      Kenyan 'Insha' Cliches Flagged
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {result.cliches_detected.map((cliche: string, i: number) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-full bg-crimson-950/80 border border-crimson-600/40 text-crimson-300 text-xs font-mono"
                        >
                          ✕ {cliche}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* KenSAP Context Tips */}
                {result.kenyan_context_tips && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-savannah-400 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      How to Translate Kenyan Context
                    </span>
                    <p className="text-xs text-parchment/80 leading-relaxed bg-canvas-surface p-3.5 rounded-xl border subtle-border">
                      {result.kenyan_context_tips}
                    </p>
                  </div>
                )}

                {/* Rewrite Example */}
                {result.rewrite_example && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-safari-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Vivid Micro-Moment Rewrite Example
                    </span>
                    <p className="text-xs text-parchment/90 italic font-editorial leading-relaxed bg-safari-950/30 p-3.5 rounded-xl border border-safari-500/30">
                      {result.rewrite_example}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Empty Placeholder */
              <div className="p-10 rounded-2xl glass-panel text-center space-y-4 border-dashed border-white/10">
                <div className="w-12 h-12 rounded-full bg-canvas-surface mx-auto flex items-center justify-center text-parchment/40">
                  <Sparkles className="w-6 h-6 text-savannah-400/60" />
                </div>
                <h3 className="font-display font-semibold text-lg text-parchment">
                  Awaiting Your Draft
                </h3>
                <p className="text-xs text-parchment/60 leading-relaxed max-w-sm mx-auto">
                  Click <strong>"Load Kenyan Sample Essay"</strong> and run the evaluation to see Dean Vance's redlines, score rubrics, and the SMS notification dispatch.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
