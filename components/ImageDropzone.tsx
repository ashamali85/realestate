'use client';

import { useEffect, useRef, useState } from 'react';
import { t, type Locale } from '@/lib/i18n';

const MAX_BYTES = 4 * 1024 * 1024; // per file
// Keep the combined payload comfortably under the server action body limit
// (30 MB), leaving room for multipart overhead and the other form fields.
const MAX_TOTAL_BYTES = 24 * 1024 * 1024;
const ACCEPT = ['image/jpeg', 'image/png', 'image/webp'];

type Picked = { file: File; url: string; key: string };

/**
 * Drag-and-drop (or click) image picker.
 *
 * React state (`items`) is the single source of truth. After every change the
 * hidden <input name="images"> is rebuilt from that state via DataTransfer, so
 * the server action receives exactly the files shown as thumbnails — no more,
 * no fewer. This avoids the earlier bug where selecting several files at once
 * desynced the input from the previews.
 */
export function ImageDropzone({ locale }: { locale: Locale }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [items, setItems] = useState<Picked[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const counter = useRef(0);

  // Whenever items change, rebuild the hidden input's FileList to match.
  useEffect(() => {
    if (!inputRef.current) return;
    const dt = new DataTransfer();
    for (const it of items) dt.items.add(it.file);
    inputRef.current.files = dt.files;
  }, [items]);

  // Clean up object URLs on unmount.
  useEffect(() => {
    return () => {
      setItems((prev) => {
        prev.forEach((it) => URL.revokeObjectURL(it.url));
        return prev;
      });
    };
  }, []);

  function addFiles(incoming: File[]) {
    setError(null);

    setItems((prev) => {
      const next = [...prev];
      let runningTotal = prev.reduce((n, it) => n + it.file.size, 0);
      const seen = new Set(prev.map((it) => `${it.file.name}:${it.file.size}`));

      for (const file of incoming) {
        if (!ACCEPT.includes(file.type)) {
          setError(t('dz_wrong_type', locale));
          continue;
        }
        if (file.size > MAX_BYTES) {
          setError(`${file.name}: ${(file.size / (1024 * 1024)).toFixed(1)} MB > 4 MB`);
          continue;
        }
        const sig = `${file.name}:${file.size}`;
        if (seen.has(sig)) continue; // skip exact duplicates
        if (runningTotal + file.size > MAX_TOTAL_BYTES) {
          setError(t('dz_too_much', locale));
          break;
        }
        seen.add(sig);
        runningTotal += file.size;
        counter.current += 1;
        next.push({
          file,
          url: URL.createObjectURL(file),
          key: `f${counter.current}`
        });
      }

      return next;
    });
  }

  function removeKey(key: string) {
    setItems((prev) => {
      const target = prev.find((it) => it.key === key);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((it) => it.key !== key);
    });
  }

  const totalMb = (items.reduce((n, it) => n + it.file.size, 0) / (1024 * 1024)).toFixed(1);

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
          if (e.dataTransfer.files?.length) addFiles(Array.from(e.dataTransfer.files));
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

      {/* Hidden real input the server action reads. Kept in sync from `items`. */}
      <input
        ref={inputRef}
        type="file"
        name="images"
        multiple
        accept={ACCEPT.join(',')}
        className="dropzone-input"
        onChange={(e) => {
          const picked = e.target.files ? Array.from(e.target.files) : [];
          // The effect will rewrite input.files from state; clearing the raw
          // value here avoids the browser keeping a stale native selection.
          if (picked.length) addFiles(picked);
        }}
      />

      {error && (
        <span className="field-error" style={{ display: 'block', marginTop: 8 }}>
          {error}
        </span>
      )}

      {items.length > 0 && (
        <>
          <div className="thumb-grid" style={{ marginTop: 12 }}>
            {items.map((it) => (
              <div className="thumb" key={it.key}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.url} alt={it.file.name} />
                <div className="thumb-del">
                  <button type="button" aria-label="remove" onClick={() => removeKey(it.key)}>
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
          <p className="small muted" style={{ marginTop: 8 }}>
            {items.length} · {totalMb} MB
          </p>
        </>
      )}
    </div>
  );
}
