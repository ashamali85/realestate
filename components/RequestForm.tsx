'use client';

import { useActionState, useMemo, useState } from 'react';
import {
  createRequest,
  updateRequest,
  type RequestFormState
} from '@/lib/actions';
import { t, localName, type Locale } from '@/lib/i18n';
import type { FormLookups } from '@/lib/lookups';
import { MapPicker } from './MapPicker';
import { CollapsibleSection } from './CollapsibleSection';
import { ImageDropzone } from './ImageDropzone';
import { ExistingImages } from './ExistingImages';

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
  notes: string | null;
  images: { id: string }[];
};

function fieldError(state: RequestFormState, field: string, locale: Locale): string | null {
  const key = state.fieldErrors?.[field];
  return key ? t(key, locale) : null;
}

export function RequestForm({
  locale,
  lookups,
  existing
}: {
  locale: Locale;
  lookups: FormLookups;
  existing?: ExistingRequest;
}) {
  const isEdit = Boolean(existing);
  const action = isEdit ? updateRequest : createRequest;
  const [state, formAction, pending] = useActionState(action, initial);
  const [areaId, setAreaId] = useState(existing?.areaId ?? '');

  const govById = useMemo(
    () => new Map(lookups.governorates.map((g) => [g.id, g])),
    [lookups.governorates]
  );
  const selectedArea = lookups.areas.find((a) => a.id === areaId);
  const selectedGov = selectedArea ? govById.get(selectedArea.governorateId) : undefined;

  const sortedAreas = useMemo(
    () =>
      [...lookups.areas].sort((a, b) =>
        localName(a, locale).localeCompare(localName(b, locale), locale === 'ar' ? 'ar' : 'en')
      ),
    [lookups.areas, locale]
  );

  return (
    <form action={formAction}>
      {isEdit && <input type="hidden" name="id" value={existing!.id} />}

      {state.fieldErrors && Object.keys(state.fieldErrors).length > 0 && (
        <div className="alert alert-error" role="alert">
          {t('required', locale)}
        </div>
      )}

      <div className="stack" style={{ gap: 14 }}>
        <CollapsibleSection title={t('sec_address', locale)}>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="areaId">{t('f_area', locale)}</label>
              <select
                id="areaId"
                name="areaId"
                required
                value={areaId}
                onChange={(e) => setAreaId(e.target.value)}
              >
                <option value="">{t('f_choose', locale)}</option>
                {sortedAreas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {localName(a, locale)}
                  </option>
                ))}
              </select>
              {fieldError(state, 'areaId', locale) && (
                <span className="field-error">{fieldError(state, 'areaId', locale)}</span>
              )}
            </div>
            <div className="field">
              <label>{t('f_governorate', locale)}</label>
              <input
                readOnly
                value={selectedGov ? localName(selectedGov, locale) : ''}
                placeholder={t('f_governorate_auto', locale)}
                style={{ background: 'var(--surface-2)' }}
              />
            </div>
          </div>
          <div className="grid-3">
            <FieldText id="block" labelKey="f_block" locale={locale} state={state} defaultValue={existing?.block} maxLength={30} />
            <FieldText id="street" labelKey="f_street" locale={locale} state={state} defaultValue={existing?.street} maxLength={60} />
            <FieldText id="houseNumber" labelKey="f_house" locale={locale} state={state} defaultValue={existing?.houseNumber} maxLength={30} />
          </div>
        </CollapsibleSection>

        <CollapsibleSection title={t('sec_location', locale)}>
          <MapPicker locale={locale} initialLat={existing?.latitude} initialLng={existing?.longitude} />
        </CollapsibleSection>

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
            <div className="field" aria-hidden="true" />
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
            <div className="field" aria-hidden="true" />
          </div>
        </CollapsibleSection>

        <CollapsibleSection title={t('sec_images', locale)}>
          {isEdit && existing!.images.length > 0 && (
            <ExistingImages images={existing!.images} requestId={existing!.id} locale={locale} />
          )}
          <ImageDropzone locale={locale} />
        </CollapsibleSection>

        <CollapsibleSection title={t('sec_notes', locale)}>
          <textarea name="notes" maxLength={2000} placeholder={t('f_notes_ph', locale)} defaultValue={existing?.notes ?? ''} />
        </CollapsibleSection>
      </div>

      <div className="row wrap mt-4">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? (
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
