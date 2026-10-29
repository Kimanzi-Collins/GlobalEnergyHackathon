'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calculator,
  Compass,
  FileEdit,
  MailCheck,
  Building2,
  Coins,
  UserCheck,
  Menu,
  X,
  RotateCcw,
  Copy,
  Check,
} from 'lucide-react';
import { useStudentSession } from '@/lib/session-context';
import { mockGuideSteps } from '@/lib/fixtures';
import { USSD_SERVICE_CODE } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Mark } from '@/components/ui/mark';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { ProgressRing } from './progress-ring';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const groups: Array<{ label: string; items: NavItem[] }> = [
  {
    label: 'Plan',
    items: [
      { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Application guide', href: '/dashboard/guide', icon: Compass },
    ],
  },
  {
    label: 'Tools',
    items: [
      { name: 'KCSE to GPA', href: '/dashboard/gpa', icon: Calculator, badge: 'Indicative' },
      { name: 'Essays', href: '/dashboard/essays', icon: FileEdit },
      { name: 'Teacher letters', href: '/dashboard/lor', icon: MailCheck },
      { name: 'College advisor', href: '/dashboard/advisor', icon: Building2 },
      { name: 'Financial aid', href: '/dashboard/aid', icon: Coins },
    ],
  },
  { label: 'You', items: [{ name: 'Student context', href: '/dashboard/context', icon: UserCheck }] },
];

const allItems = groups.flatMap((g) => g.items);

const tabs = [
  { label: 'Home', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Guide', href: '/dashboard/guide', icon: Compass },
  { label: 'GPA', href: '/dashboard/gpa', icon: Calculator },
  { label: 'Essays', href: '/dashboard/essays', icon: FileEdit },
  { label: 'Advisor', href: '/dashboard/advisor', icon: Building2 },
];

const isActivePath = (pathname: string, href: string) => (href === '/dashboard' ? pathname === href : pathname.startsWith(href));

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
}

/** Student avatar with their guide progress drawn around it. */
function Avatar({ name, progress, size = 44 }: { name: string; progress: number; size?: number }) {
  return (
    <ProgressRing value={progress} size={size} stroke={3} label="Application guide progress">
      <span className="text-[13px] font-semibold tracking-tight">{initials(name)}</span>
    </ProgressRing>
  );
}

/**
 * Dashboard navigation: a left rail on desktop (student card, grouped links, the numeric USSD code),
 * and on phones a frosted top bar, a thumb-reach tab bar and a full-screen menu.
 */
export function DashboardNav() {
  const pathname = usePathname();
  const { student, phoneNumber, setPhoneNumber, resetToDemo } = useStudentSession();
  const { push } = useToast();
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [tempPhone, setTempPhone] = useState(phoneNumber);
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  const done = mockGuideSteps.filter((s) => s.status === 'done').length;
  const progress = done / mockGuideSteps.length;

  const openPhone = () => {
    setTempPhone(phoneNumber);
    setShowPhoneModal(true);
  };

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempPhone.trim()) {
      setPhoneNumber(tempPhone.trim());
      setShowPhoneModal(false);
      push({ title: 'Phone updated', description: 'Your profile now follows this number on every channel.' });
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(USSD_SERVICE_CODE);
      setCopied(true);
      push({ title: 'Code copied', description: `Dial ${USSD_SERVICE_CODE} on any phone.` });
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      push({ title: 'Could not copy', description: `Dial ${USSD_SERVICE_CODE} on any phone.` });
    }
  };

  // Escape closes overlays; focus moves into the dialog when it opens.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowPhoneModal(false);
        setMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (showPhoneModal) dialogRef.current?.querySelector<HTMLInputElement>('input')?.focus();
  }, [showPhoneModal]);

  // Close the full-screen menu on navigation.
  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <>
      {/* Desktop rail */}
      <aside className="fixed inset-y-0 z-30 hidden w-72 flex-col border-r border-line/10 bg-bg/70 backdrop-blur-xl lg:flex">
        <div className="flex h-[72px] items-center px-7">
          <Link href="/" className="flex items-center gap-2.5 text-[19px] font-semibold tracking-tight" aria-label="Pepea home">
            <Mark className="h-6 w-6 text-accent" />
            Pepea
          </Link>
        </div>

        {/* Student */}
        <button
          type="button"
          onClick={openPhone}
          className="mx-4 mb-2 flex items-center gap-3 rounded-2xl p-3 text-left ring-1 ring-inset ring-line/10 transition-[background-color,box-shadow] duration-300 ease-quart-out hover:bg-fg/5 hover:ring-line/25"
          aria-label="Change student phone number"
        >
          <Avatar name={student.fullName} progress={progress} />
          <span className="min-w-0">
            <span className="block truncate text-[15px] font-medium leading-tight">{student.fullName}</span>
            <span className="mt-0.5 block truncate font-mono text-xs text-fg2">{phoneNumber}</span>
          </span>
        </button>

        <nav aria-label="Dashboard" className="thin-scroll flex-1 overflow-y-auto px-4 py-3">
          {groups.map((g) => (
            <div key={g.label} className="mb-5">
              <p className="px-3 pb-2 text-micro font-medium uppercase tracking-[0.1em] text-fg2/80">{g.label}</p>
              <ul className="space-y-0.5">
                {g.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActivePath(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'group relative flex h-11 items-center gap-3 rounded-xl px-3 text-[15px] transition-[background-color,color] duration-300 ease-quart-out',
                          active ? 'bg-fg/[0.07] font-medium text-fg' : 'text-fg2 hover:bg-fg/5 hover:text-fg'
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            'absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-accent transition-[transform,opacity] duration-500 ease-expo-out',
                            active ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0'
                          )}
                        />
                        <Icon className={cn('h-[18px] w-[18px] transition-colors duration-300', active ? 'text-accent' : 'group-hover:text-fg')} />
                        <span className="flex-1 truncate">{item.name}</span>
                        {item.badge && (
                          <span className="rounded-full px-2 py-0.5 text-[11px] font-medium text-fg2 ring-1 ring-inset ring-line/20">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Numeric USSD code, tap to copy */}
        <div className="p-4">
          <button
            type="button"
            onClick={copyCode}
            className="flex w-full items-center justify-between rounded-2xl bg-screen px-4 py-3 text-left ring-1 ring-inset ring-phosphor/20 transition-[box-shadow,transform] duration-300 ease-quart-out hover:ring-phosphor/45 active:scale-[0.98]"
            aria-label={`Copy USSD code ${USSD_SERVICE_CODE}`}
          >
            <span>
              <span className="block text-[11px] font-medium uppercase tracking-[0.1em] text-phosphor/60">No data? Dial</span>
              <span className="mt-0.5 block font-mono text-[15px] tracking-wide text-phosphor">{USSD_SERVICE_CODE}</span>
            </span>
            {copied ? <Check className="h-4 w-4 text-phosphor" /> : <Copy className="h-4 w-4 text-phosphor/60" />}
          </button>
        </div>
      </aside>

      {/* Phone top bar */}
      <header className="glass fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-line/10 px-4 lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2 text-[17px] font-semibold tracking-tight" aria-label="Pepea dashboard">
          <Mark className="h-5 w-5 text-accent" />
          Pepea
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openPhone}
            className="flex h-9 items-center gap-2 rounded-full bg-fg/5 pl-1 pr-3 text-xs ring-1 ring-inset ring-line/15"
            aria-label="Change student phone number"
          >
            <Avatar name={student.fullName} progress={progress} size={28} />
            <span className="font-mono text-fg2">{phoneNumber.slice(-4)}</span>
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="grid h-9 w-9 place-items-center rounded-full bg-fg/5 ring-1 ring-inset ring-line/15"
            aria-label="Open menu"
            aria-expanded={menuOpen}
          >
            <Menu className="h-[18px] w-[18px]" />
          </button>
        </div>
      </header>

      {/* Full-screen menu */}
      {menuOpen && (
        <div role="dialog" aria-modal="true" aria-label="Menu" className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-bg/95 px-6 pb-10 pt-4 backdrop-blur-2xl lg:hidden">
          <div className="flex h-10 items-center justify-between">
            <span className="text-[17px] font-semibold tracking-tight">Menu</span>
            <button type="button" onClick={() => setMenuOpen(false)} className="grid h-9 w-9 place-items-center rounded-full bg-fg/5 ring-1 ring-inset ring-line/15" aria-label="Close menu">
              <X className="h-[18px] w-[18px]" />
            </button>
          </div>
          <ul className="mt-6 space-y-1">
            {allItems.map((item, i) => {
              const Icon = item.icon;
              const active = isActivePath(pathname, item.href);
              return (
                <li key={item.href} className="animate-rise" style={{ animationDelay: `${i * 0.04}s` }}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-4 rounded-2xl px-3 py-3.5 text-[clamp(1.5rem,1.1rem+2vw,2rem)] font-semibold tracking-tight transition-colors',
                      active ? 'text-accent' : 'text-fg'
                    )}
                  >
                    <Icon className="h-6 w-6 shrink-0 opacity-80" />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Phone tab bar */}
      <nav aria-label="Quick navigation" className="glass fixed inset-x-0 bottom-0 z-40 border-t border-line/10 pb-[env(safe-area-inset-bottom)] lg:hidden">
        <ul className="mx-auto flex max-w-md items-stretch justify-around px-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActivePath(pathname, tab.href);
            return (
              <li key={tab.href} className="flex-1">
                <Link
                  href={tab.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn('relative flex h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors duration-300', active ? 'text-accent' : 'text-fg2')}
                >
                  <span
                    aria-hidden="true"
                    className={cn('absolute top-0 h-[3px] w-8 rounded-full bg-accent transition-[transform,opacity] duration-500 ease-expo-out', active ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0')}
                  />
                  <Icon className="h-5 w-5" />
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Student identity dialog */}
      {showPhoneModal && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setShowPhoneModal(false)}>
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="identity-title"
            onClick={(e) => e.stopPropagation()}
            className="panel-edge animate-rise relative w-full max-w-md rounded-4xl bg-surface p-7 ring-1 ring-inset ring-line/15"
          >
            <button
              type="button"
              onClick={() => setShowPhoneModal(false)}
              className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-fg2 transition-colors hover:bg-fg/5 hover:text-fg"
              aria-label="Close"
            >
              <X className="h-[18px] w-[18px]" />
            </button>

            <h3 id="identity-title" className="text-2xl font-semibold tracking-tight">
              Whose profile is this?
            </h3>
            <p className="mt-2 text-[15px] leading-relaxed text-fg2">
              Your phone number is your profile. The same number gives you the same plan on USSD, SMS, WhatsApp and the web.
            </p>

            <form onSubmit={handlePhoneSubmit} className="mt-6 space-y-5">
              <Input
                label="Kenyan mobile number"
                value={tempPhone}
                onChange={(e) => setTempPhone(e.target.value.replace(/[^0-9+]/g, ''))}
                inputMode="tel"
                placeholder="+254712345678"
                required
                className="font-mono"
              />
              <div className="flex items-center gap-3">
                <Button type="submit" className="flex-1">
                  Use this number
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    resetToDemo();
                    setShowPhoneModal(false);
                  }}
                >
                  <RotateCcw className="h-4 w-4" />
                  Demo
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
