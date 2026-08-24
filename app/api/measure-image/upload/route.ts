import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { validateImageBytes } from '@/lib/image';

export const runtime = 'nodejs';

const MAX_IMAGES_PER_MEASURE = 4;

/**
 * Uploads photos for a single request-measure. Dedicated route (not a Server
 * Action) and one file per request from the client, mirroring the request
 * image upload that works reliably within serverless body limits.
 */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }

  const measureId = String(form.get('measureId') ?? '');
  if (!measureId) return NextResponse.json({ error: 'missing_measure' }, { status: 400 });

  const target = await prisma.requestMeasure.findUnique({
    where: { id: measureId },
    select: { id: true }
  });
  if (!target) return NextResponse.json({ error: 'measure_not_found' }, { status: 404 });

  const files = form.getAll('images').filter((f): f is File => f instanceof File);
  if (files.length === 0) return NextResponse.json({ saved: 0 });

  const currentCount = await prisma.requestMeasureImage.count({ where: { measureId } });
  let order = currentCount;
  let saved = 0;
  const rejected: string[] = [];

  try {
    for (const file of files) {
      if (order >= MAX_IMAGES_PER_MEASURE) {
        rejected.push(`${file.name}: too many images`);
        continue;
      }
      const bytes = new Uint8Array(await file.arrayBuffer());
      const result = validateImageBytes(bytes);
      if (!result.ok) {
        rejected.push(`${file.name}: ${result.error}`);
        continue;
      }
      await prisma.requestMeasureImage.create({
        data: {
          measureId,
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
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    console.error('measure image upload failed:', err);
    return NextResponse.json({ error: `db_error: ${message}` }, { status: 500 });
  }

  try {
    await prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        action: 'UPLOAD_MEASURE_IMAGES',
        entityType: 'RequestMeasure',
        entityId: measureId,
        details: `saved ${saved}${rejected.length ? `, rejected ${rejected.length}` : ''}`
      }
    });
  } catch {
    // Audit logging is best-effort; don't fail the upload if it errors.
  }

  return NextResponse.json({ saved, rejected });
}
