'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLoading } from './LoadingOverlay';
import { t, type Locale } from '@/lib/i18n';

/**
 * A top-nav link that triggers the loading overlay when clicked, unless it's
 * the page we're already on (no navigation would occur).
 */
export function NavLinkItem({
  href,
  label,
  isActive,
  locale,
  className,
  children,
  ariaLabel
}: {
  href: string;
  label?: string;
  isActive: boolean;
  locale: Locale;
  className?: string;
  children?: React.ReactNode;
  ariaLabel?: string;
}) {
  const loading = useLoading();
  const pathname = usePathname();

  function onClick() {
    // Don't show the overlay if we're already on this page.
    if (pathname !== href) loading.showForNavigation(t('loading', locale));
  }

  return (
    <Link
      href={href}
      className={`${className ?? ''} ${isActive ? 'active' : ''}`.trim()}
      onClick={onClick}
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      {children ?? label}
    </Link>
  );
}
