'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { z } from 'zod';
import {
  authenticate,
  clearSession,
  createSession,
  requireUser
} from '@/lib/auth';
import { prisma } from '@/lib/db';
import { nextReference } from '@/lib/file-number';
import { validateImageBytes } from '@/lib/image';
import { getString, getOptionalString, getInt, getFloat } from '@/lib/utils';
import { LOCALE_COOKIE, isLocale } from '@/lib/i18n';

const MAX_IMAGES = 12;

// --------------------------------------------------------------------- audit
async function logAction(
  actorUserId: string,
  action: string,
  entityType: string,
  entityId: string,
  entityName?: string,
  details?: string
) {
  await prisma.auditLog.create({
    data: { actorUserId, action, entityType, entityId, entityName, details }
  });
}

// ---------------------------------------------------------------------- i18n
export async function setLocale(formData: FormData) {
  const next = getString(formData, 'locale');
  const value = isLocale(next) ? next : 'en';
  const store = await cookies();
  store.set(LOCALE_COOKIE, value, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax'
  });
  const back = getOptionalString(formData, 'redirect') ?? '/requests';
  redirect(back);
}

// ---------------------------------------------------------------------- auth
export type LoginState = { error?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const username = getString(formData, 'username');
  const password = getString(formData, 'password');
  if (!username || !password) return { error: 'login_error' };

  const user = await authenticate(username, password);
  if (!user) {
    await new Promise((r) => setTimeout(r, 350));
    return { error: 'login_error' };
  }

  await createSession(user);
  redirect('/requests');
}

export async function logout() {
  await clearSession();
  redirect('/login');
}

// ------------------------------------------------------------ request schema
const requestSchema = z.object({
  areaId: z.string().min(1, 'f_area'),
  block: z.string().trim().min(1, 'f_block').max(30),
  street: z.string().trim().min(1, 'f_street').max(60),
  houseNumber: z.string().trim().min(1, 'f_house').max(30),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
  clientName: z.string().trim().min(2, 'f_client_name').max(120),
  clientPhone: z
    .string()
    .trim()
    .regex(/^[0-9+\s-]{6,20}$/, 'f_client_phone'),
  clientEmail: z.string().trim().email('f_client_email').max(160).optional().or(z.literal('')),
  purposeId: z.string().min(1, 'f_purpose'),
  statusId: z.string().min(1, 'f_status'),
  exteriorId: z.string().min(1, 'f_exterior'),
  elevatorId: z.string().min(1, 'f_elevator'),
  acId: z.string().min(1, 'f_ac'),
  yearsOld: z.number().int().min(0).max(500),
  floors: z.number().int().min(0).max(300),
  notes: z.string().trim().max(2000).optional()
});

export type RequestFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

function collectErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const k = issue.path[0];
    if (typeof k === 'string' && !out[k]) out[k] = issue.message;
  }
  return out;
}

async function saveImages(requestId: string, files: File[]): Promise<void> {
  let order = 0;
  for (const file of files.slice(0, MAX_IMAGES)) {
    if (!file || file.size === 0) continue;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const result = validateImageBytes(bytes);
    if (!result.ok) continue; // skip invalid files silently; UI validates too
    await prisma.requestImage.create({
      data: {
        requestId,
        data: Buffer.from(bytes),
        mimeType: result.detected.mimeType,
        byteSize: bytes.byteLength,
        width: result.detected.width,
        height: result.detected.height,
        sortOrder: order++
      }
    });
  }
}

export async function createRequest(
  _prev: RequestFormState,
  formData: FormData
): Promise<RequestFormState> {
  const user = await requireUser();

  const parsed = requestSchema.safeParse({
    areaId: getString(formData, 'areaId'),
    block: getString(formData, 'block'),
    street: getString(formData, 'street'),
    houseNumber: getString(formData, 'houseNumber'),
    latitude: getFloat(formData, 'latitude'),
    longitude: getFloat(formData, 'longitude'),
    clientName: getString(formData, 'clientName'),
    clientPhone: getString(formData, 'clientPhone'),
    clientEmail: getOptionalString(formData, 'clientEmail') ?? '',
    purposeId: getString(formData, 'purposeId'),
    statusId: getString(formData, 'statusId'),
    exteriorId: getString(formData, 'exteriorId'),
    elevatorId: getString(formData, 'elevatorId'),
    acId: getString(formData, 'acId'),
    yearsOld: getInt(formData, 'yearsOld') ?? -1,
    floors: getInt(formData, 'floors') ?? -1,
    notes: getOptionalString(formData, 'notes')
  });

  if (!parsed.success) {
    return { error: 'required', fieldErrors: collectErrors(parsed.error) };
  }

  const d = parsed.data;

  // Confirm the area exists (and thus resolves a governorate).
  const area = await prisma.area.findUnique({ where: { id: d.areaId } });
  if (!area) return { error: 'f_area', fieldErrors: { areaId: 'f_area' } };

  const created = await prisma.$transaction(async (tx) => {
    const reference = await nextReference(tx);
    return tx.inspectionRequest.create({
      data: {
        reference,
        areaId: d.areaId,
        block: d.block,
        street: d.street,
        houseNumber: d.houseNumber,
        latitude: d.latitude,
        longitude: d.longitude,
        clientName: d.clientName,
        clientPhone: d.clientPhone,
        clientEmail: d.clientEmail ? d.clientEmail : null,
        purposeId: d.purposeId,
        statusId: d.statusId,
        exteriorId: d.exteriorId,
        elevatorId: d.elevatorId,
        acId: d.acId,
        yearsOld: d.yearsOld,
        floors: d.floors,
        notes: d.notes ?? null,
        createdById: user.id
      }
    });
  });

  const files = formData.getAll('images').filter((f): f is File => f instanceof File);
  await saveImages(created.id, files);

  await logAction(user.id, 'CREATE', 'InspectionRequest', created.id, created.reference);

  revalidatePath('/requests');
  redirect(`/requests/${created.id}`);
}

export async function deleteRequest(formData: FormData) {
  const user = await requireUser();
  const id = getString(formData, 'id');
  if (!id) return;

  const existing = await prisma.inspectionRequest.findUnique({ where: { id } });
  if (!existing) return;

  await prisma.inspectionRequest.delete({ where: { id } });
  await logAction(user.id, 'DELETE', 'InspectionRequest', id, existing.reference);

  revalidatePath('/requests');
  redirect('/requests');
}
