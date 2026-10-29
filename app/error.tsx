'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mark } from '@/components/ui/mark';
import { USSD_SERVICE_CODE } from '@/lib/constants';
import { t } from '@/lib/strings';

/** Route-level error boundary. Says what happened, that nothing was lost, and offers the phone fallback. */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[Pepea UI error]', error);
  }, [error]);

  return (
    <main data-chapter="light" className="flex min-h-screen flex-col items-center justify-center bg-bg px-6 py-24 text-center text-fg">
      <Mark className="h-8 w-8 text-accent" />
      <h1 className="mt-8 max-w-3xl text-h2 font-semibold">{t('errorTitle')}</h1>
      <p className="mt-4 max-w-md text-lead text-fg2">{t('errorBody')}</p>
      <p className="mt-2 font-mono text-sm text-fg2">{USSD_SERVICE_CODE}</p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <Button onClick={reset} size="lg">
          {t('tryAgain')}
        </Button>
        <Button href="/" variant="secondary" size="lg">
          {t('goHome')}
        </Button>
      </div>
    </main>
  );
}
