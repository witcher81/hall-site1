"use client";

import { useMemo, useState } from "react";
import {
  estimatePackageTotal,
  formatMenuItemPrice,
  formatPackagePerGuest,
  type ServiceMenuConfig,
  type ServiceMenuPackage,
} from "@/lib/serviceMenu";

type Props = {
  menu: ServiceMenuConfig;
  /** הצגת מחשבון אורחים אינטראקטיבי */
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

export default function ServiceMenuPublicSection({
  menu,
  interactive = true,
}: Props) {
  const defaultGuests = menu.minGuests ?? 100;
  const [guestCount, setGuestCount] = useState(String(defaultGuests));
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(
    menu.packages[0]?.id ?? null
  );

  const guestNum = useMemo(() => {
    const n = Number(guestCount);
    if (!Number.isFinite(n) || n < 1) return null;
    return Math.trunc(n);
  }, [guestCount]);

  const selectedPackage: ServiceMenuPackage | null = useMemo(() => {
    if (!selectedPackageId) return menu.packages[0] ?? null;
    return menu.packages.find((p) => p.id === selectedPackageId) ?? null;
  }, [menu.packages, selectedPackageId]);

  const estimate = useMemo(() => {
    if (!guestNum || !selectedPackage) return null;
    return estimatePackageTotal(selectedPackage, guestNum);
  }, [guestNum, selectedPackage]);

  const capacityText =
    menu.minGuests != null && menu.maxGuests != null
      ? `${menu.minGuests.toLocaleString("he-IL")}–${menu.maxGuests.toLocaleString("he-IL")} אורחים`
      : menu.minGuests != null
        ? `מ-${menu.minGuests.toLocaleString("he-IL")} אורחים`
        : menu.maxGuests != null
          ? `עד ${menu.maxGuests.toLocaleString("he-IL")} אורחים`
          : null;

  return (
    <section className="site-card-padded border-emerald-200/50 bg-gradient-to-br from-emerald-50/40 to-white text-right">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-emerald-950">תפריט ומחירים</h2>
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
          <p className="text-xs font-semibold text-emerald-950">חבילות</p>
          <ul className="mt-2 space-y-2">
            {menu.packages.map((pkg) => {
              const priceLabel = formatPackagePerGuest(pkg);
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
                    {pkg.description?.trim() ? (
                      <p className="mt-1 text-[11px] leading-relaxed text-neutral-600">
                        {pkg.description.trim()}
                      </p>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {interactive && menu.packages.length > 0 ? (
        <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-3">
          <p className="text-xs font-semibold text-emerald-950">הערכת מחיר לפי מספר אורחים</p>
          <div className="mt-2 flex flex-wrap items-end gap-3">
            <div className="min-w-[8rem] flex-1">
              <label className="block text-[11px] text-neutral-600">מספר אורחים</label>
              <input
                type="number"
                min={1}
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value)}
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

      {menu.sections.some((s) => s.items.length > 0) ? (
        <div className="mt-5 space-y-4">
          <p className="text-xs font-semibold text-emerald-950">פירוט מנות</p>
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
