"use client";

import {
  CATEGORY_VALUE_SEPARATOR,
  FREELANCER_CATEGORY_GROUPS,
} from "@/lib/freelancerServiceCategories";
import { useMemo, useState } from "react";

type Props = {
  primaryValue: string;
  secondaryValue: string;
  onChange: (next: { primary: string; secondary: string }) => void;
  label?: string;
};

export default function FreelancerCategoryTreePicker({
  primaryValue,
  secondaryValue,
  onChange,
  label = "קטגוריה ראשית ומשנית",
}: Props) {
  const OTHER_PRIMARY = "אחר";
  const [open, setOpen] = useState(false);
  const [expandedPrimary, setExpandedPrimary] = useState(
    FREELANCER_CATEGORY_GROUPS.some((g) => g.primary === primaryValue)
      ? primaryValue
      : OTHER_PRIMARY
  );
  const [query, setQuery] = useState("");
  const [customSecondaryDraftByPrimary, setCustomSecondaryDraftByPrimary] =
    useState<Record<string, string>>({});
  const [customOtherPrimary, setCustomOtherPrimary] = useState(
    primaryValue && !FREELANCER_CATEGORY_GROUPS.some((g) => g.primary === primaryValue)
      ? primaryValue
      : ""
  );
  const [customOtherSecondary, setCustomOtherSecondary] = useState(
    primaryValue === OTHER_PRIMARY || customOtherPrimary ? secondaryValue : ""
  );

  const displayValue = useMemo(() => {
    if (!primaryValue) return "בחר קטגוריה";
    if (!secondaryValue) return primaryValue;
    return `${primaryValue}${CATEGORY_VALUE_SEPARATOR}${secondaryValue}`;
  }, [primaryValue, secondaryValue]);

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FREELANCER_CATEGORY_GROUPS;
    return FREELANCER_CATEGORY_GROUPS.filter((g) => {
      if (g.primary.toLowerCase().includes(q) || g.primary.includes(query.trim())) {
        return true;
      }
      return g.services.some(
        (s) => s.toLowerCase().includes(q) || s.includes(query.trim())
      );
    });
  }, [query]);

  return (
    <div>
      <label className="block text-xs font-medium text-neutral-600">{label}</label>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-1 flex w-full items-center justify-between rounded-xl border border-neutral-200 bg-white px-3 py-2 text-right text-sm text-neutral-900 outline-none hover:border-amber-400/70 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40"
      >
        <span>{displayValue}</span>
        <span className="text-xs text-neutral-600">פתח רשימה</span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-neutral-200 bg-white p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-emerald-950">
                בחירת קטגוריה ראשית ותת־קטגוריה
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onChange({ primary: "", secondary: "" });
                    setExpandedPrimary("");
                    setQuery("");
                    setOpen(false);
                  }}
                  className="rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-600 hover:bg-neutral-50"
                >
                  נקה בחירה
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-600 hover:bg-neutral-50"
                >
                  סגור
                </button>
              </div>
            </div>

            <input
              type="text"
              dir="rtl"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="חיפוש קטגוריה או שירות..."
              className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40"
            />

            <div className="mt-3 max-h-[58vh] overflow-y-auto rounded-xl border border-[#E8E0D4] bg-neutral-50/70 p-2">
              <div className="space-y-2">
                {filteredGroups.map((group) => {
                  const expanded = expandedPrimary === group.primary;
                  const isPrimarySelected =
                    primaryValue === group.primary && !secondaryValue;
                  return (
                    <div
                      key={group.primary}
                      className="rounded-xl border border-neutral-200 bg-white"
                    >
                      <div className="flex items-center gap-2 p-2">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedPrimary((p) =>
                              p === group.primary ? "" : group.primary
                            )
                          }
                          className="rounded-lg border border-neutral-200 px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-50"
                          aria-label="פתיחה וסגירה"
                        >
                          {expanded ? "−" : "+"}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onChange({ primary: group.primary, secondary: "" })
                          }
                          className={`flex-1 rounded-lg px-3 py-2 text-right text-sm ${
                            isPrimarySelected
                              ? "bg-[#FFF7DD] text-emerald-950"
                              : "text-neutral-900 hover:bg-neutral-50"
                          }`}
                        >
                          {group.primary}
                        </button>
                      </div>
                      {expanded ? (
                        <div className="border-t border-[#E8E0D4] p-2">
                          <p className="mb-2 text-[11px] text-neutral-600">
                            בחר תת־קטגוריה מתוך {group.primary}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {group.services.map((service) => {
                              const selected =
                                primaryValue === group.primary &&
                                secondaryValue === service;
                              return (
                                <button
                                  key={`${group.primary}-${service}`}
                                  type="button"
                                  onClick={() => {
                                    onChange({
                                      primary: group.primary,
                                      secondary: service,
                                    });
                                    setOpen(false);
                                    setQuery("");
                                  }}
                                  className={`rounded-full border px-3 py-1.5 text-xs ${
                                    selected
                                      ? "border-[#C9A227] bg-[#FFF7DD] text-emerald-950"
                                      : "border-neutral-200 bg-white text-neutral-900 hover:border-amber-400/70"
                                  }`}
                                >
                                  {service}
                                </button>
                              );
                            })}
                          </div>
                          <div className="mt-3 rounded-lg border border-[#E8E0D4] bg-neutral-50 p-2">
                            <p className="mb-1 text-[11px] text-neutral-600">
                              תת־קטגוריה מותאמת אישית
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                              <input
                                type="text"
                                dir="rtl"
                                value={customSecondaryDraftByPrimary[group.primary] ?? ""}
                                onChange={(e) =>
                                  setCustomSecondaryDraftByPrimary((prev) => ({
                                    ...prev,
                                    [group.primary]: e.target.value,
                                  }))
                                }
                                className="min-w-0 flex-1 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-900 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40"
                                placeholder={`כתוב תת־קטגוריה מותאמת עבור ${group.primary}`}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const custom = (
                                    customSecondaryDraftByPrimary[group.primary] ?? ""
                                  ).trim();
                                  if (!custom) return;
                                  onChange({
                                    primary: group.primary,
                                    secondary: custom,
                                  });
                                  setOpen(false);
                                  setQuery("");
                                }}
                                className="rounded-full border border-emerald-950/30 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-950 hover:bg-neutral-50"
                              >
                                שמור תת־קטגוריה
                              </button>
                            </div>
                          </div>
                          {group.primary === OTHER_PRIMARY ? (
                            <div className="mt-3 rounded-lg border border-amber-200/80 bg-amber-50/40 p-2">
                              <p className="mb-1 text-[11px] text-amber-900/90">
                                אחר בהתאמה אישית (קטגוריה ראשית + תת־קטגוריה)
                              </p>
                              <div className="grid gap-2 sm:grid-cols-2">
                                <input
                                  type="text"
                                  dir="rtl"
                                  value={customOtherPrimary}
                                  onChange={(e) => setCustomOtherPrimary(e.target.value)}
                                  className="rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs text-neutral-900 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-300/40"
                                  placeholder="קטגוריה ראשית משלך"
                                />
                                <input
                                  type="text"
                                  dir="rtl"
                                  value={customOtherSecondary}
                                  onChange={(e) => setCustomOtherSecondary(e.target.value)}
                                  className="rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs text-neutral-900 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-300/40"
                                  placeholder="תת־קטגוריה משלך"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const p = customOtherPrimary.trim();
                                  const s = customOtherSecondary.trim();
                                  if (!p || !s) return;
                                  onChange({ primary: p, secondary: s });
                                  setOpen(false);
                                  setQuery("");
                                }}
                                className="mt-2 rounded-full border border-amber-700/35 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-50"
                              >
                                שמור קטגוריה ותת־קטגוריה אישיות
                              </button>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
              {filteredGroups.length === 0 ? (
                <p className="p-3 text-xs text-neutral-600">לא נמצאו תוצאות לחיפוש הזה.</p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

