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
  const [editGov, setEditGov] = useState<string | null>(null);
  const [editArea, setEditArea] = useState<string | null>(null);

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
                {governorates.map((g) =>
                  editGov === g.id ? (
                    <tr key={g.id}>
                      <td colSpan={5}>
                        <form onSubmit={(e) => handle(e, updateGovernorate, () => setEditGov(null))} className="lookup-form">
                          <input type="hidden" name="id" value={g.id} />
                          <div className="grid-3">
                            <input name="nameEn" defaultValue={g.nameEn} dir="ltr" required />
                            <input name="nameAr" defaultValue={g.nameAr} dir="rtl" required />
                            <input name="displayOrder" type="number" min={0} defaultValue={g.displayOrder} />
                          </div>
                          <div className="row wrap mt-2">
                            <label className="check">
                              <input type="checkbox" name="isActive" defaultChecked={g.isActive} /> {t('lookup_active', locale)}
                            </label>
                            <button type="submit" className="btn btn-primary btn-sm">{t('btn_save', locale)}</button>
                            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditGov(null)}>{t('btn_cancel', locale)}</button>
                          </div>
                        </form>
                      </td>
                    </tr>
                  ) : (
                    <tr key={g.id} className={g.isActive ? '' : 'row-inactive'}>
                      <td dir="ltr">{g.nameEn}</td>
                      <td dir="rtl">{g.nameAr}</td>
                      <td>{g.displayOrder}</td>
                      <td>{g.isActive ? <span className="badge badge-super">{t('lookup_active', locale)}</span> : <span className="badge badge-off">{t('user_inactive', locale)}</span>}</td>
                      <td>
                        <div className="row" style={{ gap: 6 }}>
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditGov(g.id)}>{t('btn_edit', locale)}</button>
                          <button type="button" className="btn btn-danger btn-sm" onClick={() => remove(deleteGovernorate, g.id)}>{t('btn_delete', locale)}</button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
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
                {areas.map((a) =>
                  editArea === a.id ? (
                    <tr key={a.id}>
                      <td colSpan={5}>
                        <form onSubmit={(e) => handle(e, updateArea, () => setEditArea(null))} className="lookup-form">
                          <input type="hidden" name="id" value={a.id} />
                          <div className="grid-2">
                            <input name="nameEn" defaultValue={a.nameEn} dir="ltr" required />
                            <input name="nameAr" defaultValue={a.nameAr} dir="rtl" required />
                          </div>
                          <div className="grid-2 mt-2">
                            <select name="governorateId" defaultValue={a.governorateId} required>
                              {governorates.map((g) => (
                                <option key={g.id} value={g.id}>{localName(g, locale)}</option>
                              ))}
                            </select>
                            <input name="displayOrder" type="number" min={0} defaultValue={a.displayOrder} />
                          </div>
                          <div className="row wrap mt-2">
                            <label className="check">
                              <input type="checkbox" name="isActive" defaultChecked={a.isActive} /> {t('lookup_active', locale)}
                            </label>
                            <button type="submit" className="btn btn-primary btn-sm">{t('btn_save', locale)}</button>
                            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditArea(null)}>{t('btn_cancel', locale)}</button>
                          </div>
                        </form>
                      </td>
                    </tr>
                  ) : (
                    <tr key={a.id} className={a.isActive ? '' : 'row-inactive'}>
                      <td dir="ltr">{a.nameEn}</td>
                      <td dir="rtl">{a.nameAr}</td>
                      <td>{govName(a.governorateId)}</td>
                      <td>{a.isActive ? <span className="badge badge-super">{t('lookup_active', locale)}</span> : <span className="badge badge-off">{t('user_inactive', locale)}</span>}</td>
                      <td>
                        <div className="row" style={{ gap: 6 }}>
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditArea(a.id)}>{t('btn_edit', locale)}</button>
                          <button type="button" className="btn btn-danger btn-sm" onClick={() => remove(deleteArea, a.id)}>{t('btn_delete', locale)}</button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
