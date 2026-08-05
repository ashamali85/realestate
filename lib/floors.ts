import { t, type Locale } from '@/lib/i18n';

export type FloorKey = string; // "basement" | "ground" | "mezzanine" | "1" | "2" ...

export type FloorTab = { key: FloorKey; label: string };

/**
 * The stable floor keys for a request (no labels). Shared by the server (when
 * snapshotting measures) and the client. Keys: "basement", "ground",
 * "mezzanine", then "1", "2" for First/Second.
 */
export function floorKeysFor(req: {
  floors: number;
  hasBasement: boolean;
  hasMezzanine: boolean;
}): FloorKey[] {
  const keys: FloorKey[] = [];
  if (req.hasBasement) keys.push('basement');
  const count = Math.max(1, Math.min(3, req.floors));
  for (let i = 0; i < count; i++) {
    keys.push(i === 0 ? 'ground' : String(i));
    if (i === 0 && req.hasMezzanine) keys.push('mezzanine');
  }
  return keys;
}

/** Label for a single floor key. */
export function floorLabel(key: FloorKey, locale: Locale): string {
  switch (key) {
    case 'basement':
      return t('floor_basement', locale);
    case 'ground':
      return t('floor_ground', locale);
    case 'mezzanine':
      return t('floor_mezzanine', locale);
    case '1':
      return t('floor_first', locale);
    case '2':
      return t('floor_second', locale);
    default:
      return key;
  }
}

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
  return floorKeysFor(req).map((key) => ({ key, label: floorLabel(key, locale) }));
}
