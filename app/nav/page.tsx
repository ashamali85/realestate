import { requireSuperAdmin } from '@/lib/auth';
import { getLocale } from '@/lib/locale';
import { prisma } from '@/lib/db';
import { t } from '@/lib/i18n';
import { loadLabelOverrides } from '@/lib/label-overrides';
import { TopBar } from '@/components/TopBar';
import { NavManager, type NavRow } from '@/components/NavManager';
import { NAV_META } from '@/lib/nav';

export const dynamic = 'force-dynamic';

export default async function NavPage() {
  const user = await requireSuperAdmin();
  await loadLabelOverrides();
  const locale = await getLocale();

  const rows = await prisma.navLink.findMany({ orderBy: { displayOrder: 'asc' } });
  // Only manage keys that map to a real destination.
  const managed: NavRow[] = rows
    .filter((r: (typeof rows)[number]) => r.key in NAV_META)
    .map((r: (typeof rows)[number]) => ({ key: r.key, labelEn: r.labelEn, labelAr: r.labelAr }));

  return (
    <>
      <TopBar user={user} locale={locale} active="nav" />
      <main className="container mt-6" style={{ paddingBottom: 60 }}>
        <h1>{t('nav_manage_title', locale)}</h1>
        <p className="muted small mt-2" style={{ marginBottom: 20 }}>
          {t('nav_manage_intro', locale)}
        </p>
        <NavManager rows={managed} locale={locale} />
      </main>
    </>
  );
}
