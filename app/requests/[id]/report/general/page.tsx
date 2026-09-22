import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { getLocale } from '@/lib/locale';
import { prisma } from '@/lib/db';
import { loadLabelOverrides } from '@/lib/label-overrides';
import { t, localName } from '@/lib/i18n';
import { criteriaScore, overallScore, scoreLabelKey } from '@/lib/scoring';
import { ReportPrintTrigger } from '@/components/ReportPrintTrigger';
import { ReportSummary } from '@/components/ReportSummary';
import { StarRating } from '@/components/StarRating';

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
    include: {
      criteria: { select: { nameEn: true, nameAr: true } },
      measures: { include: { status: { select: { score: true } } } }
    }
  });
  const critScores = assigned.map((a: (typeof assigned)[number]) =>
    criteriaScore(a.measures.map((m: { status: { score: number } | null }) => ({ score: m.status ? m.status.score : null })))
  );
  const overall = overallScore(critScores);

  // Build the per-criteria list with its overall percentage, dropping criteria
  // that have no rated measures (null score).
  const criteriaSummary = assigned
    .map((a: (typeof assigned)[number], i: number) => ({
      name: localName(a.criteria, locale),
      score: critScores[i]
    }))
    .filter((c: { score: number | null }) => c.score !== null);

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

      {(r.notes?.trim() || criteriaSummary.length > 0) && (
        <section className="report-page report-page-break">
          <header className="report-head">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="" className="report-head-logo" />
            <div className="report-head-title">{t('report_general', locale)}</div>
          </header>

          {r.notes && r.notes.trim() && (
            <div className="report-notes-block">
              <h2 className="report-section-title">{t('sec_notes', locale)}</h2>
              <p className="report-notes-text">{r.notes}</p>
            </div>
          )}

          {criteriaSummary.length > 0 && (
            <div className="report-crit-summary">
              <h2 className="report-section-title">{t('sec_criteria', locale)}</h2>
              <div className="report-crit-summary-grid">
                {criteriaSummary.map((c: { name: string; score: number | null }, i: number) => (
                  <div key={i} className="report-crit-summary-item">
                    <StarRating score={c.score} size={16} />
                    <span className="report-crit-summary-text">
                      <span className="report-crit-summary-name">{c.name}</span>
                      {c.score !== null && scoreLabelKey(c.score) && (
                        <span className="report-crit-summary-rating">{t(scoreLabelKey(c.score)!, locale)}</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
