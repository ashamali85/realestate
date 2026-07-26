import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { getLocale } from '@/lib/locale';
import { prisma } from '@/lib/db';
import { t, localName } from '@/lib/i18n';
import { formatDate } from '@/lib/utils';
import { deleteRequest } from '@/lib/actions';
import { TopBar } from '@/components/TopBar';

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
            {canDelete && (
              <form action={deleteRequest}>
                <input type="hidden" name="id" value={r.id} />
                <button type="submit" className="btn btn-danger btn-sm">
                  {t('btn_delete', locale)}
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="card card-pad-lg stack" style={{ gap: 24 }}>
          <section>
            <h3 style={{ color: 'var(--brand)', marginBottom: 12 }}>{t('sec_address', locale)}</h3>
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
          </section>

          <section>
            <h3 style={{ color: 'var(--brand)', marginBottom: 12 }}>{t('sec_client', locale)}</h3>
            <div className="detail-grid">
              {item('f_client_name', r.clientName)}
              {item('f_client_phone', <span dir="ltr">{r.clientPhone}</span>)}
              {item('f_client_email', r.clientEmail ? <span dir="ltr">{r.clientEmail}</span> : '—')}
            </div>
          </section>

          <section>
            <h3 style={{ color: 'var(--brand)', marginBottom: 12 }}>{t('sec_property', locale)}</h3>
            <div className="detail-grid">
              {item('f_purpose', localName(r.purpose, locale))}
              {item('f_status', localName(r.status, locale))}
              {item('f_years', r.yearsOld)}
              {item('f_floors', r.floors)}
              {item('f_exterior', localName(r.exterior, locale))}
              {item('f_elevator', localName(r.elevator, locale))}
              {item('f_ac', localName(r.ac, locale))}
            </div>
          </section>

          {r.images.length > 0 && (
            <section>
              <h3 style={{ color: 'var(--brand)', marginBottom: 12 }}>{t('sec_images', locale)}</h3>
              <div className="thumb-grid">
                {r.images.map((img) => (
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
            </section>
          )}

          {r.notes && (
            <section>
              <h3 style={{ color: 'var(--brand)', marginBottom: 12 }}>{t('sec_notes', locale)}</h3>
              <p>{r.notes}</p>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
