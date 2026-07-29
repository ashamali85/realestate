'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { deleteRequest } from '@/lib/actions';
import { useConfirm } from './ConfirmDialog';
import { useLoading } from './LoadingOverlay';
import { IconEye, IconPencil, IconTrash } from './Icons';
import { t, type Locale } from '@/lib/i18n';

export type RequestRow = {
  id: string;
  reference: string;
  clientName: string;
  clientPhone: string;
  area: string;
  governorate: string;
  created: string; // pre-formatted (English) date
};

export function RequestsTable({
  rows,
  locale,
  governorates,
  areas,
  canDelete = false
}: {
  rows: RequestRow[];
  locale: Locale;
  governorates: string[];
  areas: string[];
  canDelete?: boolean;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const loading = useLoading();
  const [, startTransition] = useTransition();
  const [text, setText] = useState('');
  const [gov, setGov] = useState('');
  const [area, setArea] = useState('');

  async function onDelete(id: string) {
    const ok = await confirm({
      message: t('confirm_delete_request', locale),
      danger: true,
      confirmLabel: t('btn_delete', locale)
    });
    if (!ok) return;
    startTransition(async () => {
      await loading.run(async () => {
        const fd = new FormData();
        fd.append('id', id);
        fd.append('stay', '1'); // stay on the list instead of redirecting
        await deleteRequest(fd);
      }, t('loading', locale));
      router.refresh();
    });
  }

  const filtered = useMemo(() => {
    const needle = text.trim().toLowerCase();
    return rows.filter((r) => {
      if (gov && r.governorate !== gov) return false;
      if (area && r.area !== area) return false;
      if (needle) {
        const hay = `${r.reference} ${r.clientName} ${r.clientPhone}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [rows, text, gov, area]);

  // Areas shown in the dropdown narrow to the chosen governorate's set is not
  // trivially available here (we only have names), so all areas stay listed.

  const anyFilter = text || gov || area;

  return (
    <div className="stack" style={{ gap: 12 }}>
      <div className="filters">
        <input
          className="filter-input"
          placeholder={t('requests_search', locale)}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <select value={gov} onChange={(e) => setGov(e.target.value)}>
          <option value="">{t('col_governorate', locale)}: {t('filter_all', locale)}</option>
          {governorates.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <select value={area} onChange={(e) => setArea(e.target.value)}>
          <option value="">{t('col_area', locale)}: {t('filter_all', locale)}</option>
          {areas.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        {anyFilter && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setText('');
              setGov('');
              setArea('');
            }}
          >
            {t('filter_clear', locale)}
          </button>
        )}
      </div>

      <p className="small muted">
        {t('showing_n', locale)} {filtered.length} {t('of_n', locale)} {rows.length}
      </p>

      <div className="table-card scroll-area requests-scroll">
        <table>
          <thead>
            <tr>
              <th>{t('col_reference', locale)}</th>
              <th>{t('col_client', locale)}</th>
              <th>{t('col_area', locale)}</th>
              <th>{t('col_governorate', locale)}</th>
              <th>{t('col_created', locale)}</th>
              <th>{t('col_actions', locale)}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="center muted" style={{ padding: 32 }}>
                  {t('requests_empty', locale)}
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id}>
                  <td className="mono">{r.reference}</td>
                  <td>{r.clientName}</td>
                  <td>{r.area}</td>
                  <td>{r.governorate}</td>
                  <td className="small muted" dir="ltr">
                    {r.created}
                  </td>
                  <td>
                    <div className="row" style={{ gap: 6 }}>
                      <Link
                        href={`/requests/${r.id}`}
                        className="btn btn-ghost btn-icon btn-sm"
                        aria-label={t('btn_view', locale)}
                        title={t('btn_view', locale)}
                        onClick={() => loading.showForNavigation(t('loading', locale))}
                      >
                        <IconEye />
                      </Link>
                      <Link
                        href={`/requests/${r.id}/edit`}
                        className="btn btn-ghost btn-icon btn-sm"
                        aria-label={t('btn_edit', locale)}
                        title={t('btn_edit', locale)}
                        onClick={() => loading.showForNavigation(t('loading', locale))}
                      >
                        <IconPencil />
                      </Link>
                      {canDelete && (
                        <button
                          type="button"
                          className="btn btn-danger btn-icon btn-sm"
                          aria-label={t('btn_delete', locale)}
                          title={t('btn_delete', locale)}
                          onClick={() => onDelete(r.id)}
                        >
                          <IconTrash />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
