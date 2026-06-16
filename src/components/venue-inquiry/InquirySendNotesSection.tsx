"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import type { InquiryLinkedSupplier } from "@/lib/inquiryLinkedSuppliers";

function IconVenue({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M9 9h.01M15 9h.01M9 13h.01M15 13h.01"
      />
    </svg>
  );
}

function IconSuppliers({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  );
}

function NoteCard({
  icon,
  title,
  badge,
  description,
  value,
  onChange,
  placeholder,
  accent,
  headerAction,
  footerNote,
}: {
  icon: ReactNode;
  title: string;
  badge?: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  accent: "emerald" | "amber";
  headerAction?: ReactNode;
  footerNote?: string;
}) {
  const accentStyles =
    accent === "emerald"
      ? {
          border: "border-emerald-950/15",
          gradient: "from-emerald-950/10 via-emerald-50/40 to-white",
          iconBg: "bg-emerald-950/10 text-emerald-950",
          focus:
            "focus:border-emerald-950/35 focus:ring-emerald-950/15 focus:shadow-[0_0_0_3px_rgba(15,59,46,0.08)]",
          badge: "border-emerald-950/20 bg-emerald-50 text-emerald-950",
        }
      : {
          border: "border-[#C9A227]/30",
          gradient: "from-amber-50/80 via-[#FFFCF5] to-white",
          iconBg: "bg-amber-400/20 text-amber-900",
          focus:
            "focus:border-amber-400 focus:ring-amber-400/25 focus:shadow-[0_0_0_3px_rgba(251,191,36,0.15)]",
          badge: "border-amber-300/60 bg-amber-50 text-amber-950",
        };

  return (
    <article
      className={`overflow-hidden rounded-2xl border bg-gradient-to-br shadow-[0_4px_24px_rgba(15,59,46,0.06)] ${accentStyles.border} ${accentStyles.gradient}`}
    >
      <div className="h-1 bg-gradient-to-l from-[#C9A227]/80 via-[#E8D5A3] to-transparent" aria-hidden />
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accentStyles.iconBg}`}
            >
              {icon}
            </span>
            <div className="min-w-0">
              <h3 className="font-serif text-sm font-semibold text-emerald-950">{title}</h3>
              <p className="mt-1 text-[11px] leading-relaxed text-neutral-600">{description}</p>
            </div>
          </div>
          {badge ? (
            <span
              className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${accentStyles.badge}`}
            >
              {badge}
            </span>
          ) : null}
        </div>
        {headerAction ? <div className="mt-3">{headerAction}</div> : null}
        <textarea
          rows={4}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`mt-4 w-full resize-y rounded-xl border border-neutral-200/90 bg-white/95 px-3.5 py-3 text-sm leading-relaxed text-neutral-800 outline-none transition placeholder:text-neutral-400 ${accentStyles.focus}`}
          placeholder={placeholder}
        />
        <p className="mt-2 text-[10px] text-neutral-500">
          {footerNote ?? "אופציונלי — אפשר להשאיר ריק"}
        </p>
      </div>
    </article>
  );
}

function SupplierPickerModal({
  open,
  suppliers,
  selectedIds,
  onClose,
  onChange,
}: {
  open: boolean;
  suppliers: InquiryLinkedSupplier[];
  selectedIds: number[];
  onClose: () => void;
  onChange: (ids: number[]) => void;
}) {
  const allSelected = suppliers.length > 0 && selectedIds.length === suppliers.length;

  if (!open) return null;

  function toggle(id: number) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="supplier-picker-title"
    >
      <div className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl">
        <div className="border-b border-neutral-100 px-4 py-3.5 sm:px-5">
          <h3 id="supplier-picker-title" className="font-serif text-base font-semibold text-emerald-950">
            בחירת ספקים להודעה
          </h3>
          <p className="mt-0.5 text-[11px] text-neutral-600">
            סמנו למי לשלוח את ההערות לספקים. שאר הספקים יישארו בבקשה בלי הודעה נפרדת.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-neutral-100 px-4 py-2.5 sm:px-5">
          <button
            type="button"
            onClick={() => onChange(suppliers.map((s) => s.serviceId))}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
              allSelected
                ? "bg-emerald-950 text-white"
                : "border border-neutral-200 bg-white text-neutral-700 hover:border-amber-400/50"
            }`}
          >
            שלח לכולם
          </button>
          <button
            type="button"
            onClick={() => onChange([])}
            className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-[11px] font-semibold text-neutral-700 hover:border-amber-400/50"
          >
            נקה בחירה
          </button>
        </div>

        <ul className="flex-1 overflow-y-auto px-2 py-2 sm:px-3">
          {suppliers.map((s) => {
            const checked = selectedIds.includes(s.serviceId);
            return (
              <li key={s.serviceId}>
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 transition ${
                    checked
                      ? "border-amber-300/70 bg-amber-50/60"
                      : "border-transparent hover:bg-neutral-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(s.serviceId)}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-neutral-300 text-emerald-950 focus:ring-amber-400"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-emerald-950">{s.name}</span>
                    <span className="mt-0.5 block text-[11px] text-neutral-600">
                      {s.providerName}
                      <span className="mx-1 text-neutral-400">·</span>
                      {s.source === "addon" ? "ספק נוסף" : "חלופה במאגר"}
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>

        <div className="border-t border-neutral-100 px-4 py-3 sm:px-5">
          <p className="mb-3 text-center text-[11px] text-neutral-600">
            נבחרו <strong>{selectedIds.length}</strong> מתוך {suppliers.length}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-emerald-950 py-2.5 text-sm font-semibold text-white hover:bg-[#164d3d]"
          >
            סיום
          </button>
        </div>
      </div>
    </div>
  );
}

type Props = {
  venueMessage: string;
  supplierMessage: string;
  linkedSuppliers: InquiryLinkedSupplier[];
  selectedSupplierIds: number[];
  onVenueMessageChange: (value: string) => void;
  onSupplierMessageChange: (value: string) => void;
  onSelectedSupplierIdsChange: (ids: number[]) => void;
};

export default function InquirySendNotesSection({
  venueMessage,
  supplierMessage,
  linkedSuppliers,
  selectedSupplierIds,
  onVenueMessageChange,
  onSupplierMessageChange,
  onSelectedSupplierIdsChange,
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const hasSuppliers = linkedSuppliers.length > 0;

  const selectedCount = useMemo(
    () => selectedSupplierIds.filter((id) => linkedSuppliers.some((s) => s.serviceId === id)).length,
    [selectedSupplierIds, linkedSuppliers]
  );

  const allSelected = hasSuppliers && selectedCount === linkedSuppliers.length;

  return (
    <section className="overflow-hidden rounded-2xl border border-[#E8E0D4] bg-gradient-to-b from-[#FFFCF7] to-white shadow-[0_8px_32px_rgba(15,59,46,0.07)]">
      <div className="border-b border-[#C9A227]/20 bg-emerald-950/[0.04] px-4 py-3.5 sm:px-5">
        <p className="font-serif text-base font-semibold text-emerald-950">הודעות אישיות</p>
        <p className="mt-0.5 text-[11px] text-neutral-600">
          דגשים נפרדים לבעל האולם ולספקים — כל אחד יראה רק את מה שרלוונטי אליו.
        </p>
      </div>

      <div
        className={`grid gap-4 p-4 sm:p-5 ${hasSuppliers ? "lg:grid-cols-2" : ""}`}
      >
        <NoteCard
          accent="emerald"
          icon={<IconVenue className="h-5 w-5" />}
          title="הערות לבעל האולם"
          description="תפריט, לוח זמנים, העדפות מיוחדות לאירוע באולם."
          value={venueMessage}
          onChange={onVenueMessageChange}
          placeholder="לדוגמה: מעדיפים ארוחה חלבית, כניסה בשעה 19:00..."
        />

        {hasSuppliers ? (
          <NoteCard
            accent="amber"
            icon={<IconSuppliers className="h-5 w-5" />}
            title="הערות לספקים"
            badge={
              allSelected
                ? `${linkedSuppliers.length} ספקים`
                : `${selectedCount}/${linkedSuppliers.length} ספקים`
            }
            description={
              selectedCount > 0
                ? `ההודעה תישלח ל-${selectedCount} ספקים שבחרתם.`
                : "לא נבחרו ספקים — ההודעה לא תישלח לאף ספק."
            }
            value={supplierMessage}
            onChange={onSupplierMessageChange}
            placeholder="לדוגמה: סגנון רומנטי, הגעה לפני האורחים, צבעים לבן וזהב..."
            headerAction={
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="flex w-full items-center justify-between gap-2 rounded-xl border border-amber-300/60 bg-white/90 px-3 py-2.5 text-right text-xs font-semibold text-amber-950 shadow-sm transition hover:border-amber-400 hover:bg-amber-50/80"
              >
                <span>בחרו ספקים לשליחה</span>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] tabular-nums">
                  {allSelected ? "כולם" : `${selectedCount} נבחרו`}
                </span>
              </button>
            }
            footerNote={
              selectedCount === 0
                ? "בחרו לפחות ספק אחד כדי לשלוח הודעה — או השאירו ריק."
                : "אופציונלי — אפשר להשאיר ריק"
            }
          />
        ) : (
          <div className="flex items-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/80 px-4 py-5 text-center lg:col-span-1">
            <p className="w-full text-[11px] leading-relaxed text-neutral-600">
              לא בחרתם ספקים מהמאגר בשלבים הקודמים — אין צורך בהערות לספקים.
              <br />
              <span className="text-neutral-500">
                אם תוסיפו חלופה או ספק נוסף, השדה יופיע כאן.
              </span>
            </p>
          </div>
        )}
      </div>

      <SupplierPickerModal
        open={pickerOpen}
        suppliers={linkedSuppliers}
        selectedIds={selectedSupplierIds}
        onClose={() => setPickerOpen(false)}
        onChange={onSelectedSupplierIdsChange}
      />
    </section>
  );
}
