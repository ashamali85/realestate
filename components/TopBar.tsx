import Link from 'next/link';
import { logout, setLocale } from '@/lib/actions';
import { t, type Locale } from '@/lib/i18n';
import type { SessionUser } from '@/lib/auth';
import { loadNav } from '@/lib/nav';
import { NavLinkItem } from './NavLinkItem';

export async function TopBar({
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
  const nav = await loadNav(locale);
  const visible = nav.filter((item) => !item.superOnly || isSuper);

  return (
    <header className="topbar">
      <div className="container">
        <Link href="/requests" className="brand-mark">
          <span className="brand-dot" />
          {t('app_name', locale)}
        </Link>
        <nav className="nav">
          {visible.map((item) => (
            <NavLinkItem
              key={item.key}
              href={item.href}
              label={item.label}
              isActive={active === item.active}
              locale={locale}
            />
          ))}
          {isSuper && (
            <NavLinkItem
              href="/nav"
              isActive={active === 'nav'}
              locale={locale}
              className="nav-icon-link"
              ariaLabel={t('nav_manage_link', locale)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
              </svg>
            </NavLinkItem>
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
