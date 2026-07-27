'use client';

import { useTransition } from 'react';
import { deleteRequest } from '@/lib/actions';
import { useConfirm } from './ConfirmDialog';
import { t, type Locale } from '@/lib/i18n';

export function DeleteRequestButton({ id, locale }: { id: string; locale: Locale }) {
  const confirm = useConfirm();
  const [pending, startTransition] = useTransition();

  async function onClick() {
    const ok = await confirm({
      message: t('confirm_delete_request', locale),
      danger: true,
      confirmLabel: t('btn_delete', locale)
    });
    if (!ok) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.append('id', id);
      await deleteRequest(fd); // ends in redirect('/requests')
    });
  }

  return (
    <button type="button" className="btn btn-danger btn-sm" disabled={pending} onClick={onClick}>
      {pending ? <span className="spinner" /> : t('btn_delete', locale)}
    </button>
  );
}
