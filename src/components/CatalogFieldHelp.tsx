"use client";

import { useState, type ReactNode } from "react";

type Props = {
  label: string;
  help?: string;
  children: ReactNode;
  className?: string;
};

/** תווית שדה; הסבר נפתח בלחיצה על ? כדי לא לעמוס את הטופס */
export default function CatalogFieldHelp({
  label,
  help,
  children,
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-2">
        <span className="block text-[11px] font-medium text-neutral-700">{label}</span>
        {help ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-[10px] font-bold text-neutral-500 hover:border-amber-300 hover:text-amber-800"
            aria-expanded={open}
            aria-label={open ? "הסתר הסבר" : "הצג הסבר"}
            title={open ? "הסתר הסבר" : "מה למלא כאן?"}
          >
            ?
          </button>
        ) : null}
      </div>
      {help && open ? (
        <p className="mt-1 rounded-md bg-neutral-50 px-2 py-1.5 text-[10px] leading-relaxed text-neutral-600">
          {help}
        </p>
      ) : null}
      <div className="mt-1">{children}</div>
    </div>
  );
}

type ExplainerProps = {
  title?: string;
  children: ReactNode;
  className?: string;
  /** ברירת מחדל: סגור — נפתח בלחיצה */
  defaultOpen?: boolean;
};

/** תיבת הסבר לבלוק — סגורה כברירת מחדל */
export function CatalogSectionExplainer({
  title,
  children,
  className = "",
  defaultOpen = false,
}: ExplainerProps) {
  const [open, setOpen] = useState(defaultOpen);
  const label = title?.trim() || "מה זה?";

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-800 underline decoration-sky-300/70 underline-offset-2 hover:text-sky-950"
        aria-expanded={open}
      >
        {open ? "הסתר הסבר" : label}
      </button>
      {open ? (
        <div className="mt-1.5 rounded-lg border border-sky-100 bg-sky-50/70 px-3 py-2 text-[10px] leading-relaxed text-neutral-700">
          {title && title !== label ? (
            <p className="mb-1 font-semibold text-sky-950">{title}</p>
          ) : null}
          {children}
        </div>
      ) : null}
    </div>
  );
}
