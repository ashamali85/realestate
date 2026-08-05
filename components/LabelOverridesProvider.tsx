'use client';

import { useRef } from 'react';
import { setLabelOverrides } from '@/lib/i18n';

type OverrideMap = Record<string, { en?: string | null; ar?: string | null }>;

/**
 * Seeds the client-side i18n override store with the values loaded on the
 * server, so client components' t() calls resolve overrides consistently. We
 * set it synchronously on first render (before children render) via a ref
 * guard, and re-apply if the map changes (e.g. after an override is edited and
 * the tree re-renders with new props).
 */
export function LabelOverridesProvider({
  overrides,
  children
}: {
  overrides: OverrideMap;
  children: React.ReactNode;
}) {
  const applied = useRef<string>('');
  const serialized = JSON.stringify(overrides);
  if (applied.current !== serialized) {
    setLabelOverrides(overrides);
    applied.current = serialized;
  }
  return <>{children}</>;
}
