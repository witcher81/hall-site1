"use client";

import OptionalPriceRangeFields from "@/components/OptionalPriceRangeFields";

import {
  MAX_SERVICE_INCLUDE_ITEMS,
  type ServiceCustomInclude,
  type ServicePaidExtraItem,
} from "@/lib/serviceIncludes";
import { type Dispatch, type SetStateAction } from "react";

type Props = {
  /** פריטים הכלולים במחיר המוצג — לכל פריט שם + הסבר (אופציונלי) */
  customIncludes: ServiceCustomInclude[];
  onCustomIncludesChange: (v: ServiceCustomInclude[]) => void;
  /** שדרוגים / תוספות בתשלום נפרד */
  paidExtras: ServicePaidExtraItem[];
  onPaidExtrasChange: Dispatch<SetStateAction<ServicePaidExtraItem[]>>;
};

const MAX_LABEL = 80;
const MAX_ITEM_DESC = 280;

type PaidExtraPatch =
  | Partial<ServicePaidExtraItem>
  | ((row: ServicePaidExtraItem) => Partial<ServicePaidExtraItem>);

export default function ServiceIncludesEditor({
  customIncludes,
  onCustomIncludesChange,
  paidExtras,
  onPaidExtrasChange,
}: Props) {
  function addFreeItem() {
    if (customIncludes.length >= MAX_SERVICE_INCLUDE_ITEMS) return;
    onCustomIncludesChange([
      ...customIncludes,
      { label: "", checked: true, description: "" },
    ]);
  }

  function updateFreeItem(
    index: number,
    patch: Partial<ServiceCustomInclude>
  ) {
    onCustomIncludesChange(
      customIncludes.map((row, i) =>
        i === index ? { ...row, ...patch } : row
      )
    );
  }

  function removeFreeItem(index: number) {
    onCustomIncludesChange(customIncludes.filter((_, i) => i !== index));
  }

  function addPaidExtra() {
    if (paidExtras.length >= MAX_SERVICE_INCLUDE_ITEMS) return;
    onPaidExtrasChange([
      ...paidExtras,
      {
        label: "",
        description: "",
        usePriceRange: false,
        exactPrice: null,
        minPrice: null,
        maxPrice: null,
      },
    ]);
  }

  function updatePaidExtra(index: number, patch: PaidExtraPatch) {
    onPaidExtrasChange((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        const nextPatch = typeof patch === "function" ? patch(row) : patch;
        return { ...row, ...nextPatch };
      })
    );
  }

  function removePaidExtra(index: number) {
    onPaidExtrasChange(paidExtras.filter((_, i) => i !== index));
  }

  function parsePriceInput(v: string): number | null {
    const t = v.trim();
    if (!t) return null;
    const n = Number(t);
    if (!Number.isFinite(n) || n < 0) return null;
    return Math.trunc(n);
  }

  const input =
    "w-full rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-xs text-neutral-900 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40";
  const textarea =
    "mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-[11px] leading-relaxed text-neutral-900 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40";

  return (
    <div className="space-y-4 text-right">
      <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/60 p-4">
        <h3 className="text-sm font-semibold text-emerald-950">
          מה כלול בשירות
        </h3>
        <p className="mt-1 text-[11px] leading-relaxed text-neutral-600">
          פירטו מה הלקוח מקבל במחיר שמוצג — לכל פריט שם והסבר קצר.
        </p>

        <div className="mt-4">
          <p className="text-[11px] font-medium text-neutral-600">
            מה ניתן במחיר המוצג (ללא תוספת תשלום)
          </p>
          <p className="mt-0.5 text-[10px] text-[#9A948C]">
            לכל שורה: שם הפריט, ומתחת הסבר קצר למה הלקוח מקבל.
          </p>
          <ul className="mt-2 space-y-3">
            {customIncludes.map((row, index) => (
              <li
                key={index}
                className="rounded-lg border border-neutral-200/50 bg-white/90 p-2.5"
              >
                <div className="flex flex-wrap items-start gap-2">
                  <input
                    type="text"
                    dir="rtl"
                    maxLength={MAX_LABEL}
                    value={row.label}
                    onChange={(e) =>
                      updateFreeItem(index, {
                        label: e.target.value.slice(0, MAX_LABEL),
                      })
                    }
                    className={input}
                    placeholder="למשל: עריכת וידאו בסיסית"
                  />
                </div>
                <textarea
                  dir="rtl"
                  rows={2}
                  maxLength={MAX_ITEM_DESC}
                  value={row.description ?? ""}
                  onChange={(e) =>
                    updateFreeItem(index, {
                      description: e.target.value.slice(0, MAX_ITEM_DESC),
                    })
                  }
                  placeholder="הסבר על מה כלול בפריט הזה"
                  className={textarea}
                />
                <div className="mt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeFreeItem(index)}
                    className="rounded-full border border-red-200 bg-white px-3 py-1 text-[11px] text-red-700 hover:bg-red-50"
                  >
                    הסרה
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={addFreeItem}
            disabled={customIncludes.length >= MAX_SERVICE_INCLUDE_ITEMS}
            className="mt-2 rounded-full border border-dashed border-emerald-950/35 bg-white px-3 py-1.5 text-[11px] font-medium text-emerald-950 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            + הוסף פריט ללא תוספת תשלום ({customIncludes.length})
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-amber-200/90 bg-amber-50/45 p-4">
        <h3 className="text-sm font-semibold text-amber-900">
          תוספות בתשלום נפרד
        </h3>
        <p className="mt-1 text-[11px] leading-relaxed text-amber-900/80">
          כאן מוסיפים רק פריטים שאינם כלולים במחיר הבסיס.
        </p>

        <div className="mt-3 border-t border-amber-200/80 pt-3">
          <p className="text-[11px] font-medium text-amber-900">
            ניתן בתוספת תשלום
          </p>
          <p className="mt-0.5 text-[10px] text-amber-900/75">
            פריטים או תוספות שהלקוח יכול לקבל מעבר למחיר הבסיס — עם הסבר לכל שורה.
          </p>
          <ul className="mt-2 space-y-3">
            {paidExtras.map((row, index) => (
              <li
                key={index}
                className="rounded-lg border border-amber-200/80 bg-white/85 p-2.5"
              >
                <>
                <div className="flex flex-wrap items-start gap-2">
                  <input
                    type="text"
                    dir="rtl"
                    maxLength={MAX_LABEL}
                    value={row.label}
                    onChange={(e) =>
                      updatePaidExtra(index, {
                        label: e.target.value.slice(0, MAX_LABEL),
                      })
                    }
                    className={input}
                    placeholder="למשל: צילום מגנטים לאירוע"
                  />
                </div>
                <textarea
                  dir="rtl"
                  rows={2}
                  maxLength={MAX_ITEM_DESC}
                  value={row.description ?? ""}
                  onChange={(e) =>
                    updatePaidExtra(index, {
                      description: e.target.value.slice(0, MAX_ITEM_DESC),
                    })
                  }
                  placeholder="מה כולל התוספת ואיך נקבע המחיר"
                  className={textarea}
                />
                <div className="mt-2 rounded-lg border border-amber-200/60 bg-amber-50/40 p-2">
                  <OptionalPriceRangeFields
                    useRange={row.usePriceRange === true}
                    onUseRangeChange={(useRange) => {
                      updatePaidExtra(index, (row) => {
                        if (useRange) {
                          const ex = row.exactPrice;
                          return {
                            usePriceRange: true,
                            exactPrice: null,
                            minPrice: ex ?? row.minPrice ?? null,
                            maxPrice: ex ?? row.maxPrice ?? null,
                          };
                        }
                        const exact =
                          row.minPrice != null &&
                          row.maxPrice != null &&
                          row.minPrice === row.maxPrice
                            ? row.minPrice
                            : row.minPrice ?? row.maxPrice ?? null;
                        return {
                          usePriceRange: false,
                          exactPrice: exact,
                          minPrice: null,
                          maxPrice: null,
                        };
                      });
                    }}
                    minPrice={
                      row.usePriceRange
                        ? row.minPrice != null
                          ? String(row.minPrice)
                          : ""
                        : row.exactPrice != null
                          ? String(row.exactPrice)
                          : ""
                    }
                    maxPrice={
                      row.usePriceRange
                        ? row.maxPrice != null
                          ? String(row.maxPrice)
                          : ""
                        : row.exactPrice != null
                          ? String(row.exactPrice)
                          : ""
                    }
                    onChange={(min, max) => {
                      updatePaidExtra(index, (row) => {
                        if (row.usePriceRange) {
                          return {
                            minPrice: parsePriceInput(min),
                            maxPrice: parsePriceInput(max),
                          };
                        }
                        return { exactPrice: parsePriceInput(min) };
                      });
                    }}
                    singleLabel="מחיר מדויק (₪)"
                    singlePlaceholder="למשל: 500"
                    minLabel="מינימום (₪)"
                    maxLabel="מקסימום (₪)"
                    expandRangeLabel="אין לי מחיר מדויק — אציג טווח מחירים"
                    collapseRangeLabel="יש לי מחיר קבוע"
                    inputClassName={`${input} mt-1`}
                  />
                </div>
                <div className="mt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removePaidExtra(index)}
                    className="rounded-full border border-red-200 bg-white px-3 py-1 text-[11px] text-red-700 hover:bg-red-50"
                  >
                    הסרה
                  </button>
                </div>
                </>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={addPaidExtra}
            disabled={paidExtras.length >= MAX_SERVICE_INCLUDE_ITEMS}
            className="mt-2 rounded-full border border-dashed border-amber-700/35 bg-white px-3 py-1.5 text-[11px] font-medium text-amber-900/90 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            + הוסף תוספת בתשלום ({paidExtras.length})
          </button>
        </div>
      </div>
    </div>
  );
}
