import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { getLocale } from '@/lib/locale';
import { prisma } from '@/lib/db';
import { loadLabelOverrides } from '@/lib/label-overrides';
import { t } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export default async function DetailedReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser();
  await loadLabelOverrides();
  const locale = await getLocale();

  const r = await prisma.inspectionRequest.findUnique({ where: { id }, select: { id: true } });
  if (!r) notFound();

  return (
    <div className="report-root">
      <section className="report-page" style={{ textAlign: 'center', paddingTop: 80 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="" style={{ width: 260, maxWidth: '80%', borderRadius: 12, marginBottom: 24 }} />
        <h1 style={{ color: '#0f2a44' }}>{t('report_detailed', locale)}</h1>
        <p className="muted" style={{ marginTop: 12 }}>{locale === 'ar' ? 'قيد الإنشاء — سيتوفر قريبًا.' : 'Under construction — coming soon.'}</p>
      </section>
    </div>
  );
}
