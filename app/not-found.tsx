import { Button } from '@/components/ui/button';
import { RouteArc, ROUTE_D } from '@/components/landing/route-arc';
import { Mark } from '@/components/landing/nav';
import { t } from '@/lib/strings';

/** 404: the dotted route ends mid-ocean. */
export default function NotFound() {
  return (
    <main data-chapter="dark" id="main" className="flex min-h-screen flex-col items-center justify-center bg-bg px-6 py-24 text-center text-fg">
      <Mark className="h-8 w-8 text-accent" />
      <p className="mt-8 font-mono text-micro uppercase text-fg2">404</p>
      <h1 className="mt-3 max-w-3xl text-h2 font-semibold">{t('notFoundTitle')}</h1>
      <p className="mt-4 max-w-md text-lead text-fg2">{t('notFoundBody')}</p>

      <div className="mt-12 w-full max-w-3xl text-fg opacity-90">
        {/* A route that stops partway: the same path, drawn to 55%. */}
        <svg viewBox="0 0 1000 400" className="h-auto w-full" aria-hidden="true">
          <path d={ROUTE_D} fill="none" stroke="currentColor" strokeOpacity="0.28" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="0.1 11" />
          <path d={ROUTE_D} pathLength="1" fill="none" stroke="rgb(var(--accent))" strokeWidth="3" strokeLinecap="round" strokeDasharray="0.55 1" />
          <circle cx="70" cy="330" r="7" fill="currentColor" />
        </svg>
      </div>

      <Button href="/" size="lg" className="mt-10">
        {t('goHome')}
      </Button>
    </main>
  );
}
