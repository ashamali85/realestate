import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { validateImageBytes } from '@/lib/image';

export const runtime = 'nodejs';

const MAX_IMAGES_PER_REQUEST = 4;

/**
 * Uploads one or more property photos for an existing request.
 *
 * This is a dedicated route handler rather than a Server Action, on purpose:
 * Server Actions carry a body-size ceiling whose failure mode is an
 * uncatchable crash. A route handler lets us accept larger multipart bodies
 * and return clean JSON errors the client can display.
 *
 * Auth: signed-in staff only. Each file is validated by magic bytes.
 */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }

  const requestId = String(form.get('requestId') ?? '');
  if (!requestId) {
    return NextResponse.json({ error: 'missing_request' }, { status: 400 });
  }

  // Which image set this upload belongs to. Two categories share the table:
  // "property" (main property photos) and "kuwaitFinder" (Kuwait Finder).
  const rawCategory = String(form.get('category') ?? 'property');
  const category = rawCategory === 'kuwaitFinder' ? 'kuwaitFinder' : 'property';

  const target = await prisma.inspectionRequest.findUnique({
    where: { id: requestId },
    select: { id: true }
  });
  if (!target) {
    return NextResponse.json({ error: 'request_not_found' }, { status: 404 });
  }

  const files = form.getAll('images').filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ saved: 0 });
  }

  const currentCount = await prisma.requestImage.count({ where: { requestId, category } });
  let order = currentCount;
  let saved = 0;
  const rejected: string[] = [];

  for (const file of files) {
    if (order >= MAX_IMAGES_PER_REQUEST) {
      rejected.push(`${file.name}: too many images`);
      continue;
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const result = validateImageBytes(bytes);
    if (!result.ok) {
      rejected.push(`${file.name}: ${result.error}`);
      continue;
    }
    await prisma.requestImage.create({
      data: {
        requestId,
        category,
        data: Buffer.from(bytes),
        mimeType: result.detected.mimeType,
        byteSize: bytes.byteLength,
        width: result.detected.width,
        height: result.detected.height,
        sortOrder: order++
      }
    });
    saved++;
  }

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: 'UPLOAD_IMAGES',
      entityType: 'InspectionRequest',
      entityId: requestId,
      details: `saved ${saved}${rejected.length ? `, rejected ${rejected.length}` : ''}`
    }
  });

  return NextResponse.json({ saved, rejected });
}
