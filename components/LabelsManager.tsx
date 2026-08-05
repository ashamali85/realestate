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
 * strips diacritics (tashkeel) and unifies common letter variants (alef, ya,
 * ta-marbuta) so a search without diacritics still matches stored text that has
 * them (and vice-versa).
 */
function normalizeText(s: string): string {
  return s
    .replace(/[\u0617-\u061A\u064B-\u0652\u0670\u0640]/g, '') // tashkeel + tatweel
    .replace(/[\u0622\u0623\u0625\u0671]/g, '\u0627') // أ إ آ ٱ -> ا
    .replace(/\u0649/g, '\u064A') // ى -> ي
    .replace(/\u0629/g, '\u0647') // ة -> ه
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
    const q = normalizeText(search);
    if (!q) return rows;
    return rows.filter(
      (r) =>
        normalizeText(r.key).includes(q) ||
        normalizeText(r.en).includes(q) ||
        normalizeText(r.ar).includes(q)
    );
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
              <th>{t('label_status', locale)}</th>
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
                  {row.overridden ? (
                    <span className="badge badge-super">{t('label_custom', locale)}</span>
                  ) : (
                    <span className="badge badge-off">{t('label_default', locale)}</span>
                  )}
                </td>
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
                <td colSpan={5} className="muted" style={{ textAlign: 'center', padding: 24 }}>
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
              {editing.overridden && (
                <button type="button" className="btn btn-danger" onClick={() => onReset(editing)} style={{ marginInlineEnd: 'auto' }}>
                  {t('label_reset', locale)}
                </button>
              )}
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
