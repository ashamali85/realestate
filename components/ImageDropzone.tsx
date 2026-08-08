'use client';

import { useEffect, useRef, useState } from 'react';
import { t, type Locale } from '@/lib/i18n';

const MAX_BYTES = 4 * 1024 * 1024; // per file
const ACCEPT = ['image/jpeg', 'image/png', 'image/webp'];

export type SavedImage = { id: string };

type Local = { file: File; url: string; key: string };

/**
 * Image picker with two modes:
 *
 *  - EDIT mode (requestId provided): each picked/dropped file uploads to the
 *    request immediately, then shows as a saved thumbnail. Nothing is queued,
 *    so re-saving the form never re-uploads anything. This is what fixes the
 *    "images multiply on save" bug.
 *
 *  - CREATE mode (no requestId): files are held locally and reported via
 *    onFilesChange so the parent can upload them once, right after the new
 *    request is created.
 *
 * A hard cap (default 4) is enforced against existing + pending files.
 */
export function ImageDropzone({
  locale,
  requestId,
  existingCount = 0,
  max = 4,
  uploadUrl = '/api/request-image/upload',
  uploadKey = 'requestId',
  category = 'property',
  onFilesChange
}: {
  locale: Locale;
  requestId?: string;
  existingCount?: number;
  max?: number;
  uploadUrl?: string;
  uploadKey?: string;
  category?: string;
  onFilesChange?: (files: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const counter = useRef(0);
  const [local, setLocal] = useState<Local[]>([]); // create-mode queue / edit-mode transient previews
  const [savedCount, setSavedCount] = useState(0); // uploaded this session (edit mode)
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const totalUsed = existingCount + savedCount + (requestId ? 0 : local.length);
  const remaining = Math.max(0, max - totalUsed);

  useEffect(() => {
    return () => local.forEach((l) => URL.revokeObjectURL(l.url));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function validate(file: File): string | null {
    if (!ACCEPT.includes(file.type)) return t('dz_wrong_type', locale);
    if (file.size > MAX_BYTES) return `${file.name}: > 4 MB`;
    return null;
  }

  async function handleFiles(incoming: File[]) {
    setError(null);
    const files = incoming.slice(0, remaining);
    if (incoming.length > remaining) {
      setError(t('dz_max_reached', locale).replace('{n}', String(max)));
    }
    if (files.length === 0) return;

    for (const f of files) {
      const v = validate(f);
      if (v) {
        setError(v);
        return;
      }
    }

    if (requestId) {
      // EDIT mode: upload each file as its OWN request, sequentially. This is
      // exactly what "upload one by one" did manually — each request stays
      // small, so it never hits the serverless body-size limit that made a
      // single multi-file POST fail. We upload here and reload once at the end.
      setBusy(true);
      let uploaded = 0;
      try {
        for (let i = 0; i < files.length; i++) {
          setProgress({ done: i, total: files.length });
          const fd = new FormData();
          fd.append(uploadKey, requestId);
          fd.append('category', category);
          fd.append('images', files[i]!);
          const res = await fetch(uploadUrl, { method: 'POST', body: fd });
          if (!res.ok) throw new Error(String(res.status));
          uploaded++;
        }
        setSavedCount((n) => n + uploaded);
        // Refresh the server component so the saved thumbnails appear.
        window.location.reload();
      } catch {
        setError(
          uploaded > 0
            ? t('dz_upload_partial', locale).replace('{n}', String(uploaded))
            : t('dz_upload_failed', locale)
        );
        if (uploaded > 0) {
          // Some succeeded — reload so at least those show, after a beat.
          setTimeout(() => window.location.reload(), 1500);
        }
      } finally {
        setBusy(false);
        setProgress(null);
      }
    } else {
      // CREATE mode: hold locally, report up.
      setLocal((prev) => {
        const next = [
          ...prev,
          ...files.map((f) => {
            counter.current += 1;
            return { file: f, url: URL.createObjectURL(f), key: `f${counter.current}` };
          })
        ];
        onFilesChange?.(next.map((l) => l.file));
        return next;
      });
    }
  }

  function removeLocal(key: string) {
    setLocal((prev) => {
      const target = prev.find((l) => l.key === key);
      if (target) URL.revokeObjectURL(target.url);
      const next = prev.filter((l) => l.key !== key);
      onFilesChange?.(next.map((l) => l.file));
      return next;
    });
  }

  const canAdd = remaining > 0 && !busy;

  return (
    <div>
      <div
        className={`dropzone ${dragOver ? 'dropzone-over' : ''} ${canAdd ? '' : 'dropzone-disabled'}`}
        onDragOver={(e) => {
          if (!canAdd) return;
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (canAdd && e.dataTransfer.files?.length) handleFiles(Array.from(e.dataTransfer.files));
        }}
        onClick={() => canAdd && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && canAdd) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        <div className="dropzone-icon" aria-hidden="true">
          {busy ? (
            <span className="spinner" style={{ width: 28, height: 28 }} />
          ) : (
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          )}
        </div>
        <div className="dropzone-text">
          {busy
            ? progress
              ? `${t('dz_uploading', locale)} ${progress.done + 1}/${progress.total}`
              : t('dz_uploading', locale)
            : t('dz_prompt', locale)}
        </div>
        <div className="dropzone-sub">
          {t('f_images_hint', locale)} · {t('dz_remaining', locale).replace('{n}', String(remaining))}
        </div>
        {canAdd && <span className="btn btn-ghost btn-sm dropzone-btn">{t('dz_browse', locale)}</span>}
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT.join(',')}
        className="dropzone-input"
        onChange={(e) => {
          const picked = e.target.files ? Array.from(e.target.files) : [];
          e.target.value = ''; // reset so the same file can be re-picked later
          if (picked.length) handleFiles(picked);
        }}
      />

      {error && (
        <span className="field-error" style={{ display: 'block', marginTop: 8 }}>
          {error}
        </span>
      )}

      {/* Create-mode local previews (edit mode reloads to show saved thumbs). */}
      {!requestId && local.length > 0 && (
        <div className="thumb-grid" style={{ marginTop: 12 }}>
          {local.map((l) => (
            <div className="thumb" key={l.key}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={l.url} alt={l.file.name} />
              <div className="thumb-del">
                <button type="button" aria-label="remove" onClick={() => removeLocal(l.key)}>
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
