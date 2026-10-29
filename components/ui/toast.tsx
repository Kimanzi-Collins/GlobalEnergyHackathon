'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

interface ToastItem {
  id: number;
  title: string;
  description?: string;
}

interface ToastContextValue {
  /** Show a toast for 4 seconds. Announced politely to screen readers; never blocks interaction. */
  push: (toast: Omit<ToastItem, 'id'>) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { ...toast, id }]);
    window.setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[90] flex flex-col items-center gap-2 px-4"
      >
        {items.map((t) => (
          <div
            key={t.id}
            role="status"
            className="glass pointer-events-auto max-w-sm animate-rise rounded-2xl bg-ink/90 px-4 py-3 text-snow shadow-2xl ring-1 ring-white/10"
          >
            <p className="text-sm font-medium">{t.title}</p>
            {t.description && <p className="mt-0.5 text-sm text-snow/70">{t.description}</p>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
