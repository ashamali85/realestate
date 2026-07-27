'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  assignCriteria,
  unassignCriteria,
  saveMeasureValues,
  deleteMeasureImage
} from '@/lib/criteria-actions';
import { useConfirm } from './ConfirmDialog';
import { useLoading } from './LoadingOverlay';
import { CollapsibleSection } from './CollapsibleSection';
import { ImageDropzone } from './ImageDropzone';
import { t, localName, type Locale } from '@/lib/i18n';

type StatusOpt = { id: string; nameEn: string; nameAr: string };
type MeasureImage = { id: string };
type Measure = {
  id: string;
  nameEn: string;
  nameAr: string;
  statusId: string | null;
  notes: string | null;
  recommendations: string | null;
  images: MeasureImage[];
};
type Assigned = {
  id: string;
  criteriaName: string;
  measures: Measure[];
};

export function RequestEvaluation({
  requestId,
  assigned,
  available,
  statuses,
  locale
}: {
  requestId: string;
  assigned: Assigned[];
  available: { id: string; nameEn: string; nameAr: string }[];
  statuses: StatusOpt[];
  locale: Locale;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const loading = useLoading();
  const [, startTransition] = useTransition();
  const [pick, setPick] = useState('');

  function assign() {
    if (!pick) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.append('requestId', requestId);
      fd.append('criteriaId', pick);
      await loading.run(() => assignCriteria(fd), t('saving', locale));
      setPick('');
      router.refresh();
    });
  }

  async function unassign(id: string) {
    const ok = await confirm({ message: t('unassign_confirm', locale), danger: true, confirmLabel: t('btn_delete', locale) });
    if (!ok) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.append('id', id);
      fd.append('requestId', requestId);
      await loading.run(() => unassignCriteria(fd), t('loading', locale));
      router.refresh();
    });
  }

  return (
    <div className="stack" style={{ gap: 16 }}>
      {/* Assign a criteria */}
      <div className="row wrap" style={{ gap: 8 }}>
        <select value={pick} onChange={(e) => setPick(e.target.value)} style={{ maxWidth: 320 }}>
          <option value="">
            {available.length === 0 ? t('all_assigned', locale) : t('assign_choose', locale)}
          </option>
          {available.map((c) => (
            <option key={c.id} value={c.id}>
              {localName(c, locale)}
            </option>
          ))}
        </select>
        <button type="button" className="btn btn-primary btn-sm" disabled={!pick} onClick={assign}>
          {t('assign_btn', locale)}
        </button>
      </div>

      {assigned.length === 0 ? (
        <p className="muted small">{t('eval_none', locale)}</p>
      ) : (
        assigned.map((a) => (
          <CollapsibleSection key={a.id} title={a.criteriaName}>
            <div className="row-between" style={{ marginBottom: 12 }}>
              <span className="muted small">{a.measures.length} · {t('criteria_measures', locale)}</span>
              <button type="button" className="btn btn-danger btn-sm" onClick={() => unassign(a.id)}>
                {t('btn_delete', locale)}
              </button>
            </div>
            <div className="stack" style={{ gap: 14 }}>
              {a.measures.map((m) => (
                <MeasureCard key={m.id} measure={m} requestId={requestId} statuses={statuses} locale={locale} />
              ))}
            </div>
          </CollapsibleSection>
        ))
      )}
    </div>
  );
}

function MeasureCard({
  measure,
  requestId,
  statuses,
  locale
}: {
  measure: Measure;
  requestId: string;
  statuses: StatusOpt[];
  locale: Locale;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const loading = useLoading();
  const [, startTransition] = useTransition();
  const [removed, setRemoved] = useState<Set<string>>(new Set());

  function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await loading.run(() => saveMeasureValues(fd), t('saving', locale));
      router.refresh();
    });
  }

  async function delImage(id: string) {
    const ok = await confirm({ message: t('confirm_delete', locale), danger: true, confirmLabel: t('btn_delete', locale) });
    if (!ok) return;
    setRemoved((prev) => new Set(prev).add(id));
    startTransition(async () => {
      await loading.run(() => deleteMeasureImage(id, requestId), t('loading', locale));
    });
  }

  const visibleImages = measure.images.filter((img) => !removed.has(img.id));

  return (
    <div className="card" style={{ padding: 16 }}>
      <h3 style={{ marginBottom: 12 }}>{localName(measure, locale)}</h3>
      <form onSubmit={save}>
        <input type="hidden" name="id" value={measure.id} />
        <input type="hidden" name="requestId" value={requestId} />
        <div className="grid-2">
          <div className="field">
            <label>{t('m_status', locale)}</label>
            <select name="statusId" defaultValue={measure.statusId ?? ''}>
              <option value="">{t('f_choose', locale)}</option>
              {statuses.map((s) => (
                <option key={s.id} value={s.id}>
                  {localName(s, locale)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="field">
          <label>{t('m_notes', locale)}</label>
          <textarea name="notes" maxLength={2000} defaultValue={measure.notes ?? ''} />
        </div>
        <div className="field">
          <label>{t('m_recommendations', locale)}</label>
          <textarea name="recommendations" maxLength={2000} defaultValue={measure.recommendations ?? ''} />
        </div>
        <button type="submit" className="btn btn-primary btn-sm">{t('m_save', locale)}</button>
      </form>

      {/* Attachments (max 4), uploaded immediately to the measure. */}
      <div style={{ marginTop: 16 }}>
        <label>{t('m_attachments', locale)}</label>
        {visibleImages.length > 0 && (
          <div className="thumb-grid" style={{ margin: '8px 0' }}>
            {visibleImages.map((img) => (
              <div className="thumb" key={img.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/measure-image/${img.id}`} alt="" loading="lazy" />
                <div className="thumb-del">
                  <button type="button" aria-label="delete" onClick={() => delImage(img.id)}>
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <ImageDropzone
          locale={locale}
          requestId={measure.id}
          existingCount={visibleImages.length}
          max={4}
          uploadUrl="/api/measure-image/upload"
          uploadKey="measureId"
        />
      </div>
    </div>
  );
}
