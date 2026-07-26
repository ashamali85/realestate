'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireSuperAdmin, hashPassword } from '@/lib/auth';
import { getString } from '@/lib/utils';

async function audit(actorUserId: string, action: string, entityId: string, entityName?: string) {
  await prisma.auditLog.create({
    data: { actorUserId, action, entityType: 'User', entityId, entityName }
  });
}

export type UserFormState = { error?: string; ok?: string };

const createSchema = z.object({
  name: z.string().trim().min(2, 'required').max(120),
  username: z
    .string()
    .trim()
    .min(3, 'required')
    .max(40)
    .regex(/^[a-zA-Z0-9._-]+$/, 'required'),
  role: z.enum(['SUPER_ADMIN', 'INSPECTOR']),
  password: z.string().min(8, 'password_too_short').max(200)
});

export async function createUser(_prev: UserFormState, formData: FormData): Promise<UserFormState> {
  const actor = await requireSuperAdmin();

  const parsed = createSchema.safeParse({
    name: getString(formData, 'name'),
    username: getString(formData, 'username'),
    role: getString(formData, 'role'),
    password: getString(formData, 'password')
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: first ? first.message : 'required' };
  }

  const username = parsed.data.username.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) return { error: 'username_taken' };

  const created = await prisma.user.create({
    data: {
      name: parsed.data.name,
      username,
      role: parsed.data.role,
      passwordHash: await hashPassword(parsed.data.password)
    }
  });
  await audit(actor.id, 'CREATE', created.id, created.username);
  revalidatePath('/users');
  return { ok: 'saved_ok' };
}

export async function setUserActive(formData: FormData) {
  const actor = await requireSuperAdmin();
  const id = getString(formData, 'id');
  const active = getString(formData, 'active') === 'true';
  if (!id) return;

  // A super admin cannot deactivate their own account (would lock themselves out).
  if (id === actor.id && !active) return;

  await prisma.user.update({ where: { id }, data: { isActive: active } });
  await audit(actor.id, active ? 'ACTIVATE' : 'DEACTIVATE', id);
  revalidatePath('/users');
}

export async function resetUserPassword(formData: FormData) {
  const actor = await requireSuperAdmin();
  const id = getString(formData, 'id');
  const password = getString(formData, 'password');
  if (!id || password.length < 8) return;

  await prisma.user.update({
    where: { id },
    data: { passwordHash: await hashPassword(password) }
  });
  await audit(actor.id, 'RESET_PASSWORD', id);
  revalidatePath('/users');
}
