import { setLabelOverrides } from '@/lib/i18n';

type OverrideMap = Record<string, { en?: string | null; ar?: string | null }>;

/**
 * Loads admin label overrides from the database and applies them into the i18n
 * layer for the current server request. Returns the map so the layout can also
 * hand it to the client provider. Any failure is swallowed so rendering never
 * breaks — the app falls back to built-in defaults.
 */
export async function loadLabelOverrides(): Promise<OverrideMap> {
  try {
    // Import lazily so a build-time prerender that can't reach the DB doesn't
    // fail at module load.
    const { prisma } = await import('@/lib/db');
    const rows = await prisma.labelOverride.findMany();
    const map: OverrideMap = {};
    for (const r of rows) {
      map[r.key] = { en: r.en, ar: r.ar };
    }
    setLabelOverrides(map);
    return map;
  } catch {
    setLabelOverrides({});
    return {};
  }
}
