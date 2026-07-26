'use client';

import { useState } from 'react';
import { deleteRequestImageById } from '@/lib/actions';
import { t, type Locale } from '@/lib/i18n';

/**
 * Photos already saved on a request, shown inside the edit form's Images
 * section. Delete uses a button `formAction` bound to the image id, so it does
 * NOT require a nested <form> (which HTML forbids and which previously made the
 * delete button inert). The bound server action ignores the surrounding form's
 * fields entirely.
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
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const visible = images.filter((img) => !removed.has(img.id));

  if (visible.length === 0) return null;

  return (
    <div className="thumb-grid" style={{ marginBottom: 12 }}>
      {visible.map((img) => (
        <div className="thumb" key={img.id}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/request-image/${img.id}`} alt="" loading="lazy" />
          <div className="thumb-del">
            <button
              type="submit"
              aria-label="delete"
              formAction={deleteRequestImageById.bind(null, img.id, requestId)}
              onClick={(e) => {
                if (!window.confirm(t('confirm_delete', locale))) {
                  e.preventDefault();
                  return;
                }
                setRemoved((prev) => new Set(prev).add(img.id));
              }}
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
