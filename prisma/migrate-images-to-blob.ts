/**
 * One-time migration: move legacy image bytes out of Postgres into Vercel Blob.
 *
 * For every image row that still has `data` bytes and no `blobUrl`, this uploads
 * the bytes to Blob, saves the resulting URL on the row, and clears the bytes
 * (freeing Neon storage). It covers BOTH RequestImage (property / Kuwait Finder)
 * and RequestMeasureImage (measure photos).
 *
 * Safe to re-run: rows already migrated (blobUrl set, data null) are skipped, so
 * if it stops partway you can just run it again.
 *
 * Requires env vars: DATABASE_URL (or DIRECT_URL) and BLOB_READ_WRITE_TOKEN.
 * Run with:  npx tsx prisma/migrate-images-to-blob.ts
 */
import { PrismaClient } from '@prisma/client';
import { put } from '@vercel/blob';

const prisma = new PrismaClient();

// Pick a sensible file extension from the stored mime type.
function extFor(mime: string): string {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  return 'jpg';
}

const BATCH = 20; // process in small batches to keep memory low

async function migrateRequestImages(): Promise<{ moved: number; failed: number }> {
  let moved = 0;
  let failed = 0;
  for (;;) {
    // Fetch a batch of not-yet-migrated rows (bytes present, no blob URL).
    const rows = await prisma.requestImage.findMany({
      where: { blobUrl: null, NOT: { data: null } },
      select: { id: true, data: true, mimeType: true },
      take: BATCH
    });
    if (rows.length === 0) break;

    for (const row of rows) {
      if (!row.data) continue;
      try {
        const ext = extFor(row.mimeType);
        const blob = await put(`request-images/${row.id}.${ext}`, Buffer.from(row.data), {
          access: 'public',
          contentType: row.mimeType,
          addRandomSuffix: true
        });
        // Save the URL and drop the bytes in one update.
        await prisma.requestImage.update({
          where: { id: row.id },
          data: { blobUrl: blob.url, data: null }
        });
        moved++;
        process.stdout.write(`  ✓ request image ${row.id} -> blob\n`);
      } catch (err) {
        failed++;
        const msg = err instanceof Error ? err.message : String(err);
        process.stdout.write(`  ✗ request image ${row.id} FAILED: ${msg}\n`);
      }
    }
  }
  return { moved, failed };
}

async function migrateMeasureImages(): Promise<{ moved: number; failed: number }> {
  let moved = 0;
  let failed = 0;
  for (;;) {
    const rows = await prisma.requestMeasureImage.findMany({
      where: { blobUrl: null, NOT: { data: null } },
      select: { id: true, data: true, mimeType: true },
      take: BATCH
    });
    if (rows.length === 0) break;

    for (const row of rows) {
      if (!row.data) continue;
      try {
        const ext = extFor(row.mimeType);
        const blob = await put(`measure-images/${row.id}.${ext}`, Buffer.from(row.data), {
          access: 'public',
          contentType: row.mimeType,
          addRandomSuffix: true
        });
        await prisma.requestMeasureImage.update({
          where: { id: row.id },
          data: { blobUrl: blob.url, data: null }
        });
        moved++;
        process.stdout.write(`  ✓ measure image ${row.id} -> blob\n`);
      } catch (err) {
        failed++;
        const msg = err instanceof Error ? err.message : String(err);
        process.stdout.write(`  ✗ measure image ${row.id} FAILED: ${msg}\n`);
      }
    }
  }
  return { moved, failed };
}

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN is not set. Pull it with `vercel env pull` or set it in the environment.');
  }

  // Count what's left to do up front.
  const [reqLeft, measLeft] = await Promise.all([
    prisma.requestImage.count({ where: { blobUrl: null, NOT: { data: null } } }),
    prisma.requestMeasureImage.count({ where: { blobUrl: null, NOT: { data: null } } })
  ]);
  console.log(`To migrate: ${reqLeft} request image(s), ${measLeft} measure image(s).\n`);

  console.log('Migrating request images...');
  const r = await migrateRequestImages();
  console.log(`\nMigrating measure images...`);
  const m = await migrateMeasureImages();

  console.log('\n──────────────────────────────');
  console.log(`Request images: moved ${r.moved}, failed ${r.failed}`);
  console.log(`Measure images: moved ${m.moved}, failed ${m.failed}`);
  console.log('Done. Re-run to retry any failures.');
  if (r.failed + m.failed === 0) {
    console.log('\nAll images migrated. You can now VACUUM the database to reclaim space (see instructions).');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
