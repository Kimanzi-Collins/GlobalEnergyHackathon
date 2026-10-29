'use client';

import React, { useState } from 'react';
import { ShieldAlert, Search, AlertOctagon, CheckCircle2, ExternalLink, Info } from 'lucide-react';
import { MOCK_FLAGGED_AGENCIES } from '@/lib/mock-data';

export default function CUERadar() {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = MOCK_FLAGGED_AGENCIES.filter(
    (a) =>
      a.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.location_city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.warning_reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <section id="cue-blacklist" className="py-20 border-b subtle-border bg-canvas-subtle relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-crimson-500/10 border border-crimson-500/20 text-crimson-400 text-xs font-mono mb-3">
            <ShieldAlert className="w-3.5 h-3.5" />
            Public Safety & Fraud Prevention
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-parchment">
            CUE Scam Agency <span className="font-editorial italic text-crimson-400">Blacklist Radar</span>
          </h2>
          <p className="mt-2 text-base text-parchment/70 leading-relaxed">
            In January 2026, the Commission for University Education (CUE) flagged 20 recruitment agencies and 16 fake universities operating illegally across Nairobi, Eldoret, and Nakuru. Check if a recruiter is charging you for forms that are 100% free.
          </p>
        </div>

        {/* Free Waiver Policy Notice */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-safari-950/40 via-canvas-surface to-safari-950/40 border border-safari-500/30 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-safari-400 shrink-0" />
            <div className="text-xs">
              <strong className="text-safari-400 font-bold block">The Truth About University Application Costs:</strong>
              <span className="text-parchment/80">
                Common App Fee Waivers and CSS Profile Waivers cover 100% of application fees for families earning under $100,000. Never pay any agency in Kenya KSh 100,000+ for university admission forms!
              </span>
            </div>
          </div>

          <a
            href="https://appsupport.commonapp.org/applicantsupport/s/article/What-do-I-need-to-know-about-the-Common-App-fee-waiver"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-safari-600 hover:bg-safari-500 text-white text-xs font-mono font-semibold shrink-0 flex items-center gap-1.5 transition-colors"
          >
            Official Waiver Rules
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="w-4 h-4 text-parchment/40 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by agency name or city (e.g. Globwise, Eldoret, Ronald Ngala, Eastleigh)..."
            className="w-full pl-11 pr-4 py-3.5 bg-canvas-surface border subtle-border rounded-xl text-sm font-medium text-parchment focus:outline-none focus:border-crimson-500 transition-colors"
          />
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((agency) => (
            <div
              key={agency.id}
              className="p-5 rounded-xl bg-canvas-surface border border-crimson-900/30 hover:border-crimson-600/50 transition-all space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold tracking-wider bg-crimson-500/20 text-crimson-400 border border-crimson-500/30 flex items-center gap-1">
                  <AlertOctagon className="w-3 h-3" />
                  FLAGGED BY CUE
                </span>
                <span className="text-[10px] font-mono text-parchment/40">{agency.cue_notice_date}</span>
              </div>

              <div>
                <h4 className="font-display font-bold text-base text-parchment">{agency.entity_name}</h4>
                <p className="text-xs text-parchment/50 font-mono mt-0.5">Location: {agency.location_city}</p>
              </div>

              <p className="text-xs text-parchment/80 leading-relaxed font-sans bg-crimson-950/20 p-2.5 rounded-lg border border-crimson-900/40">
                {agency.warning_reason}
              </p>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-full py-10 text-center text-xs font-mono text-parchment/50">
              No flagged agencies matched your search "{searchTerm}". Remember to verify all advising agencies before paying any deposits.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
