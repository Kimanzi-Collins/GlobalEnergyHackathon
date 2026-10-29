'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  Calculator,
  Compass,
  FileEdit,
  MailCheck,
  Building2,
  Coins,
  UserCheck,
  PhoneCall,
  Menu,
  X,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useStudentSession } from '@/lib/session-context';
import { USSD_SERVICE_CODE } from '@/lib/constants';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const navItems: NavItem[] = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'KCSE to GPA', href: '/dashboard/gpa', icon: Calculator, badge: 'Indicative' },
  { name: 'Application Guide', href: '/dashboard/guide', icon: Compass },
  { name: 'Essays Studio', href: '/dashboard/essays', icon: FileEdit },
  { name: 'Teacher LOR', href: '/dashboard/lor', icon: MailCheck },
  { name: 'College Advisor', href: '/dashboard/advisor', icon: Building2 },
  { name: 'Financial Aid', href: '/dashboard/aid', icon: Coins },
  { name: 'Student Context', href: '/dashboard/context', icon: UserCheck },
];

export function DashboardNav() {
  const pathname = usePathname();
  const { student, phoneNumber, setPhoneNumber, resetToDemo } = useStudentSession();
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [tempPhone, setTempPhone] = useState(phoneNumber);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempPhone.trim()) {
      setPhoneNumber(tempPhone.trim());
      setShowPhoneModal(false);
    }
  };

  return (
    <>
      {/* 1. Desktop Left Rail Navigation */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-ink-surface border-r border-white/10 z-30">
        {/* Brand Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="font-editorial text-2xl font-bold tracking-tight text-bone group-hover:text-saffron transition-colors">
              Pepea
            </span>
            <span className="text-xs font-mono font-medium text-bone-muted tracking-wider">
              (Ng&apos;ambo)
            </span>
          </Link>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-acacia/40 text-[#8CF2A6] border border-acacia">
            v0.2
          </span>
        </div>

        {/* USSD Keypad Shortcut Pill */}
        <div className="px-5 py-3 border-b border-white/5 bg-ink/60">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-bone-muted flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-saffron" />
              USSD Dialler:
            </span>
            <span className="text-phosphor bg-screen px-2 py-0.5 rounded border border-phosphor/30 tracking-wider">
              {USSD_SERVICE_CODE}
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-display transition-all duration-160 group',
                  isActive
                    ? 'bg-saffron text-ink font-semibold shadow-sm'
                    : 'text-bone-muted hover:text-bone hover:bg-white/5'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={clsx(
                      'w-4 h-4 transition-colors',
                      isActive ? 'text-ink' : 'text-bone-muted group-hover:text-saffron'
                    )}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={clsx(
                      'text-[10px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider',
                      isActive ? 'bg-ink/20 text-ink' : 'bg-white/10 text-bone-muted'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Session Bar */}
        <div className="p-4 border-t border-white/10 bg-ink-elevated/40">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs font-display font-medium text-bone truncate">{student.fullName}</p>
              <p className="text-[11px] font-mono text-bone-muted truncate">{phoneNumber}</p>
            </div>
            <button
              onClick={() => {
                setTempPhone(phoneNumber);
                setShowPhoneModal(true);
              }}
              title="Change Student Phone Identity"
              className="p-1.5 text-bone-muted hover:text-saffron hover:bg-white/10 rounded-md transition-colors"
            >
              <UserCheck className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. Mobile Top Bar */}
      <header className="lg:hidden sticky top-0 z-40 bg-ink-surface/95 backdrop-blur-md border-b border-white/10 px-4 h-16 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="font-editorial text-xl font-bold text-bone">Pepea</span>
          <span className="text-[11px] font-mono text-phosphor bg-screen px-1.5 py-0.5 rounded border border-phosphor/30">
            {USSD_SERVICE_CODE}
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setTempPhone(phoneNumber);
              setShowPhoneModal(true);
            }}
            className="text-xs font-mono text-bone-muted bg-white/5 border border-white/10 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5"
          >
            <UserCheck className="w-3.5 h-3.5 text-saffron" />
            <span>{phoneNumber.slice(-4)}</span>
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-bone-muted hover:text-bone rounded-lg border border-white/10 bg-white/5"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer (When hamburger clicked) */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-ink/90 backdrop-blur-lg flex flex-col p-6 overflow-y-auto">
          <div className="flex items-center justify-between pb-6 border-b border-white/10">
            <span className="font-editorial text-2xl font-bold text-bone">Menu</span>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 text-bone-muted hover:text-bone rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="py-6 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={clsx(
                    'flex items-center justify-between p-3 rounded-lg text-base font-display',
                    isActive ? 'bg-saffron text-ink font-semibold' : 'text-bone hover:bg-white/5'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-black/20">{item.badge}</span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Mobile Bottom Sticky Navigation (Thumb-friendly bottom bar) */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-ink-surface/95 backdrop-blur-md border-t border-white/10 px-2 py-1.5 flex items-center justify-around">
        {[
          { label: 'Home', href: '/dashboard', icon: LayoutDashboard },
          { label: 'Guide', href: '/dashboard/guide', icon: Compass },
          { label: 'GPA', href: '/dashboard/gpa', icon: Calculator },
          { label: 'Essays', href: '/dashboard/essays', icon: FileEdit },
          { label: 'Advisor', href: '/dashboard/advisor', icon: Building2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={clsx(
                'flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[10px] font-display transition-colors',
                isActive ? 'text-saffron font-semibold' : 'text-bone-muted hover:text-bone'
              )}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* 4. Phone Number Identity Switcher Modal */}
      {showPhoneModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-ink-surface border border-white/20 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowPhoneModal(false)}
              className="absolute top-4 right-4 text-bone-muted hover:text-bone p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3 text-saffron">
              <Sparkles className="w-5 h-5" />
              <h3 className="font-editorial text-2xl font-bold text-bone">Student Identity</h3>
            </div>

            <p className="text-xs font-display text-bone-muted mb-5 leading-relaxed">
              In Pepea, your phone number (E.164) is your single unified profile across USSD, SMS, WhatsApp, and Web.
            </p>

            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-bone-muted mb-1.5">
                  Kenyan Mobile Number
                </label>
                <input
                  type="text"
                  value={tempPhone}
                  onChange={(e) => setTempPhone(e.target.value)}
                  placeholder="+254712345678"
                  className="w-full bg-ink border border-white/20 rounded-lg px-4 py-3 font-mono text-bone focus:outline-none focus:border-saffron focus:ring-1 focus:ring-saffron"
                  required
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-saffron hover:bg-saffron-light text-ink font-display font-semibold py-2.5 px-4 rounded-full text-sm transition-colors"
                >
                  Set Active Phone
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetToDemo();
                    setShowPhoneModal(false);
                  }}
                  className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-bone-muted hover:text-bone text-xs font-mono py-2.5 px-3 rounded-full border border-white/10"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Reset Demo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

