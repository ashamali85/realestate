import Link from 'next/link';
import { logout, setLocale } from '@/lib/actions';
import { t, type Locale } from '@/lib/i18n';
import type { SessionUser } from '@/lib/auth';
import { loadNav } from '@/lib/nav';

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
            <Link
              key={item.key}
              href={item.href}
              className={active === item.active ? 'active' : ''}
            >
              {item.label}
            </Link>
          ))}
          {isSuper && (
            <Link href="/nav" className={active === 'nav' ? 'active' : ''}>
              {t('nav_manage_link', locale)}
            </Link>
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
