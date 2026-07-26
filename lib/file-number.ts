import { prisma } from '@/lib/db';

/**
 * Allocates the next reference like INS-2026-0001 atomically via a per-year
 * counter row, so concurrent creates never collide.
 */
export async function nextReference(
  tx: Pick<typeof prisma, 'counter'>
): Promise<string> {
  const year = new Date().getFullYear();
  const key = `request:${year}`;
  const counter = await tx.counter.upsert({
    where: { id: key },
    create: { id: key, value: 1 },
    update: { value: { increment: 1 } }
  });
  return `INS-${year}-${String(counter.value).padStart(4, '0')}`;
}
