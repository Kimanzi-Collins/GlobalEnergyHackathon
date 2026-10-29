import React from 'react';
import { SessionProvider } from '@/lib/session-context';
import { DashboardNav } from '@/components/dashboard/DashboardNav';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div data-chapter="dark" className="relative min-h-screen bg-bg text-fg">
        {/* Ambient light, behind everything */}
        <div aria-hidden="true" className="dash-ambient pointer-events-none fixed inset-0" />

        <DashboardNav />

        <main id="main" className="relative flex min-h-screen flex-col pt-14 lg:pl-72 lg:pt-0">
          <div className="mx-auto w-full max-w-[1240px] flex-1 px-[clamp(16px,3vw,48px)] pb-28 pt-[clamp(28px,5vw,72px)] lg:pb-20">
            {children}
          </div>
        </main>
      </div>
    </SessionProvider>
  );
}
