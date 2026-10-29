'use client';

import React from 'react';
import { ArrowRight, Sparkles, Phone, ShieldCheck, CheckCircle2, ChevronRight, Globe2 } from 'lucide-react';

export default function HeroBanner() {
  return (
    <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden border-b subtle-border">
      {/* Background Radial Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-gradient-to-b from-savannah-500/10 via-savannah-600/5 to-transparent blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cultural Airlift Heritage Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-canvas-surface border subtle-border text-xs text-parchment/80 mb-8 backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-savannah-500"></span>
          <span className="font-mono text-savannah-400 font-medium">The Kennedy-Mboya Airlift, Reborn for 2026</span>
          <span className="text-white/20">|</span>
          <span className="text-parchment/60 hidden sm:inline">Zero-Data USSD & Dual-Channel Gemini AO</span>
        </div>

        {/* Monumental Hero Headline */}
        <div className="max-w-5xl">
          <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tighter leading-[0.95] text-parchment uppercase">
            Bridge your <span className="font-editorial lowercase italic font-normal text-savannah-400 pr-2">kcse</span>
            to the <span className="underline decoration-savannah-500/40 decoration-wavy decoration-2">Ivy League</span>.
          </h1>

          <p className="mt-8 text-lg sm:text-2xl text-parchment/70 font-normal leading-relaxed max-w-3xl">
            In 72 hours, November 1 Early Action deadlines close for MIT, Harvard, and Stanford.
            Pepea gives every Kenyan student a ruthlessly honest Gemini Admissions Officer, 
            zero-data USSD tracking, and an automated Voice engine that turns teacher phone calls into verified US recommendation letters.
          </p>
        </div>

        {/* Action CTAs */}
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <a
            href="#ao-studio"
            className="px-7 py-4 rounded-xl bg-savannah-500 hover:bg-savannah-400 text-canvas font-bold text-sm tracking-wider uppercase transition-all shadow-xl shadow-savannah-500/20 flex items-center gap-2 group"
          >
            <Sparkles className="w-4 h-4 fill-canvas text-canvas" />
            Roast My Essay with Gemini AO
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>

          <a
            href="#ussd-simulator"
            className="px-7 py-4 rounded-xl bg-canvas-surface hover:bg-canvas-elevated text-parchment font-semibold text-sm tracking-wide border subtle-border transition-all flex items-center gap-2"
          >
            <Phone className="w-4 h-4 text-safari-400" />
            Dial *384*PEPEA# Simulator
          </a>

          <a
            href="#voice-studio"
            className="px-7 py-4 rounded-xl bg-canvas-surface hover:bg-canvas-elevated text-parchment font-semibold text-sm tracking-wide border subtle-border transition-all flex items-center gap-2"
          >
            <Globe2 className="w-4 h-4 text-blue-400" />
            Voice Teacher Recommender
          </a>
        </div>

        {/* Hard Kenyan Admissions Proof Grid */}
        <div className="mt-16 pt-12 border-t subtle-border grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          <div className="space-y-1">
            <div className="font-display text-3xl sm:text-4xl font-bold text-parchment">
              5,337
            </div>
            <div className="text-xs font-mono text-parchment/60 uppercase tracking-wider">
              Kenyans in US (+18.4% YoY)
            </div>
            <p className="text-xs text-parchment/40">
              #3 in Sub-Saharan Africa (Open Doors Report)
            </p>
          </div>

          <div className="space-y-1">
            <div className="font-display text-3xl sm:text-4xl font-bold text-savannah-400">
              99.2%
            </div>
            <div className="text-xs font-mono text-parchment/60 uppercase tracking-wider">
              Mentorship Shortage
            </div>
            <p className="text-xs text-parchment/40">
              KenSAP accepts only 15–20 students/yr nationwide
            </p>
          </div>

          <div className="space-y-1">
            <div className="font-display text-3xl sm:text-4xl font-bold text-crimson-400">
              20
            </div>
            <div className="text-xs font-mono text-parchment/60 uppercase tracking-wider">
              Scam Agencies Flagged
            </div>
            <p className="text-xs text-parchment/40">
              CUE January 2026 Blacklist & DCI warnings
            </p>
          </div>

          <div className="space-y-1">
            <div className="font-display text-3xl sm:text-4xl font-bold text-safari-400">
              $0.00
            </div>
            <div className="text-xs font-mono text-parchment/60 uppercase tracking-wider">
              Total Application Cost
            </div>
            <p className="text-xs text-parchment/40">
              100% Free with Common App & CSS Fee Waivers
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
