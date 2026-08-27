'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireSuperAdmin, requireUser } from '@/lib/auth';
import { getString, getInt, getOptionalString } from '@/lib/utils';
import { floorKeysFor, BUILDING_FLOOR } from '@/lib/floors';

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
  const c = await prisma.criteria.create({
    data: { ...parsed.data, wholeBuilding: getString(formData, 'wholeBuilding') === 'on' }
  });
  await audit(user.id, 'CREATE', 'Criteria', c.id, parsed.data.nameEn);
  revalidatePath('/criteria');
}

export async function updateCriteria(formData: FormData) {
  const user = await requireSuperAdmin();
  const id = getString(formData, 'id');
  if (!id) return;
  const parsed = criteriaSchema.extend({ isActive: z.boolean(), wholeBuilding: z.boolean() }).safeParse({
    nameEn: getString(formData, 'nameEn'),
    nameAr: getString(formData, 'nameAr'),
    isActive: getString(formData, 'isActive') === 'on',
    wholeBuilding: getString(formData, 'wholeBuilding') === 'on'
  });
  if (!parsed.success) return;

  // Detect a false -> true transition on wholeBuilding so we can convert any
  // already-assigned requests from per-floor measures to a single building set.
  const before = await prisma.criteria.findUnique({ where: { id }, select: { wholeBuilding: true } });
  const turningOn = parsed.data.wholeBuilding && before ? !before.wholeBuilding : false;

  await prisma.criteria.update({ where: { id }, data: parsed.data });

  if (turningOn) {
    await convertAssignedToWholeBuilding(id);
  }

  await audit(user.id, 'UPDATE', 'Criteria', id, parsed.data.nameEn);
  revalidatePath('/criteria');
}

/**
 * Counts how many assigned requests would be affected by converting a criteria
 * to whole-building, and how many per-floor measures would be removed. Used to
 * warn the admin before they confirm. "Affected" = an assigned request that has
 * measures on real floors (not already just the building row).
 */
export async function countWholeBuildingImpact(
  criteriaId: string
): Promise<{ requests: number; measures: number }> {
  await requireSuperAdmin();
  const assigned = await prisma.requestCriteria.findMany({
    where: { criteriaId },
    include: { measures: { select: { floor: true } } }
  });
  let requests = 0;
  let measures = 0;
  for (const rc of assigned) {
    const nonBuilding = rc.measures.filter((m: { floor: string }) => m.floor !== BUILDING_FLOOR);
    if (nonBuilding.length > 0) {
      requests += 1;
      measures += nonBuilding.length;
    }
  }
  return { requests, measures };
}

/**
 * Converts every assigned instance of a criteria from per-floor measures to a
 * single whole-building set. Existing per-floor RequestMeasure rows (and their
 * filled values/images) are deleted and replaced with one set on the building
 * floor, snapshotted from the current template. Destructive — only called after
 * the admin confirms.
 */
async function convertAssignedToWholeBuilding(criteriaId: string): Promise<void> {
  const template = await prisma.criteria.findUnique({
    where: { id: criteriaId },
    include: { measures: { orderBy: { displayOrder: 'asc' } } }
  });
  if (!template) return;
  const templateMeasures = template.measures ?? [];

  const assigned = await prisma.requestCriteria.findMany({
    where: { criteriaId },
    include: { measures: { select: { id: true, floor: true } } }
  });

  for (const rc of assigned) {
    const hasBuildingRow = rc.measures.some((m: { floor: string }) => m.floor === BUILDING_FLOOR);
    const hasFloorRows = rc.measures.some((m: { floor: string }) => m.floor !== BUILDING_FLOOR);
    // Nothing to do if it's already just a building set.
    if (!hasFloorRows && hasBuildingRow) continue;

    await prisma.$transaction(async (tx: typeof prisma) => {
      // Remove all existing measures for this assignment (cascade removes their
      // images/values).
      await tx.requestMeasure.deleteMany({ where: { requestCriteriaId: rc.id } });
      // Recreate a single building set from the template.
      if (templateMeasures.length > 0) {
        await tx.requestMeasure.createMany({
          data: templateMeasures.map((m) => ({
            requestCriteriaId: rc.id,
            floor: BUILDING_FLOOR,
            nameEn: m.nameEn,
            nameAr: m.nameAr,
            displayOrder: m.displayOrder
          }))
        });
      }
    });
  }
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
  await assignOne(user.id, requestId, criteriaId);
  revalidatePath(`/requests/${requestId}`);
}

/** Assigns several criteria to a request in one call (multi-select). */
export async function assignCriteriaMany(formData: FormData) {
  const user = await requireUser();
  const requestId = getString(formData, 'requestId');
  const idsRaw = getString(formData, 'criteriaIds');
  if (!requestId || !idsRaw) return;
  const ids = idsRaw.split(',').map((s) => s.trim()).filter(Boolean);
  for (const criteriaId of ids) {
    await assignOne(user.id, requestId, criteriaId);
  }
  revalidatePath(`/requests/${requestId}`);
}

/** Core assignment: snapshots a criteria's measures per floor onto the request.
 *  No-op if already assigned or the template/request is missing. */
async function assignOne(userId: string, requestId: string, criteriaId: string): Promise<void> {
  const existing = await prisma.requestCriteria.findFirst({
    where: { requestId, criteriaId }
  });
  if (existing) return;

  const template = await prisma.criteria.findUnique({
    where: { id: criteriaId },
    include: { measures: { orderBy: { displayOrder: 'asc' } } }
  });
  if (!template) return;

  const request = await prisma.inspectionRequest.findUnique({
    where: { id: requestId },
    select: { floors: true, hasBasement: true, hasMezzanine: true }
  });
  if (!request) return;

  const templateMeasures = template.measures ?? [];
  // Whole-building criteria (e.g. elevator, landscape) get their measures once,
  // on a single "building" floor, instead of repeated per floor.
  const floorKeys = template.wholeBuilding ? [BUILDING_FLOOR] : floorKeysFor(request);
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

  await audit(userId, 'ASSIGN', 'RequestCriteria', requestId, template.nameEn);
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
    // Whole-building criteria don't have per-floor measures — never add floors.
    if (rc.criteria.wholeBuilding) continue;
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
      // Keep whole-building rows (BUILDING_FLOOR) — they aren't tied to floors.
      floor: { notIn: [...floorKeys, BUILDING_FLOOR] }
    }
  });
}
