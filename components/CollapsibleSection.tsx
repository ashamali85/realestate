'use client';

import { useState, type ReactNode } from 'react';

export function CollapsibleSection({
  title,
  children,
  defaultOpen = true
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="collapse">
      <button
        type="button"
        className="collapse-head"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>{title}</span>
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
