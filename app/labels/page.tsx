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

  // --- TEMPORARY DIAGNOSTIC ---------------------------------------------
  // Shows the raw stored overrides and what t() resolves for the labels in
  // question, so we can see exactly where any mismatch is. Remove once solved.
  const diagKeys = ['criteria_title', 'nav_criteria'];
  const diagnostic = diagKeys.map((key) => {
    const raw = overrideMap.get(key);
    return {
      key,
      rawOverride: raw ? { en: raw.en, ar: raw.ar } : null,
      tResolvesAr: t(key, 'ar'),
      tResolvesEn: t(key, 'en')
    };
  });
  const allOverrideKeys = overrides.map((o) => ({ key: o.key, en: o.en, ar: o.ar }));
  // ----------------------------------------------------------------------

  return (
    <>
      <TopBar user={user} locale={locale} active="labels" />
      <main className="container mt-6" style={{ paddingBottom: 60 }}>
        <h1 style={{ marginBottom: 6 }}>{t('labels_title', locale)}</h1>
        <p className="muted" style={{ marginBottom: 20 }}>{t('labels_intro', locale)}</p>

        {/* TEMPORARY DIAGNOSTIC PANEL — remove once the issue is solved */}
        <div className="card card-pad-lg" style={{ marginBottom: 20, background: '#fffbe6', border: '2px solid #f5a623' }}>
          <h3 style={{ marginBottom: 10, color: '#8a6d1a' }}>🔧 Diagnostic (temporary)</h3>
          <div dir="ltr" style={{ fontFamily: 'monospace', fontSize: '0.82rem', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
            <strong>Total override rows in DB: {overrides.length}</strong>
            {'\n\n'}
            <strong>Focus keys:</strong>
            {'\n'}
            {JSON.stringify(diagnostic, null, 2)}
            {'\n\n'}
            <strong>All override rows in DB:</strong>
            {'\n'}
            {JSON.stringify(allOverrideKeys, null, 2)}
          </div>
        </div>

        <div className="card card-pad-lg">
          <LabelsManager rows={rows} locale={locale} />
        </div>
      </main>
    </>
  );
}
