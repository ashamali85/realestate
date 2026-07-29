import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { getLocale } from '@/lib/locale';
import { prisma } from '@/lib/db';
import { t, localName } from '@/lib/i18n';
import { formatDateTime } from '@/lib/utils';
import { TopBar } from '@/components/TopBar';
import { RequestsTable, type RequestRow } from '@/components/RequestsTable';

export const dynamic = 'force-dynamic';

export default async function RequestsPage() {
  const user = await requireUser();
  const locale = await getLocale();

  const requests = await prisma.inspectionRequest.findMany({
    orderBy: { createdAt: 'desc' },
    include: { area: { include: { governorate: true } } },
    take: 500
  });

  const rows: RequestRow[] = requests.map((r) => ({
    id: r.id,
    reference: r.reference,
    clientName: r.clientName,
    clientPhone: r.clientPhone,
    area: localName(r.area, locale),
    governorate: localName(r.area.governorate, locale),
    created: formatDateTime(r.createdAt)
  }));

  const governorates = Array.from(new Set(rows.map((r) => r.governorate))).sort();
  const areas = Array.from(new Set(rows.map((r) => r.area))).sort();

  return (
    <>
      <TopBar user={user} locale={locale} active="requests" />
      <main className="container mt-6" style={{ paddingBottom: 60 }}>
        <div className="section-title">
          <h1>{t('requests_title', locale)}</h1>
          <Link href="/requests/new" className="btn btn-primary btn-sm">
            {t('nav_new_request', locale)}
          </Link>
        </div>

        {rows.length === 0 ? (
          <div className="card empty">
            <div className="empty-icon">🏠</div>
            <p>{t('requests_empty', locale)}</p>
            <Link href="/requests/new" className="btn btn-primary mt-4">
              {t('nav_new_request', locale)}
            </Link>
          </div>
        ) : (
          <RequestsTable rows={rows} locale={locale} governorates={governorates} areas={areas} canDelete={user.role === 'SUPER_ADMIN'} />
        )}
      </main>
    </>
  );
}
