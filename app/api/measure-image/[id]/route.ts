import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return new NextResponse('Unauthorized', { status: 401 });
  const { id } = await params;
  const image = await prisma.requestMeasureImage.findUnique({
    where: { id },
    select: { data: true, mimeType: true, byteSize: true, blobUrl: true }
  });
  if (!image) return new NextResponse('Not found', { status: 404 });

  // New images live in Vercel Blob — redirect to the CDN URL. Legacy images
  // still have their bytes in Postgres and are served inline below.
  if (image.blobUrl) {
    return NextResponse.redirect(image.blobUrl, 308);
  }
  if (!image.data) return new NextResponse('Not found', { status: 404 });

  const body = new Uint8Array(image.data);
  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': image.mimeType,
      'Content-Length': String(image.byteSize),
      // Image bytes never change once uploaded (id is unique per image), so cache
      // hard: the browser reuses them instantly on reprints and repeat views
      // without hitting the server again.
      'Cache-Control': 'private, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox"
    }
  });
}
