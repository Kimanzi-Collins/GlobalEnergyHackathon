'use client';

import { useEffect, useState } from 'react';

interface NetworkInformationLike {
  saveData?: boolean;
}

/**
 * True when the visitor asked for less motion (prefers-reduced-motion) or less data (Save-Data).
 * In that case every motion component renders its end state with identical content.
 * Returns false on the server and on first paint, then updates after mount.
 */
export function useLiteMotion(): boolean {
  const [lite, setLite] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const connection = (navigator as Navigator & { connection?: NetworkInformationLike }).connection;
    const update = () => setLite(mq.matches || Boolean(connection?.saveData));
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return lite;
}
