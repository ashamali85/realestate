'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { flushSync } from 'react-dom';
import { t, type Locale } from '@/lib/i18n';

type LoadingContextValue = {
  show: (message?: string) => void;
  hide: () => void;
  /** Show the overlay for a navigation; auto-clears when the route changes. */
  showForNavigation: (message?: string) => void;
  /** Wrap an async task so the overlay shows for its duration. */
  run: <T>(task: () => Promise<T>, message?: string) => Promise<T>;
  runWithRefresh: <T>(task: () => Promise<T>, refresh: () => void, message?: string) => Promise<T>;
};

const LoadingContext = createContext<LoadingContextValue | null>(null);

/**
 * App-wide loading overlay. A single animated overlay is rendered here; any
 * component calls useLoading().run(...) (or show/hide) to display it while
 * something happens in the background. Themed, RTL-agnostic (centered).
 */
export function LoadingProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const [count, setCount] = useState(0); // task-based overlays (run/show/hide)
  const [navLoading, setNavLoading] = useState(false); // navigation overlay
  const [message, setMessage] = useState<string | null>(null);
  const pathname = usePathname();
  const navTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear the navigation overlay whenever the route actually changes (the
  // destination page has rendered). Also clears on unmount.
  useEffect(() => {
    setNavLoading(false);
    if (navTimer.current) {
      clearTimeout(navTimer.current);
      navTimer.current = null;
    }
  }, [pathname]);

  const show = useCallback((msg?: string) => {
    setMessage(msg ?? null);
    setCount((c) => c + 1);
  }, []);

  const hide = useCallback(() => {
    setCount((c) => Math.max(0, c - 1));
  }, []);

  // Show the overlay for a navigation. It auto-clears when the route changes
  // (see the effect above), with a safety timeout so it can never get stuck if
  // navigation is cancelled or the target is unreachable.
  const showForNavigation = useCallback((msg?: string) => {
    setMessage(msg ?? null);
    setNavLoading(true);
    if (navTimer.current) clearTimeout(navTimer.current);
    navTimer.current = setTimeout(() => setNavLoading(false), 8000);
  }, []);

  const run = useCallback(
    async <T,>(task: () => Promise<T>, msg?: string): Promise<T> => {
      // Force the overlay to paint immediately, even when this runs inside a
      // startTransition (where state updates are otherwise deprioritized and
      // the overlay would never appear before the work finishes).
      flushSync(() => {
        setMessage(msg ?? null);
        setCount((c) => c + 1);
      });
      const startedAt = Date.now();
      try {
        return await task();
      } finally {
        // Keep the overlay up for a minimum time so quick operations don't
        // flash it invisibly — it should be clearly seen.
        const elapsed = Date.now() - startedAt;
        const minVisibleMs = 450;
        if (elapsed < minVisibleMs) {
          await new Promise((r) => setTimeout(r, minVisibleMs - elapsed));
        }
        flushSync(() => {
          setCount((c) => Math.max(0, c - 1));
        });
      }
    },
    []
  );

  // Runs a server action, then refreshes server data, keeping the overlay up
  // until BOTH finish. This prevents the "gap" where the overlay hides but the
  // UI hasn't updated yet (router.refresh re-fetches server components, which
  // takes a moment). The task should include the mutation; refresh() is called
  // after it succeeds, then we hold the overlay briefly so the refreshed data
  // is on screen before it disappears.
  const runWithRefresh = useCallback(
    async <T,>(task: () => Promise<T>, refresh: () => void, msg?: string): Promise<T> => {
      flushSync(() => {
        setMessage(msg ?? null);
        setCount((c) => c + 1);
      });
      const startedAt = Date.now();
      try {
        const result = await task();
        // Trigger the server-data refresh while the overlay is still up.
        refresh();
        // router.refresh() has no completion promise; hold the overlay a beat so
        // the re-fetched server components can paint before it disappears.
        await new Promise((r) => setTimeout(r, 600));
        return result;
      } finally {
        const elapsed = Date.now() - startedAt;
        const minVisibleMs = 450;
        if (elapsed < minVisibleMs) {
          await new Promise((r) => setTimeout(r, minVisibleMs - elapsed));
        }
        flushSync(() => {
          setCount((c) => Math.max(0, c - 1));
        });
      }
    },
    []
  );

  const visible = count > 0 || navLoading;

  return (
    <LoadingContext.Provider value={{ show, hide, showForNavigation, run, runWithRefresh }}>
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
      showForNavigation: () => {},
      run: async (task) => task(),
      runWithRefresh: async (task, refresh) => {
        const r = await task();
        refresh();
        return r;
      }
    };
  }
  return ctx;
}
