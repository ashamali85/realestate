import { setLabelOverrides } from '@/lib/i18n';

/**
 * Loads admin label overrides from the database and applies them into the i18n
 * layer so every t() call reflects them. Called from the root layout, which
 * runs on every page render. Any failure (DB unavailable, prerender context,
 * Prisma not generated at build) is swallowed so rendering never breaks — the
 * app simply falls back to built-in defaults.
 */
export async function loadLabelOverrides(): Promise<void> {
  try {
    // Import lazily so a build-time prerender that can't reach the DB doesn't
    // fail at module load.
    const { prisma } = await import('@/lib/db');
    const rows = await prisma.labelOverride.findMany();
    const map: Record<string, { en?: string | null; ar?: string | null }> = {};
    for (const r of rows) {
      map[r.key] = { en: r.en, ar: r.ar };
    }
    setLabelOverrides(map);
  } catch {
    setLabelOverrides({});
  }
}
