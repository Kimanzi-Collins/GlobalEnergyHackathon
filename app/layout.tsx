import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "Pepea (Ng'ambo) — Abroad University Tracker & Africa's Talking Engine",
  description: "Bridging the Kenyan 84-point KCSE scale to the US 4.0 admissions system with Gemini 2.5 and Africa's Talking Voice, USSD, SMS, and WhatsApp.",
  keywords: ["Kenya", "KCSE", "Admissions", "Common App", "Africa's Talking", "Gemini", "USSD", "Voice API"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-canvas text-parchment antialiased selection:bg-savannah-500 selection:text-canvas">
        {children}
      </body>
    </html>
  );
}
