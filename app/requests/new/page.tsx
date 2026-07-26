import { requireUser } from '@/lib/auth';
import { getLocale } from '@/lib/locale';
import { loadFormLookups } from '@/lib/lookups';
import { t } from '@/lib/i18n';
import { TopBar } from '@/components/TopBar';
import { RequestForm } from '@/components/RequestForm';

export const dynamic = 'force-dynamic';

export default async function NewRequestPage() {
  const user = await requireUser();
  const locale = await getLocale();
  const lookups = await loadFormLookups();

  return (
    <>
      <TopBar user={user} locale={locale} active="new" />
      <main className="container mt-6" style={{ paddingBottom: 60 }}>
        <h1 style={{ marginBottom: 20 }}>{t('form_new_title', locale)}</h1>
        <div className="card card-pad-lg">
          <RequestForm locale={locale} lookups={lookups} />
        </div>
      </main>
    </>
  );
}
