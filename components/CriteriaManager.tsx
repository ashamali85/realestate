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
import { Modal } from './Modal';
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
  const [editing, setEditing] = useState<CriteriaRow | null>(null);

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
    run(() => updateCriteria(fd), () => setEditing(null));
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
            <div className="row wrap" style={{ gap: 6, marginBottom: 12 }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(c)}>{t('btn_edit', locale)}</button>
              <button type="button" className="btn btn-danger btn-sm" onClick={() => removeCriteria(c.id)}>{t('btn_delete', locale)}</button>
            </div>

            <MeasureList criteriaId={c.id} measures={c.measures} locale={locale} run={run} confirm={confirm} />
          </CollapsibleSection>
        ))
      )}

      {editing && (
        <Modal title={t('criteria_edit_title', locale)} onClose={() => setEditing(null)}>
          <form onSubmit={submitEdit}>
            <input type="hidden" name="id" value={editing.id} />
            <div className="field">
              <label>{t('criteria_name', locale)} (EN)</label>
              <input name="nameEn" defaultValue={editing.nameEn} dir="ltr" required autoFocus />
            </div>
            <div className="field">
              <label>{t('criteria_name', locale)} (AR)</label>
              <input name="nameAr" defaultValue={editing.nameAr} dir="rtl" required />
            </div>
            <label className="check" style={{ marginTop: 4 }}>
              <input type="checkbox" name="isActive" defaultChecked={editing.isActive} /> {t('lookup_active', locale)}
            </label>
            <div className="modal-actions" style={{ marginTop: 20 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>{t('btn_cancel', locale)}</button>
              <button type="submit" className="btn btn-primary">{t('btn_save', locale)}</button>
            </div>
          </form>
        </Modal>
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
  const [editingM, setEditingM] = useState<MeasureRow | null>(null);

  function submitAddM(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    e.currentTarget.reset();
    run(() => createMeasure(fd), () => setAddingM(false));
  }
  function submitEditM(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    run(() => updateMeasure(fd), () => setEditingM(null));
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
        <div className="stack" style={{ gap: 8, marginTop: 8 }}>
          {measures.map((m) => (
            <CollapsibleSection key={m.id} title={localName(m, locale)} defaultOpen={false}>
              <div>
                <div className="detail-grid" style={{ marginBottom: 12 }}>
                  <div className="detail-item">
                    <div className="detail-label">{t('lookup_name_en', locale)}</div>
                    <div className="detail-value" dir="ltr">{m.nameEn}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">{t('lookup_name_ar', locale)}</div>
                    <div className="detail-value" dir="rtl">{m.nameAr}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">{t('lookup_order', locale)}</div>
                    <div className="detail-value">{m.displayOrder}</div>
                  </div>
                </div>
                <div className="row" style={{ gap: 6 }}>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditingM(m)}>{t('btn_edit', locale)}</button>
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => removeM(m.id)}>{t('btn_delete', locale)}</button>
                </div>
              </div>
            </CollapsibleSection>
          ))}
        </div>
      )}

      {editingM && (
        <Modal title={t('measure_edit_title', locale)} onClose={() => setEditingM(null)}>
          <form onSubmit={submitEditM}>
            <input type="hidden" name="id" value={editingM.id} />
            <div className="field">
              <label>{t('measure_name', locale)} (EN)</label>
              <input name="nameEn" defaultValue={editingM.nameEn} dir="ltr" required autoFocus />
            </div>
            <div className="field">
              <label>{t('measure_name', locale)} (AR)</label>
              <input name="nameAr" defaultValue={editingM.nameAr} dir="rtl" required />
            </div>
            <div className="field">
              <label>{t('lookup_order', locale)}</label>
              <input name="displayOrder" type="number" min={0} defaultValue={editingM.displayOrder} />
            </div>
            <div className="modal-actions" style={{ marginTop: 20 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setEditingM(null)}>{t('btn_cancel', locale)}</button>
              <button type="submit" className="btn btn-primary">{t('btn_save', locale)}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
