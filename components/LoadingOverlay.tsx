'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { t, type Locale } from '@/lib/i18n';

type LoadingContextValue = {
  show: (message?: string) => void;
  hide: () => void;
  /** Wrap an async task so the overlay shows for its duration. */
  run: <T>(task: () => Promise<T>, message?: string) => Promise<T>;
};

const LoadingContext = createContext<LoadingContextValue | null>(null);

/**
 * App-wide loading overlay. A single animated overlay is rendered here; any
 * component calls useLoading().run(...) (or show/hide) to display it while
 * something happens in the background. Themed, RTL-agnostic (centered).
 */
export function LoadingProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const [count, setCount] = useState(0); // supports overlapping tasks
  const [message, setMessage] = useState<string | null>(null);

  const show = useCallback((msg?: string) => {
    setMessage(msg ?? null);
    setCount((c) => c + 1);
  }, []);

  const hide = useCallback(() => {
    setCount((c) => Math.max(0, c - 1));
  }, []);

  const run = useCallback(
    async <T,>(task: () => Promise<T>, msg?: string): Promise<T> => {
      setMessage(msg ?? null);
      setCount((c) => c + 1);
      try {
        return await task();
      } finally {
        setCount((c) => Math.max(0, c - 1));
      }
    },
    []
  );

  const visible = count > 0;

  return (
    <LoadingContext.Provider value={{ show, hide, run }}>
      {children}
      {visible && (
        <div className="loading-overlay" role="status" aria-live="polite">
          <div className="loading-box">
            <div className="loading-text">{message ?? t('loading', locale)}</div>
            <div className="loading-stripe" aria-hidden="true">
              <div className="loading-stripe-fill" />
            </div>
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
}

export function useLoading(): LoadingContextValue {
  const ctx = useContext(LoadingContext);
  if (!ctx) {
    // No-op fallback if provider is missing.
    return {
      show: () => {},
      hide: () => {},
      run: async (task) => task()
    };
  }
  return ctx;
}
