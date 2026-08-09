'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from './Modal';
import { IconReport } from './Icons';
import { useLoading } from './LoadingOverlay';
import { t, type Locale } from '@/lib/i18n';

/**
 * Export-report action for a request row. Opens a dialog to choose between the
 * General and Detailed reports, then navigates to the print-ready report page
 * (which the user saves as PDF via the browser).
 */
export function ReportButton({ requestId, locale }: { requestId: string; locale: Locale }) {
  const router = useRouter();
  const loading = useLoading();
  const [open, setOpen] = useState(false);

  function go(kind: 'general' | 'detailed') {
    setOpen(false);
    loading.showForNavigation(t('loading', locale));
    // Open the print-ready report in a new tab so the list stays put.
    window.open(`/requests/${requestId}/report/${kind}`, '_blank', 'noopener');
    loading.hide();
  }

  return (
    <>
      <button
        type="button"
        className="btn btn-ghost btn-icon btn-sm"
        aria-label={t('report_export', locale)}
        title={t('report_export', locale)}
        onClick={() => setOpen(true)}
      >
        <IconReport />
      </button>

      {open && (
        <Modal title={t('report_choose_title', locale)} onClose={() => setOpen(false)}>
          <div className="report-choices">
            <button type="button" className="report-choice" onClick={() => go('general')}>
              <span className="report-choice-icon" aria-hidden="true">📄</span>
              <span className="report-choice-name">{t('report_general', locale)}</span>
              <span className="report-choice-desc">{t('report_general_desc', locale)}</span>
            </button>
            <button type="button" className="report-choice" onClick={() => go('detailed')}>
              <span className="report-choice-icon" aria-hidden="true">📑</span>
              <span className="report-choice-name">{t('report_detailed', locale)}</span>
              <span className="report-choice-desc">{t('report_detailed_desc', locale)}</span>
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
