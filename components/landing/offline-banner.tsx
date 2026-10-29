'use client';

import { useEffect, useState } from 'react';
import { t } from '@/lib/strings';

/** Slides in from the top when the browser goes offline, and leaves when the connection returns. */
export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-0 z-[95] flex justify-center px-4 pt-3 transition-transform duration-500 ease-expo-out"
      style={{ transform: offline ? 'translate3d(0,0,0)' : 'translate3d(0,-120%,0)' }}
    >
      <p className="glass rounded-full bg-ink/90 px-5 py-2.5 text-sm text-snow ring-1 ring-white/10">{t('offline')}</p>
    </div>
  );
}
