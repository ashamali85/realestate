import { requireSuperAdmin } from '@/lib/auth';
import { getLocale } from '@/lib/locale';
import { prisma } from '@/lib/db';
import { t } from '@/lib/i18n';
import { loadLabelOverrides } from '@/lib/label-overrides';
import { TopBar } from '@/components/TopBar';
import { CriteriaManager, type CriteriaRow } from '@/components/CriteriaManager';

export const dynamic = 'force-dynamic';

export default async function CriteriaPage() {
  const user = await requireSuperAdmin();
  await loadLabelOverrides();
  const locale = await getLocale();

  const criteria = await prisma.criteria.findMany({
    orderBy: { nameEn: 'asc' },
    include: { measures: { orderBy: { displayOrder: 'asc' } } }
  });

  const rows: CriteriaRow[] = criteria.map((c: (typeof criteria)[number]) => ({
    id: c.id,
    nameEn: c.nameEn,
    nameAr: c.nameAr,
    isActive: c.isActive,
    wholeBuilding: c.wholeBuilding,
    measures: (c.measures ?? []).map((m) => ({
      id: m.id,
      nameEn: m.nameEn,
      nameAr: m.nameAr,
      displayOrder: m.displayOrder
    }))
  }));

  return (
    <>
      <TopBar user={user} locale={locale} active="criteria" />
      <main className="container mt-6" style={{ paddingBottom: 60 }}>
        <h1 style={{ marginBottom: 6 }}>{t('criteria_title', locale)}</h1>
        <CriteriaManager criteria={rows} locale={locale} />
      </main>
    </>
  );
}
