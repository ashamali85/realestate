'use client';

import { useActionState, useState } from 'react';
import { createUser, setUserActive, resetUserPassword, type UserFormState } from '@/lib/user-actions';
import { t, type Locale } from '@/lib/i18n';

export type UserRow = {
  id: string;
  name: string;
  username: string;
  role: string;
  isActive: boolean;
  isSelf: boolean;
};

const initial: UserFormState = {};

export function UsersManager({ rows, locale }: { rows: UserRow[]; locale: Locale }) {
  const [state, formAction, pending] = useActionState(createUser, initial);
  const [adding, setAdding] = useState(false);
  const [resetId, setResetId] = useState<string | null>(null);

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="row-between">
        <span className="muted small">{t('users_intro', locale)}</span>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => setAdding((v) => !v)}>
          {adding ? t('btn_cancel', locale) : t('user_add', locale)}
        </button>
      </div>

      {adding && (
        <div className="card">
          <h3 style={{ marginBottom: 12 }}>{t('user_add', locale)}</h3>
          {state.error && <div className="alert alert-error">{t(state.error, locale)}</div>}
          {state.ok && <div className="alert alert-ok">{t(state.ok, locale)}</div>}
          <form action={formAction}>
            <div className="grid-2">
              <div className="field">
                <label htmlFor="name">{t('u_name', locale)}</label>
                <input id="name" name="name" required maxLength={120} />
              </div>
              <div className="field">
                <label htmlFor="username">{t('u_username', locale)}</label>
                <input id="username" name="username" required dir="ltr" maxLength={40} />
              </div>
            </div>
            <div className="grid-2">
              <div className="field">
                <label htmlFor="role">{t('u_role', locale)}</label>
                <select id="role" name="role" defaultValue="INSPECTOR">
                  <option value="INSPECTOR">{t('u_role_inspector', locale)}</option>
                  <option value="SUPER_ADMIN">{t('u_role_super', locale)}</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="password">{t('u_password', locale)}</label>
                <input id="password" name="password" type="password" required minLength={8} dir="ltr" />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={pending}>
              {pending ? <><span className="spinner" /> {t('btn_saving', locale)}</> : t('btn_add', locale)}
            </button>
          </form>
        </div>
      )}

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>{t('u_name', locale)}</th>
              <th>{t('u_username', locale)}</th>
              <th>{t('u_role', locale)}</th>
              <th>{t('user_status', locale)}</th>
              <th>{t('col_actions', locale)}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className={u.isActive ? '' : 'row-inactive'}>
                <td>
                  {u.name}
                  {u.isSelf && <span className="badge badge-inspector" style={{ marginInlineStart: 6 }}>{t('user_self_note', locale)}</span>}
                </td>
                <td dir="ltr">{u.username}</td>
                <td>
                  {u.role === 'SUPER_ADMIN' ? (
                    <span className="badge badge-super">{t('u_role_super', locale)}</span>
                  ) : (
                    <span className="badge badge-inspector">{t('u_role_inspector', locale)}</span>
                  )}
                </td>
                <td>
                  {u.isActive ? (
                    <span className="badge badge-super">{t('lookup_active', locale)}</span>
                  ) : (
                    <span className="badge badge-off">{t('user_inactive', locale)}</span>
                  )}
                </td>
                <td>
                  <div className="row wrap" style={{ gap: 6 }}>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setResetId(resetId === u.id ? null : u.id)}>
                      {t('user_reset_password', locale)}
                    </button>
                    {!u.isSelf && (
                      <form action={setUserActive}>
                        <input type="hidden" name="id" value={u.id} />
                        <input type="hidden" name="active" value={String(!u.isActive)} />
                        <button type="submit" className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-ghost'}`}>
                          {u.isActive ? t('user_deactivate', locale) : t('user_activate', locale)}
                        </button>
                      </form>
                    )}
                  </div>
                  {resetId === u.id && (
                    <form action={resetUserPassword} className="row wrap mt-2" style={{ gap: 6 }}>
                      <input type="hidden" name="id" value={u.id} />
                      <input name="password" type="password" placeholder={t('user_new_password', locale)} minLength={8} required dir="ltr" style={{ maxWidth: 200 }} />
                      <button type="submit" className="btn btn-primary btn-sm">{t('btn_save', locale)}</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
