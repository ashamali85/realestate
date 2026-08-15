import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { getLocale } from '@/lib/locale';
import { prisma } from '@/lib/db';
import { loadFormLookups } from '@/lib/lookups';
import { t, localName } from '@/lib/i18n';
import { loadLabelOverrides } from '@/lib/label-overrides';
import { criteriaScore } from '@/lib/scoring';
import { floorsFor } from '@/lib/floors';
import { TopBar } from '@/components/TopBar';
import { RequestForm } from '@/components/RequestForm';
import { RequestEvaluation } from '@/components/RequestEvaluation';

export const dynamic = 'force-dynamic';

export default async function EditRequestPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  await loadLabelOverrides();
  const locale = await getLocale();
  const { id } = await params;

  const [r, lookups] = await Promise.all([
    prisma.inspectionRequest.findUnique({
      where: { id },
      include: { images: { orderBy: { sortOrder: 'asc' }, select: { id: true, category: true } } }
    }),
    loadFormLookups()
  ]);

  if (!r) notFound();

  // Floors that already have filled-in measure data (status, notes,
  // recommendations, or images). Used to warn before removing such a floor.
  const filledMeasures = await prisma.requestMeasure.findMany({
    where: {
      requestCriteria: { requestId: id },
      OR: [
        { statusId: { not: null } },
        { notes: { not: null } },
        { recommendations: { not: null } },
        { images: { some: {} } }
      ]
    },
    select: { floor: true }
  });
  const filledFloors = Array.from(new Set(filledMeasures.map((m) => m.floor)));

  // Evaluation data (same as the view page) so criteria/measures can be managed
  // from the edit page too.
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
    score: criteriaScore(a.measures.map((m) => ({ score: m.statusId && m.status ? m.status.score : null }))),
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
            filledFloors={filledFloors}
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
              hasBasement: r.hasBasement,
              hasMezzanine: r.hasMezzanine,
              inspectionDate: r.inspectionDate,
              landArea: r.landArea,
              constructionPct: r.constructionPct,
              constructionArea: r.constructionArea,
              notes: r.notes,
              images: r.images
            }}
          />
        </div>

        <section className="card card-pad-lg" style={{ marginTop: 24 }}>
          <h2 style={{ marginBottom: 4 }}>{t('sec_evaluation', locale)}</h2>
          <p className="muted small" style={{ marginBottom: 16 }}>{t('criteria_intro', locale)}</p>
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
