import React from 'react';
import Navbar from '@/components/Navbar';
import HeroBanner from '@/components/HeroBanner';
import AOReviewStudio from '@/components/AOReviewStudio';
import USSDPhoneSimulator from '@/components/USSDPhoneSimulator';
import VoiceStudio from '@/components/VoiceStudio';
import CollegeMatcher from '@/components/CollegeMatcher';
import CUERadar from '@/components/CUERadar';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main className="min-h-screen bg-canvas text-parchment flex flex-col selection:bg-savannah-500 selection:text-canvas">
      {/* 1. Header with Urgent 72h EA Countdown Ticker */}
      <Navbar />

      {/* 2. Monumental Hero Section */}
      <HeroBanner />

      {/* 3. Gemini Admissions Officer Roast Studio */}
      <AOReviewStudio />

      {/* 4. Africa's Talking USSD Interactive Phone Simulator */}
      <USSDPhoneSimulator />

      {/* 5. Africa's Talking Voice Studio (Mock Interview) */}
      <VoiceStudio />

      {/* 6. KCSE to US 4.0 GPA & 100% Aid College Matcher */}
      <CollegeMatcher />

      {/* 7. Commission for University Education (CUE) Scam Agency Blacklist */}
      <CUERadar />

      {/* 8. Comprehensive Architecture & Heritage Footer */}
      <Footer />
    </main>
  );
}
