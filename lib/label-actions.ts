'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireSuperAdmin } from '@/lib/auth';
import { getString, getOptionalString } from '@/lib/utils';

async function audit(actorUserId: string, action: string, entityType: string, entityId: string, entityName?: string) {
  await prisma.auditLog.create({ data: { actorUserId, action, entityType, entityId, entityName } });
}

/**
 * Saves (upserts) an override for a single label key. Empty values are stored as
 * null, meaning "fall back to the built-in default" for that language.
 */
export async function saveLabelOverride(formData: FormData): Promise<void> {
  const user = await requireSuperAdmin();
  const key = getString(formData, 'key');
  if (!key) return;

  const en = getOptionalString(formData, 'en') ?? null;
  const ar = getOptionalString(formData, 'ar') ?? null;

  // If both are empty, remove the override entirely (revert to defaults).
  if (!en && !ar) {
    await prisma.labelOverride.deleteMany({ where: { key } });
  } else {
    await prisma.labelOverride.upsert({
      where: { key },
      create: { key, en, ar },
      update: { en, ar }
    });
  }

  await audit(user.id, 'UPDATE', 'LabelOverride', key);
  revalidatePath('/', 'layout'); // labels are used everywhere
}

/** Resets a label back to its built-in default by deleting any override. */
export async function resetLabelOverride(formData: FormData): Promise<void> {
  const user = await requireSuperAdmin();
  const key = getString(formData, 'key');
  if (!key) return;

  await prisma.labelOverride.deleteMany({ where: { key } });
  await audit(user.id, 'DELETE', 'LabelOverride', key);
  revalidatePath('/', 'layout');
}
