import { requireSuperAdmin } from '@/lib/auth';
import { getLocale } from '@/lib/locale';
import { prisma } from '@/lib/db';
import { t } from '@/lib/i18n';
import { TopBar } from '@/components/TopBar';
import { OptionListEditor } from '@/components/OptionListEditor';
import { GeographyEditor } from '@/components/GeographyEditor';

export const dynamic = 'force-dynamic';

export default async function LookupsPage() {
  const user = await requireSuperAdmin();
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
        <p className="muted small mt-2" style={{ marginBottom: 20 }}>{t('lookups_intro', locale)}</p>

        <div className="stack" style={{ gap: 20 }}>
          <GeographyEditor governorates={governorates} areas={areas} locale={locale} />
          <OptionListEditor kind="purpose" title={t('lookup_purpose', locale)} rows={purposes} locale={locale} />
          <OptionListEditor kind="status" title={t('lookup_status', locale)} rows={statuses} locale={locale} />
          <OptionListEditor kind="exterior" title={t('lookup_exterior', locale)} rows={exteriors} locale={locale} />
          <OptionListEditor kind="elevator" title={t('lookup_elevator', locale)} rows={elevators} locale={locale} />
          <OptionListEditor kind="ac" title={t('lookup_ac', locale)} rows={acs} locale={locale} />
        </div>
      </main>
    </>
  );
}
