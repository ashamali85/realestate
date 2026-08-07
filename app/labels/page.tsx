import { requireSuperAdmin } from '@/lib/auth';
import { getLocale } from '@/lib/locale';
import { prisma } from '@/lib/db';
import { t, allLabels } from '@/lib/i18n';
import { loadLabelOverrides } from '@/lib/label-overrides';
import { TopBar } from '@/components/TopBar';
import { LabelsManager, type LabelRow } from '@/components/LabelsManager';

export const dynamic = 'force-dynamic';

export default async function LabelsPage() {
  const user = await requireSuperAdmin();
  await loadLabelOverrides(); // ensure server t() sees overrides in this scope
  const locale = await getLocale();

  const [labels, overrides] = await Promise.all([
    Promise.resolve(allLabels()),
    prisma.labelOverride.findMany()
  ]);

  const overrideMap = new Map(overrides.map((o) => [o.key, o]));

  const rows: LabelRow[] = labels.map((l) => {
    const o = overrideMap.get(l.key);
    const en = o?.en && o.en !== '' ? o.en : l.en;
    const ar = o?.ar && o.ar !== '' ? o.ar : l.ar;
    const overridden = Boolean(o && ((o.en && o.en !== '') || (o.ar && o.ar !== '')));
    return { key: l.key, en, ar, defaultEn: l.en, defaultAr: l.ar, overridden };
  });

  return (
    <>
      <TopBar user={user} locale={locale} active="labels" />
      <main className="container mt-6" style={{ paddingBottom: 60 }}>
        <h1 style={{ marginBottom: 6 }}>{t('labels_title', locale)}</h1>
        <p className="muted" style={{ marginBottom: 20 }}>{t('labels_intro', locale)}</p>

        <div className="card card-pad-lg">
          <LabelsManager rows={rows} locale={locale} />
        </div>
      </main>
    </>
  );
}
