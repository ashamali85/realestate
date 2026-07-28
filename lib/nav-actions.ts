'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireSuperAdmin } from '@/lib/auth';
import { getString, getInt } from '@/lib/utils';
import { NAV_META } from '@/lib/nav';

async function audit(actorUserId: string, action: string, entityId: string, entityName?: string) {
  await prisma.auditLog.create({
    data: { actorUserId, action, entityType: 'NavLink', entityId, entityName }
  });
}

const labelSchema = z.object({
  labelEn: z.string().trim().min(1).max(60),
  labelAr: z.string().trim().min(1).max(60)
});

export async function renameNavLink(formData: FormData) {
  const user = await requireSuperAdmin();
  const key = getString(formData, 'key');
  if (!(key in NAV_META)) return;

  const parsed = labelSchema.safeParse({
    labelEn: getString(formData, 'labelEn'),
    labelAr: getString(formData, 'labelAr')
  });
  if (!parsed.success) return;

  await prisma.navLink.update({ where: { key }, data: parsed.data });
  await audit(user.id, 'RENAME', key, parsed.data.labelEn);
  revalidatePath('/nav');
}

/**
 * Moves a link up or down by swapping displayOrder with its neighbour.
 * Direction is 'up' (earlier) or 'down' (later).
 */
export async function moveNavLink(formData: FormData) {
  const user = await requireSuperAdmin();
  const key = getString(formData, 'key');
  const direction = getString(formData, 'direction');
  if (!(key in NAV_META) || (direction !== 'up' && direction !== 'down')) return;

  const links = await prisma.navLink.findMany({ orderBy: { displayOrder: 'asc' } });
  const index = links.findIndex((l) => l.key === key);
  if (index === -1) return;

  const swapWith = direction === 'up' ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= links.length) return; // already at the edge

  const a = links[index]!;
  const b = links[swapWith]!;

  // Swap their display orders in a transaction.
  await prisma.$transaction([
    prisma.navLink.update({ where: { id: a.id }, data: { displayOrder: b.displayOrder } }),
    prisma.navLink.update({ where: { id: b.id }, data: { displayOrder: a.displayOrder } })
  ]);

  await audit(user.id, 'REORDER', key, direction);
  revalidatePath('/nav');
}
