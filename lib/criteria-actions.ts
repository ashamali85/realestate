'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireSuperAdmin, requireUser } from '@/lib/auth';
import { getString, getInt, getOptionalString } from '@/lib/utils';
import { floorKeysFor } from '@/lib/floors';

async function audit(actorUserId: string, action: string, entityType: string, entityId: string, entityName?: string) {
  await prisma.auditLog.create({ data: { actorUserId, action, entityType, entityId, entityName } });
}

// --------------------------------------------------------------- templates
const criteriaSchema = z.object({
  nameEn: z.string().trim().min(1).max(150),
  nameAr: z.string().trim().min(1).max(150)
});

export async function createCriteria(formData: FormData) {
  const user = await requireSuperAdmin();
  const parsed = criteriaSchema.safeParse({
    nameEn: getString(formData, 'nameEn'),
    nameAr: getString(formData, 'nameAr')
  });
  if (!parsed.success) return;
  const c = await prisma.criteria.create({ data: parsed.data });
  await audit(user.id, 'CREATE', 'Criteria', c.id, parsed.data.nameEn);
  revalidatePath('/criteria');
}

export async function updateCriteria(formData: FormData) {
  const user = await requireSuperAdmin();
  const id = getString(formData, 'id');
  if (!id) return;
  const parsed = criteriaSchema.extend({ isActive: z.boolean() }).safeParse({
    nameEn: getString(formData, 'nameEn'),
    nameAr: getString(formData, 'nameAr'),
    isActive: getString(formData, 'isActive') === 'on'
  });
  if (!parsed.success) return;
  await prisma.criteria.update({ where: { id }, data: parsed.data });
  await audit(user.id, 'UPDATE', 'Criteria', id, parsed.data.nameEn);
  revalidatePath('/criteria');
}

export async function deleteCriteria(formData: FormData) {
  const user = await requireSuperAdmin();
  const id = getString(formData, 'id');
  if (!id) return;
  const assignedCount = await prisma.requestCriteria.count({ where: { criteriaId: id } });
  if (assignedCount > 0) {
    // In use by requests — deactivate rather than delete.
    await prisma.criteria.update({ where: { id }, data: { isActive: false } });
    await audit(user.id, 'DEACTIVATE', 'Criteria', id);
  } else {
    await prisma.criteria.delete({ where: { id } });
    await audit(user.id, 'DELETE', 'Criteria', id);
  }
  revalidatePath('/criteria');
}

// ----------------------------------------------------------- measure names
const measureSchema = z.object({
  criteriaId: z.string().min(1),
  nameEn: z.string().trim().min(1).max(200),
  nameAr: z.string().trim().min(1).max(200),
  displayOrder: z.number().int().min(0).max(9999)
});

export async function createMeasure(formData: FormData) {
  const user = await requireSuperAdmin();
  const parsed = measureSchema.safeParse({
    criteriaId: getString(formData, 'criteriaId'),
    nameEn: getString(formData, 'nameEn'),
    nameAr: getString(formData, 'nameAr'),
    displayOrder: getInt(formData, 'displayOrder') ?? 0
  });
  if (!parsed.success) return;
  const m = await prisma.criteriaMeasure.create({ data: parsed.data });
  await audit(user.id, 'CREATE', 'CriteriaMeasure', m.id, parsed.data.nameEn);
  revalidatePath('/criteria');
}

export async function updateMeasure(formData: FormData) {
  const user = await requireSuperAdmin();
  const id = getString(formData, 'id');
  if (!id) return;
  const parsed = z
    .object({
      nameEn: z.string().trim().min(1).max(200),
      nameAr: z.string().trim().min(1).max(200),
      displayOrder: z.number().int().min(0).max(9999)
    })
    .safeParse({
      nameEn: getString(formData, 'nameEn'),
      nameAr: getString(formData, 'nameAr'),
      displayOrder: getInt(formData, 'displayOrder') ?? 0
    });
  if (!parsed.success) return;
  await prisma.criteriaMeasure.update({ where: { id }, data: parsed.data });
  await audit(user.id, 'UPDATE', 'CriteriaMeasure', id, parsed.data.nameEn);
  revalidatePath('/criteria');
}

export async function deleteMeasure(formData: FormData) {
  const user = await requireSuperAdmin();
  const id = getString(formData, 'id');
  if (!id) return;
  await prisma.criteriaMeasure.delete({ where: { id } });
  await audit(user.id, 'DELETE', 'CriteriaMeasure', id);
  revalidatePath('/criteria');
}

// ---------------------------------------------------- assign to a request
/**
 * Assigns a criteria template to a request, snapshotting its current measures
 * into fillable RequestMeasure rows. Idempotent per (request, criteria).
 */
export async function assignCriteria(formData: FormData) {
  const user = await requireUser();
  const requestId = getString(formData, 'requestId');
  const criteriaId = getString(formData, 'criteriaId');
  if (!requestId || !criteriaId) return;

  const existing = await prisma.requestCriteria.findFirst({
    where: { requestId, criteriaId }
  });
  if (existing) {
    revalidatePath(`/requests/${requestId}`);
    return;
  }

  const template = await prisma.criteria.findUnique({
    where: { id: criteriaId },
    include: { measures: { orderBy: { displayOrder: 'asc' } } }
  });
  if (!template) return;

  // Determine the request's floors so we snapshot each template measure once
  // per floor. Floor keys: "basement", "ground", "mezzanine", then "1", "2"...
  const request = await prisma.inspectionRequest.findUnique({
    where: { id: requestId },
    select: { floors: true, hasBasement: true, hasMezzanine: true }
  });
  if (!request) return;

  const floorKeys = floorKeysFor(request);

  const templateMeasures = template.measures ?? [];
  const measureRows = floorKeys.flatMap((floor) =>
    templateMeasures.map((m) => ({
      floor,
      nameEn: m.nameEn,
      nameAr: m.nameAr,
      displayOrder: m.displayOrder
    }))
  );

  await prisma.requestCriteria.create({
    data: {
      requestId,
      criteriaId,
      measures: { create: measureRows }
    }
  });

  await audit(user.id, 'ASSIGN', 'RequestCriteria', requestId, template.nameEn);
  revalidatePath(`/requests/${requestId}`);
}

export async function unassignCriteria(formData: FormData) {
  const user = await requireUser();
  const id = getString(formData, 'id');
  const requestId = getString(formData, 'requestId');
  if (!id) return;
  await prisma.requestCriteria.delete({ where: { id } });
  await audit(user.id, 'UNASSIGN', 'RequestCriteria', id);
  if (requestId) revalidatePath(`/requests/${requestId}`);
}

// ------------------------------------------------- fill a measure's values
const fillSchema = z.object({
  statusId: z.string().optional(),
  notes: z.string().trim().max(2000).optional(),
  recommendations: z.string().trim().max(2000).optional()
});

export async function saveMeasureValues(formData: FormData) {
  const user = await requireUser();
  const id = getString(formData, 'id');
  const requestId = getString(formData, 'requestId');
  if (!id) return;

  const parsed = fillSchema.safeParse({
    statusId: getOptionalString(formData, 'statusId') ?? '',
    notes: getOptionalString(formData, 'notes') ?? '',
    recommendations: getOptionalString(formData, 'recommendations') ?? ''
  });
  if (!parsed.success) return;

  await prisma.requestMeasure.update({
    where: { id },
    data: {
      statusId: parsed.data.statusId ? parsed.data.statusId : null,
      notes: parsed.data.notes ? parsed.data.notes : null,
      recommendations: parsed.data.recommendations ? parsed.data.recommendations : null
    }
  });

  await audit(user.id, 'FILL', 'RequestMeasure', id);
  if (requestId) revalidatePath(`/requests/${requestId}`);
}

export async function deleteMeasureImage(imageId: string, requestId: string) {
  const user = await requireUser();
  if (!imageId) return;
  await prisma.requestMeasureImage.delete({ where: { id: imageId } });
  await audit(user.id, 'DELETE_IMAGE', 'RequestMeasureImage', imageId);
  if (requestId) revalidatePath(`/requests/${requestId}`);
}

/**
 * Keeps assigned criteria in sync when a request's floors change. For every
 * criteria already assigned to the request, adds RequestMeasure rows for any
 * floor that now exists but had no rows yet (e.g. the user increased the floor
 * count or ticked basement/mezzanine after assigning). Existing floors and
 * their filled-in values are left untouched. Does NOT remove measures for
 * floors that were dropped — that removal is handled explicitly on request
 * update after the user confirms, so filled data isn't silently lost.
 */
export async function syncRequestFloors(requestId: string): Promise<void> {
  await requireUser(); // guard: this is exported from a 'use server' module
  const request = await prisma.inspectionRequest.findUnique({
    where: { id: requestId },
    select: { floors: true, hasBasement: true, hasMezzanine: true }
  });
  if (!request) return;

  const floorKeys = floorKeysFor(request);

  const assigned = await prisma.requestCriteria.findMany({
    where: { requestId },
    include: {
      criteria: { include: { measures: { orderBy: { displayOrder: 'asc' } } } },
      measures: { select: { floor: true } }
    }
  });

  for (const rc of assigned) {
    const presentFloors = new Set(rc.measures.map((m) => m.floor));
    const missingFloors = floorKeys.filter((f) => !presentFloors.has(f));
    if (missingFloors.length === 0) continue;

    const templateMeasures = rc.criteria.measures ?? [];
    const rows = missingFloors.flatMap((floor) =>
      templateMeasures.map((m) => ({
        requestCriteriaId: rc.id,
        floor,
        nameEn: m.nameEn,
        nameAr: m.nameAr,
        displayOrder: m.displayOrder
      }))
    );
    if (rows.length > 0) {
      await prisma.requestMeasure.createMany({ data: rows });
    }
  }
}

/**
 * Removes RequestMeasure rows for floors that no longer exist on the request.
 * Called on request update after the user has confirmed losing any filled data.
 */
export async function pruneRequestFloors(requestId: string): Promise<void> {
  await requireUser(); // guard: this is exported from a 'use server' module
  const request = await prisma.inspectionRequest.findUnique({
    where: { id: requestId },
    select: { floors: true, hasBasement: true, hasMezzanine: true }
  });
  if (!request) return;

  const floorKeys = floorKeysFor(request);

  await prisma.requestMeasure.deleteMany({
    where: {
      requestCriteria: { requestId },
      floor: { notIn: floorKeys }
    }
  });
}
