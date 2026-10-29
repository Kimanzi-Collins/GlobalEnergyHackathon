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
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
        <div className="flex items-center gap-2 text-xs font-mono text-accent uppercase tracking-widest mb-1">
          <Calculator className="w-3.5 h-3.5" />
          <span>Evaluation Heuristic • PEPEA_HEURISTIC_V1</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-fg">
              KCSE to US 4.0 GPA
            </h1>
            <p className="text-sm text-fg2 mt-1 max-w-2xl">
              Convert Kenyan 84-point secondary marks to the US 4.0 grading scale.
              Every result is explicitly marked <Badge kind="indicative" className="ml-1 text-[11px]">Indicative</Badge> to meet US admissions integrity standards.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-fg2">USSD:</span>
            <span className="text-xs font-mono text-phosphor bg-screen px-2.5 py-1 rounded-full ring-1 ring-inset ring-phosphor/20">
              {USSD_SERVICE_CODE} &gt; 2
            </span>
          </div>
        </div>
      </div>

      {/* 2. Interactive Monumental Result & Selector Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Input Controls (Grade Buttons / Points Slider) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="bg-surface ring-1 ring-inset ring-line/10">
            {/* Toggle Mode */}
            <div className="flex items-center justify-between pb-4 border-b border-line/10">
              <span className="text-xs font-mono uppercase tracking-wider text-fg2">
                Conversion Input
              </span>
              <div className="flex items-center p-1 bg-bg rounded-xl ring-1 ring-inset ring-line/10">
                <button
                  type="button"
                  onClick={() => setCalcMode('grade')}
                  className={`px-3 py-1 text-xs font-mono rounded-lg transition-colors ${
                    calcMode === 'grade'
                      ? 'bg-accent text-accent-fg font-bold'
                      : 'text-fg2 hover:text-fg'
                  }`}
                >
                  By Mean Grade
                </button>
                <button
                  type="button"
                  onClick={() => setCalcMode('points')}
                  className={`px-3 py-1 text-xs font-mono rounded-lg transition-colors ${
                    calcMode === 'points'
                      ? 'bg-accent text-accent-fg font-bold'
                      : 'text-fg2 hover:text-fg'
                  }`}
                >
                  By Aggregate (7-84)
                </button>
              </div>
            </div>

            {/* Input View 1: Mean Grade Grid */}
            {calcMode === 'grade' ? (
              <div className="pt-4 space-y-4">
                <label className="block text-xs font-mono text-fg2 uppercase">
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
                        className={`py-3 px-2 rounded-2xl border flex flex-col items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-accent text-accent-fg border-accent font-bold shadow-lg scale-105'
                            : 'bg-bg/60 border-line/10 text-fg hover:border-line/30 hover:bg-fg/5'
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
                  <label className="text-xs font-mono text-fg2 uppercase">
                    Slide Aggregate Points (KNEC):
                  </label>
                  <span className="font-mono text-2xl font-bold text-accent">
                    {points} <span className="text-xs text-fg2">/ 84 points</span>
                  </span>
                </div>

                <input
                  type="range"
                  min="7"
                  max="84"
                  value={points}
                  onChange={(e) => handlePointsChange(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-bg rounded-lg appearance-none cursor-pointer accent-accent"
                />

                <div className="flex items-center justify-between text-[11px] font-mono text-fg2">
                  <span>7 pts (Grade E)</span>
                  <span>46 pts (C+)</span>
                  <span>67 pts (B+)</span>
                  <span>84 pts (Max A)</span>
                </div>
              </div>
            )}

            {/* Scale Band Explainer */}
            <div className="mt-6 pt-4 border-t border-line/10 text-xs text-fg2 space-y-2">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <p>
                  <strong>KNEC Aggregate Range:</strong> Grade {currentBand.grade} spans from{' '}
                  <span className="font-mono text-fg">{currentBand.aggregateMin}</span> to{' '}
                  <span className="font-mono text-fg">{currentBand.aggregateMax}</span> points.
                  Points per subject: {currentBand.pointsPerSubject} pts.
                </p>
              </div>
            </div>
          </Card>

          {/* Sync With Profile Button */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-surface ring-1 ring-inset ring-line/10">
            <div>
              <p className="text-sm font-medium text-fg">
                Save Grade to Active Profile
              </p>
              <p className="text-xs font-mono text-fg2">
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
                  <Check className="w-3.5 h-3.5 mr-1 text-accent-fg" /> Saved!
                </>
              ) : (
                'Save to Profile'
              )}
            </Button>
          </div>
        </div>

        {/* Right Column (5 cols): Monumental Result Display */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="bg-surface ring-1 ring-inset ring-accent/40 relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-line/10">
              <span className="text-xs font-mono uppercase tracking-widest text-accent">
                Equivalent Result
              </span>
              <Badge kind="indicative">Indicative Only</Badge>
            </div>

            {/* Monumental Numeral Display */}
            <div className="py-8 text-center space-y-2">
              <p className="font-editorial text-7xl sm:text-8xl font-bold tracking-tighter text-fg">
                {currentBand.gpa40.toFixed(2)}
              </p>
              <p className="text-xs font-mono uppercase tracking-widest text-fg2">
                Unweighted 4.0 Scale
              </p>

              <div className="pt-4 flex items-center justify-center gap-2">
                <span className="text-xs font-mono px-3 py-1 rounded-full bg-accent/20 text-accent ring-1 ring-inset ring-accent/40 font-bold">
                  KCSE Grade {currentBand.grade}
                </span>
                <span className="text-xs font-mono text-fg2">
                  ({points} Aggregate Points)
                </span>
              </div>
            </div>

            {/* Admissions Committee Context */}
            <div className="p-4 rounded-2xl bg-bg/60 ring-1 ring-inset ring-line/10 space-y-2 text-xs">
              <p className="text-fg font-medium flex items-center gap-1.5">
                <Award className="w-4 h-4 text-accent" />
                <span>US Admissions Context:</span>
              </p>
              <p className="text-fg2 leading-relaxed">
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
          <Card className="bg-surface ring-1 ring-inset ring-line/10 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono uppercase tracking-wider text-fg2">
                Common App Copy-Paste Note
              </h3>
              <button
                onClick={handleCopySnippet}
                className="text-xs font-mono text-accent hover:opacity-80 flex items-center gap-1 transition-opacity"
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

            <p className="text-xs text-fg2">
              Paste into Common App &gt; <em>Additional Information</em> to explain your KCSE grading curve:
            </p>

            <div className="p-3 bg-bg rounded-xl ring-1 ring-inset ring-line/10 font-mono text-xs text-fg2 leading-relaxed">
              {commonAppSnippet}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
