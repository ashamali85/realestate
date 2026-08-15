import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { getLocale } from '@/lib/locale';
import { prisma } from '@/lib/db';
import { loadLabelOverrides } from '@/lib/label-overrides';
import { t } from '@/lib/i18n';
import { criteriaScore, overallScore } from '@/lib/scoring';
import { ReportPrintTrigger } from '@/components/ReportPrintTrigger';
import { ReportSummary } from '@/components/ReportSummary';

export const dynamic = 'force-dynamic';

export default async function GeneralReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser();
  await loadLabelOverrides();
  const locale = await getLocale();

  const r = await prisma.inspectionRequest.findUnique({
    where: { id },
    include: {
      area: { include: { governorate: true } },
      purpose: true,
      status: true,
      exterior: true,
      elevator: true,
      ac: true,
      images: { orderBy: { sortOrder: 'asc' }, select: { id: true, category: true } }
    }
  });
  if (!r) notFound();

  const assigned = await prisma.requestCriteria.findMany({
    where: { requestId: id },
    include: { measures: { include: { status: { select: { score: true } } } } }
  });
  const critScores = assigned.map((a: (typeof assigned)[number]) =>
    criteriaScore(a.measures.map((m: { status: { score: number } | null }) => ({ score: m.status ? m.status.score : null })))
  );
  const overall = overallScore(critScores);

  const propertyImg = r.images.find((i: { category?: string }) => (i.category ?? 'property') !== 'kuwaitFinder');
  const kuwaitImg = r.images.find((i: { category?: string }) => i.category === 'kuwaitFinder');

  return (
    <div className="report-root">
      <ReportPrintTrigger />
      <ReportSummary
        r={r}
        locale={locale}
        title={t('report_general', locale)}
        overall={overall}
        propertyImgId={propertyImg?.id ?? null}
        kuwaitImgId={kuwaitImg?.id ?? null}
      />
    </div>
  );
}
