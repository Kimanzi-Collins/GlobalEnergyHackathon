import React from 'react';
import { Zap, Heart, Terminal, ShieldCheck, Github } from 'lucide-react';
import { USSD_SERVICE_CODE } from '@/lib/constants';

export default function Footer() {
  return (
    <footer className="border-t subtle-border bg-canvas-subtle py-16 text-xs text-parchment/60 font-mono">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-savannah-500 flex items-center justify-center font-bold text-canvas">
                <Zap className="h-4 w-4 text-canvas fill-canvas" />
              </div>
              <span className="font-display font-bold text-lg text-parchment">Pepea (Ng'ambo)</span>
            </div>
            <p className="font-sans text-xs text-parchment/70 leading-relaxed max-w-md">
              Bridging Kenya's high school talent to world-class higher education.
              Named in tribute to the 1959–1963 Kennedy-Mboya Airlift that sent Barack Obama Sr., Wangari Maathai, and hundreds of pioneering Kenyans to top US colleges.
            </p>
            <div className="text-[11px] text-parchment/40">
              Built for the Africa's Talking Hackathon • October 2026
            </div>
          </div>

          {/* Africa's Talking Architecture */}
          <div className="space-y-3">
            <span className="text-parchment font-bold uppercase tracking-wider block text-[11px]">
              AT API Integration
            </span>
            <ul className="space-y-2 text-[11px]">
              <li className="flex items-center gap-1.5 text-parchment/70">
                <span className="w-1.5 h-1.5 rounded-full bg-safari-400"></span>
                USSD Gateway ({USSD_SERVICE_CODE})
              </li>
              <li className="flex items-center gap-1.5 text-parchment/70">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                Voice API Mock Interview
              </li>
              <li className="flex items-center gap-1.5 text-parchment/70">
                <span className="w-1.5 h-1.5 rounded-full bg-savannah-400"></span>
                SMS Scorecard Dispatcher
              </li>
              <li className="flex items-center gap-1.5 text-parchment/70">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                WhatsApp Business API Webhook
              </li>
            </ul>
          </div>

          {/* Compliance & CUE */}
          <div className="space-y-3">
            <span className="text-parchment font-bold uppercase tracking-wider block text-[11px]">
              Student Protections
            </span>
            <ul className="space-y-2 text-[11px]">
              <li className="text-parchment/70">CUE Jan 2026 Rogue Agency Blacklist</li>
              <li className="text-parchment/70">Common App $0 Fee Waiver Navigator</li>
              <li className="text-parchment/70">CSS Profile Aid Documentation</li>
              <li className="text-parchment/70">Kenyan KCSE to US GPA Standard</li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t subtle-border flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <p>© 2026 Pepea Technologies. Empowering Kenyan Scholars Worldwide.</p>
          <div className="flex items-center gap-4">
            <span className="text-safari-400 font-bold">100% Free for Kenyan Students</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
