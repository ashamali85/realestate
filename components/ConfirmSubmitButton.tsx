'use client';

import { useRef, type ReactNode } from 'react';
import { useConfirm } from './ConfirmDialog';
import { t, type Locale } from '@/lib/i18n';

/**
 * A submit button that shows a themed confirm dialog first. On confirm it
 * submits its enclosing <form> via requestSubmit(), so it drops into existing
 * server-action forms without changing how they post.
 */
export function ConfirmSubmitButton({
  locale,
  message,
  className = 'btn btn-danger btn-sm',
  confirmLabel,
  children
}: {
  locale: Locale;
  message: string;
  className?: string;
  confirmLabel?: string;
  children: ReactNode;
}) {
  const confirm = useConfirm();
  const ref = useRef<HTMLButtonElement | null>(null);

  async function onClick() {
    const ok = await confirm({
      message,
      danger: true,
      confirmLabel: confirmLabel ?? t('btn_delete', locale)
    });
    if (!ok) return;
    // Submit the form this button belongs to, routing through the button so
    // any formAction on it is honoured.
    const form = ref.current?.form;
    if (form) form.requestSubmit(ref.current ?? undefined);
  }

  return (
    <button ref={ref} type="button" className={className} onClick={onClick}>
      {children}
    </button>
  );
}
