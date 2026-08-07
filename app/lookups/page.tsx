import { requireSuperAdmin } from '@/lib/auth';
import { getLocale } from '@/lib/locale';
import { prisma } from '@/lib/db';
import { t } from '@/lib/i18n';
import { loadLabelOverrides } from '@/lib/label-overrides';
import { TopBar } from '@/components/TopBar';
import { LookupsGrid } from '@/components/LookupsGrid';

export const dynamic = 'force-dynamic';

export default async function LookupsPage() {
  const user = await requireSuperAdmin();
  await loadLabelOverrides();
  const locale = await getLocale();

  const [purposes, statuses, exteriors, elevators, acs, governorates, areas] = await Promise.all([
    prisma.purposeOption.findMany({ orderBy: { displayOrder: 'asc' } }),
    prisma.statusOption.findMany({ orderBy: { displayOrder: 'asc' } }),
    prisma.exteriorOption.findMany({ orderBy: { displayOrder: 'asc' } }),
    prisma.elevatorOption.findMany({ orderBy: { displayOrder: 'asc' } }),
    prisma.acOption.findMany({ orderBy: { displayOrder: 'asc' } }),
    prisma.governorate.findMany({ orderBy: { displayOrder: 'asc' } }),
    prisma.area.findMany({ orderBy: [{ governorateId: 'asc' }, { nameEn: 'asc' }] })
  ]);

  return (
    <>
      <TopBar user={user} locale={locale} active="lookups" />
      <main className="container mt-6" style={{ paddingBottom: 60 }}>
        <h1>{t('lookups_title', locale)}</h1>
        <p className="muted small mt-2" style={{ marginBottom: 24 }}>{t('lookups_intro', locale)}</p>

        <LookupsGrid
          locale={locale}
          purposes={purposes}
          statuses={statuses}
          exteriors={exteriors}
          elevators={elevators}
          acs={acs}
          governorates={governorates}
          areas={areas}
        />
      </main>
    </>
  );
}
