import { localName, t, type Locale } from '@/lib/i18n';
import { formatDate } from '@/lib/utils';
import { StarRating } from '@/components/StarRating';

type Row = [string, string, boolean];

export type SummaryData = {
  reference: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string | null;
  block: string;
  street: string;
  houseNumber: string;
  yearsOld: number;
  floors: number;
  hasBasement: boolean;
  hasMezzanine: boolean;
  inspectionDate: Date;
  landArea: number | null;
  constructionPct: number | null;
  constructionArea: number | null;
  area: { nameEn: string; nameAr: string; governorate: { nameEn: string; nameAr: string } };
  purpose: { nameEn: string; nameAr: string };
  status: { nameEn: string; nameAr: string };
  exterior: { nameEn: string; nameAr: string };
  elevator: { nameEn: string; nameAr: string };
  ac: { nameEn: string; nameAr: string };
};

/**
 * Renders the report cover page and the page-1 summary (client + property info
 * tables, the two images, and the overall rating). Shared by the General and
 * Detailed reports so page 1 is identical.
 */
export function ReportSummary({
  r,
  locale,
  title,
  overall,
  propertyImgId,
  kuwaitImgId
}: {
  r: SummaryData;
  locale: Locale;
  title: string;
  overall: number | null;
  propertyImgId: string | null;
  kuwaitImgId: string | null;
}) {
  const yn = (v: boolean) => (v ? t('yes', locale) : t('no', locale));
  const dash = (v: number | null, suffix = '') => (v != null ? `${v}${suffix}` : '—');

  const clientRows: Row[] = [
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
  const propertyRows: Row[] = [
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

  const maxRows = Math.max(clientRows.length, propertyRows.length);
  const pad = (arr: Row[]): Row[] => {
    const out = arr.slice();
    let i = 0;
    while (out.length < maxRows) out.push([`__pad_${i++}`, '', false]);
    return out;
  };
  const renderTable = (rows: Row[], heading: string) => (
    <div className="report-table-col">
      <h2 className="report-section-title">{heading}</h2>
      <table className="report-table">
        <tbody>
          {pad(rows).map(([label, value, isLtr]) => {
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
  );

  return (
    <>
      {/* Cover page */}
      <section className="report-cover">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-transparent.png" alt={t('app_name', locale)} className="report-cover-logo" />
        <div className="report-cover-title">{title}</div>
        <div className="report-cover-ref" dir="ltr">{r.reference}</div>
        <div className="report-cover-date" dir="ltr">{formatDate(r.inspectionDate, locale)}</div>
      </section>

      {/* Summary page */}
      <section className="report-page report-summary-page">
        <header className="report-head">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" className="report-head-logo" />
          <div className="report-head-title">{title}</div>
        </header>

        <div className="report-tables">
          {renderTable(clientRows, t('report_client_info', locale))}
          {renderTable(propertyRows, t('report_property_info', locale))}
        </div>

        <div className="report-images">
          <figure className="report-figure">
            <figcaption>{t('report_property_image', locale)}</figcaption>
            {propertyImgId ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/api/request-image/${propertyImgId}`} alt="" />
            ) : (
              <div className="report-noimg">{t('report_no_image', locale)}</div>
            )}
          </figure>
          <figure className="report-figure">
            <figcaption>{t('report_kuwait_finder', locale)}</figcaption>
            {kuwaitImgId ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/api/request-image/${kuwaitImgId}`} alt="" />
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
    </>
  );
}
