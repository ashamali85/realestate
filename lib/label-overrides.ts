import { cache } from 'react';
import { setLabelOverrides } from '@/lib/i18n';

type OverrideMap = Record<string, { en?: string | null; ar?: string | null }>;

/**
 * Loads admin label overrides from the database and applies them into the i18n
 * layer for the current server request, returning the map.
 *
 * Wrapped in React cache() so it runs at most once per request no matter how
 * many times it's called. IMPORTANT: because setLabelOverrides writes to a
 * request-scoped store that server t() reads, this must be invoked within the
 * render that will call t(). The root layout calls it (for layout-level text
 * and to feed the client provider), and each server page that renders labels
 * also calls it so its own t() calls see the overrides — layout and page can be
 * separate render scopes in the App Router, so relying on the layout alone is
 * not enough.
 */
export const loadLabelOverrides = cache(async (): Promise<OverrideMap> => {
  try {
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
});
