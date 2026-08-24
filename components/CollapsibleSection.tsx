'use client';

import { useState, type ReactNode } from 'react';

export function CollapsibleSection({
  title,
  titleExtra,
  children,
  defaultOpen = true,
  allowOverflow = false,
  open: controlledOpen,
  onToggle
}: {
  title: string;
  titleExtra?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  allowOverflow?: boolean;
  /** When provided, the section is controlled by the parent (for exclusive
   *  accordion groups where only one can be open at a time). */
  open?: boolean;
  onToggle?: () => void;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  function toggle() {
    if (isControlled) onToggle?.();
    else setUncontrolledOpen((v) => !v);
  }

  return (
    <div className={`collapse${allowOverflow ? ' collapse-overflow' : ''}`}>
      <button
        type="button"
        className="collapse-head"
        onClick={toggle}
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
