'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { saveLabelOverride, resetLabelOverride } from '@/lib/label-actions';
import { useConfirm } from './ConfirmDialog';
import { useLoading } from './LoadingOverlay';
import { Modal } from './Modal';
import { IconPencil } from './Icons';
import { t, type Locale } from '@/lib/i18n';

export type LabelRow = {
  key: string;
  en: string; // effective (override or default)
  ar: string;
  defaultEn: string;
  defaultAr: string;
  overridden: boolean;
};

/**
 * Normalizes text for forgiving search. Lowercases, trims, and for Arabic it
 * strips diacritics (tashkeel) and unifies letter variants that look identical
 * but have different Unicode codepoints across keyboards (Arabic vs Persian
 * ya/kaf, alef forms, ta-marbuta, alef-maksura). Without this, typing on a
 * Persian-style keyboard wouldn't match text stored in the Arabic forms.
 */
function normalizeText(s: string): string {
  return s
    .replace(/[\u0617-\u061A\u064B-\u0652\u0670\u0640]/g, '') // tashkeel + tatweel
    .replace(/[\u0622\u0623\u0625\u0671\u0672\u0673]/g, '\u0627') // أ إ آ ٱ ٲ ٳ -> ا
    .replace(/[\u0649\u06CC\u064A\u06D2]/g, '\u064A') // ى ی ي ے -> ي (Persian/Arabic ya)
    .replace(/[\u0643\u06A9\u06AA\u06AB]/g, '\u0643') // ک ٩ etc (Persian kaf) -> ك
    .replace(/[\u0629\u06C0]/g, '\u0647') // ة ۀ -> ه
    .replace(/[\u06BE\u06C1\u06C2]/g, '\u0647') // heh variants -> ه
    .replace(/\u200C|\u200D|\u200E|\u200F|\uFEFF/g, '') // zero-width / direction marks
    .toLowerCase()
    .trim();
}

export function LabelsManager({ rows, locale }: { rows: LabelRow[]; locale: Locale }) {
  const router = useRouter();
  const confirm = useConfirm();
  const loading = useLoading();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<LabelRow | null>(null);

  const filtered = useMemo(() => {
    const nq = normalizeText(search);
    if (!nq) return rows;
    // Match on individual words: every whitespace-separated term the user typed
    // must appear somewhere in the label's key, English, or Arabic. This is far
    // more forgiving than a single substring match — extra/odd spaces, word
    // order, and partial words all still match.
    const terms = nq.split(/\s+/).filter(Boolean);
    const nqNoSpace = nq.replace(/\s+/g, '');
    return rows.filter((r) => {
      const hay = `${normalizeText(r.key)} ${normalizeText(r.en)} ${normalizeText(r.ar)} ${normalizeText(r.defaultEn)} ${normalizeText(r.defaultAr)}`;
      // Every typed word appears somewhere, OR the whole query (spaces removed)
      // is a substring of the label text (spaces removed) — covers odd spacing.
      if (terms.every((term) => hay.includes(term))) return true;
      return hay.replace(/\s+/g, '').includes(nqNoSpace);
    });
  }, [rows, search]);

  function submitEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await loading.run(() => saveLabelOverride(fd), t('saving', locale));
      setEditing(null);
      router.refresh();
    });
  }

  async function onReset(row: LabelRow) {
    const ok = await confirm({
      message: t('label_reset_confirm', locale),
      danger: true,
      confirmLabel: t('label_reset', locale)
    });
    if (!ok) return;
    startTransition(async () => {
      await loading.run(async () => {
        const fd = new FormData();
        fd.append('key', row.key);
        await resetLabelOverride(fd);
      }, t('saving', locale));
      setEditing(null);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="field" style={{ maxWidth: 360, marginBottom: 16 }}>
        <input
          type="search"
          placeholder={t('label_search', locale)}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="table-scroll">
        <table className="table">
          <thead>
            <tr>
              <th>{t('label_key', locale)}</th>
              <th>English</th>
              <th>العربية</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.key}>
                <td className="mono small">{row.key}</td>
                <td dir="ltr">{row.en}</td>
                <td dir="rtl">{row.ar}</td>
                <td>
                  <button
                    type="button"
                    className="btn btn-ghost btn-icon btn-sm"
                    onClick={() => setEditing(row)}
                    aria-label={t('btn_edit', locale)}
                    title={t('btn_edit', locale)}
                  >
                    <IconPencil />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="muted" style={{ textAlign: 'center', padding: 24 }}>
                  {t('label_none', locale)}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <Modal title={t('label_edit_title', locale)} onClose={() => setEditing(null)}>
          <form onSubmit={submitEdit}>
            <input type="hidden" name="key" value={editing.key} />
            <p className="mono small muted" style={{ marginBottom: 12 }}>{editing.key}</p>
            <div className="field">
              <label>English</label>
              <input name="en" defaultValue={editing.en} dir="ltr" autoFocus />
              <span className="hint">{t('label_default', locale)}: {editing.defaultEn}</span>
            </div>
            <div className="field">
              <label>العربية</label>
              <input name="ar" defaultValue={editing.ar} dir="rtl" />
              <span className="hint">{t('label_default', locale)}: {editing.defaultAr}</span>
            </div>
            <div className="modal-actions" style={{ marginTop: 20 }}>
              <button type="button" className="btn btn-danger" onClick={() => onReset(editing)} style={{ marginInlineEnd: 'auto' }}>
                {t('label_reset', locale)}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>
                {t('btn_cancel', locale)}
              </button>
              <button type="submit" className="btn btn-primary">
                {t('btn_save', locale)}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
