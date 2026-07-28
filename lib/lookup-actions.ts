'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireSuperAdmin } from '@/lib/auth';
import { getString, getInt } from '@/lib/utils';

/**
 * The five request option lists all share the same shape, so one set of
 * actions serves them via a `kind` discriminator. Areas and governorates have
 * their own actions below because they carry a relation.
 */
export type LookupKind =
  | 'purpose'
  | 'status'
  | 'exterior'
  | 'elevator'
  | 'ac'
  | 'measureStatus';

const KIND_TO_MODEL = {
  purpose: 'purposeOption',
  status: 'statusOption',
  exterior: 'exteriorOption',
  elevator: 'elevatorOption',
  ac: 'acOption',
  measureStatus: 'measureStatusOption'
} as const;

function modelFor(kind: LookupKind) {
  const key = KIND_TO_MODEL[kind];
  // Each maps to a delegate with an identical surface.
  return prisma[key] as {
    create(a: unknown): Promise<unknown>;
    update(a: unknown): Promise<unknown>;
    delete(a: unknown): Promise<unknown>;
    count(a?: unknown): Promise<number>;
  };
}

function isKind(v: string): v is LookupKind {
  return (
    v === 'purpose' ||
    v === 'status' ||
    v === 'exterior' ||
    v === 'elevator' ||
    v === 'ac' ||
    v === 'measureStatus'
  );
}

const optionSchema = z.object({
  nameEn: z.string().trim().min(1).max(100),
  nameAr: z.string().trim().min(1).max(100),
  displayOrder: z.number().int().min(0).max(9999)
});

/** Constrain a measure-status score to the allowed 0–3 range. */
function clampScore(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(3, Math.trunc(n)));
}

async function audit(actorUserId: string, action: string, entityType: string, entityId: string, entityName?: string) {
  await prisma.auditLog.create({ data: { actorUserId, action, entityType, entityId, entityName } });
}

export async function createOption(formData: FormData) {
  const user = await requireSuperAdmin();
  const kind = getString(formData, 'kind');
  if (!isKind(kind)) return;

  const parsed = optionSchema.safeParse({
    nameEn: getString(formData, 'nameEn'),
    nameAr: getString(formData, 'nameAr'),
    displayOrder: getInt(formData, 'displayOrder') ?? 0
  });
  if (!parsed.success) return;

  // Measure status carries a 0–3 score; other lookups don't have this column.
  const data =
    kind === 'measureStatus'
      ? { ...parsed.data, score: clampScore(getInt(formData, 'score') ?? 0) }
      : parsed.data;

  await modelFor(kind).create({ data });
  await audit(user.id, 'CREATE', `Lookup:${kind}`, 'new', parsed.data.nameEn);
  revalidatePath('/lookups');
  revalidatePath('/measure-lookups');
}

export async function updateOption(formData: FormData) {
  const user = await requireSuperAdmin();
  const kind = getString(formData, 'kind');
  const id = getString(formData, 'id');
  if (!isKind(kind) || !id) return;

  const parsed = optionSchema
    .extend({ isActive: z.boolean() })
    .safeParse({
      nameEn: getString(formData, 'nameEn'),
      nameAr: getString(formData, 'nameAr'),
      displayOrder: getInt(formData, 'displayOrder') ?? 0,
      isActive: getString(formData, 'isActive') === 'on'
    });
  if (!parsed.success) return;

  const data =
    kind === 'measureStatus'
      ? { ...parsed.data, score: clampScore(getInt(formData, 'score') ?? 0) }
      : parsed.data;

  await modelFor(kind).update({ where: { id }, data });
  await audit(user.id, 'UPDATE', `Lookup:${kind}`, id, parsed.data.nameEn);
  revalidatePath('/lookups');
  revalidatePath('/measure-lookups');
}

export async function deleteOption(formData: FormData) {
  const user = await requireSuperAdmin();
  const kind = getString(formData, 'kind');
  const id = getString(formData, 'id');
  if (!isKind(kind) || !id) return;

  // Determine whether the option is in use. Measure status is referenced by
  // RequestMeasure; the other lookups are referenced by InspectionRequest.
  let inUse = 0;
  if (kind === 'measureStatus') {
    inUse = await prisma.requestMeasure.count({ where: { statusId: id } });
  } else {
    const relationField = `${kind}Id`;
    inUse = await prisma.inspectionRequest.count({
      where: { [relationField]: id } as Record<string, string>
    });
  }

  if (inUse > 0) {
    // Deactivate rather than delete to preserve referential integrity.
    await modelFor(kind).update({ where: { id }, data: { isActive: false } });
    await audit(user.id, 'DEACTIVATE', `Lookup:${kind}`, id);
  } else {
    await modelFor(kind).delete({ where: { id } });
    await audit(user.id, 'DELETE', `Lookup:${kind}`, id);
  }
  revalidatePath('/lookups');
  revalidatePath('/measure-lookups');
}

// ------------------------------------------------------------- governorates
const govSchema = z.object({
  nameEn: z.string().trim().min(1).max(100),
  nameAr: z.string().trim().min(1).max(100),
  displayOrder: z.number().int().min(0).max(9999)
});

export async function createGovernorate(formData: FormData) {
  const user = await requireSuperAdmin();
  const parsed = govSchema.safeParse({
    nameEn: getString(formData, 'nameEn'),
    nameAr: getString(formData, 'nameAr'),
    displayOrder: getInt(formData, 'displayOrder') ?? 0
  });
  if (!parsed.success) return;
  const gov = await prisma.governorate.create({ data: parsed.data });
  await audit(user.id, 'CREATE', 'Governorate', gov.id, parsed.data.nameEn);
  revalidatePath('/lookups');
}

export async function updateGovernorate(formData: FormData) {
  const user = await requireSuperAdmin();
  const id = getString(formData, 'id');
  if (!id) return;
  const parsed = govSchema.extend({ isActive: z.boolean() }).safeParse({
    nameEn: getString(formData, 'nameEn'),
    nameAr: getString(formData, 'nameAr'),
    displayOrder: getInt(formData, 'displayOrder') ?? 0,
    isActive: getString(formData, 'isActive') === 'on'
  });
  if (!parsed.success) return;
  await prisma.governorate.update({ where: { id }, data: parsed.data });
  await audit(user.id, 'UPDATE', 'Governorate', id, parsed.data.nameEn);
  revalidatePath('/lookups');
}

export async function deleteGovernorate(formData: FormData) {
  const user = await requireSuperAdmin();
  const id = getString(formData, 'id');
  if (!id) return;
  const areaCount = await prisma.area.count({ where: { governorateId: id } });
  if (areaCount > 0) {
    await prisma.governorate.update({ where: { id }, data: { isActive: false } });
    await audit(user.id, 'DEACTIVATE', 'Governorate', id);
  } else {
    await prisma.governorate.delete({ where: { id } });
    await audit(user.id, 'DELETE', 'Governorate', id);
  }
  revalidatePath('/lookups');
}

// -------------------------------------------------------------------- areas
const areaSchema = z.object({
  nameEn: z.string().trim().min(1).max(100),
  nameAr: z.string().trim().min(1).max(100),
  governorateId: z.string().min(1),
  displayOrder: z.number().int().min(0).max(9999)
});

export async function createArea(formData: FormData) {
  const user = await requireSuperAdmin();
  const parsed = areaSchema.safeParse({
    nameEn: getString(formData, 'nameEn'),
    nameAr: getString(formData, 'nameAr'),
    governorateId: getString(formData, 'governorateId'),
    displayOrder: getInt(formData, 'displayOrder') ?? 0
  });
  if (!parsed.success) return;
  const area = await prisma.area.create({ data: parsed.data });
  await audit(user.id, 'CREATE', 'Area', area.id, parsed.data.nameEn);
  revalidatePath('/lookups');
}

export async function updateArea(formData: FormData) {
  const user = await requireSuperAdmin();
  const id = getString(formData, 'id');
  if (!id) return;
  const parsed = areaSchema.extend({ isActive: z.boolean() }).safeParse({
    nameEn: getString(formData, 'nameEn'),
    nameAr: getString(formData, 'nameAr'),
    governorateId: getString(formData, 'governorateId'),
    displayOrder: getInt(formData, 'displayOrder') ?? 0,
    isActive: getString(formData, 'isActive') === 'on'
  });
  if (!parsed.success) return;
  await prisma.area.update({ where: { id }, data: parsed.data });
  await audit(user.id, 'UPDATE', 'Area', id, parsed.data.nameEn);
  revalidatePath('/lookups');
}

export async function deleteArea(formData: FormData) {
  const user = await requireSuperAdmin();
  const id = getString(formData, 'id');
  if (!id) return;
  const inUse = await prisma.inspectionRequest.count({ where: { areaId: id } });
  if (inUse > 0) {
    await prisma.area.update({ where: { id }, data: { isActive: false } });
    await audit(user.id, 'DEACTIVATE', 'Area', id);
  } else {
    await prisma.area.delete({ where: { id } });
    await audit(user.id, 'DELETE', 'Area', id);
  }
  revalidatePath('/lookups');
}
