'use client';

import { useState } from 'react';
import { createOption, updateOption, deleteOption, type LookupKind } from '@/lib/lookup-actions';
import { t, type Locale } from '@/lib/i18n';

export type OptionRow = {
  id: string;
  nameEn: string;
  nameAr: string;
  displayOrder: number;
  isActive: boolean;
};

export function OptionListEditor({
  kind,
  title,
  rows,
  locale
}: {
  kind: LookupKind;
  title: string;
  rows: OptionRow[];
  locale: Locale;
}) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="card">
      <div className="section-title">
        <h3>{title}</h3>
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
        <form action={createOption} className="lookup-form">
          <input type="hidden" name="kind" value={kind} />
          <div className="grid-3">
            <input name="nameEn" placeholder={t('lookup_name_en', locale)} dir="ltr" required />
            <input name="nameAr" placeholder={t('lookup_name_ar', locale)} dir="rtl" required />
            <input name="displayOrder" type="number" min={0} placeholder={t('lookup_order', locale)} defaultValue={rows.length} />
          </div>
          <div className="mt-2">
            <button type="submit" className="btn btn-primary btn-sm">
              {t('btn_add', locale)}
            </button>
          </div>
        </form>
      )}

      <div className="table-card" style={{ marginTop: 12 }}>
        <table>
          <thead>
            <tr>
              <th>{t('lookup_name_en', locale)}</th>
              <th>{t('lookup_name_ar', locale)}</th>
              <th>{t('lookup_order', locale)}</th>
              <th>{t('lookup_active', locale)}</th>
              <th>{t('col_actions', locale)}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) =>
              editingId === row.id ? (
                <tr key={row.id}>
                  <td colSpan={5}>
                    <form action={updateOption} className="lookup-form">
                      <input type="hidden" name="kind" value={kind} />
                      <input type="hidden" name="id" value={row.id} />
                      <div className="grid-3">
                        <input name="nameEn" defaultValue={row.nameEn} dir="ltr" required />
                        <input name="nameAr" defaultValue={row.nameAr} dir="rtl" required />
                        <input name="displayOrder" type="number" min={0} defaultValue={row.displayOrder} />
                      </div>
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
                      <form
                        action={deleteOption}
                        onSubmit={(e) => {
                          if (!window.confirm(t('confirm_delete', locale))) e.preventDefault();
                        }}
                      >
                        <input type="hidden" name="kind" value={kind} />
                        <input type="hidden" name="id" value={row.id} />
                        <button type="submit" className="btn btn-danger btn-sm">
                          {t('btn_delete', locale)}
                        </button>
                      </form>
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
