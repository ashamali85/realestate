'use client';

import { useActionState } from 'react';
import { login, type LoginState } from '@/lib/actions';
import { t, type Locale } from '@/lib/i18n';

const initial: LoginState = {};

export function LoginForm({ locale }: { locale: Locale }) {
  const [state, formAction, pending] = useActionState(login, initial);

  return (
    <form action={formAction}>
      {state.error && (
        <div className="alert alert-error" role="alert">
          {t(state.error, locale)}
        </div>
      )}
      <div className="field">
        <label htmlFor="username">{t('login_username', locale)}</label>
        <input id="username" name="username" required autoComplete="username" autoFocus />
      </div>
      <div className="field">
        <label htmlFor="password">{t('login_password', locale)}</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" />
      </div>
      <button type="submit" className="btn btn-primary btn-block" disabled={pending}>
        {pending ? (
          <>
            <span className="spinner" /> {t('login_signing_in', locale)}
          </>
        ) : (
          t('login_submit', locale)
        )}
      </button>
    </form>
  );
}
