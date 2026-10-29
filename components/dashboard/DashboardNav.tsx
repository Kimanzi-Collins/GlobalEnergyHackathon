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
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-surface border-r border-line/10 z-30">
        {/* Brand Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-line/10">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="font-editorial text-2xl font-bold tracking-tight text-fg group-hover:text-accent transition-colors">
              Pepea
            </span>
            <span className="text-xs font-mono font-medium text-fg2 tracking-wider">
              (Ng&apos;ambo)
            </span>
          </Link>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-acacia/30 text-[#8CF2A6] ring-1 ring-inset ring-acacia/50">
            v0.2
          </span>
        </div>

        {/* USSD Keypad Shortcut Pill */}
        <div className="px-5 py-3 border-b border-line/10 bg-bg/60">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-fg2 flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-accent" />
              USSD:
            </span>
            <span className="text-phosphor bg-screen px-2 py-0.5 rounded-full ring-1 ring-inset ring-phosphor/30 tracking-wider">
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
                  'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-all duration-160 group',
                  isActive
                    ? 'bg-accent text-accent-fg font-medium shadow-sm'
                    : 'text-fg2 hover:text-fg hover:bg-fg/5'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={clsx(
                      'w-4 h-4 transition-colors',
                      isActive ? 'text-accent-fg' : 'text-fg2 group-hover:text-accent'
                    )}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={clsx(
                      'text-[10px] font-mono px-1.5 py-0.5 rounded-full uppercase tracking-wider',
                      isActive ? 'bg-black/20 text-accent-fg' : 'bg-fg/10 text-fg2'
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
        <div className="p-4 border-t border-line/10 bg-bg/40">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs font-medium text-fg truncate">{student.fullName}</p>
              <p className="text-[11px] font-mono text-fg2 truncate">{phoneNumber}</p>
            </div>
            <button
              onClick={() => {
                setTempPhone(phoneNumber);
                setShowPhoneModal(true);
              }}
              title="Change Student Phone Identity"
              className="p-1.5 text-fg2 hover:text-accent hover:bg-fg/10 rounded-lg transition-colors"
            >
              <UserCheck className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. Mobile Top Bar */}
      <header className="lg:hidden sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-line/10 px-4 h-16 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="font-editorial text-xl font-bold text-fg">Pepea</span>
          <span className="text-[11px] font-mono text-phosphor bg-screen px-2 py-0.5 rounded-full ring-1 ring-inset ring-phosphor/30">
            {USSD_SERVICE_CODE}
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setTempPhone(phoneNumber);
              setShowPhoneModal(true);
            }}
            className="text-xs font-mono text-fg2 bg-fg/5 ring-1 ring-inset ring-line/15 px-2.5 py-1.5 rounded-full flex items-center gap-1.5"
          >
            <UserCheck className="w-3.5 h-3.5 text-accent" />
            <span>{phoneNumber.slice(-4)}</span>
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-fg2 hover:text-fg rounded-xl ring-1 ring-inset ring-line/15 bg-fg/5"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer (When hamburger clicked) */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-bg/95 backdrop-blur-lg flex flex-col p-6 overflow-y-auto">
          <div className="flex items-center justify-between pb-6 border-b border-line/10">
            <span className="font-editorial text-2xl font-bold text-fg">Menu</span>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 text-fg2 hover:text-fg rounded-lg"
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
                    'flex items-center justify-between p-3.5 rounded-xl text-base transition-colors',
                    isActive ? 'bg-accent text-accent-fg font-medium' : 'text-fg hover:bg-fg/5'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-black/20">{item.badge}</span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Mobile Bottom Sticky Navigation (Thumb-friendly bottom bar) */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-surface/95 backdrop-blur-md border-t border-line/10 px-2 py-1.5 flex items-center justify-around">
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
                'flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] transition-colors',
                isActive ? 'text-accent font-medium' : 'text-fg2 hover:text-fg'
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
          <div className="bg-surface ring-1 ring-inset ring-line/20 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowPhoneModal(false)}
              className="absolute top-4 right-4 text-fg2 hover:text-fg p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3 text-accent">
              <Sparkles className="w-5 h-5" />
              <h3 className="font-editorial text-2xl font-bold text-fg">Student Identity</h3>
            </div>

            <p className="text-xs text-fg2 mb-5 leading-relaxed">
              In Pepea, your phone number (E.164) is your single unified profile across USSD, SMS, WhatsApp, and Web.
            </p>

            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-fg2 mb-1.5">
                  Kenyan Mobile Number
                </label>
                <input
                  type="text"
                  value={tempPhone}
                  onChange={(e) => setTempPhone(e.target.value)}
                  placeholder="+254712345678"
                  className="w-full bg-bg ring-1 ring-inset ring-line/15 rounded-xl px-4 py-3 font-mono text-fg focus:outline-none focus:ring-2 focus:ring-accent"
                  required
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-accent hover:brightness-110 text-accent-fg font-medium py-2.5 px-4 rounded-full text-sm transition-all"
                >
                  Set Active Phone
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetToDemo();
                    setShowPhoneModal(false);
                  }}
                  className="flex items-center gap-1.5 bg-fg/5 hover:bg-fg/10 text-fg2 hover:text-fg text-xs font-mono py-2.5 px-3 rounded-full ring-1 ring-inset ring-line/15"
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
