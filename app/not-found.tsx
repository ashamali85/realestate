import Link from 'next/link';
import { getLocale } from '@/lib/locale';
import { t } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export default async function NotFound() {
  const locale = await getLocale();
  return (
    <main className="container mt-6" style={{ paddingBottom: 60 }}>
      <div className="card card-pad-lg" style={{ textAlign: 'center' }}>
        <h1 style={{ marginBottom: 10 }}>404</h1>
        <p className="muted" style={{ marginBottom: 20 }}>{t('not_found', locale)}</p>
        <Link href="/requests" className="btn btn-primary">
          {t('requests_title', locale)}
        </Link>
      </div>
    </main>
  );
}
