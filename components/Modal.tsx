'use client';

import { useEffect, type ReactNode } from 'react';

/**
 * Themed modal dialog shell. Closes on Escape and backdrop click. Content is
 * provided by the caller (typically an edit form). Reuses the app's existing
 * .modal-backdrop / .modal-card styling.
 */
export function Modal({
  title,
  onClose,
  children
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div className="modal-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ color: 'var(--brand)', marginBottom: 16 }}>{title}</h3>
        {children}
      </div>
    </div>
  );
}
