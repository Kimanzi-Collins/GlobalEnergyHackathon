'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, PhoneCall, ShieldAlert, Award, ArrowUpRight, Zap } from 'lucide-react';

export default function Navbar() {
  const [timeLeft, setTimeLeft] = useState({ hours: 71, minutes: 48, seconds: 12 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b subtle-border bg-canvas/80 backdrop-blur-xl">
      {/* Top Ticker: Urgent 72-Hour Deadline Hook */}
      <div className="bg-gradient-to-r from-crimson-600/20 via-savannah-600/20 to-crimson-600/20 border-b border-crimson-500/20 px-4 py-1.5 text-center text-xs text-parchment/90 flex items-center justify-center gap-3">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-crimson-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-crimson-500"></span>
        </span>
        <span className="font-mono font-medium tracking-wide">
          <strong className="text-crimson-400 uppercase tracking-wider">Urgent Countdown:</strong> November 1 Early Action Deadlines close in{' '}
          <span className="text-savannah-400 font-bold bg-canvas/60 px-2 py-0.5 rounded border border-white/10">
            {String(timeLeft.hours).padStart(2, '0')}h : {String(timeLeft.minutes).padStart(2, '0')}m : {String(timeLeft.seconds).padStart(2, '0')}s
          </span>
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <a href="#" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-savannah-500 to-crimson-600 flex items-center justify-center font-bold text-canvas shadow-lg shadow-savannah-500/20 group-hover:scale-105 transition-transform">
              <Zap className="h-5 w-5 text-canvas fill-canvas" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-xl tracking-tight text-parchment">
                  Pepea
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-savannah-500/10 text-savannah-400 border border-savannah-500/20 font-mono">
                  Ng'ambo
                </span>
              </div>
              <p className="text-[10px] text-parchment/50 font-mono -mt-0.5">
                Africa's Talking × Gemini 2.5
              </p>
            </div>
          </a>
        </div>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-parchment/70">
          <a href="#ao-studio" className="hover:text-savannah-400 transition-colors flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-savannah-400" />
            AO Roast Studio
          </a>
          <a href="#ussd-simulator" className="hover:text-savannah-400 transition-colors flex items-center gap-1.5">
            <PhoneCall className="w-3.5 h-3.5 text-safari-400" />
            USSD Dialpad (*384#)
          </a>
          <a href="#voice-studio" className="hover:text-savannah-400 transition-colors flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-blue-400" />
            Voice Mwalimu Rec
          </a>
          <a href="#cue-blacklist" className="hover:text-savannah-400 transition-colors flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-crimson-400" />
            CUE Scam Radar
          </a>
        </nav>

        {/* Live AT Status Pill */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-canvas-surface border subtle-border text-xs font-mono">
            <span className="h-2 w-2 rounded-full bg-safari-500 animate-pulse"></span>
            <span className="text-parchment/80">AT Sandbox: Active</span>
          </div>

          <a
            href="#ao-studio"
            className="px-4 py-2 rounded-lg bg-savannah-500 hover:bg-savannah-400 text-canvas font-semibold text-xs tracking-wider uppercase transition-all shadow-lg shadow-savannah-500/25 flex items-center gap-1.5 hover:gap-2"
          >
            Launch Review
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </header>
  );
}
