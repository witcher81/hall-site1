"use client";

import { useEffect, useMemo, useState } from "react";
import type { CatalogTemplate } from "@/lib/serviceCategoryTemplates";
import {
  catalogPackageUsesPerGuestMultiplier,
  estimatePackageTotal,
  filterItemsForSecondary,
  formatItemPortion,
  formatMenuItemPrice,
  formatPackagePrice,
  groupPackageIncludedItems,
  itemChoiceSelectCount,
  itemHasCustomerChoice,
  type ServiceMenuConfig,
  type ServiceMenuItem,
  type ServiceMenuPackage,
} from "@/lib/serviceMenu";
import {
  isLegacyGeneralFoodMode,
  isPyramidPerHeadMode,
  resolveFoodPricingModeForSecondary,
} from "@/lib/foodPricingMode";
import { isUsefulIncludeDescription } from "@/lib/serviceIncludes";

type Props = {
  menu: ServiceMenuConfig;
  template: CatalogTemplate;
  /** הצגת מחשבון מחיר אינטראקטיבי */
  interactive?: boolean;
  /** חבילה שנבחרה (לחיבור לטופס הזמנה) */
  selectedPackageId?: string | null;
  onSelectedPackageIdChange?: (id: string) => void;
  /** בחירות או/או לפי מזהה פריט */
  choicesByItemId?: Record<string, string[]>;
  onChoicesChange?: (next: Record<string, string[]>) => void;
  /** מספר אורחים מהטופס — לתצוגת כמות לפי אדם */
  guestCount?: number | null;
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

function formatPackagePriceLabel(
  pkg: ServiceMenuPackage,
  template: CatalogTemplate,
  menu: ServiceMenuConfig
): string | null {
  if (template.hidePackagePrice) return "לפי מדרגות אורחים";
  const mode = resolveFoodPricingModeForSecondary(
    menu,
    pkg.secondary?.trim() || ""
  );
  if (isPyramidPerHeadMode(mode)) return "לפי מדרגות אורחים";
  if (isLegacyGeneralFoodMode(mode) || template.id === "food_station") {
    const base = formatPackagePrice(pkg, { perGuestSuffix: false });
    return base ? `${base} לשולחן/הצעה` : null;
  }
  return formatPackagePrice(pkg, {
    perGuestSuffix: catalogPackageUsesPerGuestMultiplier(template),
  });
}

function quantityHint(
  item: ServiceMenuItem,
  guestCount: number | null | undefined
): string | null {
  const base = formatItemPortion(item);
  if (
    item.quantityMode === "per_person" &&
    guestCount != null &&
    guestCount > 0
  ) {
    const per =
      item.portionAmount != null && item.portionAmount > 0
        ? item.portionAmount
        : 1;
    return `${per} לכל אורח × ${guestCount.toLocaleString("he-IL")} (= ${(per * guestCount).toLocaleString("he-IL")})`;
  }
  return base;
}

export default function ServiceMenuPublicSection({
  menu,
  template,
  interactive = true,
  selectedPackageId: selectedPackageIdProp,
  onSelectedPackageIdChange,
  choicesByItemId: choicesProp,
  onChoicesChange,
  guestCount,
}: Props) {
  const multiply = catalogPackageUsesPerGuestMultiplier(template);
  const defaultCount =
    menu.minGuests ?? menu.minPersons ?? menu.quantityTiers?.[0]?.minQty ?? 100;
  const [countInput, setCountInput] = useState(String(defaultCount));
  const [internalPackageId, setInternalPackageId] = useState<string | null>(
    menu.packages[0]?.id ?? null
  );
  const [internalChoices, setInternalChoices] = useState<
    Record<string, string[]>
  >({});

  const selectedPackageId =
    selectedPackageIdProp !== undefined
      ? selectedPackageIdProp
      : internalPackageId;
  const choicesByItemId = choicesProp ?? internalChoices;

  function setSelectedPackageId(id: string) {
    if (onSelectedPackageIdChange) onSelectedPackageIdChange(id);
    else setInternalPackageId(id);
  }

  function setChoices(next: Record<string, string[]>) {
    if (onChoicesChange) onChoicesChange(next);
    else setInternalChoices(next);
  }

  useEffect(() => {
    if (guestCount != null && guestCount > 0) {
      setCountInput(String(guestCount));
    }
  }, [guestCount]);

  const countNum = useMemo(() => {
    if (guestCount != null && guestCount > 0) return guestCount;
    const n = Number(countInput);
    if (!Number.isFinite(n) || n < 1) return null;
    return Math.trunc(n);
  }, [countInput, guestCount]);

  const selectedPackage: ServiceMenuPackage | null = useMemo(() => {
    if (!selectedPackageId) return menu.packages[0] ?? null;
    return menu.packages.find((p) => p.id === selectedPackageId) ?? null;
  }, [menu.packages, selectedPackageId]);

  const packageSecondaries = useMemo(() => {
    const set = new Set<string>();
    for (const pkg of menu.packages) {
      if (pkg.secondary?.trim()) set.add(pkg.secondary.trim());
    }
    return [...set];
  }, [menu.packages]);

  const estimate = useMemo(() => {
    if (!countNum || !selectedPackage) return null;
    const sec = selectedPackage.secondary?.trim() || packageSecondaries[0] || "";
    const tiersForPkg =
      packageSecondaries.length > 1 && sec
        ? filterItemsForSecondary(
            menu.quantityTiers ?? [],
            sec,
            packageSecondaries
          )
        : menu.quantityTiers;
    return estimatePackageTotal(
      selectedPackage,
      countNum,
      multiply,
      tiersForPkg
    );
  }, [
    countNum,
    selectedPackage,
    multiply,
    menu.quantityTiers,
    packageSecondaries,
  ]);

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
    }
    if (menu.minGuests != null && menu.maxGuests != null) {
      return `${menu.minGuests.toLocaleString("he-IL")}–${menu.maxGuests.toLocaleString("he-IL")} אורחים`;
    }
    if (menu.minGuests != null) {
      return `מ-${menu.minGuests.toLocaleString("he-IL")} אורחים`;
    }
    if (menu.maxGuests != null) {
      return `עד ${menu.maxGuests.toLocaleString("he-IL")} אורחים`;
    }
    return null;
  }, [menu, template.showPersonCapacity]);

  const showCalculator =
    interactive &&
    (multiply ||
      (menu.quantityTiers?.length ?? 0) > 0 ||
      Object.values(menu.foodPricingModesBySecondary ?? {}).some((m) =>
        isPyramidPerHeadMode(m)
      ) ||
      isPyramidPerHeadMode(menu.foodPricingMode));

  const calculatorLabel = template.showPersonCapacity
    ? "מספר אנשים"
    : template.requireQuantityInquiry
      ? "כמות"
      : "מספר אורחים";

  const packageBlocks =
    packageSecondaries.length > 1
      ? packageSecondaries.map((s) => s as string | null)
      : [null as string | null];

  function toggleChoice(item: ServiceMenuItem, option: string) {
    const need = itemChoiceSelectCount(item);
    const current = choicesByItemId[item.id] ?? [];
    if (need <= 1) {
      setChoices({ ...choicesByItemId, [item.id]: [option] });
      return;
    }
    if (current.includes(option)) {
      setChoices({
        ...choicesByItemId,
        [item.id]: current.filter((x) => x !== option),
      });
      return;
    }
    if (current.length >= need) {
      setChoices({
        ...choicesByItemId,
        [item.id]: [...current.slice(1), option],
      });
      return;
    }
    setChoices({
      ...choicesByItemId,
      [item.id]: [...current, option],
    });
  }

  function renderIncludedItem(
    item: ServiceMenuItem,
    pkgActive: boolean
  ) {
    const qty = quantityHint(item, countNum);
    if (itemHasCustomerChoice(item)) {
      const need = itemChoiceSelectCount(item);
      const selected = choicesByItemId[item.id] ?? [];
      const canPick = interactive && pkgActive;
      return (
        <li key={item.id} className="space-y-1">
          <div className="flex flex-wrap items-baseline gap-1.5">
            <span className="font-semibold text-emerald-950">
              {item.label.trim() || "בחירה"}
            </span>
            {qty ? (
              <span className="text-[10px] text-neutral-500">({qty})</span>
            ) : null}
            {canPick ? (
              <span className="text-[10px] font-medium text-amber-800">
                {need === 1 ? "בחרו אחת:" : `בחרו ${need}:`}
              </span>
            ) : (
              <span className="text-[10px] text-neutral-500">
                לבחירה: {(item.choiceOptions ?? []).join(" / ")}
              </span>
            )}
          </div>
          {canPick ? (
            <ul className="space-y-1 pr-1">
              {(item.choiceOptions ?? []).map((opt) => {
                const checked = selected.includes(opt);
                return (
                  <li key={opt}>
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-[11px] hover:border-amber-400/60">
                      <input
                        type={need <= 1 ? "radio" : "checkbox"}
                        name={`choice-${item.id}`}
                        checked={checked}
                        onChange={() => toggleChoice(item, opt)}
                        className="accent-emerald-800"
                      />
                      <span>{opt}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </li>
      );
    }

    return (
      <li key={item.id} className="flex gap-1.5">
        <span className="text-emerald-700" aria-hidden>
          ·
        </span>
        <span>
          {item.label.trim()}
          {qty ? ` (${qty})` : ""}
          {item.description &&
          isUsefulIncludeDescription(item.label, item.description)
            ? ` — ${item.description.trim()}`
            : ""}
        </span>
      </li>
    );
  }

  return (
    <section className="site-card-padded text-right">
      <h2 className="text-sm font-semibold text-emerald-950">
        {template.packagesTitle || "תפריט ומחירים"}
      </h2>
      {template.packagesHint ? (
        <p className="mt-1 text-xs leading-relaxed text-neutral-600">
          {template.packagesHint}
        </p>
      ) : null}
      {capacityText ? (
        <p className="mt-2 text-[11px] text-neutral-500">
          מתאים ל־{capacityText}
        </p>
      ) : null}
      {menu.dietaryOptions && menu.dietaryOptions.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {menu.dietaryOptions.map((d) => (
            <span
              key={d}
              className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-900"
            >
              {d}
            </span>
          ))}
        </div>
      ) : null}

      {menu.packages.length > 0 ? (
        <div className="mt-4 space-y-4">
          {interactive ? (
            <p className="text-[11px] text-amber-900/90">
              בחרו חבילה / שולחן
              {menu.packages.some((p) =>
                (p.includedItems ?? []).some(itemHasCustomerChoice)
              )
                ? " — ואז סמנו את האפשרויות בתפריט"
                : ""}
              .
            </p>
          ) : null}
          {packageBlocks.map((secKey) => {
            const pkgs =
              secKey && packageSecondaries.length > 1
                ? filterItemsForSecondary(
                    menu.packages,
                    secKey,
                    packageSecondaries
                  )
                : menu.packages;
            if (pkgs.length === 0) return null;
            return (
              <div key={secKey ?? "all-packages"}>
                {secKey ? (
                  <p className="mb-2 text-[11px] font-bold text-emerald-900">
                    {secKey}
                  </p>
                ) : null}
                <ul className="space-y-2">
                  {pkgs.map((pkg) => {
                    const priceLabel = formatPackagePriceLabel(
                      pkg,
                      template,
                      menu
                    );
                    const active = selectedPackage?.id === pkg.id;
                    return (
                      <li key={pkg.id}>
                        <div
                          className={`w-full rounded-xl border p-3 text-right transition ${
                            active
                              ? "border-[#C9A227] bg-[#FFF7DD] ring-1 ring-amber-400/40"
                              : "border-neutral-200 bg-white hover:border-amber-400/50"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              interactive && setSelectedPackageId(pkg.id)
                            }
                            className="w-full text-right"
                            disabled={!interactive}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="font-semibold text-emerald-950">
                                {pkg.name}
                              </span>
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
                          </button>

                          {(pkg.includedItems?.filter((i) => i.label.trim())
                            .length ?? 0) > 0 ? (
                            <div className="mt-2 space-y-2 border-t border-neutral-100 pt-2 text-[11px] text-neutral-700">
                              {groupPackageIncludedItems(
                                pkg.includedItems!.filter((i) =>
                                  i.label.trim()
                                ),
                                template.packageIncludedGroups
                              ).map((block) => (
                                <div key={block.title ?? "all"}>
                                  {block.title ? (
                                    <p className="mb-0.5 text-[10px] font-semibold text-emerald-900">
                                      {block.title}
                                    </p>
                                  ) : null}
                                  <ul className="space-y-1.5">
                                    {block.items.map(({ item }) =>
                                      renderIncludedItem(item, active)
                                    )}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          ) : null}

                          {(pkg.extraItems?.filter((i) => i.label.trim())
                            .length ?? 0) > 0 ? (
                            <ul className="mt-2 space-y-0.5 border-t border-amber-100 pt-2 text-[11px] text-neutral-700">
                              <li className="mb-0.5 text-[10px] font-semibold text-amber-900">
                                תוספות בתשלום
                              </li>
                              {pkg.extraItems!
                                .filter((i) => i.label.trim())
                                .map((item) => {
                                  const price = formatMenuItemPrice(item);
                                  return (
                                    <li
                                      key={item.id}
                                      className="flex flex-wrap justify-between gap-2"
                                    >
                                      <span className="flex gap-1.5">
                                        <span
                                          className="text-amber-700"
                                          aria-hidden
                                        >
                                          ·
                                        </span>
                                        <span>
                                          {item.label.trim()}
                                          {item.description &&
                                          isUsefulIncludeDescription(
                                            item.label,
                                            item.description
                                          )
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
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      ) : null}

      {showCalculator ? (
        <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-3">
          <p className="text-xs font-semibold text-emerald-950">
            הערכת מחיר לפי {calculatorLabel}
          </p>
          <div className="mt-2 flex flex-wrap items-end gap-3">
            <div className="min-w-[8rem] flex-1">
              <label className="block text-[11px] text-neutral-600">
                {calculatorLabel}
              </label>
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
        </div>
      ) : null}

      {menu.menuNote?.trim() ? (
        <p className="mt-3 text-[11px] leading-relaxed text-neutral-600">
          {menu.menuNote.trim()}
        </p>
      ) : null}

      {menu.sections.some(
        (s) => s.title.trim() || s.items.some((i) => i.label.trim())
      ) ? (
        <div className="mt-4 space-y-3 border-t border-neutral-100 pt-4">
          <p className="text-xs font-semibold text-emerald-950">
            {template.catalogTitle || "פירוט נוסף"}
          </p>
          {menu.sections.map((section) => {
            const items = section.items.filter((i) => i.label.trim());
            if (!section.title.trim() && items.length === 0) return null;
            return (
              <div key={section.id}>
                {section.title.trim() ? (
                  <p className="text-[11px] font-semibold text-neutral-800">
                    {section.title.trim()}
                  </p>
                ) : null}
                <ul className="mt-1 space-y-0.5 text-[11px] text-neutral-700">
                  {items.map((item) => (
                    <li key={item.id} className="flex flex-wrap justify-between gap-2">
                      <span>
                        {item.label.trim()}
                        {formatItemPortion(item)
                          ? ` (${formatItemPortion(item)})`
                          : ""}
                      </span>
                      {formatMenuItemPrice(item) &&
                      item.pricing !== "included" ? (
                        <span className="font-medium">
                          {formatMenuItemPrice(item)}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
