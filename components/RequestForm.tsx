'use client';

import { useActionState, useMemo, useState } from 'react';
import { createRequest, type RequestFormState } from '@/lib/actions';
import { t, localName, type Locale } from '@/lib/i18n';
import type { FormLookups } from '@/lib/lookups';
import { MapPicker } from './MapPicker';

const initial: RequestFormState = {};

function err(state: RequestFormState, field: string, locale: Locale): string | null {
  const key = state.fieldErrors?.[field];
  return key ? t(key, locale) : null;
}

export function RequestForm({
  locale,
  lookups
}: {
  locale: Locale;
  lookups: FormLookups;
}) {
  const [state, formAction, pending] = useActionState(createRequest, initial);
  const [areaId, setAreaId] = useState('');

  // Areas grouped by governorate for the dropdown; governorate shown read-only.
  const govById = useMemo(
    () => new Map(lookups.governorates.map((g) => [g.id, g])),
    [lookups.governorates]
  );

  const selectedArea = lookups.areas.find((a) => a.id === areaId);
  const selectedGov = selectedArea ? govById.get(selectedArea.governorateId) : undefined;

  // Sort areas alphabetically in the active language.
  const sortedAreas = useMemo(() => {
    return [...lookups.areas].sort((a, b) =>
      localName(a, locale).localeCompare(localName(b, locale), locale === 'ar' ? 'ar' : 'en')
    );
  }, [lookups.areas, locale]);

  return (
    <form action={formAction}>
      {state.error && state.error !== 'required' && (
        <div className="alert alert-error" role="alert">
          {t(state.error, locale)}
        </div>
      )}
      {state.fieldErrors && Object.keys(state.fieldErrors).length > 0 && (
        <div className="alert alert-error" role="alert">
          {t('required', locale)}
        </div>
      )}

      {/* Address */}
      <div className="form-section">
        <h3>{t('sec_address', locale)}</h3>
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
            {err(state, 'areaId', locale) && (
              <span className="field-error">{err(state, 'areaId', locale)}</span>
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
          <div className="field">
            <label htmlFor="block">{t('f_block', locale)}</label>
            <input id="block" name="block" required maxLength={30} />
            {err(state, 'block', locale) && (
              <span className="field-error">{err(state, 'block', locale)}</span>
            )}
          </div>
          <div className="field">
            <label htmlFor="street">{t('f_street', locale)}</label>
            <input id="street" name="street" required maxLength={60} />
            {err(state, 'street', locale) && (
              <span className="field-error">{err(state, 'street', locale)}</span>
            )}
          </div>
          <div className="field">
            <label htmlFor="houseNumber">{t('f_house', locale)}</label>
            <input id="houseNumber" name="houseNumber" required maxLength={30} />
            {err(state, 'houseNumber', locale) && (
              <span className="field-error">{err(state, 'houseNumber', locale)}</span>
            )}
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="form-section">
        <h3>{t('sec_location', locale)}</h3>
        <MapPicker locale={locale} />
      </div>

      {/* Client */}
      <div className="form-section">
        <h3>{t('sec_client', locale)}</h3>
        <div className="grid-3">
          <div className="field">
            <label htmlFor="clientName">{t('f_client_name', locale)}</label>
            <input id="clientName" name="clientName" required maxLength={120} />
            {err(state, 'clientName', locale) && (
              <span className="field-error">{err(state, 'clientName', locale)}</span>
            )}
          </div>
          <div className="field">
            <label htmlFor="clientPhone">{t('f_client_phone', locale)}</label>
            <input id="clientPhone" name="clientPhone" required inputMode="tel" dir="ltr" />
            {err(state, 'clientPhone', locale) && (
              <span className="field-error">{err(state, 'clientPhone', locale)}</span>
            )}
          </div>
          <div className="field">
            <label htmlFor="clientEmail">{t('f_client_email', locale)}</label>
            <input id="clientEmail" name="clientEmail" type="email" dir="ltr" maxLength={160} />
            {err(state, 'clientEmail', locale) && (
              <span className="field-error">{err(state, 'clientEmail', locale)}</span>
            )}
          </div>
        </div>
      </div>

      {/* Property */}
      <div className="form-section">
        <h3>{t('sec_property', locale)}</h3>
        <div className="grid-2">
          <LookupSelect name="purposeId" labelKey="f_purpose" options={lookups.purposes} locale={locale} state={state} />
          <LookupSelect name="statusId" labelKey="f_status" options={lookups.statuses} locale={locale} state={state} />
        </div>
        <div className="grid-3">
          <div className="field">
            <label htmlFor="yearsOld">{t('f_years', locale)}</label>
            <input id="yearsOld" name="yearsOld" type="number" min={0} max={500} required />
          </div>
          <div className="field">
            <label htmlFor="floors">{t('f_floors', locale)}</label>
            <input id="floors" name="floors" type="number" min={0} max={300} required />
          </div>
          <LookupSelect name="exteriorId" labelKey="f_exterior" options={lookups.exteriors} locale={locale} state={state} />
        </div>
        <div className="grid-2">
          <LookupSelect name="elevatorId" labelKey="f_elevator" options={lookups.elevators} locale={locale} state={state} />
          <LookupSelect name="acId" labelKey="f_ac" options={lookups.acs} locale={locale} state={state} />
        </div>
      </div>

      {/* Images */}
      <div className="form-section">
        <h3>{t('sec_images', locale)}</h3>
        <input
          type="file"
          name="images"
          multiple
          accept="image/jpeg,image/png,image/webp"
        />
        <span className="small muted" style={{ display: 'block', marginTop: 6 }}>
          {t('f_images_hint', locale)}
        </span>
      </div>

      {/* Notes */}
      <div className="form-section">
        <h3>{t('sec_notes', locale)}</h3>
        <textarea name="notes" maxLength={2000} placeholder={t('f_notes_ph', locale)} />
      </div>

      <div className="row wrap mt-4">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? (
            <>
              <span className="spinner" /> {t('btn_saving', locale)}
            </>
          ) : (
            t('btn_save', locale)
          )}
        </button>
      </div>
    </form>
  );
}

function LookupSelect({
  name,
  labelKey,
  options,
  locale,
  state
}: {
  name: string;
  labelKey: string;
  options: Array<{ id: string; nameEn: string; nameAr: string }>;
  locale: Locale;
  state: RequestFormState;
}) {
  const error = err(state, name, locale);
  return (
    <div className="field">
      <label htmlFor={name}>{t(labelKey, locale)}</label>
      <select id={name} name={name} required defaultValue="">
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
