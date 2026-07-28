'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createOption, updateOption, deleteOption, type LookupKind } from '@/lib/lookup-actions';
import { useConfirm } from './ConfirmDialog';
import { useLoading } from './LoadingOverlay';
import { t, type Locale } from '@/lib/i18n';

export type OptionRow = {
  id: string;
  nameEn: string;
  nameAr: string;
  displayOrder: number;
  isActive: boolean;
  score?: number;
};

export function OptionListEditor({
  kind,
  title,
  rows,
  locale,
  showScore = false
}: {
  kind: LookupKind;
  title: string;
  rows: OptionRow[];
  locale: Locale;
  showScore?: boolean;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const loading = useLoading();
  const [, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  function submitAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await loading.run(() => createOption(fd), t('saving', locale));
      setAdding(false); // close the form → back to list view
      router.refresh();
    });
  }

  function submitEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await loading.run(() => updateOption(fd), t('saving', locale));
      setEditingId(null); // close the inline editor
      router.refresh();
    });
  }

  async function onDelete(id: string) {
    const ok = await confirm({
      message: t('confirm_delete', locale),
      danger: true,
      confirmLabel: t('btn_delete', locale)
    });
    if (!ok) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.append('kind', kind);
      fd.append('id', id);
      await loading.run(() => deleteOption(fd), t('loading', locale));
      router.refresh();
    });
  }

  return (
    <div>
      <div className="row-between" style={{ marginBottom: 12 }}>
        <span className="muted small">{title}</span>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => {
            setAdding((v) => !v);
            setEditingId(null);
          }}
        >
          {adding ? t('btn_cancel', locale) : t('lookup_add_new', locale)}
        </button>
      </div>

      {adding && (
        <form onSubmit={submitAdd} className="lookup-form">
          <div className="grid-3">
            <input name="nameEn" placeholder={t('lookup_name_en', locale)} dir="ltr" required />
            <input name="nameAr" placeholder={t('lookup_name_ar', locale)} dir="rtl" required />
            <input name="displayOrder" type="number" min={0} placeholder={t('lookup_order', locale)} defaultValue={rows.length} />
          </div>
          {showScore && (
            <div className="grid-3 mt-2">
              <div className="field" style={{ margin: 0 }}>
                <label>{t('measure_score', locale)}</label>
                <input name="score" type="number" min={0} max={3} defaultValue={0} required />
              </div>
            </div>
          )}
          <input type="hidden" name="kind" value={kind} />
          <div className="mt-2">
            <button type="submit" className="btn btn-primary btn-sm">
              {t('btn_add', locale)}
            </button>
          </div>
        </form>
      )}

      <div className="table-card scroll-area" style={{ marginTop: 12 }}>
        <table>
          <thead>
            <tr>
              <th>{t('lookup_name_en', locale)}</th>
              <th>{t('lookup_name_ar', locale)}</th>
              {showScore && <th>{t('measure_score', locale)}</th>}
              <th>{t('lookup_order', locale)}</th>
              <th>{t('lookup_active', locale)}</th>
              <th>{t('col_actions', locale)}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) =>
              editingId === row.id ? (
                <tr key={row.id}>
                  <td colSpan={showScore ? 6 : 5}>
                    <form onSubmit={submitEdit} className="lookup-form">
                      <input type="hidden" name="kind" value={kind} />
                      <input type="hidden" name="id" value={row.id} />
                      <div className="grid-3">
                        <input name="nameEn" defaultValue={row.nameEn} dir="ltr" required />
                        <input name="nameAr" defaultValue={row.nameAr} dir="rtl" required />
                        <input name="displayOrder" type="number" min={0} defaultValue={row.displayOrder} />
                      </div>
                      {showScore && (
                        <div className="grid-3 mt-2">
                          <div className="field" style={{ margin: 0 }}>
                            <label>{t('measure_score', locale)}</label>
                            <input name="score" type="number" min={0} max={3} defaultValue={row.score ?? 0} required />
                          </div>
                        </div>
                      )}
                      <div className="row wrap mt-2">
                        <label className="check">
                          <input type="checkbox" name="isActive" defaultChecked={row.isActive} />{' '}
                          {t('lookup_active', locale)}
                        </label>
                        <button type="submit" className="btn btn-primary btn-sm">
                          {t('btn_save', locale)}
                        </button>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}>
                          {t('btn_cancel', locale)}
                        </button>
                      </div>
                    </form>
                  </td>
                </tr>
              ) : (
                <tr key={row.id} className={row.isActive ? '' : 'row-inactive'}>
                  <td dir="ltr">{row.nameEn}</td>
                  <td dir="rtl">{row.nameAr}</td>
                  {showScore && <td className="mono">{row.score ?? 0}</td>}
                  <td>{row.displayOrder}</td>
                  <td>
                    {row.isActive ? (
                      <span className="badge badge-super">{t('lookup_active', locale)}</span>
                    ) : (
                      <span className="badge badge-off">{t('user_inactive', locale)}</span>
                    )}
                  </td>
                  <td>
                    <div className="row" style={{ gap: 6 }}>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditingId(row.id)}>
                        {t('btn_edit', locale)}
                      </button>
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => onDelete(row.id)}>
                        {t('btn_delete', locale)}
                      </button>
                    </div>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
