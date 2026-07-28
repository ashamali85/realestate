import { prisma } from '@/lib/db';
import { t, type Locale } from '@/lib/i18n';

/**
 * Fixed routing and visibility for each nav key. Admins can reorder and rename
 * links, but the destination and who-can-see-it live here in code so the nav
 * can't be pointed at a broken or unauthorized route.
 */
export const NAV_META: Record<string, { href: string; active: string; superOnly: boolean; fallbackKey: string }> = {
  requests: { href: '/requests', active: 'requests', superOnly: false, fallbackKey: 'nav_requests' },
  new: { href: '/requests/new', active: 'new', superOnly: false, fallbackKey: 'nav_new_request' },
  lookups: { href: '/lookups', active: 'lookups', superOnly: true, fallbackKey: 'nav_lookups' },
  criteria: { href: '/criteria', active: 'criteria', superOnly: true, fallbackKey: 'nav_criteria' },
  'measure-lookups': { href: '/measure-lookups', active: 'measure-lookups', superOnly: true, fallbackKey: 'nav_measure_lookups' },
  users: { href: '/users', active: 'users', superOnly: true, fallbackKey: 'nav_users' }
};

export type NavItem = {
  key: string;
  label: string;
  href: string;
  active: string;
  superOnly: boolean;
};

/**
 * Returns the ordered nav items for rendering, using admin-set labels/order
 * from the DB and falling back to built-in translations for any key without a
 * row yet. Unknown keys (not in NAV_META) are ignored.
 */
export async function loadNav(locale: Locale): Promise<NavItem[]> {
  let rows: { key: string; labelEn: string; labelAr: string; displayOrder: number }[] = [];
  try {
    rows = await prisma.navLink.findMany({ orderBy: { displayOrder: 'asc' } });
  } catch {
    rows = [];
  }

  const byKey = new Map(rows.map((r) => [r.key, r]));

  // Start from configured rows in their order; append any known keys missing
  // from the DB (e.g. first run before seed) using their default labels.
  const orderedKeys = [
    ...rows.map((r) => r.key).filter((k) => k in NAV_META),
    ...Object.keys(NAV_META).filter((k) => !byKey.has(k))
  ];

  return orderedKeys.map((key) => {
    const meta = NAV_META[key]!;
    const row = byKey.get(key);
    const label = row
      ? locale === 'ar'
        ? row.labelAr
        : row.labelEn
      : t(meta.fallbackKey as Parameters<typeof t>[0], locale);
    return { key, label, href: meta.href, active: meta.active, superOnly: meta.superOnly };
  });
}
