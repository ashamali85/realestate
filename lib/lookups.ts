import { prisma } from '@/lib/db';

export type LookupOption = {
  id: string;
  nameEn: string;
  nameAr: string;
  displayOrder: number;
  isActive: boolean;
};

export type AreaOption = {
  id: string;
  nameEn: string;
  nameAr: string;
  governorateId: string;
};

export type FormLookups = {
  purposes: LookupOption[];
  statuses: LookupOption[];
  exteriors: LookupOption[];
  elevators: LookupOption[];
  acs: LookupOption[];
  governorates: LookupOption[];
  areas: AreaOption[];
};

/**
 * All five request lookups plus areas/governorates, loaded for the form.
 * The explicit return type keeps callers correctly typed regardless of whether
 * the generated Prisma client is present at type-check time.
 */
export async function loadFormLookups(): Promise<FormLookups> {
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
