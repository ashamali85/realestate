import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { getLocale } from '@/lib/locale';
import { prisma } from '@/lib/db';
import { t, localName } from '@/lib/i18n';
import { formatDate } from '@/lib/utils';
import { TopBar } from '@/components/TopBar';

export const dynamic = 'force-dynamic';

export default async function RequestsPage() {
  const user = await requireUser();
  const locale = await getLocale();

  const requests = await prisma.inspectionRequest.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      area: { include: { governorate: true } }
    },
    take: 200
  });

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

        {requests.length === 0 ? (
          <div className="card empty">
            <div className="empty-icon">🏠</div>
            <p>{t('requests_empty', locale)}</p>
            <Link href="/requests/new" className="btn btn-primary mt-4">
              {t('nav_new_request', locale)}
            </Link>
          </div>
        ) : (
          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>{t('col_reference', locale)}</th>
                  <th>{t('col_client', locale)}</th>
                  <th>{t('col_area', locale)}</th>
                  <th>{t('col_governorate', locale)}</th>
                  <th>{t('col_created', locale)}</th>
                  <th>{t('col_actions', locale)}</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td className="mono">{r.reference}</td>
                    <td>{r.clientName}</td>
                    <td>{localName(r.area, locale)}</td>
                    <td>{localName(r.area.governorate, locale)}</td>
                    <td className="small muted">{formatDate(r.createdAt, locale)}</td>
                    <td>
                      <Link href={`/requests/${r.id}`} className="btn btn-ghost btn-sm">
                        {t('btn_view', locale)}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
