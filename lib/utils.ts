/** Pull a required trimmed string from FormData. */
export function getString(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === 'string' ? v.trim() : '';
}

/** Pull an optional trimmed string; empty becomes undefined. */
export function getOptionalString(form: FormData, key: string): string | undefined {
  const v = getString(form, key);
  return v.length > 0 ? v : undefined;
}

/** Pull an integer, or null when absent/invalid. */
export function getInt(form: FormData, key: string): number | null {
  const v = getString(form, key);
  if (!/^-?\d+$/.test(v)) return null;
  return Number(v);
}

/** Pull a float, or null when absent/invalid. */
export function getFloat(form: FormData, key: string): number | null {
  const v = getString(form, key);
  if (v === '' || Number.isNaN(Number(v))) return null;
  return Number(v);
}

export function getDate(form: FormData, key: string): Date | null {
  const v = getString(form, key);
  if (v === '') return null;
  // A date input yields "YYYY-MM-DD". Parse as local noon to avoid timezone
  // rollover (midnight UTC could land on the previous day in +03:00).
  const d = new Date(`${v}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDate(d: Date, _locale?: string): string {
  // Dates are always shown in English, even in the Arabic view, per requirement.
  // Day-Month-Year order (e.g. "8 August 2026"). Pinned to Kuwait time (GMT+3)
  // so it's correct regardless of server timezone (Vercel runs in UTC).
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Kuwait'
  }).format(d);
}

/** Same as formatDate but with a 24-hour time appended (English, Kuwait time). */
export function formatDateTime(d: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Kuwait'
  }).format(d);
}
