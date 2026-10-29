'use client';

import React, { useState } from 'react';
import { Calculator, Award, Calendar, DollarSign, Check, ChevronRight } from 'lucide-react';
import { MOCK_UNIVERSITIES } from '@/lib/mock-data';

export default function CollegeMatcher() {
  const [kcsePoints, setKcsePoints] = useState(82);

  // Conversion logic based on Kenyan 84-point scale to US 4.0
  const getGradeInfo = (points: number) => {
    if (points >= 81) return { grade: 'A Plain', gpa: 4.0, percentile: 'Top 0.2% in Kenya', tier: 'Top Tier (Ivy & MIT)' };
    if (points >= 74) return { grade: 'A- Minus', gpa: 3.85, percentile: 'Top 1.5% in Kenya', tier: 'High Need-Blind Match' };
    if (points >= 67) return { grade: 'B+ Plus', gpa: 3.5, percentile: 'Top 5% in Kenya', tier: 'Liberal Arts & Full Ride' };
    if (points >= 60) return { grade: 'B Plain', gpa: 3.2, percentile: 'Top 12% in Kenya', tier: 'Merit Scholarship Colleges' };
    return { grade: 'B- or Below', gpa: 2.8, percentile: 'Direct Entry', tier: 'Regional & Transfer' };
  };

  const currentInfo = getGradeInfo(kcsePoints);

  return (
    <section className="py-20 border-b subtle-border bg-canvas relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-savannah-500/10 border border-savannah-500/20 text-savannah-400 text-xs font-mono mb-3">
            <Calculator className="w-3.5 h-3.5" />
            Module 1: The 84-to-Four GPA & Full-Aid Engine
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-parchment">
            KCSE-to-GPA & <span className="font-editorial italic text-savannah-400">100% Aid Matcher</span>
          </h2>
          <p className="mt-2 text-base text-parchment/70 leading-relaxed">
            US universities do not understand the Kenyan 84-point KCSE system.
            Use this converter to translate your points into an unweighted 4.0 GPA and discover schools that guarantee to meet 100% of your financial need.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* KCSE Interactive Slider (5 Cols) */}
          <div className="lg:col-span-5 p-6 rounded-2xl glass-panel space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono uppercase text-parchment/60">
                  Slide Your KCSE Mean Points
                </span>
                <span className="font-display font-bold text-2xl text-savannah-400">
                  {kcsePoints} <span className="text-xs font-mono text-parchment/40">/ 84 pts</span>
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="84"
                value={kcsePoints}
                onChange={(e) => setKcsePoints(Number(e.target.value))}
                className="w-full accent-savannah-500 cursor-pointer h-2 bg-canvas-surface rounded-lg"
              />
              <div className="flex justify-between text-[10px] font-mono text-parchment/40 mt-1">
                <span>50 pts (B-)</span>
                <span>67 pts (B+)</span>
                <span>74 pts (A-)</span>
                <span>84 pts (A 84)</span>
              </div>
            </div>

            {/* Calculated Output Card */}
            <div className="p-5 rounded-xl bg-canvas-surface border subtle-border space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-parchment/50 uppercase">Kenyan Grade</span>
                  <div className="font-display font-bold text-xl text-parchment">{currentInfo.grade}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-parchment/50 uppercase">US 4.0 GPA Equiv.</span>
                  <div className="font-display font-bold text-2xl text-safari-400">{currentInfo.gpa.toFixed(2)}</div>
                </div>
              </div>

              <div className="pt-3 border-t subtle-border flex items-center justify-between text-xs font-mono">
                <span className="text-parchment/60">National Percentile:</span>
                <span className="text-savannah-400 font-bold">{currentInfo.percentile}</span>
              </div>

              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-parchment/60">Target Tier:</span>
                <span className="text-parchment font-semibold">{currentInfo.tier}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-safari-500/10 border border-safari-500/20 text-xs text-safari-300 flex items-start gap-2">
              <Award className="w-4 h-4 text-safari-400 shrink-0 mt-0.5" />
              <span>
                <strong>Fee Waiver Eligible:</strong> With a KCSE score of {currentInfo.grade}, you qualify for $0 Common App application fee waivers across over 1,000 participating US colleges.
              </span>
            </div>
          </div>

          {/* Matched Need-Blind Universities (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="text-xs font-mono uppercase tracking-widest text-parchment/60 flex items-center justify-between">
              <span>Universities Meeting 100% Demonstrated Need</span>
              <span className="text-safari-400 font-bold">100% Aid Guaranteed</span>
            </div>

            <div className="space-y-3">
              {MOCK_UNIVERSITIES.map((uni) => (
                <div
                  key={uni.id}
                  className="p-5 rounded-2xl glass-panel hover:border-savannah-500/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-display font-bold text-base text-parchment">{uni.name}</h4>
                      {uni.is_need_blind_intl && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-safari-500/20 text-safari-400 border border-safari-500/30">
                          Need-Blind Intl
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-parchment/60">
                      <span>Min KCSE: {uni.min_kcse_grade}</span>
                      <span>Avg SAT: {uni.avg_sat}</span>
                      <span>Acceptance: {uni.acceptance_rate}%</span>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] font-mono text-crimson-400 uppercase font-bold block">
                        Nov 1 Early Action
                      </span>
                      <span className="text-xs text-parchment/40 font-mono">RD: {uni.rd_deadline}</span>
                    </div>
                    <a
                      href="#ao-studio"
                      className="px-3 py-1.5 rounded-lg bg-canvas-surface border subtle-border hover:border-savannah-500 text-xs font-mono text-parchment flex items-center gap-1 transition-colors"
                    >
                      Roast Supplement
                      <ChevronRight className="w-3 h-3 text-savannah-400" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
