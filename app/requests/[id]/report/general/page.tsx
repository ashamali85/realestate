import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { getLocale } from '@/lib/locale';
import { prisma } from '@/lib/db';
import { loadLabelOverrides } from '@/lib/label-overrides';
import { t, localName } from '@/lib/i18n';
import { formatDate } from '@/lib/utils';
import { criteriaScore, overallScore } from '@/lib/scoring';
import { StarRating } from '@/components/StarRating';
import { ReportPrintTrigger } from '@/components/ReportPrintTrigger';

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

  // Compute overall score from criteria.
  const assigned = await prisma.requestCriteria.findMany({
    where: { requestId: id },
    include: {
      measures: { include: { status: { select: { score: true } } } }
    }
  });
  const critScores = assigned.map((a: (typeof assigned)[number]) =>
    criteriaScore(a.measures.map((m: { status: { score: number } | null }) => ({ score: m.status ? m.status.score : null })))
  );
  const overall = overallScore(critScores);

  const propertyImg = r.images.find((i: { category?: string }) => (i.category ?? 'property') !== 'kuwaitFinder');
  const kuwaitImg = r.images.find((i: { category?: string }) => i.category === 'kuwaitFinder');

  // Each row: [label, value, isLtr]. isLtr marks values whose characters read
  // left-to-right (codes, numbers, email, dates) so they display correctly even
  // in the RTL Arabic view — while still aligning to the page side.
  const rows: Array<[string, string, boolean]> = [
    [t('report_ref', locale), r.reference, true],
    [t('f_client_name', locale), r.clientName, false],
    [t('f_client_phone', locale), r.clientPhone, true],
    [t('f_client_email', locale), r.clientEmail || '—', true],
    [t('f_governorate', locale), localName(r.area.governorate, locale), false],
    [t('f_area', locale), localName(r.area, locale), false],
    [t('f_block', locale), r.block, true],
    [t('f_street', locale), r.street, true],
    [t('f_house', locale), r.houseNumber, true],
    [t('f_purpose', locale), localName(r.purpose, locale), false],
    [t('f_status', locale), localName(r.status, locale), false],
    [t('inspection_date', locale), formatDate(r.inspectionDate, locale), true]
  ];

  return (
    <div className="report-root">
      <ReportPrintTrigger />

      {/* Cover page */}
      <section className="report-cover">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-transparent.png" alt={t('app_name', locale)} className="report-cover-logo" />
        <div className="report-cover-title">{t('report_general', locale)}</div>
        <div className="report-cover-ref" dir="ltr">{r.reference}</div>
        <div className="report-cover-date" dir="ltr">{formatDate(r.inspectionDate, locale)}</div>
      </section>

      {/* Content page — single page */}
      <section className="report-page">
        <header className="report-head">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" className="report-head-logo" />
          <div className="report-head-title">{t('report_general', locale)}</div>
        </header>

        <h2 className="report-section-title">{t('report_client_info', locale)}</h2>
        <table className="report-table">
          <tbody>
            {rows.map(([label, value, isLtr]) => (
              <tr key={label}>
                <th>{label}</th>
                <td>{isLtr ? <span dir="ltr" style={{ unicodeBidi: 'embed' }}>{value}</span> : value}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="report-images">
          <figure className="report-figure">
            <figcaption>{t('report_property_image', locale)}</figcaption>
            {propertyImg ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/api/request-image/${propertyImg.id}`} alt="" />
            ) : (
              <div className="report-noimg">{t('report_no_image', locale)}</div>
            )}
          </figure>
          <figure className="report-figure">
            <figcaption>{t('report_kuwait_finder', locale)}</figcaption>
            {kuwaitImg ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/api/request-image/${kuwaitImg.id}`} alt="" />
            ) : (
              <div className="report-noimg">{t('report_no_image', locale)}</div>
            )}
          </figure>
        </div>

        <div className="report-rating">
          <div className="report-rating-label">{t('report_overall_rating', locale)}</div>
          {overall === null ? (
            <div className="report-rating-none">{t('report_not_rated', locale)}</div>
          ) : (
            <div className="report-rating-stars">
              <StarRating score={overall} size={34} showNumber />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
