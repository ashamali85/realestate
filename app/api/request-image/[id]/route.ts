import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

/**
 * Serves a property photo. Unlike public storefront images, these are behind
 * auth — only signed-in staff may view them.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return new NextResponse('Unauthorized', { status: 401 });

  const { id } = await params;
  const image = await prisma.requestImage.findUnique({
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
      // Image bytes never change once uploaded — cache hard so reprints and
      // repeat views reuse them instantly instead of re-fetching.
      'Cache-Control': 'private, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox"
    }
  });
}
