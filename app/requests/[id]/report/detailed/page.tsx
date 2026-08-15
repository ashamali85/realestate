import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { getLocale } from '@/lib/locale';
import { prisma } from '@/lib/db';
import { loadLabelOverrides } from '@/lib/label-overrides';
import { t, localName } from '@/lib/i18n';
import { criteriaScore, overallScore } from '@/lib/scoring';
import { floorLabel } from '@/lib/floors';
import { StarRating } from '@/components/StarRating';
import { ReportPrintTrigger } from '@/components/ReportPrintTrigger';
import { ReportSummary } from '@/components/ReportSummary';

export const dynamic = 'force-dynamic';

type MeasureImg = { id: string };
type Measure = {
  id: string;
  floor: string;
  nameEn: string;
  nameAr: string;
  displayOrder: number;
  notes: string | null;
  recommendations: string | null;
  status: { nameEn: string; nameAr: string; score: number } | null;
  images: MeasureImg[];
};
type Assigned = {
  id: string;
  criteria: { nameEn: string; nameAr: string };
  measures: Measure[];
};

function hasData(m: Measure): boolean {
  return Boolean(m.status || (m.notes && m.notes.trim()) || (m.recommendations && m.recommendations.trim()) || m.images.length > 0);
}

export default async function DetailedReportPage({ params }: { params: Promise<{ id: string }> }) {
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

  const assigned: Assigned[] = await prisma.requestCriteria.findMany({
    where: { requestId: id },
    include: {
      criteria: true,
      measures: {
        orderBy: { displayOrder: 'asc' },
        include: {
          status: { select: { nameEn: true, nameAr: true, score: true } },
          images: { orderBy: { sortOrder: 'asc' }, select: { id: true } }
        }
      }
    }
  });

  // Overall score (same as general).
  const overall = overallScore(
    assigned.map((a) => criteriaScore(a.measures.map((m) => ({ score: m.status ? m.status.score : null }))))
  );

  const propertyImg = r.images.find((i: { category?: string }) => (i.category ?? 'property') !== 'kuwaitFinder');
  const kuwaitImg = r.images.find((i: { category?: string }) => i.category === 'kuwaitFinder');

  // Group by floor -> criteria -> measures (only measures with data).
  // Collect the set of floors that actually have filled measures, in a stable order.
  const floorOrder = ['basement', 'ground', 'mezzanine', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
  const floorsPresent = new Set<string>();
  for (const a of assigned) for (const m of a.measures) if (hasData(m)) floorsPresent.add(m.floor);
  const floors = floorOrder.filter((f) => floorsPresent.has(f)).concat(
    [...floorsPresent].filter((f) => !floorOrder.includes(f))
  );

  return (
    <div className="report-root">
      <ReportPrintTrigger />
      <ReportSummary
        r={r}
        locale={locale}
        title={t('report_detailed', locale)}
        overall={overall}
        propertyImgId={propertyImg?.id ?? null}
        kuwaitImgId={kuwaitImg?.id ?? null}
      />

      {/* Detailed breakdown: floor -> criteria -> measures */}
      <section className="report-page report-page-break">
        <header className="report-head">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" className="report-head-logo" />
          <div className="report-head-title">{t('report_detailed', locale)}</div>
        </header>

        {floors.length === 0 ? (
          <p className="muted">{t('report_not_rated', locale)}</p>
        ) : (
          floors.map((floor) => {
            // Criteria that have data on this floor.
            const critOnFloor = assigned
              .map((a) => ({
                name: localName(a.criteria, locale),
                measures: a.measures.filter((m) => m.floor === floor && hasData(m))
              }))
              .filter((c) => c.measures.length > 0);
            if (critOnFloor.length === 0) return null;

            return (
              <div key={floor} className="report-floor">
                <h2 className="report-floor-title">{floorLabel(floor, locale)}</h2>
                {critOnFloor.map((c, ci) => (
                  <div key={ci} className="report-crit">
                    <h3 className="report-crit-title">{c.name}</h3>
                    {c.measures.map((m) => (
                      <div key={m.id} className="report-measure">
                        <div className="report-measure-head">
                          <span className="report-measure-name">{localName(m, locale)}</span>
                          {m.status && (
                            <span className="report-measure-status">
                              <StarRating score={m.status.score} size={15} />
                              <span className="report-measure-status-name">{localName(m.status, locale)}</span>
                            </span>
                          )}
                        </div>
                        {m.notes && m.notes.trim() && (
                          <div className="report-measure-row">
                            <span className="report-measure-label">{t('m_notes', locale)}:</span> {m.notes}
                          </div>
                        )}
                        {m.recommendations && m.recommendations.trim() && (
                          <div className="report-measure-row">
                            <span className="report-measure-label">{t('m_recommendations', locale)}:</span> {m.recommendations}
                          </div>
                        )}
                        {m.images.length > 0 && (
                          <div className="report-measure-imgs">
                            {m.images.map((img) => (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img key={img.id} src={`/api/measure-image/${img.id}`} alt="" />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}
