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

  // Pad the shorter table with blank rows so both tables have the same number
  // of rows and their bottom borders line up exactly.
  const propertyImg = r.images.find((i: { category?: string }) => (i.category ?? 'property') !== 'kuwaitFinder');
  const kuwaitImg = r.images.find((i: { category?: string }) => i.category === 'kuwaitFinder');

  const yn = (v: boolean) => (v ? t('yes', locale) : t('no', locale));
  const dash = (v: number | null, suffix = '') => (v != null ? `${v}${suffix}` : '—');

  // Client & location info.
  const clientRows: Array<[string, string, boolean]> = [
    [t('report_ref', locale), r.reference, true],
    [t('f_client_name', locale), r.clientName, false],
    [t('f_client_phone', locale), r.clientPhone, true],
    [t('f_client_email', locale), r.clientEmail || '—', true],
    [t('f_governorate', locale), localName(r.area.governorate, locale), false],
    [t('f_area', locale), localName(r.area, locale), false],
    [t('f_block', locale), r.block, true],
    [t('f_street', locale), r.street, true],
    [t('f_house', locale), r.houseNumber, true],
    [t('inspection_date', locale), formatDate(r.inspectionDate, locale), true]
  ];

  // Property specifications.
  const propertyRows: Array<[string, string, boolean]> = [
    [t('f_purpose', locale), localName(r.purpose, locale), false],
    [t('f_status', locale), localName(r.status, locale), false],
    [t('f_exterior', locale), localName(r.exterior, locale), false],
    [t('f_elevator', locale), localName(r.elevator, locale), false],
    [t('f_ac', locale), localName(r.ac, locale), false],
    [t('f_years', locale), String(r.yearsOld), true],
    [t('f_floors', locale), String(r.floors), true],
    [t('f_has_basement', locale), yn(r.hasBasement), false],
    [t('f_has_mezzanine', locale), yn(r.hasMezzanine), false],
    [t('land_area', locale), dash(r.landArea), true],
    [t('construction_pct', locale), dash(r.constructionPct, '%'), true],
    [t('construction_area', locale), dash(r.constructionArea), true]
  ];

  // Pad the shorter table with blank rows so both tables have the same row count
  // and their bottom borders line up exactly.
  const maxRows = Math.max(clientRows.length, propertyRows.length);
  const padRows = (arr: Array<[string, string, boolean]>): Array<[string, string, boolean]> => {
    const out = arr.slice();
    let i = 0;
    while (out.length < maxRows) out.push([`__pad_${i++}`, '', false]);
    return out;
  };
  const clientRowsP = padRows(clientRows);
  const propertyRowsP = padRows(propertyRows);

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

        <div className="report-tables">
          <div className="report-table-col">
            <h2 className="report-section-title">{t('report_client_info', locale)}</h2>
            <table className="report-table">
              <tbody>
                {clientRowsP.map(([label, value, isLtr]) => {
                  const isPad = label.startsWith('__pad_');
                  return (
                    <tr key={label}>
                      <th className={isPad ? 'report-pad' : undefined}>{isPad ? '\u00A0' : label}</th>
                      <td>{isPad ? '\u00A0' : isLtr ? <span dir="ltr" style={{ unicodeBidi: 'embed' }}>{value}</span> : value}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="report-table-col">
            <h2 className="report-section-title">{t('report_property_info', locale)}</h2>
            <table className="report-table">
              <tbody>
                {propertyRowsP.map(([label, value, isLtr]) => {
                  const isPad = label.startsWith('__pad_');
                  return (
                    <tr key={label}>
                      <th className={isPad ? 'report-pad' : undefined}>{isPad ? '\u00A0' : label}</th>
                      <td>{isPad ? '\u00A0' : isLtr ? <span dir="ltr" style={{ unicodeBidi: 'embed' }}>{value}</span> : value}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

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
