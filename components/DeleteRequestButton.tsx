'use client';

import { useTransition } from 'react';
import { deleteRequest } from '@/lib/actions';
import { useConfirm } from './ConfirmDialog';
import { useLoading } from './LoadingOverlay';
import { IconTrash } from './Icons';
import { t, type Locale } from '@/lib/i18n';

export function DeleteRequestButton({ id, locale }: { id: string; locale: Locale }) {
  const confirm = useConfirm();
  const loading = useLoading();
  const [pending, startTransition] = useTransition();

  async function onClick() {
    const ok = await confirm({
      message: t('confirm_delete_request', locale),
      danger: true,
      confirmLabel: t('btn_delete', locale)
    });
    if (!ok) return;
    startTransition(async () => {
      await loading.run(async () => {
        const fd = new FormData();
        fd.append('id', id);
        await deleteRequest(fd); // ends in redirect('/requests')
      }, t('loading', locale));
    });
  }

  return (
    <button type="button" className="btn btn-danger btn-icon btn-sm" disabled={pending} onClick={onClick} aria-label={t('btn_delete', locale)} title={t('btn_delete', locale)}>
      {pending ? <span className="spinner" /> : <IconTrash />}
    </button>
  );
}
