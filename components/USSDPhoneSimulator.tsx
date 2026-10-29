'use client';

import React, { useState } from 'react';
import { Phone, Delete, RotateCcw, MessageSquare, Check, ShieldCheck, Zap } from 'lucide-react';

export default function USSDPhoneSimulator() {
  const [phoneNumber, setPhoneNumber] = useState('+254712345678');
  const [sessionText, setSessionText] = useState('');
  const [currentInput, setCurrentInput] = useState('*384*PEPEA#');
  const [screenText, setScreenText] = useState('Dial *384*PEPEA# to start zero-data navigation.');
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [incomingSMS, setIncomingSMS] = useState<string | null>(null);

  const dialCode = '*384*PEPEA#';

  const sendUSSDRequest = async (fullText: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/at/ussd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: `AT_SIM_SESSION_${Date.now()}`,
          serviceCode: '*384#',
          phoneNumber,
          text: fullText,
        }),
      });

      const rawResponse = await res.text();
      const isEnd = rawResponse.startsWith('END ');
      const cleanMessage = rawResponse.replace(/^(CON|END)\s+/, '');

      setScreenText(cleanMessage);
      setCurrentInput('');

      if (isEnd) {
        setIsSessionActive(false);
        setSessionText('');
        // If the roadmap was triggered, simulate incoming SMS
        if (fullText.startsWith('1*')) {
          setIncomingSMS(
            `PEPEA ROADMAP: KCSE grade converted to US 4.0 scale! 1) Create account at commonapp.org 2) Request Common App & CSS Fee Waivers ($0 application cost). Check dashboard for full guide.`
          );
        } else if (fullText.startsWith('3*')) {
          setIncomingSMS(
            `PEPEA ALERT: Outbound Voice Call triggered to Mwalimu. Recommendation letter will compile upon call completion.`
          );
        }
      } else {
        setIsSessionActive(true);
      }
    } catch (err) {
      setScreenText('Connection timeout with Africa\'s Talking gateway.');
      setIsSessionActive(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartDial = () => {
    setSessionText('');
    setIncomingSMS(null);
    sendUSSDRequest('');
  };

  const handleSendInput = () => {
    if (!currentInput.trim()) return;
    const nextSession = sessionText ? `${sessionText}*${currentInput.trim()}` : currentInput.trim();
    setSessionText(nextSession);
    sendUSSDRequest(nextSession);
  };

  const handleKeyClick = (val: string) => {
    setCurrentInput((prev) => prev + val);
  };

  const handleClear = () => {
    setCurrentInput((prev) => prev.slice(0, -1));
  };

  const handleReset = () => {
    setIsSessionActive(false);
    setSessionText('');
    setCurrentInput('*384*PEPEA#');
    setScreenText('Dial *384*PEPEA# to start zero-data navigation.');
  };

  return (
    <section id="ussd-simulator" className="py-20 border-b subtle-border bg-canvas-subtle relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Description (6 Cols) */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-safari-500/10 border border-safari-500/20 text-safari-400 text-xs font-mono">
              <Zap className="w-3.5 h-3.5" />
              Module 1: Zero-Data Africa's Talking USSD Gateway
            </div>

            <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-parchment leading-tight">
              Test <span className="font-mono text-safari-400">*384*PEPEA#</span> Live
            </h2>

            <p className="text-base text-parchment/70 leading-relaxed">
              In rural Kenyan counties like Kitui or Turkana, students don't have laptops or continuous Wi-Fi. 
              Pepea works on any 2G 'Kabambe' feature phone via Africa's Talking USSD protocol.
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-safari-500/20 text-safari-400 flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-parchment">KCSE-to-GPA & 100% Aid Matcher</h4>
                  <p className="text-xs text-parchment/60">
                    Converts 84-point KCSE grades into the US 4.0 scale and texts an instant roadmap.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-safari-500/20 text-safari-400 flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-parchment">Urgent Nov 1 Early Action Checklist</h4>
                  <p className="text-xs text-parchment/60">
                    Live 72-hour countdown for Common App essays, fee waivers, and teacher letters.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-safari-500/20 text-safari-400 flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-parchment">2026 CUE Scam-Agency Radar</h4>
                  <p className="text-xs text-parchment/60">
                    Verifies questionable recruiters against the Commission for University Education blacklist.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Test Shortcuts */}
            <div className="pt-4 flex flex-wrap gap-2 text-xs">
              <span className="text-parchment/50 font-mono py-1">Try inputs:</span>
              <button
                onClick={() => {
                  setSessionText('1*1*1');
                  sendUSSDRequest('1*1*1');
                }}
                className="px-2.5 py-1 rounded bg-canvas-surface border subtle-border hover:border-safari-500 text-parchment/80 font-mono transition-colors"
              >
                1*1*1 (A Plain + 100% Aid)
              </button>
              <button
                onClick={() => {
                  setSessionText('2');
                  sendUSSDRequest('2');
                }}
                className="px-2.5 py-1 rounded bg-canvas-surface border subtle-border hover:border-safari-500 text-parchment/80 font-mono transition-colors"
              >
                2 (Checklist Countdown)
              </button>
              <button
                onClick={() => {
                  setSessionText('5*Globwise');
                  sendUSSDRequest('5*Globwise');
                }}
                className="px-2.5 py-1 rounded bg-canvas-surface border subtle-border hover:border-safari-500 text-parchment/80 font-mono transition-colors"
              >
                5*Globwise (CUE Check)
              </button>
            </div>
          </div>

          {/* Right Phone Device Mockup (6 Cols) */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-[330px] rounded-[38px] p-5 bg-gradient-to-b from-[#1E222D] to-[#12151C] shadow-2xl shadow-black/80 border-4 border-[#2A3040] relative">
              {/* Speaker notch */}
              <div className="w-16 h-1.5 bg-canvas rounded-full mx-auto mb-4 border border-white/5"></div>

              {/* Telco Screen Container */}
              <div className="rounded-2xl ussd-screen p-4 min-h-[220px] flex flex-col justify-between border-2 border-[#1E3025] mb-5">
                {/* Status Bar */}
                <div className="flex items-center justify-between text-[10px] font-mono text-safari-400/80 pb-2 border-b border-safari-900/40">
                  <span>SAFARICOM 4G</span>
                  <span>{isLoading ? 'SYNCING...' : 'USSD ACTIVE'}</span>
                </div>

                {/* Main USSD Display Content */}
                <div className="py-2 text-xs font-mono text-safari-300 whitespace-pre-line leading-relaxed z-10 flex-grow flex items-center">
                  {isLoading ? (
                    <div className="flex items-center gap-2 text-safari-400">
                      <span className="animate-spin text-base">◓</span>
                      <span>Contacting AT USSD Gateway...</span>
                    </div>
                  ) : (
                    screenText
                  )}
                </div>

                {/* Input Prompt bar */}
                <div className="pt-2 border-t border-safari-900/40 flex items-center justify-between text-xs font-mono text-safari-400 z-10">
                  <span className="text-[10px] text-safari-400/60">&gt;</span>
                  <input
                    type="text"
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    placeholder={isSessionActive ? 'Enter choice...' : '*384*PEPEA#'}
                    className="bg-transparent border-none text-right text-xs font-mono text-safari-200 focus:outline-none w-3/4"
                  />
                </div>
              </div>

              {/* Phone Keypad */}
              <div className="space-y-2">
                {/* Control Action Buttons */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {!isSessionActive ? (
                    <button
                      onClick={handleStartDial}
                      disabled={isLoading}
                      className="py-2.5 rounded-xl bg-safari-600 hover:bg-safari-500 text-white font-mono text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 col-span-2"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      DIAL *384*PEPEA#
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleSendInput}
                        disabled={isLoading}
                        className="py-2 rounded-xl bg-safari-600 hover:bg-safari-500 text-white font-mono text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1"
                      >
                        SEND
                      </button>
                      <button
                        onClick={handleReset}
                        className="py-2 rounded-xl bg-crimson-600/80 hover:bg-crimson-500 text-white font-mono text-xs font-bold transition-all"
                      >
                        END
                      </button>
                    </>
                  )}
                </div>

                {/* 12-Key Numeric Grid */}
                <div className="grid grid-cols-3 gap-2 text-center font-mono">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((key) => (
                    <button
                      key={key}
                      onClick={() => handleKeyClick(key)}
                      className="py-3 rounded-xl bg-[#171B24] hover:bg-[#202633] active:scale-95 text-parchment font-semibold text-sm transition-all border border-white/5 shadow-inner"
                    >
                      {key}
                    </button>
                  ))}
                </div>

                {/* Clear / Backspace button */}
                <div className="flex justify-between items-center pt-2 px-1">
                  <button
                    onClick={handleReset}
                    className="text-[11px] font-mono text-parchment/40 hover:text-parchment flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </button>
                  <button
                    onClick={handleClear}
                    className="text-[11px] font-mono text-parchment/40 hover:text-parchment flex items-center gap-1"
                  >
                    <Delete className="w-3 h-3" />
                    Clear
                  </button>
                </div>
              </div>

              {/* Simulated Incoming SMS Dropdown Drawer */}
              {incomingSMS && (
                <div className="mt-4 p-3 rounded-xl bg-canvas border border-safari-500/40 text-[11px] font-mono text-parchment shadow-xl animate-bounce">
                  <div className="flex items-center gap-1.5 text-safari-400 font-bold mb-1">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>NEW SMS FROM "PEPEA"</span>
                  </div>
                  <p className="text-parchment/80 font-sans text-xs">{incomingSMS}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
