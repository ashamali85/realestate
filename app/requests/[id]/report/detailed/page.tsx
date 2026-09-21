import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { getLocale } from '@/lib/locale';
import { prisma } from '@/lib/db';
import { loadLabelOverrides } from '@/lib/label-overrides';
import { t, localName } from '@/lib/i18n';
import { criteriaScore, overallScore, scoreLabelKey } from '@/lib/scoring';
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

  // Group by criteria -> floor -> measures (only measures with data).
  const floorOrder = ['building', 'basement', 'ground', 'mezzanine', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
  function orderFloors(keys: string[]): string[] {
    return floorOrder.filter((f) => keys.includes(f)).concat(keys.filter((f) => !floorOrder.includes(f)));
  }

  // Build the criteria list, each with its floors (that have filled measures)
  // and the measures grouped under each floor. Criteria with no data anywhere
  // are dropped.
  const criteriaGroups = assigned
    .map((a) => {
      const withData = a.measures.filter((m) => hasData(m));
      const floorKeys = orderFloors([...new Set(withData.map((m) => m.floor))]);
      const floors = floorKeys
        .map((floor) => {
          const floorMeasures = withData.filter((m) => m.floor === floor);
          return {
            floor,
            measures: floorMeasures,
            // Floor score = average of this floor's rated measures.
            score: criteriaScore(floorMeasures.map((m) => ({ score: m.status ? m.status.score : null })))
          };
        })
        .filter((f) => f.measures.length > 0);
      return {
        name: localName(a.criteria, locale),
        floors,
        count: withData.length,
        // Criteria score = average of ALL its rated measures across every floor.
        score: criteriaScore(withData.map((m) => ({ score: m.status ? m.status.score : null })))
      };
    })
    .filter((c) => c.count > 0);

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

      {/* Detailed breakdown: criteria -> floor -> measures */}
      <section className="report-page report-page-break">
        <header className="report-head">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" className="report-head-logo" />
          <div className="report-head-title">{t('report_detailed', locale)}</div>
        </header>

        {criteriaGroups.length === 0 ? (
          <p className="muted">{t('report_not_rated', locale)}</p>
        ) : (
          criteriaGroups.map((c, ci) => (
            <div key={ci} className="report-floor">
              <h2 className="report-floor-title report-head-score">
                <span>{c.name}</span>
                <span className="report-head-score-val">
                  {scoreLabelKey(c.score) && (
                    <span className="report-head-score-name">{t(scoreLabelKey(c.score)!, locale)}</span>
                  )}
                  <StarRating score={c.score} size={15} />
                </span>
              </h2>
              {c.floors.map((fl) => (
                <div key={fl.floor} className="report-crit">
                  <h3 className="report-crit-title report-head-score">
                    <span>{floorLabel(fl.floor, locale)}</span>
                    <span className="report-head-score-val">
                      {scoreLabelKey(fl.score) && (
                        <span className="report-head-score-name">{t(scoreLabelKey(fl.score)!, locale)}</span>
                      )}
                      <StarRating score={fl.score} size={15} />
                    </span>
                  </h3>
                  {fl.measures.map((m) => (
                    <div key={m.id} className="report-measure">
                      <div className="report-measure-head">
                        <span className="report-measure-name">{localName(m, locale)}</span>
                        {m.status && (
                          <span className="report-measure-status">
                            <span className="report-measure-status-name">{localName(m.status, locale)}</span>
                            <StarRating score={m.status.score} size={15} />
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
                            <img key={img.id} src={`/api/measure-image/${img.id}`} alt="" loading="eager" decoding="sync" />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))
        )}
      </section>
    </div>
  );
}
