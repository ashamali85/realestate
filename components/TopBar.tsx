import Link from 'next/link';
import { logout, setLocale } from '@/lib/actions';
import { t, type Locale } from '@/lib/i18n';
import type { SessionUser } from '@/lib/auth';

export function TopBar({
  user,
  locale,
  active
}: {
  user: SessionUser;
  locale: Locale;
  active?: string;
}) {
  const isSuper = user.role === 'SUPER_ADMIN';
  const other: Locale = locale === 'ar' ? 'en' : 'ar';

  return (
    <header className="topbar">
      <div className="container">
        <Link href="/requests" className="brand-mark">
          <span className="brand-dot" />
          {t('app_name', locale)}
        </Link>
        <nav className="nav">
          <Link href="/requests" className={active === 'requests' ? 'active' : ''}>
            {t('nav_requests', locale)}
          </Link>
          <Link href="/requests/new" className={active === 'new' ? 'active' : ''}>
            {t('nav_new_request', locale)}
          </Link>
          {isSuper && (
            <>
              <Link href="/lookups" className={active === 'lookups' ? 'active' : ''}>
                {t('nav_lookups', locale)}
              </Link>
              <Link href="/criteria" className={active === 'criteria' ? 'active' : ''}>
                {t('nav_criteria', locale)}
              </Link>
              <Link href="/measure-lookups" className={active === 'measure-lookups' ? 'active' : ''}>
                {t('nav_measure_lookups', locale)}
              </Link>
              <Link href="/users" className={active === 'users' ? 'active' : ''}>
                {t('nav_users', locale)}
              </Link>
            </>
          )}
          <form action={setLocale} style={{ display: 'inline' }}>
            <input type="hidden" name="locale" value={other} />
            <button type="submit">{t('nav_language', locale)}</button>
          </form>
          <form action={logout} style={{ display: 'inline' }}>
            <button type="submit">{t('nav_signout', locale)}</button>
          </form>
        </nav>
      </div>
    </header>
  );
}
