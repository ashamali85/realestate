'use client';

import { useEffect } from 'react';

/**
 * On a report page: shows a floating Print button (hidden when printing) and
 * auto-opens the browser's print dialog shortly after load, so the user can
 * save the report as PDF. Images are given a moment to load first.
 */
export function ReportPrintTrigger() {
  useEffect(() => {
    const imgs = Array.from(document.images);
    let done = false;
    const fire = () => {
      if (done) return;
      done = true;
      window.print();
    };
    // Wait for images (with a cap) so they appear in the PDF.
    Promise.all(
      imgs.map((img) =>
        img.complete
          ? Promise.resolve()
          : new Promise<void>((res) => {
              img.addEventListener('load', () => res());
              img.addEventListener('error', () => res());
            })
      )
    ).then(() => setTimeout(fire, 350));
    const safety = setTimeout(fire, 2500);
    return () => clearTimeout(safety);
  }, []);

  return (
    <button type="button" className="report-print-btn no-print" onClick={() => window.print()}>
      🖨️ Print / Save as PDF
    </button>
  );
}
