'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  assignCriteriaMany,
  unassignCriteria,
  saveMeasureValues,
  deleteMeasureImage
} from '@/lib/criteria-actions';
import { useConfirm } from './ConfirmDialog';
import { useLoading } from './LoadingOverlay';
import { CollapsibleSection } from './CollapsibleSection';
import { Modal } from './Modal';
import { ImageDropzone } from './ImageDropzone';
import { StarRating } from './StarRating';
import { IconTrash } from './Icons';
import { criteriaIcon } from '@/lib/criteria-icons';
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
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);

  function togglePick(id: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setPicked((prev) => (prev.size === available.length ? new Set() : new Set(available.map((c) => c.id))));
  }

  function assign() {
    if (picked.size === 0) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.append('requestId', requestId);
      fd.append('criteriaIds', [...picked].join(','));
      await loading.run(() => assignCriteriaMany(fd), t('saving', locale));
      setPicked(new Set());
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
      {/* Assign criteria (multi-select) */}
      {available.length === 0 ? (
        <p className="muted small">{t('all_assigned', locale)}</p>
      ) : (
        <div className="assign-panel">
          <div className="assign-panel-head">
            <label className="assign-check assign-selectall">
              <input
                type="checkbox"
                checked={picked.size === available.length && available.length > 0}
                ref={(el) => {
                  if (el) el.indeterminate = picked.size > 0 && picked.size < available.length;
                }}
                onChange={toggleAll}
              />
              <span>{t('assign_select_all', locale)}</span>
            </label>
            <button type="button" className="btn btn-primary btn-sm" disabled={picked.size === 0} onClick={assign}>
              {picked.size > 0 ? `${t('assign_btn', locale)} (${picked.size})` : t('assign_btn', locale)}
            </button>
          </div>
          <div className="assign-grid">
            {available.map((c) => (
              <label key={c.id} className="assign-check">
                <input type="checkbox" checked={picked.has(c.id)} onChange={() => togglePick(c.id)} />
                <span>{localName(c, locale)}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {assigned.length === 0 ? (
        <p className="muted small">{t('eval_none', locale)}</p>
      ) : (
        <div className="lookup-grid">
          {assigned.map((a) => (
            <button key={a.id} type="button" className="lookup-tile" onClick={() => setOpenId(a.id)}>
              <span className="lookup-tile-icon" aria-hidden="true">{criteriaIcon(a.criteriaName)}</span>
              <span className="lookup-tile-name">{a.criteriaName}</span>
              {a.score !== null && <StarRating score={a.score} size={16} />}
              <span className="lookup-tile-count">{a.measures.length} · {t('criteria_measures', locale)}</span>
            </button>
          ))}
        </div>
      )}

      {openId && (() => {
        const a = assigned.find((x) => x.id === openId);
        if (!a) return null;
        return (
          <Modal title={a.criteriaName} onClose={() => setOpenId(null)} wide>
            <CriteriaBlock
              assigned={a}
              floorTabs={floorTabs}
              requestId={requestId}
              statuses={statuses}
              locale={locale}
              onUnassign={() => {
                setOpenId(null);
                unassign(a.id);
              }}
            />
          </Modal>
        );
      })()}
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
  // Only one measure accordion open at a time within this criteria.
  const [openMeasureId, setOpenMeasureId] = useState<string | null>(null);

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
          <MeasureCard
            key={m.id}
            measure={m}
            requestId={requestId}
            statuses={statuses}
            locale={locale}
            open={openMeasureId === m.id}
            onToggle={() => setOpenMeasureId((cur) => (cur === m.id ? null : m.id))}
          />
        ))}
      </div>
    </div>
  );
}

function MeasureCard({
  measure,
  requestId,
  statuses,
  locale,
  open,
  onToggle
}: {
  measure: Measure;
  requestId: string;
  statuses: StatusOpt[];
  locale: Locale;
  open: boolean;
  onToggle: () => void;
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
      open={open}
      onToggle={onToggle}
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
