"use client";

import OptionalPriceRangeFields from "@/components/OptionalPriceRangeFields";
import {
  createEmptyMenuItem,
  createEmptyMenuPackage,
  createEmptyMenuSection,
  MAX_MENU_ITEMS_PER_SECTION,
  MAX_MENU_PACKAGES,
  MAX_MENU_SECTIONS,
  type ServiceMenuConfig,
  type ServiceMenuItem,
  type ServiceMenuItemPricing,
  type ServiceMenuPackage,
  type ServiceMenuSection,
} from "@/lib/serviceMenu";

type Props = {
  value: ServiceMenuConfig;
  onChange: (next: ServiceMenuConfig) => void;
};

const PRICING_LABELS: Record<ServiceMenuItemPricing, string> = {
  included: "כלול בחבילה (ללא תוספת)",
  per_guest: "תוספת לאורח (₪)",
  per_guest_range: "תוספת לאורח — טווח",
  fixed: "מחיר קבוע לאירוע (₪)",
};

const input =
  "w-full rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-xs text-neutral-900 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40";
const textarea =
  "mt-1 w-full rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-[11px] leading-relaxed text-neutral-900 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40";

function parsePriceInput(v: string): number | null {
  const t = v.trim();
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.trunc(n);
}

export default function ServiceMenuEditor({ value, onChange }: Props) {
  function patchMenu(patch: Partial<ServiceMenuConfig>) {
    onChange({ ...value, ...patch });
  }

  function updateSection(index: number, patch: Partial<ServiceMenuSection>) {
    patchMenu({
      sections: value.sections.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    });
  }

  function updateItem(
    sectionIndex: number,
    itemIndex: number,
    patch: Partial<ServiceMenuItem>
  ) {
    const sections = value.sections.map((sec, si) => {
      if (si !== sectionIndex) return sec;
      return {
        ...sec,
        items: sec.items.map((item, ii) =>
          ii === itemIndex ? { ...item, ...patch } : item
        ),
      };
    });
    patchMenu({ sections });
  }

  function updatePackage(index: number, patch: Partial<ServiceMenuPackage>) {
    patchMenu({
      packages: value.packages.map((p, i) => (i === index ? { ...p, ...patch } : p)),
    });
  }

  return (
    <div className="space-y-4 text-right">
      <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-4">
        <h3 className="text-sm font-semibold text-emerald-950">קיבולת אורחים</h3>
        <p className="mt-1 text-[11px] leading-relaxed text-neutral-600">
          כמה אורחים אתם מכינים לאירוע — חובה כדי שהלקוח יידע אם אתם מתאימים וכמה מנות
          להכין.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="block text-[11px] font-medium text-neutral-600">
              מינימום אורחים *
            </label>
            <input
              type="number"
              min={1}
              value={value.minGuests ?? ""}
              onChange={(e) =>
                patchMenu({
                  minGuests: parsePriceInput(e.target.value),
                })
              }
              className={`${input} mt-1`}
              placeholder="למשל 30"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-neutral-600">
              מקסימום אורחים *
            </label>
            <input
              type="number"
              min={1}
              value={value.maxGuests ?? ""}
              onChange={(e) =>
                patchMenu({
                  maxGuests: parsePriceInput(e.target.value),
                })
              }
              className={`${input} mt-1`}
              placeholder="למשל 500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-neutral-600">
              מינימום הזמנה (₪)
            </label>
            <input
              type="number"
              min={0}
              value={value.minOrderAmountNis ?? ""}
              onChange={(e) =>
                patchMenu({
                  minOrderAmountNis: parsePriceInput(e.target.value),
                })
              }
              className={`${input} mt-1`}
              placeholder="אופציונלי"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-amber-200/90 bg-amber-50/45 p-4">
        <h3 className="text-sm font-semibold text-amber-900">חבילות מחיר</h3>
        <p className="mt-1 text-[11px] leading-relaxed text-amber-900/80">
          חבילות מוכנות עם מחיר לאורח — למשל «כסף», «זהב», «מנה בסיסית».
        </p>
        <ul className="mt-3 space-y-3">
          {value.packages.map((pkg, index) => (
            <li
              key={pkg.id}
              className="rounded-lg border border-amber-200/80 bg-white/85 p-3"
            >
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  type="text"
                  dir="rtl"
                  value={pkg.name}
                  onChange={(e) => updatePackage(index, { name: e.target.value })}
                  className={input}
                  placeholder="שם החבילה"
                />
                <OptionalPriceRangeFields
                  useRange={pkg.usePerGuestRange === true}
                  onUseRangeChange={(useRange) => {
                    const p = value.packages[index];
                    if (!p) return;
                    if (useRange) {
                      const ex = p.perGuestPrice;
                      updatePackage(index, {
                        usePerGuestRange: true,
                        perGuestPrice: null,
                        perGuestMin: ex ?? p.perGuestMin ?? null,
                        perGuestMax: ex ?? p.perGuestMax ?? null,
                      });
                      return;
                    }
                    const min = p.perGuestMin ?? p.perGuestPrice ?? null;
                    const max = p.perGuestMax ?? p.perGuestPrice ?? min;
                    const exact =
                      min != null && max != null && min === max
                        ? min
                        : min ?? max ?? null;
                    updatePackage(index, {
                      usePerGuestRange: false,
                      perGuestPrice: exact,
                      perGuestMin: null,
                      perGuestMax: null,
                    });
                  }}
                  minPrice={
                    pkg.usePerGuestRange
                      ? pkg.perGuestMin != null
                        ? String(pkg.perGuestMin)
                        : ""
                      : pkg.perGuestPrice != null
                        ? String(pkg.perGuestPrice)
                        : ""
                  }
                  maxPrice={
                    pkg.usePerGuestRange
                      ? pkg.perGuestMax != null
                        ? String(pkg.perGuestMax)
                        : ""
                      : pkg.perGuestPrice != null
                        ? String(pkg.perGuestPrice)
                        : ""
                  }
                  onChange={(min, max) => {
                    const p = value.packages[index];
                    if (!p) return;
                    if (p.usePerGuestRange) {
                      updatePackage(index, {
                        perGuestMin: parsePriceInput(min),
                        perGuestMax: parsePriceInput(max),
                      });
                      return;
                    }
                    updatePackage(index, {
                      perGuestPrice: parsePriceInput(min),
                    });
                  }}
                  singleLabel="מחיר לאורח (₪)"
                  singlePlaceholder="למשל 180"
                  minLabel="מינימום לאורח (₪)"
                  maxLabel="מקסימום לאורח (₪)"
                  expandRangeLabel="אין מחיר קבוע — אציג טווח לאורח"
                  collapseRangeLabel="יש מחיר קבוע לאורח"
                  inputClassName={`${input} mt-1`}
                />
              </div>
              <textarea
                dir="rtl"
                rows={2}
                value={pkg.description ?? ""}
                onChange={(e) =>
                  updatePackage(index, { description: e.target.value })
                }
                placeholder="מה כלול בחבילה (מנות, שירות, הגשה...)"
                className={textarea}
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() =>
                    patchMenu({
                      packages: value.packages.filter((_, i) => i !== index),
                    })
                  }
                  className="rounded-full border border-red-200 bg-white px-3 py-1 text-[11px] text-red-700 hover:bg-red-50"
                >
                  הסר חבילה
                </button>
              </div>
            </li>
          ))}
        </ul>
        <button
          type="button"
          disabled={value.packages.length >= MAX_MENU_PACKAGES}
          onClick={() =>
            patchMenu({
              packages: [...value.packages, createEmptyMenuPackage()],
            })
          }
          className="mt-2 rounded-full border border-dashed border-amber-700/35 bg-white px-3 py-1.5 text-[11px] font-medium text-amber-900/90 hover:bg-amber-50 disabled:opacity-50"
        >
          + הוסף חבילה ({value.packages.length})
        </button>
      </div>

      <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/60 p-4">
        <h3 className="text-sm font-semibold text-emerald-950">תפריט מנות</h3>
        <p className="mt-1 text-[11px] leading-relaxed text-neutral-600">
          קטגוריות ומנות — לכל מנה אפשר לציין אם היא כלולה בחבילה או בתוספת תשלום.
        </p>
        <div className="mt-3 space-y-3">
          {value.sections.map((section, sectionIndex) => (
            <div
              key={section.id}
              className="rounded-lg border border-neutral-200/80 bg-white p-3"
            >
              <input
                type="text"
                dir="rtl"
                value={section.title}
                onChange={(e) =>
                  updateSection(sectionIndex, { title: e.target.value })
                }
                className={input}
                placeholder="שם קטגוריה — למשל מנות ראשונות"
              />
              <ul className="mt-2 space-y-2">
                {section.items.map((item, itemIndex) => (
                  <li
                    key={item.id}
                    className="rounded-lg border border-neutral-200/60 bg-neutral-50/80 p-2"
                  >
                    <div className="flex flex-wrap gap-2">
                      <input
                        type="text"
                        dir="rtl"
                        value={item.label}
                        onChange={(e) =>
                          updateItem(sectionIndex, itemIndex, {
                            label: e.target.value,
                          })
                        }
                        className={`${input} min-w-[8rem] flex-1`}
                        placeholder="שם המנה"
                      />
                      <select
                        value={item.pricing}
                        onChange={(e) =>
                          updateItem(sectionIndex, itemIndex, {
                            pricing: e.target.value as ServiceMenuItemPricing,
                            exactPrice: null,
                            minPrice: null,
                            maxPrice: null,
                            usePriceRange: false,
                          })
                        }
                        className="rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-[11px] text-neutral-900"
                      >
                        {(Object.keys(PRICING_LABELS) as ServiceMenuItemPricing[]).map(
                          (k) => (
                            <option key={k} value={k}>
                              {PRICING_LABELS[k]}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                    {item.pricing !== "included" ? (
                      <div className="mt-2">
                        <OptionalPriceRangeFields
                          useRange={
                            item.usePriceRange === true ||
                            item.pricing === "per_guest_range"
                          }
                          onUseRangeChange={(useRange) => {
                            const row = value.sections[sectionIndex]?.items[itemIndex];
                            if (!row) return;
                            if (useRange) {
                              const ex = row.exactPrice;
                              updateItem(sectionIndex, itemIndex, {
                                usePriceRange: true,
                                pricing:
                                  row.pricing === "fixed" ? "fixed" : "per_guest_range",
                                exactPrice: null,
                                minPrice: ex ?? row.minPrice ?? null,
                                maxPrice: ex ?? row.maxPrice ?? null,
                              });
                              return;
                            }
                            const min = row.minPrice ?? row.exactPrice ?? null;
                            const max = row.maxPrice ?? row.exactPrice ?? min;
                            const exact =
                              min != null && max != null && min === max
                                ? min
                                : min ?? max ?? null;
                            updateItem(sectionIndex, itemIndex, {
                              usePriceRange: false,
                              pricing:
                                row.pricing === "fixed" ? "fixed" : "per_guest",
                              exactPrice: exact,
                              minPrice: null,
                              maxPrice: null,
                            });
                          }}
                          minPrice={
                            item.usePriceRange || item.pricing === "per_guest_range"
                              ? item.minPrice != null
                                ? String(item.minPrice)
                                : ""
                              : item.exactPrice != null
                                ? String(item.exactPrice)
                                : ""
                          }
                          maxPrice={
                            item.usePriceRange || item.pricing === "per_guest_range"
                              ? item.maxPrice != null
                                ? String(item.maxPrice)
                                : ""
                              : item.exactPrice != null
                                ? String(item.exactPrice)
                                : ""
                          }
                          onChange={(min, max) => {
                            const row = value.sections[sectionIndex]?.items[itemIndex];
                            if (!row) return;
                            if (row.usePriceRange || row.pricing === "per_guest_range") {
                              updateItem(sectionIndex, itemIndex, {
                                minPrice: parsePriceInput(min),
                                maxPrice: parsePriceInput(max),
                              });
                              return;
                            }
                            updateItem(sectionIndex, itemIndex, {
                              exactPrice: parsePriceInput(min),
                            });
                          }}
                          singleLabel={
                            item.pricing === "fixed" ? "מחיר (₪)" : "מחיר לאורח (₪)"
                          }
                          singlePlaceholder="למשל 25"
                          expandRangeLabel="טווח מחירים"
                          collapseRangeLabel="מחיר קבוע"
                          inputClassName={`${input} mt-1`}
                        />
                      </div>
                    ) : null}
                    <textarea
                      dir="rtl"
                      rows={1}
                      value={item.description ?? ""}
                      onChange={(e) =>
                        updateItem(sectionIndex, itemIndex, {
                          description: e.target.value,
                        })
                      }
                      placeholder="תיאור קצר (אופציונלי)"
                      className={textarea}
                    />
                    <div className="mt-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          updateSection(sectionIndex, {
                            items: section.items.filter((_, i) => i !== itemIndex),
                          })
                        }
                        className="text-[10px] text-red-600 hover:underline"
                      >
                        הסר מנה
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                disabled={section.items.length >= MAX_MENU_ITEMS_PER_SECTION}
                onClick={() =>
                  updateSection(sectionIndex, {
                    items: [...section.items, createEmptyMenuItem()],
                  })
                }
                className="mt-2 text-[11px] font-medium text-emerald-950 hover:underline disabled:opacity-50"
              >
                + הוסף מנה לקטגוריה
              </button>
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() =>
                    patchMenu({
                      sections: value.sections.filter((_, i) => i !== sectionIndex),
                    })
                  }
                  className="rounded-full border border-red-200 bg-white px-3 py-1 text-[11px] text-red-700 hover:bg-red-50"
                >
                  הסר קטגוריה
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          disabled={value.sections.length >= MAX_MENU_SECTIONS}
          onClick={() =>
            patchMenu({
              sections: [...value.sections, createEmptyMenuSection()],
            })
          }
          className="mt-3 rounded-full border border-dashed border-emerald-950/35 bg-white px-3 py-1.5 text-[11px] font-medium text-emerald-950 hover:bg-neutral-50 disabled:opacity-50"
        >
          + הוסף קטגוריה בתפריט ({value.sections.length})
        </button>
      </div>

      <div>
        <label className="block text-[11px] font-medium text-neutral-600">
          הערות לתפריט (כשרות, אלרגנים, תנאים)
        </label>
        <textarea
          dir="rtl"
          rows={2}
          value={value.menuNote ?? ""}
          onChange={(e) => patchMenu({ menuNote: e.target.value })}
          className={textarea}
          placeholder="למשל: כשר למהדרין, אפשרות ללא גלוטן בתיאום מראש"
        />
      </div>
    </div>
  );
}
