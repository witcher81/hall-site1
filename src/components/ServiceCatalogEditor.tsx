"use client";

import CatalogFieldHelp, { CatalogSectionExplainer } from "@/components/CatalogFieldHelp";
import OptionalPriceRangeFields from "@/components/OptionalPriceRangeFields";
import { getCatalogFieldHelp, getItemPricingHelp } from "@/lib/catalogFieldHelp";
import { useEffect, useState } from "react";
import type { CatalogTemplate } from "@/lib/serviceCategoryTemplates";
import {
  createEmptyDeliverable,
  createEmptyMenuItem,
  createEmptyMenuPackage,
  createEmptyMenuSection,
  createEmptyQuantityTier,
  MAX_MENU_ITEMS_PER_SECTION,
  MAX_MENU_PACKAGES,
  MAX_MENU_SECTIONS,
  type ServiceDeliverable,
  type ServiceMenuConfig,
  type ServiceMenuItem,
  type ServiceMenuItemPricing,
  type ServiceMenuPackage,
  type ServiceMenuSection,
  type ServiceQuantityTier,
} from "@/lib/serviceMenu";

type Props = {
  template: CatalogTemplate;
  value: ServiceMenuConfig;
  onChange: (next: ServiceMenuConfig) => void;
};

const PRICING_LABELS: Record<ServiceMenuItemPricing, string> = {
  included: "ללא תוספת תשלום",
  per_guest: "תוספת לאורח (₪)",
  per_guest_range: "תוספת לאורח — טווח",
  fixed: "מחיר קבוע (₪)",
  per_unit: "מחיר ליחידה (₪)",
  per_hour: "מחיר לשעה (₪)",
};

/** תבניות שבהן רשימת פריטים הגלובלית היא חלק מרכזי (דפוס...) — fallback אם אין catalogEssential */
const CATALOG_ESSENTIAL_FALLBACK = new Set<CatalogTemplate["id"]>([
  "print_quantity",
]);

/** תבניות עם מנות/טעמים בתוך שורת המחיר */
const PACKAGE_INCLUDED_MENU = new Set<CatalogTemplate["id"]>([
  "food",
  "beverage",
  "food_station",
]);

function packageIncludedListTitle(templateId: CatalogTemplate["id"]): string {
  if (templateId === "beverage") return "משקאות בחבילה הזו";
  if (templateId === "food_station") return "טעמים / מנות בחבילה הזו";
  return "מנות בתפריט הזה";
}

function packageIncludedItemPlaceholder(
  templateId: CatalogTemplate["id"]
): string {
  if (templateId === "beverage") return "למשל: מוחיטו, בירה";
  if (templateId === "food_station") return "למשל: וניל, שוקולד";
  return "למשל: סלט ירוק";
}

function packageIncludedAddLabel(templateId: CatalogTemplate["id"]): string {
  if (templateId === "beverage") return "+ הוסף משקה";
  if (templateId === "food_station") return "+ הוסף טעם / מנה";
  return "+ הוסף מנה";
}

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

function itemPriceSingleLabel(pricing: ServiceMenuItemPricing): string {
  if (pricing === "per_hour") return "מחיר לשעה (₪)";
  if (pricing === "per_unit") return "מחיר ליחידה (₪)";
  if (pricing === "fixed") return "מחיר (₪)";
  return "מחיר לאורח (₪)";
}

export default function ServiceCatalogEditor({ template, value, onChange }: Props) {
  const fieldHelp = getCatalogFieldHelp(template.id);
  const pricingModes = template.itemPricingModes;
  const catalogEssential =
    template.catalogEssential ?? CATALOG_ESSENTIAL_FALLBACK.has(template.id);
  const catalogOptional = template.catalogOptional ?? !catalogEssential;
  const showPackageIncludedMenu = PACKAGE_INCLUDED_MENU.has(template.id);
  const [catalogOpen, setCatalogOpen] = useState(!catalogOptional);
  /** סיכום אופציונלי לחבילה — נפתח רק בלחיצה או אם כבר יש תוכן */
  const [packageDescOpen, setPackageDescOpen] = useState<Record<string, boolean>>(
    {}
  );

  useEffect(() => {
    if (value.packages.length === 0) {
      const pkg = createEmptyMenuPackage();
      if (PACKAGE_INCLUDED_MENU.has(template.id)) {
        pkg.includedItems = [createEmptyMenuItem()];
      }
      onChange({ ...value, templateId: template.id, packages: [pkg] });
    }
  }, [template.id]); // eslint-disable-line react-hooks/exhaustive-deps -- seed once per template

  function patchMenu(patch: Partial<ServiceMenuConfig>) {
    onChange({ ...value, templateId: template.id, ...patch });
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

  function updateIncludedItem(
    packageIndex: number,
    itemIndex: number,
    patch: Partial<ServiceMenuItem>
  ) {
    const pkg = value.packages[packageIndex];
    if (!pkg) return;
    const items = [...(pkg.includedItems ?? [])];
    const cur = items[itemIndex];
    if (!cur) return;
    items[itemIndex] = { ...cur, ...patch };
    updatePackage(packageIndex, { includedItems: items });
  }

  function addIncludedItem(packageIndex: number) {
    const pkg = value.packages[packageIndex];
    if (!pkg) return;
    const items = [...(pkg.includedItems ?? [])];
    if (items.length >= MAX_MENU_ITEMS_PER_SECTION) return;
    items.push(createEmptyMenuItem());
    updatePackage(packageIndex, { includedItems: items });
  }

  function removeIncludedItem(packageIndex: number, itemIndex: number) {
    const pkg = value.packages[packageIndex];
    if (!pkg) return;
    updatePackage(packageIndex, {
      includedItems: (pkg.includedItems ?? []).filter((_, i) => i !== itemIndex),
    });
  }

  function updateTier(index: number, patch: Partial<ServiceQuantityTier>) {
    const tiers = value.quantityTiers ?? [];
    patchMenu({
      quantityTiers: tiers.map((t, i) => (i === index ? { ...t, ...patch } : t)),
    });
  }

  function updateDeliverable(index: number, patch: Partial<ServiceDeliverable>) {
    const list = value.deliverables ?? [];
    patchMenu({
      deliverables: list.map((d, i) => (i === index ? { ...d, ...patch } : d)),
    });
  }

  const showCapacity =
    template.showGuestCapacity || template.showPersonCapacity;

  return (
    <div className="space-y-4 text-right">
      <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-4">
        <h3 className="text-sm font-semibold text-emerald-950">{template.editorTitle}</h3>
        <p className="mt-1 text-[11px] leading-relaxed text-neutral-600">
          {template.editorHint}
        </p>
        <ol className="mt-3 space-y-1 text-[11px] text-neutral-700">
          {showCapacity ? (
            <li>
              <strong>①</strong> כמה אורחים אתם משרתים
            </li>
          ) : null}
          <li>
            <strong>{showCapacity ? "②" : "①"}</strong>{" "}
            {template.packagesStepLabel ?? "לכל סוג שירות — שם + מחיר (המחירון העיקרי)"}
          </li>
          {!catalogOptional ? (
            <li>
              <strong>{showCapacity ? "③" : "②"}</strong>{" "}
              {template.catalogStepLabel ?? template.catalogTitle}
            </li>
          ) : (
            <li>
              <strong>{showCapacity ? "③" : "②"}</strong> תוספות ופירוט — רק אם צריך
              (אופציונלי)
            </li>
          )}
        </ol>
      </div>

      {showCapacity ? (
        <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-4">
          <h3 className="text-sm font-semibold text-emerald-950">
            {showCapacity && template.showPersonCapacity ? "① " : ""}
            {template.capacityTitle}
          </h3>
          <p className="mt-1 text-[11px] leading-relaxed text-neutral-600">
            {template.capacityHint}
          </p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <CatalogFieldHelp
              label={template.minCapacityLabel}
              help={fieldHelp.minGuests}
            >
              <input
                type="number"
                min={1}
                value={
                  template.showPersonCapacity
                    ? (value.minPersons ?? "")
                    : (value.minGuests ?? "")
                }
                onChange={(e) => {
                  const n = parsePriceInput(e.target.value);
                  if (template.showPersonCapacity) {
                    patchMenu({ minPersons: n });
                  } else {
                    patchMenu({ minGuests: n });
                  }
                }}
                className={input}
              />
            </CatalogFieldHelp>
            <CatalogFieldHelp
              label={template.maxCapacityLabel}
              help={fieldHelp.maxGuests}
            >
              <input
                type="number"
                min={1}
                value={
                  template.showPersonCapacity
                    ? (value.maxPersons ?? "")
                    : (value.maxGuests ?? "")
                }
                onChange={(e) => {
                  const n = parsePriceInput(e.target.value);
                  if (template.showPersonCapacity) {
                    patchMenu({ maxPersons: n });
                  } else {
                    patchMenu({ maxGuests: n });
                  }
                }}
                className={input}
              />
            </CatalogFieldHelp>
            {template.showMinOrderAmount ? (
              <CatalogFieldHelp label="מינימום הזמנה (₪)" help={fieldHelp.minOrder}>
                <input
                  type="number"
                  min={0}
                  value={value.minOrderAmountNis ?? ""}
                  onChange={(e) =>
                    patchMenu({ minOrderAmountNis: parsePriceInput(e.target.value) })
                  }
                  className={input}
                  placeholder="אופציונלי"
                />
              </CatalogFieldHelp>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="rounded-xl border border-amber-200/90 bg-amber-50/45 p-4">
        <h3 className="text-sm font-semibold text-amber-900">
          {showCapacity ? "② " : "① "}
          {template.packagesTitle}
        </h3>
        <p className="mt-1 text-[11px] leading-relaxed text-amber-900/80">
          {template.packagesHint}
        </p>
        {fieldHelp.packagesSectionBody ? (
          <CatalogSectionExplainer
            title={fieldHelp.packagesSectionTitle ?? "צריך עוד הסבר?"}
            className="mt-2"
          >
            {fieldHelp.packagesSectionBody}
          </CatalogSectionExplainer>
        ) : null}
        <ul className="mt-3 space-y-3">
          {value.packages.map((pkg, index) => {
            const descVisible =
              Boolean(pkg.description?.trim()) || packageDescOpen[pkg.id] === true;
            return (
            <li
              key={pkg.id}
              className="rounded-lg border border-amber-200/80 bg-white/85 p-3"
            >
              <p className="mb-2 text-[10px] font-medium text-neutral-500">
                שורה {index + 1}
                {showPackageIncludedMenu
                  ? " — שם, מחיר ומנות"
                  : " — שם + מחיר"}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <CatalogFieldHelp
                  label={template.packageNameFieldLabel ?? "שם הרמה / סוג"}
                  help={fieldHelp.packageName}
                >
                  <input
                    type="text"
                    dir="rtl"
                    value={pkg.name}
                    onChange={(e) => updatePackage(index, { name: e.target.value })}
                    className={input}
                    placeholder={
                      template.packageNamePlaceholder ?? "שם השירות / סוג"
                    }
                  />
                </CatalogFieldHelp>
                <CatalogFieldHelp
                  label={template.packagePriceLabel}
                  help={fieldHelp.packagePrice}
                >
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
                      min != null && max != null && min === max ? min : min ?? max ?? null;
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
                  singleLabel=""
                  singlePlaceholder="למשל 180"
                  minLabel="מינימום (₪)"
                  maxLabel="מקסימום (₪)"
                  expandRangeLabel={template.packagePriceExpandLabel}
                  collapseRangeLabel="מחיר קבוע"
                  inputClassName={input}
                />
                </CatalogFieldHelp>
              </div>
              {template.showPackageDuration ? (
                <CatalogFieldHelp
                  label="משך (שעות)"
                  help={fieldHelp.packageDuration}
                  className="mt-2"
                >
                  <input
                    type="number"
                    min={0}
                    value={pkg.durationHours ?? ""}
                    onChange={(e) =>
                      updatePackage(index, {
                        durationHours: parsePriceInput(e.target.value),
                      })
                    }
                    className={`${input} max-w-[8rem]`}
                    placeholder="אופציונלי"
                  />
                </CatalogFieldHelp>
              ) : null}
              {descVisible ? (
                <CatalogFieldHelp
                  label={
                    template.packageDescriptionFieldLabel ?? "מה כלול? (אופציונלי)"
                  }
                  help={fieldHelp.packageDescription}
                  className="mt-2"
                >
                  <textarea
                    dir="rtl"
                    rows={2}
                    value={pkg.description ?? ""}
                    onChange={(e) =>
                      updatePackage(index, { description: e.target.value })
                    }
                    placeholder={
                      template.packageDescriptionPlaceholder ?? "מה כלול בשורה הזו?"
                    }
                    className={textarea}
                  />
                </CatalogFieldHelp>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    setPackageDescOpen((prev) => ({ ...prev, [pkg.id]: true }))
                  }
                  className="mt-2 text-[11px] font-medium text-amber-900/80 underline decoration-amber-400/50 underline-offset-2 hover:text-amber-950"
                >
                  + הוסף סיכום קצר (אופציונלי)
                </button>
              )}
              {showPackageIncludedMenu ? (
                <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50/40 p-2.5">
                  <p className="text-[11px] font-semibold text-emerald-950">
                    {packageIncludedListTitle(template.id)}
                  </p>
                  <p className="mt-0.5 text-[10px] text-neutral-500">
                    רק מה שכלול במחיר השורה הזו
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {(pkg.includedItems ?? []).map((item, itemIndex) => (
                      <li key={item.id} className="flex items-center gap-2">
                        <input
                          type="text"
                          dir="rtl"
                          value={item.label}
                          onChange={(e) =>
                            updateIncludedItem(index, itemIndex, {
                              label: e.target.value,
                            })
                          }
                          className={`${input} flex-1`}
                          placeholder={packageIncludedItemPlaceholder(template.id)}
                        />
                        <button
                          type="button"
                          onClick={() => removeIncludedItem(index, itemIndex)}
                          className="shrink-0 text-[11px] text-red-600 hover:underline"
                        >
                          הסר
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    disabled={
                      (pkg.includedItems?.length ?? 0) >= MAX_MENU_ITEMS_PER_SECTION
                    }
                    onClick={() => addIncludedItem(index)}
                    className="mt-2 text-[11px] font-medium text-emerald-900 hover:underline disabled:opacity-50"
                  >
                    {packageIncludedAddLabel(template.id)}
                  </button>
                </div>
              ) : null}
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
                  הסר שורה
                </button>
              </div>
            </li>
            );
          })}
        </ul>
        <button
          type="button"
          disabled={value.packages.length >= MAX_MENU_PACKAGES}
          onClick={() => {
            const pkg = createEmptyMenuPackage();
            if (showPackageIncludedMenu) {
              pkg.includedItems = [createEmptyMenuItem()];
            }
            patchMenu({
              packages: [...value.packages, pkg],
            });
          }}
          className="mt-2 rounded-full border border-dashed border-amber-700/35 bg-white px-3 py-1.5 text-[11px] font-medium text-amber-900/90 hover:bg-amber-50 disabled:opacity-50"
        >
          + {fieldHelp.addPackageButton ?? "הוסף שורת מחיר"} ({value.packages.length})
        </button>
      </div>

      {template.showQuantityTiers ? (
        <div className="rounded-xl border border-violet-200/80 bg-violet-50/40 p-4">
          <h3 className="text-sm font-semibold text-violet-950">מדרגות כמות</h3>
          <p className="mt-1 text-[11px] text-neutral-600">
            מחיר ליחידה לפי כמות הזמנה — למשל 50–100 יחידות במחיר אחד.
          </p>
          <ul className="mt-3 space-y-2">
            {(value.quantityTiers ?? []).map((tier, index) => (
              <li
                key={tier.id}
                className="grid gap-2 rounded-lg border border-violet-200/70 bg-white p-2 sm:grid-cols-4"
              >
                <input
                  type="number"
                  min={1}
                  value={tier.minQty}
                  onChange={(e) =>
                    updateTier(index, { minQty: parsePriceInput(e.target.value) ?? 1 })
                  }
                  className={input}
                  placeholder="מינימום"
                />
                <input
                  type="number"
                  min={1}
                  value={tier.maxQty ?? ""}
                  onChange={(e) =>
                    updateTier(index, { maxQty: parsePriceInput(e.target.value) })
                  }
                  className={input}
                  placeholder="מקסימום"
                />
                <input
                  type="number"
                  min={0}
                  value={tier.pricePerUnit ?? ""}
                  onChange={(e) =>
                    updateTier(index, { pricePerUnit: parsePriceInput(e.target.value) })
                  }
                  className={input}
                  placeholder="₪ ליחידה"
                />
                <button
                  type="button"
                  onClick={() =>
                    patchMenu({
                      quantityTiers: (value.quantityTiers ?? []).filter(
                        (_, i) => i !== index
                      ),
                    })
                  }
                  className="text-[11px] text-red-600 hover:underline"
                >
                  הסר
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() =>
              patchMenu({
                quantityTiers: [...(value.quantityTiers ?? []), createEmptyQuantityTier()],
              })
            }
            className="mt-2 text-[11px] font-medium text-violet-950 hover:underline"
          >
            + הוסף מדרגה
          </button>
        </div>
      ) : null}

      {catalogOptional && !catalogOpen ? (
        <button
          type="button"
          onClick={() => setCatalogOpen(true)}
          className="w-full rounded-xl border border-dashed border-neutral-300 bg-neutral-50/80 px-4 py-3 text-right text-xs text-neutral-700 hover:border-amber-400/60 hover:bg-amber-50/40"
        >
          <span className="font-semibold text-emerald-950">
            {showCapacity ? "③ " : "② "}
            {template.catalogTitle}
          </span>
          <span className="mt-0.5 block text-[11px] text-neutral-600">
            יש לכם גם תוספות בתשלום או פירוט נוסף? לחצו כאן (לא חובה)
          </span>
        </button>
      ) : (
      <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/60 p-4">
        {catalogOptional ? (
          <button
            type="button"
            onClick={() => setCatalogOpen(false)}
            className="mb-2 text-[10px] text-neutral-500 hover:text-neutral-700"
          >
            הסתר תוספות (אופציונלי)
          </button>
        ) : null}
        <h3 className="text-sm font-semibold text-emerald-950">
          {!catalogOptional && showCapacity ? "③ " : !catalogOptional ? "② " : ""}
          {template.catalogTitle}
          {catalogOptional ? (
            <span className="mr-2 text-[10px] font-normal text-neutral-500">(אופציונלי)</span>
          ) : null}
        </h3>
        <p className="mt-1 text-[11px] leading-relaxed text-neutral-600">
          {template.catalogHint}
        </p>
        {fieldHelp.catalogSectionBody ? (
          <CatalogSectionExplainer
            title={fieldHelp.catalogSectionTitle}
            className="mt-2"
          >
            {fieldHelp.catalogSectionBody}
          </CatalogSectionExplainer>
        ) : null}
        <div className="mt-3 space-y-3">
          {value.sections.map((section, sectionIndex) => (
            <div
              key={section.id}
              className="rounded-lg border border-neutral-200/80 bg-white p-3"
            >
              <CatalogFieldHelp
                label="שם קבוצה"
                help={fieldHelp.sectionTitle}
              >
                <input
                  type="text"
                  dir="rtl"
                  value={section.title}
                  onChange={(e) => updateSection(sectionIndex, { title: e.target.value })}
                  className={input}
                  placeholder={template.catalogSectionPlaceholder}
                />
              </CatalogFieldHelp>
              <ul className="mt-2 space-y-2">
                {section.items.map((item, itemIndex) => (
                  <li
                    key={item.id}
                    className="rounded-lg border border-neutral-200/60 bg-neutral-50/80 p-2"
                  >
                    <div className="grid gap-2 sm:grid-cols-2">
                      <CatalogFieldHelp label="שם הפריט" help={fieldHelp.itemName}>
                        <input
                          type="text"
                          dir="rtl"
                          value={item.label}
                          onChange={(e) =>
                            updateItem(sectionIndex, itemIndex, { label: e.target.value })
                          }
                          className={input}
                          placeholder={template.catalogItemPlaceholder}
                        />
                      </CatalogFieldHelp>
                      <CatalogFieldHelp
                        label="תמחור"
                        help={fieldHelp.itemPricing}
                      >
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
                          className="w-full rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-[11px] text-neutral-900"
                        >
                          {pricingModes.map((k) => (
                            <option key={k} value={k}>
                              {PRICING_LABELS[k]}
                            </option>
                          ))}
                        </select>
                        {getItemPricingHelp(template.id, item.pricing) ? (
                          <p className="mt-1 text-[10px] text-neutral-500">
                            {getItemPricingHelp(template.id, item.pricing)}
                          </p>
                        ) : null}
                      </CatalogFieldHelp>
                    </div>
                    {item.pricing !== "included" ? (
                      <CatalogFieldHelp
                        label={itemPriceSingleLabel(item.pricing)}
                        help={fieldHelp.itemExtraPrice}
                        className="mt-2"
                      >
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
                                  row.pricing === "fixed" ||
                                  row.pricing === "per_unit" ||
                                  row.pricing === "per_hour"
                                    ? row.pricing
                                    : "per_guest_range",
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
                            const nextPricing =
                              row.pricing === "fixed" ||
                              row.pricing === "per_unit" ||
                              row.pricing === "per_hour"
                                ? row.pricing
                                : "per_guest";
                            updateItem(sectionIndex, itemIndex, {
                              usePriceRange: false,
                              pricing: nextPricing,
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
                          singleLabel={itemPriceSingleLabel(item.pricing)}
                          singlePlaceholder="למשל 25"
                          expandRangeLabel="טווח מחירים"
                          collapseRangeLabel="מחיר קבוע"
                          inputClassName={`${input} mt-1`}
                        />
                      </CatalogFieldHelp>
                    ) : null}
                    <CatalogFieldHelp
                      label="תיאור קצר (אופציונלי)"
                      help={fieldHelp.itemDescription}
                      className="mt-2"
                    >
                      <textarea
                        dir="rtl"
                        rows={1}
                        value={item.description ?? ""}
                        onChange={(e) =>
                          updateItem(sectionIndex, itemIndex, {
                            description: e.target.value,
                          })
                        }
                        placeholder="למשל: כשר, ללא גלוטן, מנה צמחונית"
                        className={textarea}
                      />
                    </CatalogFieldHelp>
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
                        הסר פריט
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
                + הוסף פריט
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
          + {fieldHelp.addSectionButton ?? "הוסף קבוצה"} ({value.sections.length})
        </button>
      </div>
      )}

      {template.showDeliverables ? (
        <div className="rounded-xl border border-sky-200/80 bg-sky-50/40 p-4">
          <h3 className="text-sm font-semibold text-sky-950">תוצרים כלולים</h3>
          <p className="mt-1 text-[11px] text-neutral-600">
            למשל: מספר תמונות, דקות וידאו, זמן אספקה.
          </p>
          <ul className="mt-3 space-y-2">
            {(value.deliverables ?? []).map((del, index) => (
              <li key={del.id} className="flex flex-wrap gap-2">
                <input
                  type="text"
                  dir="rtl"
                  value={del.label}
                  onChange={(e) => updateDeliverable(index, { label: e.target.value })}
                  className={`${input} min-w-[6rem] flex-1`}
                  placeholder="שם (למשל: תמונות)"
                />
                <input
                  type="text"
                  dir="rtl"
                  value={del.value}
                  onChange={(e) => updateDeliverable(index, { value: e.target.value })}
                  className={`${input} min-w-[6rem] flex-1`}
                  placeholder="ערך (למשל: 400)"
                />
                <button
                  type="button"
                  onClick={() =>
                    patchMenu({
                      deliverables: (value.deliverables ?? []).filter(
                        (_, i) => i !== index
                      ),
                    })
                  }
                  className="text-[11px] text-red-600 hover:underline"
                >
                  הסר
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() =>
              patchMenu({
                deliverables: [...(value.deliverables ?? []), createEmptyDeliverable()],
              })
            }
            className="mt-2 text-[11px] font-medium text-sky-950 hover:underline"
          >
            + הוסף תוצר
          </button>
        </div>
      ) : null}

      <CatalogFieldHelp label={template.notesLabel} help={fieldHelp.notes}>
        <textarea
          dir="rtl"
          rows={2}
          value={value.menuNote ?? ""}
          onChange={(e) => patchMenu({ menuNote: e.target.value })}
          className={textarea}
          placeholder={template.notesPlaceholder}
        />
      </CatalogFieldHelp>
    </div>
  );
}
