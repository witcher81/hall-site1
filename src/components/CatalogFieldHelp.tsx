"use client";

import type { ReactNode } from "react";

type Props = {
  label: string;
  help?: string;
  children: ReactNode;
  className?: string;
};

/** תווית שדה + הסבר קצר מתחתיה */
export default function CatalogFieldHelp({
  label,
  help,
  children,
  className = "",
}: Props) {
  return (
    <div className={className}>
      <span className="block text-[11px] font-medium text-neutral-700">{label}</span>
      {help ? (
        <p className="mt-0.5 text-[10px] leading-relaxed text-neutral-500">{help}</p>
      ) : null}
      <div className="mt-1">{children}</div>
    </div>
  );
}

type ExplainerProps = {
  title?: string;
  children: ReactNode;
  className?: string;
};

/** תיבת הסבר לבלוק שלם */
export function CatalogSectionExplainer({
  title,
  children,
  className = "",
}: ExplainerProps) {
  return (
    <div
      className={`rounded-lg border border-sky-100 bg-sky-50/70 px-3 py-2 text-[10px] leading-relaxed text-neutral-700 ${className}`}
    >
      {title ? <p className="mb-1 font-semibold text-sky-950">{title}</p> : null}
      {children}
    </div>
  );
}
