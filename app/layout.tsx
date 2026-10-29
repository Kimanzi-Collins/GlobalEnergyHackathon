import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { MotionProvider } from '@/components/motion/motion-provider';
import { ToastProvider } from '@/components/ui/toast';
import { OfflineBanner } from '@/components/landing/offline-banner';
import { USSD_SERVICE_CODE } from '@/lib/constants';
import { t } from '@/lib/strings';

export const metadata: Metadata = {
  title: 'Pepea: free US admissions guidance for Kenyan students',
  description: `From KCSE to a US university, on any phone. Dial ${USSD_SERVICE_CODE}, message on WhatsApp, or use the web. GPA conversion, essays, financial aid and an honest scam check.`,
  keywords: ['Kenya', 'KCSE', 'US admissions', 'Common App', "Africa's Talking", 'USSD', 'WhatsApp', 'financial aid'],
};

export const viewport: Viewport = {
  themeColor: '#FBFBFD',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-screen antialiased">
        {/* Reveal animations hide content until scrolled into view; without JS everything stays visible. */}
        <noscript>
          <style>{'[data-reveal]{opacity:1!important;transform:none!important}'}</style>
        </noscript>
        <a href="#main" className="skip-link">
          {t('skipToContent')}
        </a>
        <MotionProvider>
          <ToastProvider>
            <OfflineBanner />
            {children}
          </ToastProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
