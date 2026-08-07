'use client';

import { useState } from 'react';
import { Modal } from './Modal';
import { OptionListEditor } from './OptionListEditor';
import { GeographyEditor } from './GeographyEditor';
import { t, type Locale } from '@/lib/i18n';
import type { LookupKind } from '@/lib/lookup-actions';

type OptionRow = { id: string; nameEn: string; nameAr: string; displayOrder: number; isActive: boolean; score?: number };
type Gov = { id: string; nameEn: string; nameAr: string; displayOrder: number; isActive: boolean };
type AreaRow = { id: string; nameEn: string; nameAr: string; displayOrder: number; isActive: boolean; governorateId: string };

export function LookupsGrid({
  locale,
  purposes,
  statuses,
  exteriors,
  elevators,
  acs,
  governorates,
  areas
}: {
  locale: Locale;
  purposes: OptionRow[];
  statuses: OptionRow[];
  exteriors: OptionRow[];
  elevators: OptionRow[];
  acs: OptionRow[];
  governorates: Gov[];
  areas: AreaRow[];
}) {
  const [open, setOpen] = useState<string | null>(null);

  const categories: Array<{ key: string; labelKey: string; count: number; icon: string }> = [
    { key: 'areas', labelKey: 'lookup_areas', count: governorates.length + areas.length, icon: '🗺️' },
    { key: 'purpose', labelKey: 'lookup_purpose', count: purposes.length, icon: '🎯' },
    { key: 'status', labelKey: 'lookup_status', count: statuses.length, icon: '📋' },
    { key: 'exterior', labelKey: 'lookup_exterior', count: exteriors.length, icon: '🏠' },
    { key: 'elevator', labelKey: 'lookup_elevator', count: elevators.length, icon: '🛗' },
    { key: 'ac', labelKey: 'lookup_ac', count: acs.length, icon: '❄️' }
  ];

  function rowsFor(kind: string): OptionRow[] {
    switch (kind) {
      case 'purpose': return purposes;
      case 'status': return statuses;
      case 'exterior': return exteriors;
      case 'elevator': return elevators;
      case 'ac': return acs;
      default: return [];
    }
  }

  const activeCat = categories.find((c) => c.key === open);

  return (
    <>
      <div className="lookup-grid">
        {categories.map((c) => (
          <button key={c.key} type="button" className="lookup-tile" onClick={() => setOpen(c.key)}>
            <span className="lookup-tile-icon" aria-hidden="true">{c.icon}</span>
            <span className="lookup-tile-name">{t(c.labelKey, locale)}</span>
            <span className="lookup-tile-count">{c.count} {t('lookup_items', locale)}</span>
          </button>
        ))}
      </div>

      {activeCat && (
        <Modal title={t(activeCat.labelKey, locale)} onClose={() => setOpen(null)} wide>
          {activeCat.key === 'areas' ? (
            <GeographyEditor governorates={governorates} areas={areas} locale={locale} />
          ) : (
            <OptionListEditor
              kind={activeCat.key as LookupKind}
              title={t(activeCat.labelKey, locale)}
              rows={rowsFor(activeCat.key)}
              locale={locale}
            />
          )}
        </Modal>
      )}
    </>
  );
}
