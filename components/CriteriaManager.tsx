'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  createCriteria,
  updateCriteria,
  deleteCriteria,
  createMeasure,
  updateMeasure,
  deleteMeasure
} from '@/lib/criteria-actions';
import { useConfirm } from './ConfirmDialog';
import { useLoading } from './LoadingOverlay';
import { CollapsibleSection } from './CollapsibleSection';
import { t, localName, type Locale } from '@/lib/i18n';

export type MeasureRow = { id: string; nameEn: string; nameAr: string; displayOrder: number };
export type CriteriaRow = {
  id: string;
  nameEn: string;
  nameAr: string;
  isActive: boolean;
  measures: MeasureRow[];
};

export function CriteriaManager({ criteria, locale }: { criteria: CriteriaRow[]; locale: Locale }) {
  const router = useRouter();
  const confirm = useConfirm();
  const loading = useLoading();
  const [, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  function run(action: () => Promise<unknown>, after?: () => void) {
    startTransition(async () => {
      await loading.run(action, t('saving', locale));
      after?.();
      router.refresh();
    });
  }

  function submitAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    e.currentTarget.reset();
    run(() => createCriteria(fd), () => setAdding(false));
  }

  function submitEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    run(() => updateCriteria(fd), () => setEditId(null));
  }

  async function removeCriteria(id: string) {
    const ok = await confirm({ message: t('confirm_delete', locale), danger: true, confirmLabel: t('btn_delete', locale) });
    if (!ok) return;
    const fd = new FormData();
    fd.append('id', id);
    run(() => deleteCriteria(fd));
  }

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="row-between">
        <span className="muted small">{t('criteria_intro', locale)}</span>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => setAdding((v) => !v)}>
          {adding ? t('btn_cancel', locale) : t('criteria_add', locale)}
        </button>
      </div>

      {adding && (
        <form onSubmit={submitAdd} className="lookup-form">
          <div className="grid-2">
            <input name="nameEn" placeholder={`${t('criteria_name', locale)} (EN)`} dir="ltr" required />
            <input name="nameAr" placeholder={`${t('criteria_name', locale)} (AR)`} dir="rtl" required />
          </div>
          <div className="mt-2">
            <button type="submit" className="btn btn-primary btn-sm">{t('btn_add', locale)}</button>
          </div>
        </form>
      )}

      {criteria.length === 0 ? (
        <div className="card empty">{t('criteria_none', locale)}</div>
      ) : (
        criteria.map((c) => (
          <CollapsibleSection
            key={c.id}
            title={`${localName(c, locale)}${c.isActive ? '' : ' •'}`}
            defaultOpen={false}
          >
            {editId === c.id ? (
              <form onSubmit={submitEdit} className="lookup-form">
                <input type="hidden" name="id" value={c.id} />
                <div className="grid-2">
                  <input name="nameEn" defaultValue={c.nameEn} dir="ltr" required />
                  <input name="nameAr" defaultValue={c.nameAr} dir="rtl" required />
                </div>
                <div className="row wrap mt-2">
                  <label className="check">
                    <input type="checkbox" name="isActive" defaultChecked={c.isActive} /> {t('lookup_active', locale)}
                  </label>
                  <button type="submit" className="btn btn-primary btn-sm">{t('btn_save', locale)}</button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditId(null)}>{t('btn_cancel', locale)}</button>
                </div>
              </form>
            ) : (
              <div className="row wrap" style={{ gap: 6, marginBottom: 12 }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditId(c.id)}>{t('btn_edit', locale)}</button>
                <button type="button" className="btn btn-danger btn-sm" onClick={() => removeCriteria(c.id)}>{t('btn_delete', locale)}</button>
              </div>
            )}

            <MeasureList criteriaId={c.id} measures={c.measures} locale={locale} run={run} confirm={confirm} />
          </CollapsibleSection>
        ))
      )}
    </div>
  );
}

function MeasureList({
  criteriaId,
  measures,
  locale,
  run,
  confirm
}: {
  criteriaId: string;
  measures: MeasureRow[];
  locale: Locale;
  run: (action: () => Promise<unknown>, after?: () => void) => void;
  confirm: ReturnType<typeof useConfirm>;
}) {
  const [addingM, setAddingM] = useState(false);
  const [editMId, setEditMId] = useState<string | null>(null);

  function submitAddM(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    e.currentTarget.reset();
    run(() => createMeasure(fd), () => setAddingM(false));
  }
  function submitEditM(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    run(() => updateMeasure(fd), () => setEditMId(null));
  }
  async function removeM(id: string) {
    const ok = await confirm({ message: t('confirm_delete', locale), danger: true, confirmLabel: t('btn_delete', locale) });
    if (!ok) return;
    const fd = new FormData();
    fd.append('id', id);
    run(() => deleteMeasure(fd));
  }

  return (
    <div>
      <div className="row-between" style={{ marginBottom: 8 }}>
        <strong className="small">{t('criteria_measures', locale)}</strong>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAddingM((v) => !v)}>
          {addingM ? t('btn_cancel', locale) : t('measure_add', locale)}
        </button>
      </div>

      {addingM && (
        <form onSubmit={submitAddM} className="lookup-form">
          <input type="hidden" name="criteriaId" value={criteriaId} />
          <div className="grid-3">
            <input name="nameEn" placeholder={`${t('measure_name', locale)} (EN)`} dir="ltr" required />
            <input name="nameAr" placeholder={`${t('measure_name', locale)} (AR)`} dir="rtl" required />
            <input name="displayOrder" type="number" min={0} placeholder={t('lookup_order', locale)} defaultValue={measures.length} />
          </div>
          <div className="mt-2">
            <button type="submit" className="btn btn-primary btn-sm">{t('btn_add', locale)}</button>
          </div>
        </form>
      )}

      {measures.length === 0 ? (
        <p className="muted small">{t('measure_none', locale)}</p>
      ) : (
        <div className="table-card" style={{ marginTop: 8 }}>
          <table>
            <thead>
              <tr>
                <th>{t('lookup_name_en', locale)}</th>
                <th>{t('lookup_name_ar', locale)}</th>
                <th>{t('lookup_order', locale)}</th>
                <th>{t('col_actions', locale)}</th>
              </tr>
            </thead>
            <tbody>
              {measures.map((m) =>
                editMId === m.id ? (
                  <tr key={m.id}>
                    <td colSpan={4}>
                      <form onSubmit={submitEditM} className="lookup-form">
                        <input type="hidden" name="id" value={m.id} />
                        <div className="grid-3">
                          <input name="nameEn" defaultValue={m.nameEn} dir="ltr" required />
                          <input name="nameAr" defaultValue={m.nameAr} dir="rtl" required />
                          <input name="displayOrder" type="number" min={0} defaultValue={m.displayOrder} />
                        </div>
                        <div className="row wrap mt-2">
                          <button type="submit" className="btn btn-primary btn-sm">{t('btn_save', locale)}</button>
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditMId(null)}>{t('btn_cancel', locale)}</button>
                        </div>
                      </form>
                    </td>
                  </tr>
                ) : (
                  <tr key={m.id}>
                    <td dir="ltr">{m.nameEn}</td>
                    <td dir="rtl">{m.nameAr}</td>
                    <td>{m.displayOrder}</td>
                    <td>
                      <div className="row" style={{ gap: 6 }}>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditMId(m.id)}>{t('btn_edit', locale)}</button>
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => removeM(m.id)}>{t('btn_delete', locale)}</button>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
