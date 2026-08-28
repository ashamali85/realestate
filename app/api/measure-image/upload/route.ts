import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export const runtime = 'nodejs';

const MAX_IMAGES_PER_MEASURE = 4;

/**
 * Records a measure photo that the browser already uploaded to Vercel Blob.
 * The client uploads straight to Blob, then posts the resulting URL here; we
 * store the URL + metadata only. Auth: signed-in staff only.
 */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let payload: {
    measureId?: string;
    blobUrl?: string;
    mimeType?: string;
    byteSize?: number;
  };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }

  const measureId = String(payload.measureId ?? '');
  const blobUrl = String(payload.blobUrl ?? '');
  if (!measureId || !blobUrl) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }
  if (!/^https:\/\/[a-z0-9.-]*\.public\.blob\.vercel-storage\.com\//i.test(blobUrl)) {
    return NextResponse.json({ error: 'invalid_url' }, { status: 400 });
  }

  const target = await prisma.requestMeasure.findUnique({
    where: { id: measureId },
    select: { id: true }
  });
  if (!target) {
    return NextResponse.json({ error: 'measure_not_found' }, { status: 404 });
  }

  const currentCount = await prisma.requestMeasureImage.count({ where: { measureId } });
  if (currentCount >= MAX_IMAGES_PER_MEASURE) {
    return NextResponse.json({ error: 'too_many' }, { status: 400 });
  }

  await prisma.requestMeasureImage.create({
    data: {
      measureId,
      blobUrl,
      mimeType: String(payload.mimeType ?? 'image/jpeg'),
      byteSize: Number(payload.byteSize ?? 0),
      sortOrder: currentCount
    }
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: 'UPLOAD_MEASURE_IMAGE',
      entityType: 'RequestMeasure',
      entityId: measureId,
      details: 'blob'
    }
  });

  return NextResponse.json({ saved: 1 });
}
