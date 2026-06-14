"use client";

import type { KeyboardEvent, ReactNode } from "react";

export function VenueAddItemsPanel({
  hint,
  children,
}: {
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mb-3 rounded-xl border border-neutral-200/90 bg-white/70 p-3">
      {hint ? (
        <p className="mb-2 text-[11px] leading-relaxed text-neutral-600">{hint}</p>
      ) : null}
      {children}
    </div>
  );
}

export function VenueAddItemsInputRow({
  value,
  onChange,
  onAdd,
  placeholder,
  maxLength,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  onAdd: () => void;
  placeholder: string;
  maxLength?: number;
  disabled?: boolean;
}) {
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onAdd();
    }
  };

  return (
    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        disabled={disabled}
        className="min-w-0 flex-1 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-900 outline-none focus:border-amber-400 disabled:opacity-50"
        placeholder={placeholder}
        maxLength={maxLength}
      />
      <button
        type="button"
        onClick={onAdd}
        disabled={disabled}
        className="shrink-0 rounded-xl border border-[#D4C9BC] px-3 py-2 text-xs text-neutral-800 hover:bg-neutral-50 disabled:opacity-50"
      >
        הוסף
      </button>
    </div>
  );
}

export function VenueItemsTable({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200/90 bg-white">
      <div className="divide-y divide-neutral-200/70">{children}</div>
    </div>
  );
}

export function VenueItemsTableRow({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex min-w-0 flex-col gap-2 px-3 py-2.5 text-xs text-neutral-800 sm:flex-row sm:flex-wrap sm:items-center ${className}`}
    >
      {children}
    </div>
  );
}

export function VenueItemsTableRemoveButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="shrink-0 text-[11px] text-neutral-600 underline-offset-2 hover:text-neutral-900 hover:underline sm:ms-auto"
      onClick={onClick}
    >
      {label}
    </button>
  );
}
