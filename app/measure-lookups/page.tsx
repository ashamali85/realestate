import { requireSuperAdmin } from '@/lib/auth';
import { getLocale } from '@/lib/locale';
import { prisma } from '@/lib/db';
import { t } from '@/lib/i18n';
import { TopBar } from '@/components/TopBar';
import { OptionListEditor } from '@/components/OptionListEditor';
import { CollapsibleSection } from '@/components/CollapsibleSection';

export const dynamic = 'force-dynamic';

export default async function MeasureLookupsPage() {
  const user = await requireSuperAdmin();
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

        <div className="stack" style={{ gap: 14 }}>
          <CollapsibleSection title={t('measure_status_title', locale)} defaultOpen>
            <OptionListEditor
              kind="measureStatus"
              title={t('measure_status_title', locale)}
              rows={measureStatuses}
              locale={locale}
            />
          </CollapsibleSection>
        </div>
      </main>
    </>
  );
}
