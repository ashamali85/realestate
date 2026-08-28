import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export const runtime = 'nodejs';

const MAX_IMAGES_PER_REQUEST = 4;

/**
 * Records property/Kuwait-Finder photos that the browser already uploaded to
 * Vercel Blob. The client uploads the file straight to Blob (via the
 * /api/blob-upload token flow), then posts the resulting blob URL here as JSON;
 * we store only the URL + metadata, never the bytes. Auth: signed-in staff only.
 */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let payload: {
    requestId?: string;
    category?: string;
    blobUrl?: string;
    mimeType?: string;
    byteSize?: number;
  };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }

  const requestId = String(payload.requestId ?? '');
  const blobUrl = String(payload.blobUrl ?? '');
  if (!requestId || !blobUrl) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }
  // Only accept URLs from the Vercel Blob store.
  if (!/^https:\/\/[a-z0-9.-]*\.public\.blob\.vercel-storage\.com\//i.test(blobUrl)) {
    return NextResponse.json({ error: 'invalid_url' }, { status: 400 });
  }

  const category = payload.category === 'kuwaitFinder' ? 'kuwaitFinder' : 'property';

  const target = await prisma.inspectionRequest.findUnique({
    where: { id: requestId },
    select: { id: true }
  });
  if (!target) {
    return NextResponse.json({ error: 'request_not_found' }, { status: 404 });
  }

  const currentCount = await prisma.requestImage.count({ where: { requestId, category } });
  if (currentCount >= MAX_IMAGES_PER_REQUEST) {
    return NextResponse.json({ error: 'too_many' }, { status: 400 });
  }

  await prisma.requestImage.create({
    data: {
      requestId,
      category,
      blobUrl,
      mimeType: String(payload.mimeType ?? 'image/jpeg'),
      byteSize: Number(payload.byteSize ?? 0),
      sortOrder: currentCount
    }
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: 'UPLOAD_IMAGE',
      entityType: 'InspectionRequest',
      entityId: requestId,
      details: `blob ${category}`
    }
  });

  return NextResponse.json({ saved: 1 });
}
