import { requireSuperAdmin } from '@/lib/auth';
import { getLocale } from '@/lib/locale';
import { loadLabelOverrides } from '@/lib/label-overrides';
import { TopBar } from '@/components/TopBar';
import { MigrateImagesButton } from '@/components/MigrateImagesButton';
import { countImagesToMigrate } from '@/lib/migrate-actions';

export const dynamic = 'force-dynamic';

export default async function MigrateImagesPage() {
  const me = await requireSuperAdmin();
  await loadLabelOverrides();
  const locale = await getLocale();

  const remaining = await countImagesToMigrate();

  return (
    <>
      <TopBar user={me} locale={locale} active="" />
      <main className="container mt-6" style={{ paddingBottom: 60 }}>
        <h1 style={{ marginBottom: 8 }}>Migrate images to Blob</h1>
        <p className="muted" style={{ maxWidth: 640, marginBottom: 20 }}>
          This moves images that are still stored in the database over to Vercel Blob, then clears them from the
          database to free up storage. It runs in batches — just click Start and keep this tab open until it finishes.
          Safe to run more than once.
        </p>
        <MigrateImagesButton initialRemaining={remaining} />
      </main>
    </>
  );
}
