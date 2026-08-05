import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { getLocale } from '@/lib/locale';
import { t } from '@/lib/i18n';
import { loadLabelOverrides } from '@/lib/label-overrides';
import { setLocale } from '@/lib/actions';
import { LoginForm } from '@/components/LoginForm';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  if (await getSessionUser()) redirect('/requests');
  await loadLabelOverrides();
  const locale = await getLocale();
  const other = locale === 'ar' ? 'en' : 'ar';

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="card card-pad-lg">
          <div className="login-logo">
            <span className="brand-dot" />
            <strong style={{ fontSize: '1.15rem' }}>{t('app_name', locale)}</strong>
          </div>
          <p className="muted small center" style={{ marginBottom: 20 }}>
            {t('login_subtitle', locale)}
          </p>
          <LoginForm locale={locale} />
          <div className="center mt-4">
            <form action={setLocale} style={{ display: 'inline' }}>
              <input type="hidden" name="locale" value={other} />
              <input type="hidden" name="redirect" value="/login" />
              <button type="submit" className="btn btn-ghost btn-sm">
                {t('nav_language', locale)}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
