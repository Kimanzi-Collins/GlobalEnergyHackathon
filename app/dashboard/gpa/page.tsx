'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Calculator,
  Check,
  Copy,
  Info,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Sliders,
  Award,
} from 'lucide-react';
import { useStudentSession } from '@/lib/session-context';
import { mockGradeBands } from '@/lib/fixtures';
import { Badge } from '@/components/dashboard/ui/Badge';
import { Card } from '@/components/dashboard/ui/Card';
import { Button } from '@/components/dashboard/ui/Button';
import { USSD_SERVICE_CODE } from '@/lib/constants';

export default function GpaConverterPage() {
  const { student, updateProfile } = useStudentSession();

  // Mode: by mean grade vs by aggregate points (7-84)
  const [calcMode, setCalcMode] = useState<'grade' | 'points'>('grade');
  const [selectedGrade, setSelectedGrade] = useState<string>(student.kcseGrade || 'B+');
  const [points, setPoints] = useState<number>(student.kcsePoints || 70);
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Compute GPA and band
  const currentBand = React.useMemo(() => {
    if (calcMode === 'grade') {
      return mockGradeBands.find((b) => b.grade === selectedGrade) || mockGradeBands[2];
    } else {
      // Find band matching aggregate points
      return (
        mockGradeBands.find((b) => points >= b.aggregateMin && points <= b.aggregateMax) ||
        mockGradeBands[mockGradeBands.length - 1]
      );
    }
  }, [calcMode, selectedGrade, points]);

  // When grade changes
  const handleGradeSelect = (grade: string) => {
    setSelectedGrade(grade);
    const band = mockGradeBands.find((b) => b.grade === grade);
    if (band) {
      setPoints(band.aggregateMax);
    }
  };

  // When points slider moves
  const handlePointsChange = (val: number) => {
    setPoints(val);
    const band = mockGradeBands.find((b) => val >= b.aggregateMin && val <= b.aggregateMax);
    if (band) {
      setSelectedGrade(band.grade);
    }
  };

  // Save to Student Profile
  const handleSaveToProfile = () => {
    updateProfile({
      kcseGrade: currentBand.grade,
      kcsePoints: points,
      gpaEquivalent: currentBand.gpa40,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Common App snippet text
  const commonAppSnippet = `In Kenya's KCSE examination (taken at Form 4), candidate scores are evaluated on an 84-point aggregate across 7 subjects with an A representing under 2% of test-takers nationally. My KCSE mean grade of ${currentBand.grade} (${points}/84 aggregate points) translates to an indicative unweighted US 4.0 GPA equivalent of approximately ${currentBand.gpa40.toFixed(2)}. Official KNEC certificates and verified secondary school transcripts are provided directly by my school headteacher.`;

  const handleCopySnippet = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(commonAppSnippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* 1. Header & Context */}
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-saffron uppercase tracking-widest mb-1">
          <Calculator className="w-3.5 h-3.5" />
          <span>Evaluation Heuristic • PEPEA_HEURISTIC_V1</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-fraunces text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-bone">
              KCSE to US 4.0 GPA
            </h1>
            <p className="text-sm font-display text-bone-muted mt-1 max-w-2xl">
              Convert Kenyan 84-point secondary marks to the US 4.0 grading scale.
              Every result is explicitly marked <Badge variant="indicative" className="ml-1 text-[11px]">Indicative</Badge> to meet US admissions integrity standards.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-bone-muted">USSD:</span>
            <span className="text-xs font-mono text-phosphor bg-screen px-2.5 py-1 rounded border border-phosphor/20">
              {USSD_SERVICE_CODE} &gt; 2
            </span>
          </div>
        </div>
      </div>

      {/* 2. Interactive Monumental Result & Selector Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Input Controls (Grade Buttons / Points Slider) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="bg-ink-surface border-white/10">
            {/* Toggle Mode */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <span className="text-xs font-mono uppercase tracking-wider text-bone-muted">
                Conversion Input
              </span>
              <div className="flex items-center p-1 bg-ink rounded-lg border border-white/10">
                <button
                  type="button"
                  onClick={() => setCalcMode('grade')}
                  className={`px-3 py-1 text-xs font-mono rounded-md transition-colors ${
                    calcMode === 'grade'
                      ? 'bg-saffron text-ink font-bold'
                      : 'text-bone-muted hover:text-bone'
                  }`}
                >
                  By Mean Grade
                </button>
                <button
                  type="button"
                  onClick={() => setCalcMode('points')}
                  className={`px-3 py-1 text-xs font-mono rounded-md transition-colors ${
                    calcMode === 'points'
                      ? 'bg-saffron text-ink font-bold'
                      : 'text-bone-muted hover:text-bone'
                  }`}
                >
                  By Aggregate (7-84)
                </button>
              </div>
            </div>

            {/* Input View 1: Mean Grade Grid */}
            {calcMode === 'grade' ? (
              <div className="pt-4 space-y-4">
                <label className="block text-xs font-mono text-bone-muted uppercase">
                  Select KCSE Mean Certificate Grade:
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {mockGradeBands.map((band) => {
                    const isSelected = selectedGrade === band.grade;
                    return (
                      <button
                        key={band.grade}
                        type="button"
                        onClick={() => handleGradeSelect(band.grade)}
                        className={`py-3 px-2 rounded-xl border flex flex-col items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-saffron text-ink border-saffron font-bold shadow-lg scale-105'
                            : 'bg-ink/60 border-white/10 text-bone hover:border-white/30 hover:bg-white/5'
                        }`}
                      >
                        <span className="font-editorial text-2xl font-bold">{band.grade}</span>
                        <span className="text-[10px] font-mono mt-0.5 opacity-80">
                          {band.gpa40.toFixed(2)} GPA
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Input View 2: Points Slider (7 to 84) */
              <div className="pt-4 space-y-5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono text-bone-muted uppercase">
                    Slide Aggregate Points (KNEC):
                  </label>
                  <span className="font-mono text-2xl font-bold text-saffron">
                    {points} <span className="text-xs text-bone-muted">/ 84 points</span>
                  </span>
                </div>

                <input
                  type="range"
                  min="7"
                  max="84"
                  value={points}
                  onChange={(e) => handlePointsChange(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-ink rounded-lg appearance-none cursor-pointer accent-saffron"
                />

                <div className="flex items-center justify-between text-[11px] font-mono text-bone-muted">
                  <span>7 pts (Grade E)</span>
                  <span>46 pts (C+)</span>
                  <span>67 pts (B+)</span>
                  <span>84 pts (Max A)</span>
                </div>
              </div>
            )}

            {/* Scale Band Explainer */}
            <div className="mt-6 pt-4 border-t border-white/5 text-xs font-display text-bone-muted space-y-2">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-saffron flex-shrink-0 mt-0.5" />
                <p>
                  <strong>KNEC Aggregate Range:</strong> Grade {currentBand.grade} spans from{' '}
                  <span className="font-mono text-bone">{currentBand.aggregateMin}</span> to{' '}
                  <span className="font-mono text-bone">{currentBand.aggregateMax}</span> points.
                  Points per subject: {currentBand.pointsPerSubject} pts.
                </p>
              </div>
            </div>
          </Card>

          {/* Sync With Profile Button */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-ink-elevated/40 border border-white/10">
            <div>
              <p className="text-sm font-display font-medium text-bone">
                Save Grade to Active Profile
              </p>
              <p className="text-xs font-mono text-bone-muted">
                Updates profile identity for {student.fullName} ({student.phoneNumber})
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveToProfile}
              className="text-xs"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1 text-ink" /> Saved!
                </>
              ) : (
                'Save to Profile'
              )}
            </Button>
          </div>
        </div>

        {/* Right Column (5 cols): Monumental Result Display */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="bg-ink-surface border-saffron/40 relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-xs font-mono uppercase tracking-widest text-saffron">
                Equivalent Result
              </span>
              <Badge variant="indicative">Indicative Only</Badge>
            </div>

            {/* Monumental Numeral Display */}
            <div className="py-8 text-center space-y-2">
              <p className="font-fraunces text-7xl sm:text-8xl font-bold tracking-tighter text-bone">
                {currentBand.gpa40.toFixed(2)}
              </p>
              <p className="text-xs font-mono uppercase tracking-widest text-bone-muted">
                Unweighted 4.0 Scale
              </p>

              <div className="pt-4 flex items-center justify-center gap-2">
                <span className="text-xs font-mono px-3 py-1 rounded-full bg-saffron/20 text-saffron border border-saffron/40 font-bold">
                  KCSE Grade {currentBand.grade}
                </span>
                <span className="text-xs font-mono text-bone-muted">
                  ({points} Aggregate Points)
                </span>
              </div>
            </div>

            {/* Admissions Committee Context */}
            <div className="p-4 rounded-xl bg-ink/60 border border-white/5 space-y-2 text-xs font-display">
              <p className="text-bone font-medium flex items-center gap-1.5">
                <Award className="w-4 h-4 text-saffron" />
                <span>US Admissions Context:</span>
              </p>
              <p className="text-bone-muted leading-relaxed">
                {currentBand.grade === 'A'
                  ? 'Top national tier. Extremely competitive for Ivy League and top-20 universities with need-blind financial aid.'
                  : currentBand.grade === 'A-'
                  ? 'Very strong academic standing. Meets competitive thresholds across top US research universities and liberal arts colleges.'
                  : currentBand.grade === 'B+'
                  ? 'Competitive for selective US liberal arts colleges, especially paired with strong extracurricular leadership or STEM projects.'
                  : 'Eligible for comprehensive US universities and community college 2+2 transfer pathways.'}
              </p>
            </div>
          </Card>

          {/* 3. Common App Additional Info Snippet Box */}
          <Card className="bg-ink-surface border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono uppercase tracking-wider text-bone-muted">
                Common App Copy-Paste Note
              </h3>
              <button
                onClick={handleCopySnippet}
                className="text-xs font-mono text-saffron hover:text-saffron-light flex items-center gap-1 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#8CF2A6]" />
                    <span className="text-[#8CF2A6]">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Snippet</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs font-display text-bone-muted">
              Paste into Common App &gt; <em>Additional Information</em> to explain your KCSE grading curve:
            </p>

            <div className="p-3 bg-ink rounded-lg border border-white/10 font-mono text-xs text-bone-muted leading-relaxed">
              {commonAppSnippet}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

