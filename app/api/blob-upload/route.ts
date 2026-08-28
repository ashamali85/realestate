import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';

/**
 * Generates short-lived client-upload tokens for Vercel Blob. The browser
 * (@vercel/blob/client `upload()`) posts here first; we authenticate the user,
 * then hand back a token that lets the browser upload the file straight to Blob
 * (bypassing the 4.5 MB serverless function body limit). The actual DB record is
 * created separately once the client reports the resulting blob URL.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        // Only signed-in users may upload. Without this check the route would
        // allow anonymous uploads to the store.
        const user = await getSessionUser();
        if (!user) throw new Error('unauthorized');
        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp'],
          maximumSizeInBytes: 10 * 1024 * 1024, // 10 MB ceiling
          addRandomSuffix: true
        };
      },
      onUploadCompleted: async () => {
        // No-op: the client sends the blob URL to our own record-creation route.
      }
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'upload failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
