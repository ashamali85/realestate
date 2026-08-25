'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { renameNavLink, moveNavLink } from '@/lib/nav-actions';
import { useLoading } from './LoadingOverlay';
import { t, type Locale } from '@/lib/i18n';

export type NavRow = { key: string; labelEn: string; labelAr: string };

export function NavManager({ rows, locale }: { rows: NavRow[]; locale: Locale }) {
  const router = useRouter();
  const loading = useLoading();
  const [, startTransition] = useTransition();

  function move(key: string, direction: 'up' | 'down') {
    startTransition(async () => {
      const fd = new FormData();
      fd.append('key', key);
      fd.append('direction', direction);
      await loading.runWithRefresh(() => moveNavLink(fd), () => router.refresh(), t('saving', locale));
    });
  }

  function rename(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await loading.runWithRefresh(() => renameNavLink(fd), () => router.refresh(), t('saving', locale));
    });
  }

  return (
    <div className="table-card">
      <table>
        <thead>
          <tr>
            <th style={{ width: 90 }}>{t('nav_order', locale)}</th>
            <th>{t('lookup_name_en', locale)}</th>
            <th>{t('lookup_name_ar', locale)}</th>
            <th style={{ width: 120 }}>{t('col_actions', locale)}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.key}>
              <td>
                <div className="row" style={{ gap: 4 }}>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    aria-label="move up"
                    disabled={i === 0}
                    onClick={() => move(row.key, 'up')}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    aria-label="move down"
                    disabled={i === rows.length - 1}
                    onClick={() => move(row.key, 'down')}
                  >
                    ↓
                  </button>
                </div>
              </td>
              <td colSpan={3}>
                <form onSubmit={rename} className="row wrap" style={{ gap: 8, alignItems: 'center' }}>
                  <input type="hidden" name="key" value={row.key} />
                  <input name="labelEn" defaultValue={row.labelEn} dir="ltr" required style={{ maxWidth: 220 }} />
                  <input name="labelAr" defaultValue={row.labelAr} dir="rtl" required style={{ maxWidth: 220 }} />
                  <button type="submit" className="btn btn-primary btn-sm">
                    {t('btn_save', locale)}
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
