import { prisma } from '@/lib/db';

/** All five request lookups plus areas/governorates, loaded for the form. */
export async function loadFormLookups() {
  const [purposes, statuses, exteriors, elevators, acs, governorates, areas] =
    await Promise.all([
      prisma.purposeOption.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } }),
      prisma.statusOption.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } }),
      prisma.exteriorOption.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } }),
      prisma.elevatorOption.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } }),
      prisma.acOption.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } }),
      prisma.governorate.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } }),
      prisma.area.findMany({
        where: { isActive: true },
        orderBy: { nameEn: 'asc' },
        select: { id: true, nameEn: true, nameAr: true, governorateId: true }
      })
    ]);
  return { purposes, statuses, exteriors, elevators, acs, governorates, areas };
}

export type FormLookups = Awaited<ReturnType<typeof loadFormLookups>>;
