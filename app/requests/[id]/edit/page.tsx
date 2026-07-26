import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { getLocale } from '@/lib/locale';
import { prisma } from '@/lib/db';
import { loadFormLookups } from '@/lib/lookups';
import { t } from '@/lib/i18n';
import { TopBar } from '@/components/TopBar';
import { RequestForm } from '@/components/RequestForm';

export const dynamic = 'force-dynamic';

export default async function EditRequestPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const locale = await getLocale();
  const { id } = await params;

  const [r, lookups] = await Promise.all([
    prisma.inspectionRequest.findUnique({
      where: { id },
      include: { images: { orderBy: { sortOrder: 'asc' }, select: { id: true } } }
    }),
    loadFormLookups()
  ]);

  if (!r) notFound();

  return (
    <>
      <TopBar user={user} locale={locale} active="requests" />
      <main className="container mt-6" style={{ paddingBottom: 60 }}>
        <h1 style={{ marginBottom: 20 }}>
          {t('form_edit_title', locale)} · <span className="mono">{r.reference}</span>
        </h1>
        <div className="card card-pad-lg">
          <RequestForm
            locale={locale}
            lookups={lookups}
            existing={{
              id: r.id,
              areaId: r.areaId,
              block: r.block,
              street: r.street,
              houseNumber: r.houseNumber,
              latitude: r.latitude,
              longitude: r.longitude,
              clientName: r.clientName,
              clientPhone: r.clientPhone,
              clientEmail: r.clientEmail,
              purposeId: r.purposeId,
              statusId: r.statusId,
              exteriorId: r.exteriorId,
              elevatorId: r.elevatorId,
              acId: r.acId,
              yearsOld: r.yearsOld,
              floors: r.floors,
              notes: r.notes,
              images: r.images
            }}
          />
        </div>
      </main>
    </>
  );
}
