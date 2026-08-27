'use client';

/**
 * On a report page: shows a floating "Print / Save as PDF" button. The print
 * dialog opens ONLY when the user clicks it — the report displays normally
 * until then (no auto-print on load).
 */
export function ReportPrintTrigger() {
  return (
    <button type="button" className="report-print-btn no-print" onClick={() => window.print()}>
      🖨️ Print / Save as PDF
    </button>
  );
}
