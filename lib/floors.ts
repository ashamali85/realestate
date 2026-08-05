import { t, type Locale } from '@/lib/i18n';

export type FloorKey = string; // "basement" | "ground" | "mezzanine" | "1" | "2" ...

export type FloorTab = { key: FloorKey; label: string };

/**
 * Derives the list of floors for a request. The numbered floors come from the
 * request's `floors` count (Ground is floor 1, then First, Second, ...), plus
 * Basement and/or Mezzanine when those flags are set. Order is for display only
 * and carries no meaning.
 */
export function floorsFor(
  req: { floors: number; hasBasement: boolean; hasMezzanine: boolean },
  locale: Locale
): FloorTab[] {
  const tabs: FloorTab[] = [];

  if (req.hasBasement) tabs.push({ key: 'basement', label: t('floor_basement', locale) });

  // Ground is the first floor; subsequent are First, Second, ...
  const ordinals: Array<Parameters<typeof t>[0]> = [
    'floor_ground',
    'floor_first',
    'floor_second'
  ];
  const count = Math.max(1, Math.min(3, req.floors));
  for (let i = 0; i < count; i++) {
    const key = i === 0 ? 'ground' : String(i); // ground, then "1", "2"
    const label = t(ordinals[i] ?? 'floor_ground', locale);
    tabs.push({ key, label });

    // Insert Mezzanine right after Ground (its position is not significant).
    if (i === 0 && req.hasMezzanine) {
      tabs.push({ key: 'mezzanine', label: t('floor_mezzanine', locale) });
    }
  }

  return tabs;
}
