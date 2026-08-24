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
import { Modal } from './Modal';
import { IconPencil, IconTrash } from './Icons';
import { t, localName, type Locale } from '@/lib/i18n';

export type MeasureRow = { id: string; nameEn: string; nameAr: string; displayOrder: number };
export type CriteriaRow = {
  id: string;
  nameEn: string;
  nameAr: string;
  isActive: boolean;
  wholeBuilding: boolean;
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

  // Keep the editing row in sync with fresh data after a refresh, so the
  // measures list inside the modal updates when a measure is added/edited.
  const editingLive = editing ? criteria.find((c) => c.id === editing.id) ?? editing : null;

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
          <label className="check" style={{ marginTop: 8 }}>
            <input type="checkbox" name="wholeBuilding" /> {t('criteria_whole_building', locale)}
          </label>
          <div className="mt-2">
            <button type="submit" className="btn btn-primary btn-sm">{t('btn_add', locale)}</button>
          </div>
        </form>
      )}

      {criteria.length === 0 ? (
        <div className="card empty">{t('criteria_none', locale)}</div>
      ) : (
        <div className="table-card scroll-area requests-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>{t('col_criteria_name', locale)}</th>
                <th>{t('col_status', locale)}</th>
                <th>{t('col_measures_count', locale)}</th>
                <th>{t('col_actions', locale)}</th>
              </tr>
            </thead>
            <tbody>
              {criteria.map((c) => (
                <tr key={c.id} className={c.isActive ? '' : 'row-inactive'}>
                  <td>{localName(c, locale)}</td>
                  <td>
                    {c.isActive ? (
                      <span className="badge badge-super">{t('status_active', locale)}</span>
                    ) : (
                      <span className="badge badge-off">{t('user_inactive', locale)}</span>
                    )}
                  </td>
                  <td>{c.measures.length}</td>
                  <td>
                    <div className="row" style={{ gap: 6 }}>
                      <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => setEditing(c)} aria-label={t('btn_edit', locale)} title={t('btn_edit', locale)}><IconPencil /></button>
                      <button type="button" className="btn btn-danger btn-icon btn-sm" onClick={() => removeCriteria(c.id)} aria-label={t('btn_delete', locale)} title={t('btn_delete', locale)}><IconTrash /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingLive && (
        <Modal title={t('criteria_edit_title', locale)} onClose={() => setEditing(null)} wide>
          <form onSubmit={submitEdit}>
            <input type="hidden" name="id" value={editingLive.id} />
            <div className="grid-2">
              <div className="field">
                <label>{t('criteria_name', locale)} (EN)</label>
                <input name="nameEn" defaultValue={editingLive.nameEn} dir="ltr" required autoFocus />
              </div>
              <div className="field">
                <label>{t('criteria_name', locale)} (AR)</label>
                <input name="nameAr" defaultValue={editingLive.nameAr} dir="rtl" required />
              </div>
            </div>
            <label className="check" style={{ marginTop: 4 }}>
              <input type="checkbox" name="isActive" defaultChecked={editingLive.isActive} /> {t('lookup_active', locale)}
            </label>
            <label className="check" style={{ marginTop: 4 }}>
              <input type="checkbox" name="wholeBuilding" defaultChecked={editingLive.wholeBuilding} /> {t('criteria_whole_building', locale)}
            </label>
            <p className="muted small" style={{ marginTop: 2 }}>{t('criteria_whole_building_hint', locale)}</p>
            <div className="modal-actions" style={{ marginTop: 16 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>{t('btn_cancel', locale)}</button>
              <button type="submit" className="btn btn-primary">{t('btn_save', locale)}</button>
            </div>
          </form>

          <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid var(--line)' }} />

          <MeasureList criteriaId={editingLive.id} measures={editingLive.measures} locale={locale} run={run} confirm={confirm} />
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
      <div className="row-between" style={{ marginBottom: 10 }}>
        <strong>{t('criteria_measures', locale)}</strong>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAddingM((v) => !v)}>
          {addingM ? t('btn_cancel', locale) : t('measure_add', locale)}
        </button>
      </div>

      {addingM && (
        <form onSubmit={submitAddM} className="lookup-form" style={{ marginBottom: 12 }}>
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
        <table className="table">
          <thead>
            <tr>
              <th>English</th>
              <th>العربية</th>
              <th>{t('lookup_order', locale)}</th>
              <th>{t('col_actions', locale)}</th>
            </tr>
          </thead>
          <tbody>
            {measures.map((m) => (
              <tr key={m.id}>
                <td dir="ltr">{m.nameEn}</td>
                <td dir="rtl">{m.nameAr}</td>
                <td>{m.displayOrder}</td>
                <td>
                  <div className="row" style={{ gap: 6 }}>
                    <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => setEditingM(m)} aria-label={t('btn_edit', locale)} title={t('btn_edit', locale)}><IconPencil /></button>
                    <button type="button" className="btn btn-danger btn-icon btn-sm" onClick={() => removeM(m.id)} aria-label={t('btn_delete', locale)} title={t('btn_delete', locale)}><IconTrash /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
