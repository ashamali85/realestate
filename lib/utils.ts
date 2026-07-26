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

export function formatDate(d: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-KW' : 'en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(d);
}
