'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { t, type Locale } from '@/lib/i18n';

type ConfirmOptions = {
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/**
 * Provides an imperative, themed confirm() replacement:
 *   const confirm = useConfirm();
 *   if (await confirm({ message, danger: true })) { ... }
 *
 * Renders a single modal for the whole subtree. Styled with the app theme,
 * RTL-aware, closes on Escape / backdrop click, and traps initial focus on the
 * cancel button so an accidental Enter doesn't confirm a destructive action.
 */
export function ConfirmProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);
  const cancelBtnRef = useRef<HTMLButtonElement | null>(null);

  const confirm = useCallback<ConfirmFn>((opts) => {
    setOptions(opts);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const settle = useCallback((value: boolean) => {
    resolverRef.current?.(value);
    resolverRef.current = null;
    setOptions(null);
  }, []);

  useEffect(() => {
    if (!options) return;
    cancelBtnRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') settle(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [options, settle]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {options && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) settle(false);
          }}
        >
          <div className="modal-card" role="alertdialog" aria-modal="true" aria-label={options.message}>
            <p className="modal-message">{options.message}</p>
            <div className="modal-actions">
              <button
                ref={cancelBtnRef}
                type="button"
                className="btn btn-ghost"
                onClick={() => settle(false)}
              >
                {options.cancelLabel ?? t('btn_cancel', locale)}
              </button>
              <button
                type="button"
                className={`btn ${options.danger ? 'btn-danger' : 'btn-primary'}`}
                onClick={() => settle(true)}
              >
                {options.confirmLabel ?? t('btn_confirm', locale)}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    // Fallback keeps callers working if the provider is missing; should not
    // happen in normal use because the layout wraps the app in ConfirmProvider.
    return async ({ message }) => window.confirm(message);
  }
  return ctx;
}
