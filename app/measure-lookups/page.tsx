import { requireSuperAdmin } from '@/lib/auth';
import { getLocale } from '@/lib/locale';
import { prisma } from '@/lib/db';
import { t } from '@/lib/i18n';
import { loadLabelOverrides } from '@/lib/label-overrides';
import { TopBar } from '@/components/TopBar';
import { OptionListEditor } from '@/components/OptionListEditor';

export const dynamic = 'force-dynamic';

export default async function MeasureLookupsPage() {
  const user = await requireSuperAdmin();
  await loadLabelOverrides();
  const locale = await getLocale();

  const measureStatuses = await prisma.measureStatusOption.findMany({
    orderBy: { displayOrder: 'asc' }
  });

  return (
    <>
      <TopBar user={user} locale={locale} active="measure-lookups" />
      <main className="container mt-6" style={{ paddingBottom: 60 }}>
        <h1>{t('measure_lookups_title', locale)}</h1>
        <p className="muted small mt-2" style={{ marginBottom: 20 }}>
          {t('measure_lookups_intro', locale)}
        </p>

        <section>
          <h2 className="lookup-section-title">{t('measure_status_title', locale)}</h2>
          <OptionListEditor
            kind="measureStatus"
            title={t('measure_status_title', locale)}
            rows={measureStatuses}
            locale={locale}
            showScore
          />
        </section>
      </main>
    </>
  );
}
