'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  createGovernorate,
  updateGovernorate,
  deleteGovernorate,
  createArea,
  updateArea,
  deleteArea
} from '@/lib/lookup-actions';
import { useConfirm } from './ConfirmDialog';
import { useLoading } from './LoadingOverlay';
import { Modal } from './Modal';
import { t, localName, type Locale } from '@/lib/i18n';

type Gov = { id: string; nameEn: string; nameAr: string; displayOrder: number; isActive: boolean };
type AreaRow = Gov & { governorateId: string };

export function GeographyEditor({
  governorates,
  areas,
  locale
}: {
  governorates: Gov[];
  areas: AreaRow[];
  locale: Locale;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const loading = useLoading();
  const [, startTransition] = useTransition();
  const [tab, setTab] = useState<'gov' | 'area'>('gov');
  const [addingGov, setAddingGov] = useState(false);
  const [addingArea, setAddingArea] = useState(false);
  const [editGov, setEditGov] = useState<Gov | null>(null);
  const [editArea, setEditArea] = useState<AreaRow | null>(null);

  const govName = (id: string) => {
    const g = governorates.find((x) => x.id === id);
    return g ? localName(g, locale) : '';
  };

  // Each handler runs its server action, closes whatever form was open, and
  // refreshes so the new/updated row appears — all inside a transition so the
  // action returning void never throws mid-render.
  function handle(
    e: React.FormEvent<HTMLFormElement>,
    action: (fd: FormData) => Promise<unknown>,
    close: () => void
  ) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await loading.run(() => action(fd), t('saving', locale));
      close();
      router.refresh();
    });
  }

  async function remove(action: (fd: FormData) => Promise<unknown>, id: string) {
    const ok = await confirm({
      message: t('confirm_delete', locale),
      danger: true,
      confirmLabel: t('btn_delete', locale)
    });
    if (!ok) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.append('id', id);
      await loading.run(() => action(fd), t('loading', locale));
      router.refresh();
    });
  }

  return (
    <div>
      <div className="section-title">
        <div className="row" style={{ gap: 6 }}>
          <button
            type="button"
            className={`btn btn-sm ${tab === 'gov' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setTab('gov')}
          >
            {t('gov_title', locale)}
          </button>
          <button
            type="button"
            className={`btn btn-sm ${tab === 'area' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setTab('area')}
          >
            {t('area_title', locale)}
          </button>
        </div>
        {tab === 'gov' ? (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAddingGov((v) => !v)}>
            {addingGov ? t('btn_cancel', locale) : t('lookup_add_new', locale)}
          </button>
        ) : (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAddingArea((v) => !v)}>
            {addingArea ? t('btn_cancel', locale) : t('lookup_add_new', locale)}
          </button>
        )}
      </div>

      {tab === 'gov' && (
        <>
          {addingGov && (
            <form onSubmit={(e) => handle(e, createGovernorate, () => setAddingGov(false))} className="lookup-form">
              <div className="grid-3">
                <input name="nameEn" placeholder={t('lookup_name_en', locale)} dir="ltr" required />
                <input name="nameAr" placeholder={t('lookup_name_ar', locale)} dir="rtl" required />
                <input name="displayOrder" type="number" min={0} defaultValue={governorates.length} />
              </div>
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
                  <th>{t('lookup_order', locale)}</th>
                  <th>{t('lookup_active', locale)}</th>
                  <th>{t('col_actions', locale)}</th>
                </tr>
              </thead>
              <tbody>
                {governorates.map((g) => (
                  <tr key={g.id} className={g.isActive ? '' : 'row-inactive'}>
                    <td dir="ltr">{g.nameEn}</td>
                    <td dir="rtl">{g.nameAr}</td>
                    <td>{g.displayOrder}</td>
                    <td>{g.isActive ? <span className="badge badge-super">{t('lookup_active', locale)}</span> : <span className="badge badge-off">{t('user_inactive', locale)}</span>}</td>
                    <td>
                      <div className="row" style={{ gap: 6 }}>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditGov(g)}>{t('btn_edit', locale)}</button>
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => remove(deleteGovernorate, g.id)}>{t('btn_delete', locale)}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'area' && (
        <>
          {addingArea && (
            <form onSubmit={(e) => handle(e, createArea, () => setAddingArea(false))} className="lookup-form">
              <div className="grid-2">
                <input name="nameEn" placeholder={t('lookup_name_en', locale)} dir="ltr" required />
                <input name="nameAr" placeholder={t('lookup_name_ar', locale)} dir="rtl" required />
              </div>
              <div className="grid-2 mt-2">
                <select name="governorateId" required defaultValue="">
                  <option value="">{t('area_of_gov', locale)}…</option>
                  {governorates.map((g) => (
                    <option key={g.id} value={g.id}>{localName(g, locale)}</option>
                  ))}
                </select>
                <input name="displayOrder" type="number" min={0} defaultValue={0} />
              </div>
              <div className="mt-2">
                <button type="submit" className="btn btn-primary btn-sm">{t('btn_add', locale)}</button>
              </div>
            </form>
          )}
          <div className="table-card scroll-area" style={{ marginTop: 12 }}>
            <table>
              <thead>
                <tr>
                  <th>{t('lookup_name_en', locale)}</th>
                  <th>{t('lookup_name_ar', locale)}</th>
                  <th>{t('area_of_gov', locale)}</th>
                  <th>{t('lookup_active', locale)}</th>
                  <th>{t('col_actions', locale)}</th>
                </tr>
              </thead>
              <tbody>
                {areas.map((a) => (
                  <tr key={a.id} className={a.isActive ? '' : 'row-inactive'}>
                    <td dir="ltr">{a.nameEn}</td>
                    <td dir="rtl">{a.nameAr}</td>
                    <td>{govName(a.governorateId)}</td>
                    <td>{a.isActive ? <span className="badge badge-super">{t('lookup_active', locale)}</span> : <span className="badge badge-off">{t('user_inactive', locale)}</span>}</td>
                    <td>
                      <div className="row" style={{ gap: 6 }}>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditArea(a)}>{t('btn_edit', locale)}</button>
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => remove(deleteArea, a.id)}>{t('btn_delete', locale)}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {editGov && (
        <Modal title={t('geo_edit_gov', locale)} onClose={() => setEditGov(null)}>
          <form onSubmit={(e) => handle(e, updateGovernorate, () => setEditGov(null))}>
            <input type="hidden" name="id" value={editGov.id} />
            <div className="field">
              <label>{t('lookup_name_en', locale)}</label>
              <input name="nameEn" defaultValue={editGov.nameEn} dir="ltr" required autoFocus />
            </div>
            <div className="field">
              <label>{t('lookup_name_ar', locale)}</label>
              <input name="nameAr" defaultValue={editGov.nameAr} dir="rtl" required />
            </div>
            <div className="field">
              <label>{t('lookup_order', locale)}</label>
              <input name="displayOrder" type="number" min={0} defaultValue={editGov.displayOrder} />
            </div>
            <label className="check" style={{ marginTop: 4 }}>
              <input type="checkbox" name="isActive" defaultChecked={editGov.isActive} /> {t('lookup_active', locale)}
            </label>
            <div className="modal-actions" style={{ marginTop: 20 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setEditGov(null)}>{t('btn_cancel', locale)}</button>
              <button type="submit" className="btn btn-primary">{t('btn_save', locale)}</button>
            </div>
          </form>
        </Modal>
      )}

      {editArea && (
        <Modal title={t('geo_edit_area', locale)} onClose={() => setEditArea(null)}>
          <form onSubmit={(e) => handle(e, updateArea, () => setEditArea(null))}>
            <input type="hidden" name="id" value={editArea.id} />
            <div className="field">
              <label>{t('lookup_name_en', locale)}</label>
              <input name="nameEn" defaultValue={editArea.nameEn} dir="ltr" required autoFocus />
            </div>
            <div className="field">
              <label>{t('lookup_name_ar', locale)}</label>
              <input name="nameAr" defaultValue={editArea.nameAr} dir="rtl" required />
            </div>
            <div className="field">
              <label>{t('f_governorate', locale)}</label>
              <select name="governorateId" defaultValue={editArea.governorateId} required>
                {governorates.map((g) => (
                  <option key={g.id} value={g.id}>{localName(g, locale)}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>{t('lookup_order', locale)}</label>
              <input name="displayOrder" type="number" min={0} defaultValue={editArea.displayOrder} />
            </div>
            <label className="check" style={{ marginTop: 4 }}>
              <input type="checkbox" name="isActive" defaultChecked={editArea.isActive} /> {t('lookup_active', locale)}
            </label>
            <div className="modal-actions" style={{ marginTop: 20 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setEditArea(null)}>{t('btn_cancel', locale)}</button>
              <button type="submit" className="btn btn-primary">{t('btn_save', locale)}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
