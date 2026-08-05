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
import { StarRating } from './StarRating';
import { IconTrash } from './Icons';
import { t, localName, type Locale } from '@/lib/i18n';

type StatusOpt = { id: string; nameEn: string; nameAr: string };
type MeasureImage = { id: string };
type FloorTab = { key: string; label: string };
type Measure = {
  id: string;
  floor: string;
  nameEn: string;
  nameAr: string;
  statusId: string | null;
  score: number | null;
  notes: string | null;
  recommendations: string | null;
  images: MeasureImage[];
};
type Assigned = {
  id: string;
  criteriaName: string;
  score: number | null;
  measures: Measure[];
};

export function RequestEvaluation({
  requestId,
  assigned,
  available,
  floorTabs,
  statuses,
  locale
}: {
  requestId: string;
  assigned: Assigned[];
  available: { id: string; nameEn: string; nameAr: string }[];
  floorTabs: FloorTab[];
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
          <CollapsibleSection
            key={a.id}
            title={a.criteriaName}
            titleExtra={a.score !== null ? <StarRating score={a.score} size={16} /> : undefined}
          >
            <CriteriaBlock
              assigned={a}
              floorTabs={floorTabs}
              requestId={requestId}
              statuses={statuses}
              locale={locale}
              onUnassign={() => unassign(a.id)}
            />
          </CollapsibleSection>
        ))
      )}
    </div>
  );
}

function CriteriaBlock({
  assigned,
  floorTabs,
  requestId,
  statuses,
  locale,
  onUnassign
}: {
  assigned: Assigned;
  floorTabs: FloorTab[];
  requestId: string;
  statuses: StatusOpt[];
  locale: Locale;
  onUnassign: () => void;
}) {
  // Only show tabs for floors that actually have measures (guards against a
  // request whose floor count changed after assignment).
  const presentFloors = new Set(assigned.measures.map((m) => m.floor));
  const tabs = floorTabs.filter((f) => presentFloors.has(f.key));
  const effectiveTabs = tabs.length > 0 ? tabs : floorTabs;
  const [floor, setFloor] = useState<string>(effectiveTabs[0]?.key ?? 'ground');

  const floorMeasures = assigned.measures.filter((m) => m.floor === floor);

  return (
    <div>
      <div className="row-between" style={{ marginBottom: 12 }}>
        <span className="muted small">{floorMeasures.length} · {t('criteria_measures', locale)}</span>
        <button type="button" className="btn btn-danger btn-icon btn-sm" onClick={onUnassign} aria-label={t('btn_delete', locale)} title={t('btn_delete', locale)}>
          <IconTrash />
        </button>
      </div>

      {effectiveTabs.length > 1 && (
        <div className="floor-tabs" role="tablist">
          {effectiveTabs.map((f) => (
            <button
              key={f.key}
              type="button"
              role="tab"
              aria-selected={floor === f.key}
              className={`floor-tab ${floor === f.key ? 'active' : ''}`}
              onClick={() => setFloor(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      <div className="stack" style={{ gap: 14 }}>
        {floorMeasures.map((m) => (
          <MeasureCard key={m.id} measure={m} requestId={requestId} statuses={statuses} locale={locale} />
        ))}
      </div>
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
    <CollapsibleSection
      title={localName(measure, locale)}
      defaultOpen={false}
      titleExtra={
        measure.score !== null ? (
          <StarRating score={measure.score} size={16} />
        ) : (
          <span className="muted small">{t('eval_unscored', locale)}</span>
        )
      }
    >
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
    </CollapsibleSection>
  );
}
