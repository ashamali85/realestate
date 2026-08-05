import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { getLocale } from '@/lib/locale';
import { prisma } from '@/lib/db';
import { t, localName } from '@/lib/i18n';
import { formatDate } from '@/lib/utils';
import { TopBar } from '@/components/TopBar';
import { DeleteRequestButton } from '@/components/DeleteRequestButton';
import { IconPencil } from '@/components/Icons';
import { RequestEvaluation } from '@/components/RequestEvaluation';
import { StarRating } from '@/components/StarRating';
import { CollapsibleSection } from '@/components/CollapsibleSection';
import { criteriaScore, overallScore } from '@/lib/scoring';
import { floorsFor } from '@/lib/floors';

export const dynamic = 'force-dynamic';

export default async function RequestDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const locale = await getLocale();
  const { id } = await params;

  const r = await prisma.inspectionRequest.findUnique({
    where: { id },
    include: {
      area: { include: { governorate: true } },
      purpose: true,
      status: true,
      exterior: true,
      elevator: true,
      ac: true,
      images: { orderBy: { sortOrder: 'asc' }, select: { id: true } },
      createdBy: { select: { name: true } }
    }
  });

  if (!r) notFound();

  // Evaluation data: assigned criteria (with filled measures + images),
  // the criteria still available to assign, and status options for the pickers.
  const [assignedRaw, allCriteria, statuses] = await Promise.all([
    prisma.requestCriteria.findMany({
      where: { requestId: id },
      include: {
        criteria: true,
        measures: {
          orderBy: { displayOrder: 'asc' },
          include: {
            images: { orderBy: { sortOrder: 'asc' }, select: { id: true } },
            status: { select: { score: true } }
          }
        }
      }
    }),
    prisma.criteria.findMany({ where: { isActive: true }, orderBy: { nameEn: 'asc' } }),
    prisma.measureStatusOption.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } })
  ]);

  const assignedIds = new Set(assignedRaw.map((a: (typeof assignedRaw)[number]) => a.criteriaId));
  const available = allCriteria
    .filter((c: (typeof allCriteria)[number]) => !assignedIds.has(c.id))
    .map((c: (typeof allCriteria)[number]) => ({ id: c.id, nameEn: c.nameEn, nameAr: c.nameAr }));

  const assigned = assignedRaw.map((a: (typeof assignedRaw)[number]) => ({
    id: a.id,
    criteriaName: localName(a.criteria, locale),
    score: criteriaScore(
      a.measures.map((m) => ({ score: m.statusId && m.status ? m.status.score : null }))
    ),
    measures: a.measures.map((m) => ({
      id: m.id,
      floor: m.floor,
      nameEn: m.nameEn,
      nameAr: m.nameAr,
      statusId: m.statusId,
      score: m.statusId && m.status ? m.status.score : null,
      notes: m.notes,
      recommendations: m.recommendations,
      images: m.images.map((img) => ({ id: img.id }))
    }))
  }));

  const floorTabs = floorsFor(
    { floors: r.floors, hasBasement: r.hasBasement, hasMezzanine: r.hasMezzanine },
    locale
  );

  const overall = overallScore(assigned.map((a: { score: number | null }) => a.score));

  const canDelete = user.role === 'SUPER_ADMIN';
  const mapLink =
    r.latitude != null && r.longitude != null
      ? `https://www.google.com/maps/search/?api=1&query=${r.latitude},${r.longitude}`
      : null;

  const item = (label: string, value: React.ReactNode) => (
    <div className="detail-item">
      <div className="detail-label">{t(label, locale)}</div>
      <div className="detail-value">{value || '—'}</div>
    </div>
  );

  return (
    <>
      <TopBar user={user} locale={locale} active="requests" />
      <main className="container mt-6" style={{ paddingBottom: 60 }}>
        <div className="section-title">
          <div>
            <h1 className="mono">{r.reference}</h1>
            <p className="muted small mt-2">
              {formatDate(r.createdAt, locale)} · {r.createdBy.name}
            </p>
          </div>
          <div className="row">
            <Link href="/requests" className="btn btn-ghost btn-sm">
              {t('requests_title', locale)}
            </Link>
            <Link href={`/requests/${r.id}/edit`} className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <IconPencil /> {t('btn_edit', locale)}
            </Link>
            {canDelete && <DeleteRequestButton id={r.id} locale={locale} />}
          </div>
        </div>

        <div className="stack" style={{ gap: 14 }}>
          <CollapsibleSection title={t('sec_address', locale)}>
            <div className="detail-grid">
              {item('f_governorate', localName(r.area.governorate, locale))}
              {item('f_area', localName(r.area, locale))}
              {item('f_block', r.block)}
              {item('f_street', r.street)}
              {item('f_house', r.houseNumber)}
              {mapLink &&
                item(
                  'sec_location',
                  <a href={mapLink} target="_blank" rel="noopener noreferrer">
                    {r.latitude?.toFixed(5)}, {r.longitude?.toFixed(5)}
                  </a>
                )}
            </div>
          </CollapsibleSection>

          <CollapsibleSection title={t('sec_client', locale)}>
            <div className="detail-grid">
              {item('f_client_name', r.clientName)}
              {item('f_client_phone', <span dir="ltr">{r.clientPhone}</span>)}
              {item('f_client_email', r.clientEmail ? <span dir="ltr">{r.clientEmail}</span> : '—')}
            </div>
          </CollapsibleSection>

          <CollapsibleSection title={t('sec_property', locale)}>
            <div className="detail-grid">
              {item('f_purpose', localName(r.purpose, locale))}
              {item('f_status', localName(r.status, locale))}
              {item('f_years', r.yearsOld)}
              {item('f_floors', r.floors)}
              {item('f_has_basement', r.hasBasement ? t('yes', locale) : t('no', locale))}
              {item('f_has_mezzanine', r.hasMezzanine ? t('yes', locale) : t('no', locale))}
              {item('f_exterior', localName(r.exterior, locale))}
              {item('f_elevator', localName(r.elevator, locale))}
              {item('f_ac', localName(r.ac, locale))}
            </div>
          </CollapsibleSection>

          {r.images.length > 0 && (
            <CollapsibleSection title={t('sec_images', locale)}>
              <div className="thumb-grid">
                {r.images.map((img: { id: string }) => (
                  <a
                    key={img.id}
                    href={`/api/request-image/${img.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="thumb"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/api/request-image/${img.id}`} alt="" loading="lazy" />
                  </a>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {r.notes && (
            <CollapsibleSection title={t('sec_notes', locale)}>
              <p className="detail-value">{r.notes}</p>
            </CollapsibleSection>
          )}
        </div>

        <section className="mt-6">
          <div className="section-title" style={{ marginBottom: 16 }}>
            <h2 style={{ color: 'var(--brand)' }}>{t('sec_criteria', locale)}</h2>
            {overall !== null && (
              <span className="row" style={{ gap: 10 }}>
                <span style={{ color: 'var(--brand)', fontWeight: 800 }}>{t('sec_evaluation', locale)}</span>
                <StarRating score={overall} />
              </span>
            )}
          </div>
          <RequestEvaluation
            requestId={r.id}
            assigned={assigned}
            available={available}
            floorTabs={floorTabs}
            statuses={statuses.map((s: (typeof statuses)[number]) => ({ id: s.id, nameEn: s.nameEn, nameAr: s.nameAr }))}
            locale={locale}
          />
        </section>
      </main>
    </>
  );
}
