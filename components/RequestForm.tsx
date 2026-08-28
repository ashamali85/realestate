'use client';

import { useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  createRequest,
  updateRequest,
  type RequestFormState
} from '@/lib/actions';
import { t, localName, type Locale } from '@/lib/i18n';
import type { FormLookups } from '@/lib/lookups';
import { floorKeysFor, floorLabel } from '@/lib/floors';
import { useConfirm } from './ConfirmDialog';
import { MapPicker } from './MapPicker';
import { MapErrorBoundary } from './MapErrorBoundary';
import { CollapsibleSection } from './CollapsibleSection';
import { AreaSelect } from './AreaSelect';
import { ImageDropzone } from './ImageDropzone';
import { ExistingImages } from './ExistingImages';
import { useLoading } from './LoadingOverlay';

const initial: RequestFormState = {};

export type ExistingRequest = {
  id: string;
  areaId: string;
  block: string;
  street: string;
  houseNumber: string;
  latitude: number | null;
  longitude: number | null;
  clientName: string;
  clientPhone: string;
  clientEmail: string | null;
  purposeId: string;
  statusId: string;
  exteriorId: string;
  elevatorId: string;
  acId: string;
  yearsOld: number;
  floors: number;
  hasBasement: boolean;
  hasMezzanine: boolean;
  inspectionDate: Date | string;
  landArea: number | null;
  constructionPct: number | null;
  constructionArea: number | null;
  notes: string | null;
  images: { id: string; category?: string }[];
};

function toDateInputValue(value: Date | string | undefined): string {
  if (!value) return '';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '';
  // Format as YYYY-MM-DD in Kuwait time so the date shown matches what was saved.
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kuwait',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(d);
  return parts; // en-CA yields YYYY-MM-DD
}

function fieldError(state: RequestFormState, field: string, locale: Locale): string | null {
  const key = state.fieldErrors?.[field];
  return key ? t(key, locale) : null;
}

export function RequestForm({
  locale,
  lookups,
  existing,
  filledFloors = []
}: {
  locale: Locale;
  lookups: FormLookups;
  existing?: ExistingRequest;
  filledFloors?: string[];
}) {
  const isEdit = Boolean(existing);
  // Existing images (edit mode) are split by category. Older images saved before
  // categories existed default to "property".
  const propertyImages = (existing?.images ?? []).filter((i) => (i.category ?? 'property') !== 'kuwaitFinder');
  const kuwaitImages = (existing?.images ?? []).filter((i) => i.category === 'kuwaitFinder');
  const router = useRouter();
  const confirm = useConfirm();
  const [state, setState] = useState<RequestFormState>(initial);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  // Create-mode only: files queued in the dropzone, uploaded once after the
  // new request is created. In edit mode the dropzone uploads immediately and
  // this stays empty, so re-saving never re-uploads anything.
  const filesRef = useRef<File[]>([]);
  const kuwaitFilesRef = useRef<File[]>([]);
  const loading = useLoading();

  const busy = pending || uploading;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // If editing and the new floor set drops a floor that already has filled-in
    // measure data, warn before proceeding (that data will be deleted).
    if (isEdit && filledFloors.length > 0) {
      const newFloors = new Set(
        floorKeysFor({
          floors: Number(formData.get('floors') ?? 0),
          hasBasement: formData.get('hasBasement') === 'on',
          hasMezzanine: formData.get('hasMezzanine') === 'on'
        })
      );
      const droppedWithData = filledFloors.filter((f) => !newFloors.has(f));
      if (droppedWithData.length > 0) {
        const names = droppedWithData.map((f) => floorLabel(f, locale)).join('، ');
        const ok = await confirm({
          message: `${t('floor_remove_warning', locale)} (${names})`,
          danger: true,
          confirmLabel: t('btn_confirm', locale)
        });
        if (!ok) return;
      }
    }

    const queued = filesRef.current.slice();
    const queuedKuwait = kuwaitFilesRef.current.slice();

    startTransition(async () => {
      loading.show(t('saving', locale));
      try {
        const result = await (isEdit ? updateRequest : createRequest)(initial, formData);

        if (!result.ok || !result.id) {
          setState(result);
          return;
        }
        const targetId = result.id;

        if (isEdit) {
          router.push(`/requests/${targetId}`);
          router.refresh();
          return;
        }

        if (queued.length > 0 || queuedKuwait.length > 0) {

        }

        router.push(`/requests/${targetId}`);
        router.refresh();
        // Hold the overlay through the navigation + refresh so there's no gap
        // where the spinner is gone but the destination page hasn't painted yet.
        await new Promise((r) => setTimeout(r, 700));
      } finally {
        loading.hide();
      }
    });
  }



  return (
    <form onSubmit={onSubmit}>
      {isEdit && <input type="hidden" name="id" value={existing!.id} />}

      {state.error && (
        <div className="alert alert-error" role="alert">
          {t(state.error, locale)}
        </div>
      )}

      {state.fieldErrors && Object.keys(state.fieldErrors).length > 0 && (
        <div className="alert alert-error" role="alert">
          {t('required', locale)}
        </div>
      )}

      <div className="stack" style={{ gap: 14 }}>
        <CollapsibleSection title={t('sec_address', locale)} allowOverflow>
          <AreaSelect
            governorates={lookups.governorates}
            areas={lookups.areas}
            locale={locale}
            initialAreaId={existing?.areaId ?? ''}
            error={fieldError(state, 'areaId', locale)}
          />
          <div className="grid-3">
            <FieldText id="block" labelKey="f_block" locale={locale} state={state} defaultValue={existing?.block} maxLength={30} />
            <FieldText id="street" labelKey="f_street" locale={locale} state={state} defaultValue={existing?.street} maxLength={60} />
            <FieldText id="houseNumber" labelKey="f_house" locale={locale} state={state} defaultValue={existing?.houseNumber} maxLength={30} />
          </div>
        </CollapsibleSection>

        {/* Google Maps location picker — hidden for now per request.
            To re-enable, uncomment this section. All supporting code
            (MapPicker, MapErrorBoundary, lat/lng fields) is intact. */}
        {/*
        <CollapsibleSection title={t('sec_location', locale)}>
          <MapErrorBoundary locale={locale} initialLat={existing?.latitude} initialLng={existing?.longitude}>
            <MapPicker locale={locale} initialLat={existing?.latitude} initialLng={existing?.longitude} />
          </MapErrorBoundary>
        </CollapsibleSection>
        */}

        <CollapsibleSection title={t('sec_client', locale)}>
          <div className="grid-3">
            <FieldText id="clientName" labelKey="f_client_name" locale={locale} state={state} defaultValue={existing?.clientName} maxLength={120} />
            <div className="field">
              <label htmlFor="clientPhone">{t('f_client_phone', locale)}</label>
              <input id="clientPhone" name="clientPhone" required inputMode="tel" dir="ltr" defaultValue={existing?.clientPhone} />
              {fieldError(state, 'clientPhone', locale) && (
                <span className="field-error">{fieldError(state, 'clientPhone', locale)}</span>
              )}
            </div>
            <div className="field">
              <label htmlFor="clientEmail">{t('f_client_email', locale)}</label>
              <input id="clientEmail" name="clientEmail" type="email" dir="ltr" maxLength={160} defaultValue={existing?.clientEmail ?? ''} />
              {fieldError(state, 'clientEmail', locale) && (
                <span className="field-error">{fieldError(state, 'clientEmail', locale)}</span>
              )}
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection title={t('sec_property', locale)}>
          <div className="grid-3">
            <LookupSelect name="purposeId" labelKey="f_purpose" options={lookups.purposes} locale={locale} state={state} value={existing?.purposeId} />
            <LookupSelect name="statusId" labelKey="f_status" options={lookups.statuses} locale={locale} state={state} value={existing?.statusId} />
            <LookupSelect name="exteriorId" labelKey="f_exterior" options={lookups.exteriors} locale={locale} state={state} value={existing?.exteriorId} />
          </div>
          <div className="grid-3">
            <LookupSelect name="elevatorId" labelKey="f_elevator" options={lookups.elevators} locale={locale} state={state} value={existing?.elevatorId} />
            <LookupSelect name="acId" labelKey="f_ac" options={lookups.acs} locale={locale} state={state} value={existing?.acId} />
            <div className="field">
              <label className="toggle-card toggle-aligned">
                <input type="checkbox" name="hasBasement" defaultChecked={existing?.hasBasement ?? false} />
                <span className="toggle-box" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </span>
                <span className="toggle-label">{t('f_has_basement', locale)}</span>
              </label>
            </div>
          </div>
          <div className="grid-3">
            <div className="field">
              <label htmlFor="yearsOld">{t('f_years', locale)}</label>
              <input id="yearsOld" name="yearsOld" type="number" min={0} max={500} required defaultValue={existing?.yearsOld ?? ''} />
            </div>
            <div className="field">
              <label htmlFor="floors">{t('f_floors', locale)}</label>
              <select id="floors" name="floors" required defaultValue={existing?.floors ?? ''}>
                <option value="">{t('f_choose', locale)}</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
              </select>
            </div>
            <div className="field">
              <label className="toggle-card toggle-aligned">
                <input type="checkbox" name="hasMezzanine" defaultChecked={existing?.hasMezzanine ?? false} />
                <span className="toggle-box" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </span>
                <span className="toggle-label">{t('f_has_mezzanine', locale)}</span>
              </label>
              <span className="field-error">{fieldError(state, 'hasMezzanine', locale)}</span>
            </div>
          </div>
          <div className="grid-3">
            <div className="field">
              <label htmlFor="landArea">{t('land_area', locale)}</label>
              <input id="landArea" name="landArea" type="number" step="any" min={0} inputMode="decimal" defaultValue={existing?.landArea ?? ''} />
              <span className="field-error">{fieldError(state, 'landArea', locale)}</span>
            </div>
            <div className="field">
              <label htmlFor="constructionPct">{t('construction_pct', locale)}</label>
              <input id="constructionPct" name="constructionPct" type="number" step="any" min={0} inputMode="decimal" defaultValue={existing?.constructionPct ?? ''} />
              <span className="field-error">{fieldError(state, 'constructionPct', locale)}</span>
            </div>
            <div className="field">
              <label htmlFor="constructionArea">{t('construction_area', locale)}</label>
              <input id="constructionArea" name="constructionArea" type="number" step="any" min={0} inputMode="decimal" defaultValue={existing?.constructionArea ?? ''} />
              <span className="field-error">{fieldError(state, 'constructionArea', locale)}</span>
            </div>
          </div>
          <div className="grid-3">
            <div className="field">
              <label htmlFor="inspectionDate">{t('inspection_date', locale)}</label>
              <input
                id="inspectionDate"
                name="inspectionDate"
                type="date"
                required
                defaultValue={toDateInputValue(existing?.inspectionDate)}
              />
              <span className="field-error">{fieldError(state, 'inspectionDate', locale)}</span>
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection title={t('sec_images', locale)}>
          {isEdit && propertyImages.length > 0 && (
            <ExistingImages images={propertyImages} requestId={existing!.id} locale={locale} />
          )}
          {isEdit ? (
            <ImageDropzone
              locale={locale}
              requestId={existing!.id}
              existingCount={propertyImages.length}
              max={4}
              category="property"
            />
          ) : (
            <ImageDropzone
              locale={locale}
              max={4}
              category="property"
              onFilesChange={(f) => {
                filesRef.current = f;
              }}
            />
          )}
        </CollapsibleSection>

        <CollapsibleSection title={t('sec_kuwait_finder', locale)}>
          {isEdit && kuwaitImages.length > 0 && (
            <ExistingImages images={kuwaitImages} requestId={existing!.id} locale={locale} />
          )}
          {isEdit ? (
            <ImageDropzone
              locale={locale}
              requestId={existing!.id}
              existingCount={kuwaitImages.length}
              max={4}
              category="kuwaitFinder"
            />
          ) : (
            <ImageDropzone
              locale={locale}
              max={4}
              category="kuwaitFinder"
              onFilesChange={(f) => {
                kuwaitFilesRef.current = f;
              }}
            />
          )}
        </CollapsibleSection>

        <CollapsibleSection title={t('sec_notes', locale)}>
          <textarea name="notes" maxLength={2000} placeholder={t('f_notes_ph', locale)} defaultValue={existing?.notes ?? ''} />
        </CollapsibleSection>
      </div>

      <div className="row wrap mt-4">
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? (
            <>
              <span className="spinner" /> {t('btn_saving', locale)}
            </>
          ) : isEdit ? (
            t('btn_save_changes', locale)
          ) : (
            t('btn_save', locale)
          )}
        </button>
      </div>
    </form>
  );
}

function FieldText({
  id,
  labelKey,
  locale,
  state,
  defaultValue,
  maxLength
}: {
  id: string;
  labelKey: string;
  locale: Locale;
  state: RequestFormState;
  defaultValue?: string;
  maxLength?: number;
}) {
  const error = fieldError(state, id, locale);
  return (
    <div className="field">
      <label htmlFor={id}>{t(labelKey, locale)}</label>
      <input id={id} name={id} required maxLength={maxLength} defaultValue={defaultValue ?? ''} />
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}

function LookupSelect({
  name,
  labelKey,
  options,
  locale,
  state,
  value
}: {
  name: string;
  labelKey: string;
  options: Array<{ id: string; nameEn: string; nameAr: string }>;
  locale: Locale;
  state: RequestFormState;
  value?: string;
}) {
  const error = fieldError(state, name, locale);
  return (
    <div className="field">
      <label htmlFor={name}>{t(labelKey, locale)}</label>
      <select id={name} name={name} required defaultValue={value ?? ''}>
        <option value="">{t('f_choose', locale)}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {localName(o, locale)}
          </option>
        ))}
      </select>
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}
