'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import { localName, t, type Locale } from '@/lib/i18n';

type Gov = { id: string; nameEn: string; nameAr: string };
type Area = { id: string; nameEn: string; nameAr: string; governorateId: string };

/** Arabic-aware normalization for forgiving search (matches the labels admin). */
function normalizeText(s: string): string {
  return s
    .replace(/[\u0617-\u061A\u064B-\u0652\u0670\u0640]/g, '')
    .replace(/[\u0622\u0623\u0625\u0671\u0672\u0673]/g, '\u0627')
    .replace(/[\u0649\u06CC\u064A\u06D2]/g, '\u064A')
    .replace(/[\u0643\u06A9\u06AA\u06AB]/g, '\u0643')
    .replace(/[\u0629\u06C0]/g, '\u0647')
    .replace(/\u200C|\u200D|\u200E|\u200F|\uFEFF/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Area picker with a Governorate filter and a type-to-search (autocomplete)
 * area list. The selected area id is submitted via a hidden input named
 * `areaId`. Picking a governorate narrows the area options; the area search box
 * filters by name. Selecting an area also fills the governorate to match.
 */
export function AreaSelect({
  governorates,
  areas,
  locale,
  initialAreaId = '',
  error
}: {
  governorates: Gov[];
  areas: Area[];
  locale: Locale;
  initialAreaId?: string;
  error?: string | null;
}) {
  const initialArea = areas.find((a) => a.id === initialAreaId);
  const [govId, setGovId] = useState<string>(initialArea?.governorateId ?? '');
  const [areaId, setAreaId] = useState<string>(initialAreaId);
  const [query, setQuery] = useState<string>(initialArea ? localName(initialArea, locale) : '');
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const sortedGovs = useMemo(
    () => [...governorates].sort((a, b) => localName(a, locale).localeCompare(localName(b, locale), locale === 'ar' ? 'ar' : 'en')),
    [governorates, locale]
  );

  // Areas filtered by governorate (if chosen) and by the search query.
  const filtered = useMemo(() => {
    let list = areas;
    if (govId) list = list.filter((a) => a.governorateId === govId);
    const nq = normalizeText(query);
    const selectedName = areaId ? localName(areas.find((a) => a.id === areaId)!, locale) : '';
    // If the query exactly matches the selected area's name, show the full list
    // (so the user can browse), otherwise filter by the typed text.
    if (nq && normalizeText(selectedName) !== nq) {
      list = list.filter((a) => normalizeText(localName(a, locale)).includes(nq));
    }
    return [...list].sort((a, b) => localName(a, locale).localeCompare(localName(b, locale), locale === 'ar' ? 'ar' : 'en'));
  }, [areas, govId, query, areaId, locale]);

  // Close the dropdown when clicking outside.
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  function pickArea(a: Area) {
    setAreaId(a.id);
    setQuery(localName(a, locale));
    setGovId(a.governorateId); // keep governorate in sync with the chosen area
    setOpen(false);
  }

  function onGovChange(id: string) {
    setGovId(id);
    // If the currently selected area doesn't belong to the new governorate, clear it.
    if (areaId) {
      const cur = areas.find((a) => a.id === areaId);
      if (cur && id && cur.governorateId !== id) {
        setAreaId('');
        setQuery('');
      }
    }
  }

  return (
    <>
      <input type="hidden" name="areaId" value={areaId} />
      <div className="grid-2">
        <div className="field" ref={boxRef} style={{ position: 'relative' }}>
          <label htmlFor="areaSearch">{t('f_area', locale)}</label>
          <input
            id="areaSearch"
            type="text"
            autoComplete="off"
            value={query}
            placeholder={t('f_area_search', locale)}
            onChange={(e) => {
              setQuery(e.target.value);
              setAreaId(''); // typing invalidates the current selection until re-picked
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
          />
          {open && (
            <div className="combo-list">
              {filtered.length === 0 ? (
                <div className="combo-empty">{t('f_area_none', locale)}</div>
              ) : (
                filtered.map((a) => (
                  <button
                    type="button"
                    key={a.id}
                    className={`combo-item${a.id === areaId ? ' is-selected' : ''}`}
                    onClick={() => pickArea(a)}
                  >
                    {localName(a, locale)}
                  </button>
                ))
              )}
            </div>
          )}
          {error && <span className="field-error">{error}</span>}
        </div>
        <div className="field">
          <label htmlFor="govFilter">{t('f_governorate', locale)}</label>
          <select id="govFilter" value={govId} onChange={(e) => onGovChange(e.target.value)}>
            <option value="">{t('f_governorate_all', locale)}</option>
            {sortedGovs.map((g) => (
              <option key={g.id} value={g.id}>
                {localName(g, locale)}
              </option>
            ))}
          </select>
        </div>
      </div>
    </>
  );
}
