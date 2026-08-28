'use client';

import { useState } from 'react';
import { migrateImagesBatch } from '@/lib/migrate-actions';

/**
 * One-click migration UI: repeatedly calls the batch server action until no
 * legacy images remain, showing live progress. Runs entirely on the server side
 * for the actual work, so the admin just clicks and watches.
 */
export function MigrateImagesButton({ initialRemaining }: { initialRemaining: number }) {
  const [remaining, setRemaining] = useState(initialRemaining);
  const [moved, setMoved] = useState(0);
  const [failed, setFailed] = useState(0);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  async function run() {
    setRunning(true);
    setDone(false);
    setMoved(0);
    setFailed(0);
    setErrors([]);
    try {
      // Loop batch-by-batch until nothing is left. A safety cap prevents an
      // infinite loop if something keeps failing.
      for (let i = 0; i < 10000; i++) {
        const res = await migrateImagesBatch();
        setRemaining(res.remaining);
        setMoved((m) => m + res.movedThisBatch);
        setFailed((f) => f + res.failedThisBatch);
        if (res.errors.length) setErrors((e) => [...e, ...res.errors].slice(0, 50));
        // Stop when nothing remains, or when a batch made no progress at all
        // (everything left is failing) to avoid spinning forever.
        if (res.remaining === 0) break;
        if (res.movedThisBatch === 0 && res.failedThisBatch === 0) break;
        if (res.movedThisBatch === 0 && res.failedThisBatch > 0) break;
      }
      setDone(true);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="card" style={{ maxWidth: 640 }}>
      <p style={{ marginTop: 0 }}>
        Legacy images still in the database: <strong>{remaining}</strong>
      </p>

      {running && (
        <p className="muted">
          Migrating… moved {moved} so far{failed ? `, ${failed} failed` : ''}. {remaining} remaining. Please keep this
          tab open.
        </p>
      )}

      {done && (
        <p style={{ color: remaining === 0 ? 'var(--ok, #197b4f)' : 'var(--danger, #b3261e)' }}>
          {remaining === 0
            ? `Done — all images migrated (${moved} moved).`
            : `Stopped with ${remaining} remaining (${moved} moved, ${failed} failed). You can run again.`}
        </p>
      )}

      {errors.length > 0 && (
        <details style={{ marginBottom: 12 }}>
          <summary>Errors ({errors.length})</summary>
          <ul className="small muted">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </details>
      )}

      <button type="button" className="btn btn-primary" onClick={run} disabled={running || remaining === 0}>
        {running ? 'Migrating…' : remaining === 0 ? 'Nothing to migrate' : 'Start migration'}
      </button>
    </div>
  );
}
