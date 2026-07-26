'use client';

import { deleteRequest } from '@/lib/actions';
import { t, type Locale } from '@/lib/i18n';

export function DeleteRequestButton({ id, locale }: { id: string; locale: Locale }) {
  return (
    <form
      action={deleteRequest}
      onSubmit={(e) => {
        if (!window.confirm(t('confirm_delete_request', locale))) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="btn btn-danger btn-sm">
        {t('btn_delete', locale)}
      </button>
    </form>
  );
}
