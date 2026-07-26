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
  const image = await prisma.requestImage.findUnique({ where: { id } });
  if (!image) return new NextResponse('Not found', { status: 404 });

  const body = new Uint8Array(image.data);
  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': image.mimeType,
      'Content-Length': String(image.byteSize),
      'Cache-Control': 'private, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox"
    }
  });
}
