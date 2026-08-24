'use client';

import { useState, type ReactNode } from 'react';

export function CollapsibleSection({
  title,
  titleExtra,
  children,
  defaultOpen = true,
  allowOverflow = false
}: {
  title: string;
  titleExtra?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  allowOverflow?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`collapse${allowOverflow ? ' collapse-overflow' : ''}`}>
      <button
        type="button"
        className="collapse-head"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="collapse-title">
          <span>{title}</span>
          {titleExtra}
        </span>
        <span className={`collapse-chevron ${open ? 'open' : ''}`} aria-hidden="true">
          ▾
        </span>
      </button>
      <div className="collapse-body" hidden={!open}>
        {children}
      </div>
    </div>
  );
}
