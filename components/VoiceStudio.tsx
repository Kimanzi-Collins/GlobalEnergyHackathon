'use client';

import React from 'react';
import { PhoneCall, Mic, Award } from 'lucide-react';

/**
 * Live 60-second voice mock interview. The teacher recommendation call flow
 * was removed; recommendation letters are now reviewed as text in the LOR module.
 */
export default function VoiceStudio() {
  return (
    <section id="mock-interview" className="py-20 border-b subtle-border bg-canvas relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono mb-3">
            <Award className="w-3.5 h-3.5" />
            Africa's Talking Voice Engine
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-parchment">
            Voice <span className="font-editorial italic text-blue-400">Mock Interview</span>
          </h2>
          <p className="mt-2 text-base text-parchment/70 leading-relaxed">
            Practice the admissions or visa interview out loud, on any phone. Pepea calls you, asks a hard question,
            and scores your pacing, filler words and clarity.
          </p>
        </div>

        <div className="max-w-3xl mx-auto p-8 rounded-2xl glass-panel space-y-6 text-center">
          <div className="w-16 h-16 rounded-full bg-blue-500/10 text-blue-400 mx-auto flex items-center justify-center">
            <Mic className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h3 className="font-display font-bold text-2xl text-parchment">
              Live 60-Second Mock Admissions / Visa Call
            </h3>
            <p className="text-sm text-parchment/60 max-w-lg mx-auto">
              Africa's Talking Voice calls your phone. An Admissions Officer asks a hard question.
              Speak for 30 seconds to receive instant pacing, filler-word, and content clarity analysis.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-canvas-surface border subtle-border text-left space-y-2 max-w-md mx-auto">
            <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest block">
              Question Read Over the Call:
            </span>
            <p className="text-sm italic font-editorial text-parchment/90">
              "Why are you applying to study in the United States, and what specific problem in Kenya do you want to solve when you graduate?"
            </p>
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={() => alert("Africa's Talking Voice Call triggered to your phone number!")}
              className="px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2"
            >
              <PhoneCall className="w-4 h-4" />
              Call My Phone for Mock Interview
            </button>
          </div>

          {/* Performance Stats preview */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t subtle-border text-center">
            <div>
              <div className="font-display text-2xl font-bold text-safari-400">88%</div>
              <div className="text-[10px] font-mono text-parchment/50 uppercase">Clarity Score</div>
            </div>
            <div>
              <div className="font-display text-2xl font-bold text-parchment">135</div>
              <div className="text-[10px] font-mono text-parchment/50 uppercase">Words / Min (Optimal)</div>
            </div>
            <div>
              <div className="font-display text-2xl font-bold text-savannah-400">1</div>
              <div className="text-[10px] font-mono text-parchment/50 uppercase">Filler Words Detected</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
