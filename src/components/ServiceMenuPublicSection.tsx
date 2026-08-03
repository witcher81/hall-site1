"use client";

import { useMemo, useState } from "react";
import type { CatalogTemplate } from "@/lib/serviceCategoryTemplates";
import {
  catalogPackageUsesPerGuestMultiplier,
  estimatePackageTotal,
  formatItemPortion,
  formatMenuItemPrice,
  formatPackagePrice,
  type ServiceMenuConfig,
  type ServiceMenuPackage,
} from "@/lib/serviceMenu";

type Props = {
  menu: ServiceMenuConfig;
  template: CatalogTemplate;
  /** הצגת מחשבון מחיר אינטראקטיבי */
  interactive?: boolean;
};

function formatTotalRange(min: number | null, max: number | null): string | null {
  if (min == null && max == null) return null;
  if (min != null && max != null && min !== max) {
    return `₪${min.toLocaleString("he-IL")}–${max.toLocaleString("he-IL")}`;
  }
  const v = min ?? max;
  if (v == null) return null;
  return `₪${v.toLocaleString("he-IL")}`;
}

function formatPackagePriceLabel(pkg: ServiceMenuPackage, template: CatalogTemplate): string | null {
  if (template.hidePackagePrice) return "לפי מדרגות אורחים";
  return formatPackagePrice(pkg, {
    perGuestSuffix: catalogPackageUsesPerGuestMultiplier(template),
  });
}

export default function ServiceMenuPublicSection({
  menu,
  template,
  interactive = true,
}: Props) {
  const multiply = catalogPackageUsesPerGuestMultiplier(template);
  const defaultCount =
    menu.minGuests ?? menu.minPersons ?? menu.quantityTiers?.[0]?.minQty ?? 100;
  const [countInput, setCountInput] = useState(String(defaultCount));
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(
    menu.packages[0]?.id ?? null
  );

  const countNum = useMemo(() => {
    const n = Number(countInput);
    if (!Number.isFinite(n) || n < 1) return null;
    return Math.trunc(n);
  }, [countInput]);

  const selectedPackage: ServiceMenuPackage | null = useMemo(() => {
    if (!selectedPackageId) return menu.packages[0] ?? null;
    return menu.packages.find((p) => p.id === selectedPackageId) ?? null;
  }, [menu.packages, selectedPackageId]);

  const estimate = useMemo(() => {
    if (!countNum || !selectedPackage) return null;
    return estimatePackageTotal(
      selectedPackage,
      countNum,
      multiply,
      menu.quantityTiers
    );
  }, [countNum, selectedPackage, multiply, menu.quantityTiers]);

  const capacityText = useMemo(() => {
    if (template.showPersonCapacity) {
      if (menu.minPersons != null && menu.maxPersons != null) {
        return `${menu.minPersons.toLocaleString("he-IL")}–${menu.maxPersons.toLocaleString("he-IL")} אנשים`;
      }
      if (menu.minPersons != null) {
        return `מ-${menu.minPersons.toLocaleString("he-IL")} אנשים`;
      }
      if (menu.maxPersons != null) {
        return `עד ${menu.maxPersons.toLocaleString("he-IL")} אנשים`;
      }
      return null;
    }
    if (menu.minGuests != null && menu.maxGuests != null) {
      const unit = template.requireQuantityInquiry ? "יחידות" : "אורחים";
      return `${menu.minGuests.toLocaleString("he-IL")}–${menu.maxGuests.toLocaleString("he-IL")} ${unit}`;
    }
    if (menu.minGuests != null) {
      return `מ-${menu.minGuests.toLocaleString("he-IL")}`;
    }
    if (menu.maxGuests != null) {
      return `עד ${menu.maxGuests.toLocaleString("he-IL")}`;
    }
    return null;
  }, [menu, template]);

  const calculatorLabel = template.requirePersonCountInquiry
    ? "מספר אנשים"
    : template.requireQuantityInquiry
      ? "כמות"
      : "מספר אורחים";

  const showCalculator =
    interactive &&
    (menu.packages.length > 0 || (menu.quantityTiers?.length ?? 0) > 0) &&
    (multiply || (menu.quantityTiers?.length ?? 0) > 0);

  return (
    <section className="site-card-padded border-emerald-200/50 bg-gradient-to-br from-emerald-50/40 to-white text-right">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-emerald-950">
            {template.editorTitle}
          </h2>
          {capacityText ? (
            <p className="mt-1 text-xs text-neutral-600">
              מתאים ל־<strong className="text-emerald-950">{capacityText}</strong>
            </p>
          ) : null}
        </div>
        {menu.minOrderAmountNis != null ? (
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-900">
            מינימום הזמנה ₪{menu.minOrderAmountNis.toLocaleString("he-IL")}
          </span>
        ) : null}
      </div>

      {menu.packages.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs font-semibold text-emerald-950">{template.packagesTitle}</p>
          <ul className="mt-2 space-y-2">
            {menu.packages.map((pkg) => {
              const priceLabel = formatPackagePriceLabel(pkg, template);
              const active = selectedPackage?.id === pkg.id;
              return (
                <li key={pkg.id}>
                  <button
                    type="button"
                    onClick={() => interactive && setSelectedPackageId(pkg.id)}
                    className={`w-full rounded-xl border p-3 text-right transition ${
                      active
                        ? "border-[#C9A227] bg-[#FFF7DD] ring-1 ring-amber-400/40"
                        : "border-neutral-200 bg-white hover:border-amber-400/50"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-emerald-950">{pkg.name}</span>
                      {priceLabel ? (
                        <span className="shrink-0 rounded-full bg-emerald-950 px-2.5 py-0.5 text-xs font-bold text-white">
                          {priceLabel}
                        </span>
                      ) : null}
                    </div>
                    {pkg.durationHours != null ? (
                      <p className="mt-1 text-[10px] text-neutral-500">
                        משך: {pkg.durationHours} שעות
                      </p>
                    ) : null}
                    {pkg.description?.trim() ? (
                      <p className="mt-1 text-[11px] leading-relaxed text-neutral-600">
                        {pkg.description.trim()}
                      </p>
                    ) : null}
                    {(pkg.includedItems?.filter((i) => i.label.trim()).length ?? 0) >
                    0 ? (
                      <ul className="mt-2 space-y-0.5 border-t border-neutral-100 pt-2 text-[11px] text-neutral-700">
                        {pkg.includedItems!
                          .filter((i) => i.label.trim())
                          .map((item) => (
                            <li key={item.id} className="flex gap-1.5">
                              <span className="text-emerald-700" aria-hidden>
                                ·
                              </span>
                              <span>
                                {item.label.trim()}
                                {formatItemPortion(item)
                                  ? ` (${formatItemPortion(item)})`
                                  : ""}
                                {item.description?.trim()
                                  ? ` — ${item.description.trim()}`
                                  : ""}
                              </span>
                            </li>
                          ))}
                      </ul>
                    ) : null}
                    {(pkg.extraItems?.filter((i) => i.label.trim()).length ?? 0) >
                    0 ? (
                      <ul className="mt-2 space-y-0.5 border-t border-amber-100 pt-2 text-[11px] text-neutral-700">
                        <li className="mb-0.5 text-[10px] font-semibold text-amber-900">
                          תוספות בתשלום
                        </li>
                        {pkg.extraItems!
                          .filter((i) => i.label.trim())
                          .map((item) => {
                            const price = formatMenuItemPrice(item);
                            return (
                              <li key={item.id} className="flex flex-wrap justify-between gap-2">
                                <span className="flex gap-1.5">
                                  <span className="text-amber-700" aria-hidden>
                                    ·
                                  </span>
                                  <span>
                                    {item.label.trim()}
                                    {item.description?.trim()
                                      ? ` — ${item.description.trim()}`
                                      : ""}
                                  </span>
                                </span>
                                {price ? (
                                  <span className="shrink-0 font-semibold text-neutral-800">
                                    {price}
                                  </span>
                                ) : null}
                              </li>
                            );
                          })}
                      </ul>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {showCalculator ? (
        <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-3">
          <p className="text-xs font-semibold text-emerald-950">
            הערכת מחיר לפי {calculatorLabel}
          </p>
          <div className="mt-2 flex flex-wrap items-end gap-3">
            <div className="min-w-[8rem] flex-1">
              <label className="block text-[11px] text-neutral-600">{calculatorLabel}</label>
              <input
                type="number"
                min={1}
                value={countInput}
                onChange={(e) => setCountInput(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-amber-400"
              />
            </div>
            {estimate ? (
              <div className="text-left sm:text-right">
                <p className="text-[10px] text-neutral-500">סה״כ משוער</p>
                <p className="text-lg font-bold text-emerald-950">
                  {formatTotalRange(estimate.min, estimate.max) ?? "—"}
                </p>
              </div>
            ) : null}
          </div>
          <p className="mt-2 text-[10px] text-neutral-500">
            ההערכה לפי החבילה שנבחרה — המחיר הסופי ייקבע מול הספק.
          </p>
        </div>
      ) : null}

      {(menu.quantityTiers?.length ?? 0) > 0 ? (
        <div className="mt-4">
          <p className="text-xs font-semibold text-emerald-950">
            {template.quantityTiersTitle ?? "מדרגות כמות"}
          </p>
          <ul className="mt-2 space-y-1">
            {menu.quantityTiers!.map((tier) => (
              <li
                key={tier.id}
                className="flex flex-wrap justify-between gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs"
              >
                <span>
                  {tier.minQty}
                  {tier.maxQty != null ? `–${tier.maxQty}` : "+"}{" "}
                  {template.quantityTierUnitLabel ?? "יחידות"}
                </span>
                {tier.pricePerUnit != null ? (
                  <span className="font-semibold">
                    ₪{tier.pricePerUnit}{" "}
                    {template.quantityTierUnitLabel === "אורחים" ? "לראש" : "ליחידה"}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {(menu.deliverables?.length ?? 0) > 0 ? (
        <div className="mt-4">
          <p className="text-xs font-semibold text-emerald-950">תוצרים</p>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {menu.deliverables!.map((d) => (
              <li
                key={d.id}
                className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs"
              >
                <span className="font-medium text-emerald-950">{d.label}</span>
                {d.value ? (
                  <span className="text-neutral-600"> — {d.value}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {menu.sections.some((s) => s.items.length > 0) ? (
        <div className="mt-5 space-y-4">
          <p className="text-xs font-semibold text-emerald-950">{template.catalogTitle}</p>
          {menu.sections.map((section) =>
            section.items.length === 0 ? null : (
              <div key={section.id}>
                <h3 className="text-sm font-semibold text-emerald-950">{section.title}</h3>
                <ul className="mt-2 space-y-1.5">
                  {section.items.map((item) => {
                    const price = formatMenuItemPrice(item);
                    return (
                      <li
                        key={item.id}
                        className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-neutral-200/80 bg-white/90 px-3 py-2"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-emerald-950">{item.label}</p>
                          {item.description?.trim() ? (
                            <p className="mt-0.5 text-[11px] text-neutral-600">
                              {item.description.trim()}
                            </p>
                          ) : null}
                        </div>
                        {price ? (
                          <span className="shrink-0 text-xs font-semibold text-neutral-700">
                            {price}
                          </span>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )
          )}
        </div>
      ) : null}

      {menu.menuNote?.trim() ? (
        <p className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-[11px] leading-relaxed text-neutral-700">
          {menu.menuNote.trim()}
        </p>
      ) : null}
    </section>
  );
}
