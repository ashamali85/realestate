'use server';

import { put } from '@vercel/blob';
import { prisma } from '@/lib/db';
import { requireSuperAdmin } from '@/lib/auth';

/**
 * In-app migration of legacy DB-stored images into Vercel Blob. Runs on the
 * server (Vercel), where BLOB_READ_WRITE_TOKEN already exists — so the admin
 * doesn't need any local setup. Processes a small batch per call and returns the
 * remaining count, so the admin page can call it repeatedly until done.
 */

const BATCH = 10; // small batches keep each request well within time/memory limits

function extFor(mime: string): string {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  return 'jpg';
}

export type MigrationProgress = {
  movedThisBatch: number;
  failedThisBatch: number;
  remaining: number;
  errors: string[];
};

export async function migrateImagesBatch(): Promise<MigrationProgress> {
  await requireSuperAdmin();

  const errors: string[] = [];
  let moved = 0;
  let failed = 0;

  // Interleave: take a few request images and a few measure images each call.
  const reqRows = await prisma.requestImage.findMany({
    where: { blobUrl: null, NOT: { data: null } },
    select: { id: true, data: true, mimeType: true },
    take: BATCH
  });
  for (const row of reqRows) {
    if (!row.data) continue;
    try {
      const blob = await put(`request-images/${row.id}.${extFor(row.mimeType)}`, Buffer.from(row.data), {
        access: 'public',
        contentType: row.mimeType,
        addRandomSuffix: true
      });
      await prisma.requestImage.update({ where: { id: row.id }, data: { blobUrl: blob.url, data: null } });
      moved++;
    } catch (err) {
      failed++;
      errors.push(`request ${row.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Only pull measure images if we didn't already fill the batch with request
  // images, so each call stays small.
  if (reqRows.length < BATCH) {
    const measRows = await prisma.requestMeasureImage.findMany({
      where: { blobUrl: null, NOT: { data: null } },
      select: { id: true, data: true, mimeType: true },
      take: BATCH - reqRows.length
    });
    for (const row of measRows) {
      if (!row.data) continue;
      try {
        const blob = await put(`measure-images/${row.id}.${extFor(row.mimeType)}`, Buffer.from(row.data), {
          access: 'public',
          contentType: row.mimeType,
          addRandomSuffix: true
        });
        await prisma.requestMeasureImage.update({ where: { id: row.id }, data: { blobUrl: blob.url, data: null } });
        moved++;
      } catch (err) {
        failed++;
        errors.push(`measure ${row.id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  const [reqLeft, measLeft] = await Promise.all([
    prisma.requestImage.count({ where: { blobUrl: null, NOT: { data: null } } }),
    prisma.requestMeasureImage.count({ where: { blobUrl: null, NOT: { data: null } } })
  ]);

  return {
    movedThisBatch: moved,
    failedThisBatch: failed,
    remaining: reqLeft + measLeft,
    errors
  };
}

/** Count how many legacy images still need migrating (for the initial display). */
export async function countImagesToMigrate(): Promise<number> {
  await requireSuperAdmin();
  const [reqLeft, measLeft] = await Promise.all([
    prisma.requestImage.count({ where: { blobUrl: null, NOT: { data: null } } }),
    prisma.requestMeasureImage.count({ where: { blobUrl: null, NOT: { data: null } } })
  ]);
  return reqLeft + measLeft;
}
