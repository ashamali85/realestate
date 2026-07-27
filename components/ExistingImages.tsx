'use client';

import { useState, useTransition } from 'react';
import { deleteRequestImageById } from '@/lib/actions';
import { useConfirm } from './ConfirmDialog';
import { useLoading } from './LoadingOverlay';
import { t, type Locale } from '@/lib/i18n';

/**
 * Photos already saved on a request, shown when editing. Deleting calls the
 * server action directly (inside a transition) after a themed confirm, so
 * there is no nested <form> and no native browser prompt.
 */
export function ExistingImages({
  images,
  requestId,
  locale
}: {
  images: { id: string }[];
  requestId: string;
  locale: Locale;
}) {
  const confirm = useConfirm();
  const loading = useLoading();
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();
  const visible = images.filter((img) => !removed.has(img.id));

  if (visible.length === 0) return null;

  async function onDelete(id: string) {
    const ok = await confirm({
      message: t('confirm_delete', locale),
      danger: true,
      confirmLabel: t('btn_delete', locale)
    });
    if (!ok) return;
    setRemoved((prev) => new Set(prev).add(id));
    startTransition(async () => {
      await loading.run(() => deleteRequestImageById(id, requestId), t('loading', locale));
    });
  }

  return (
    <div className="thumb-grid" style={{ marginBottom: 12 }}>
      {visible.map((img) => (
        <div className="thumb" key={img.id}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/request-image/${img.id}`} alt="" loading="lazy" />
          <div className="thumb-del">
            <button type="button" aria-label="delete" onClick={() => onDelete(img.id)}>
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
