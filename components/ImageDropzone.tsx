'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { t, type Locale } from '@/lib/i18n';

const MAX_BYTES = 4 * 1024 * 1024;
const ACCEPT = ['image/jpeg', 'image/png', 'image/webp'];

type Preview = { url: string; name: string; size: number };

/**
 * Drag-and-drop (or click) image picker. Maintains a DataTransfer-backed file
 * list bound to a hidden <input name="images"> so the existing server action
 * receives the files unchanged. Client-side it rejects wrong types and
 * oversized files before they ever reach the server.
 */
export function ImageDropzone({ locale }: { locale: Locale }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const syncInput = useCallback((files: File[]) => {
    if (!inputRef.current) return;
    const dt = new DataTransfer();
    files.forEach((f) => dt.items.add(f));
    inputRef.current.files = dt.files;
  }, []);

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      setError(null);
      const current: File[] = inputRef.current?.files
        ? Array.from(inputRef.current.files)
        : [];
      const accepted: File[] = [...current];
      const newPreviews: Preview[] = [...previews];

      for (const file of Array.from(incoming)) {
        if (!ACCEPT.includes(file.type)) {
          setError(t('f_images_hint', locale));
          continue;
        }
        if (file.size > MAX_BYTES) {
          setError(
            `${file.name}: ${(file.size / (1024 * 1024)).toFixed(1)} MB > 4 MB`
          );
          continue;
        }
        accepted.push(file);
        newPreviews.push({
          url: URL.createObjectURL(file),
          name: file.name,
          size: file.size
        });
      }

      syncInput(accepted);
      setPreviews(newPreviews);
    },
    [previews, syncInput, locale]
  );

  const removeAt = useCallback(
    (index: number) => {
      const current = inputRef.current?.files ? Array.from(inputRef.current.files) : [];
      const next = current.filter((_, i) => i !== index);
      const removed = previews[index];
      if (removed) URL.revokeObjectURL(removed.url);
      syncInput(next);
      setPreviews((prev) => prev.filter((_, i) => i !== index));
    },
    [previews, syncInput]
  );

  return (
    <div>
      <div
        className={`dropzone ${dragOver ? 'dropzone-over' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        <div className="dropzone-icon" aria-hidden="true">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <div className="dropzone-text">{t('dz_prompt', locale)}</div>
        <div className="dropzone-sub">{t('f_images_hint', locale)}</div>
        <span className="btn btn-ghost btn-sm dropzone-btn">{t('dz_browse', locale)}</span>
      </div>

      {/* Hidden real input the server action reads. */}
      <input
        ref={inputRef}
        type="file"
        name="images"
        multiple
        accept={ACCEPT.join(',')}
        className="dropzone-input"
        onChange={(e) => {
          if (e.target.files?.length) {
            // Re-run through addFiles so previews and validation stay in sync.
            const picked = Array.from(e.target.files);
            // Clear then re-add current + picked to dedupe the native selection.
            const existing = previews.length;
            if (existing === 0) {
              // fast path
              const dt = new DataTransfer();
              picked.forEach((f) => dt.items.add(f));
              e.target.files = dt.files;
              setPreviews(
                picked
                  .filter((f) => ACCEPT.includes(f.type) && f.size <= MAX_BYTES)
                  .map((f) => ({ url: URL.createObjectURL(f), name: f.name, size: f.size }))
              );
            } else {
              addFiles(picked);
            }
          }
        }}
      />

      {error && <span className="field-error" style={{ marginTop: 8 }}>{error}</span>}

      {previews.length > 0 && (
        <div className="thumb-grid" style={{ marginTop: 12 }}>
          {previews.map((p, i) => (
            <div className="thumb" key={`${p.name}-${i}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={p.name} />
              <div className="thumb-del">
                <button type="button" aria-label="remove" onClick={() => removeAt(i)}>
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
