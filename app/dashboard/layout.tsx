import React from 'react';
import { SessionProvider } from '@/lib/session-context';
import { DashboardNav } from '@/components/dashboard/DashboardNav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <div className="min-h-screen bg-ink text-bone selection:bg-saffron selection:text-ink">
        <DashboardNav />
        <main className="lg:pl-64 flex flex-col min-h-screen">
          <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl w-full mx-auto pb-24 lg:pb-12">
            {children}
          </div>
        </main>
      </div>
    </SessionProvider>
  );
}

