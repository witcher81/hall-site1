"use client";

import {
  FREELANCER_SERVICE_CATEGORIES,
  getPrimaryCategoryDescription,
  parseServiceCategoryValue,
} from "@/lib/freelancerServiceCategories";
import { formatFreelancerServicePriceShekelCompact } from "@/lib/freelancerServicePriceForm";
import type { InquiryAddonFreelancerPick } from "@/lib/inquiryAddonFreelancers";
import Link from "next/link";
import { useMemo, useState } from "react";

type PublicService = {
  id: number;
  name: string;
  category: string | null;
  shortDescription: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  provider: {
    name: string | null;
    businessName: string | null;
  };
};

type Props = {
  selected: InquiryAddonFreelancerPick[];
  onChange: (next: InquiryAddonFreelancerPick[]) => void;
};

function providerLabel(s: PublicService): string {
  return s.provider.businessName?.trim() || s.provider.name?.trim() || "ספק";
}

function toPick(s: PublicService): InquiryAddonFreelancerPick {
  return {
    serviceId: s.id,
    name: s.name,
    providerName: providerLabel(s),
    category: s.category,
    minPrice: s.minPrice,
    maxPrice: s.maxPrice,
  };
}

function groupServicesBySecondary(services: PublicService[]): [string, PublicService[]][] {
  const map = new Map<string, PublicService[]>();
  for (const s of services) {
    const { secondary } = parseServiceCategoryValue(s.category ?? "");
    const key = secondary || "שירותים בקטגוריה";
    const list = map.get(key) ?? [];
    list.push(s);
    map.set(key, list);
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b, "he"));
}

function ServiceRow({
  service,
  picked,
  addDisabled,
  onToggle,
}: {
  service: PublicService;
  picked: boolean;
  addDisabled: boolean;
  onToggle: () => void;
}) {
  return (
    <li
      className={`rounded-lg border px-3 py-2.5 transition ${
        picked ? "border-emerald-950/30 bg-emerald-50/70" : "border-neutral-200 bg-white"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1 text-right">
          <p className="text-sm font-medium text-neutral-900">{service.name}</p>
          <p className="text-[11px] text-neutral-600">{providerLabel(service)}</p>
          {service.shortDescription ? (
            <p className="mt-0.5 line-clamp-2 text-[10px] text-neutral-500">
              {service.shortDescription}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {service.minPrice != null ? (
            <span className="text-[11px] font-semibold tabular-nums text-emerald-950">
              {formatFreelancerServicePriceShekelCompact(service.minPrice, service.maxPrice)}
            </span>
          ) : null}
          <div className="flex items-center gap-2">
            <Link
              href={`/services/${service.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-semibold text-emerald-950 underline-offset-2 hover:underline"
            >
              פרטים
            </Link>
            <button
              type="button"
              onClick={onToggle}
              disabled={!picked && addDisabled}
              className={`rounded-lg px-3 py-1 text-[11px] font-bold transition ${
                picked
                  ? "border border-emerald-950/25 bg-white text-emerald-950"
                  : "bg-emerald-950 text-white hover:bg-emerald-900 disabled:opacity-50"
              }`}
            >
              {picked ? "הסר" : "הוסף"}
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}

function CategoryServiceGroups({
  services,
  selectedIds,
  addDisabled,
  onToggle,
}: {
  services: PublicService[];
  selectedIds: Set<number>;
  addDisabled: boolean;
  onToggle: (service: PublicService) => void;
}) {
  const groups = groupServicesBySecondary(services);
  return (
    <div className="max-h-[min(360px,45vh)] space-y-4 overflow-y-auto pr-1">
      {groups.map(([secondary, items]) => (
        <div key={secondary}>
          {groups.length > 1 ? (
            <p className="mb-2 text-[11px] font-semibold text-neutral-700">{secondary}</p>
          ) : null}
          <ul className="space-y-2">
            {items.map((s) => (
              <ServiceRow
                key={s.id}
                service={s}
                picked={selectedIds.has(s.id)}
                addDisabled={addDisabled}
                onToggle={() => onToggle(s)}
              />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default function InquiryFreelancerAddonsStep({ selected, onChange }: Props) {
  const [expandedPrimaries, setExpandedPrimaries] = useState<Set<string>>(() => new Set());
  const [servicesByPrimary, setServicesByPrimary] = useState<Record<string, PublicService[]>>(
    {}
  );
  const [loadingPrimary, setLoadingPrimary] = useState<string | null>(null);
  const [loadErrorPrimary, setLoadErrorPrimary] = useState<string | null>(null);

  const selectedIds = useMemo(
    () => new Set(selected.map((s) => s.serviceId)),
    [selected]
  );

  const selectedCountByPrimary = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of selected) {
      const { primary } = parseServiceCategoryValue(item.category ?? "");
      if (!primary) continue;
      counts.set(primary, (counts.get(primary) ?? 0) + 1);
    }
    return counts;
  }, [selected]);

  async function loadPrimaryServices(primary: string, force = false) {
    if (!force && servicesByPrimary[primary] !== undefined) return;
    setLoadingPrimary(primary);
    setLoadErrorPrimary(null);
    try {
      const params = new URLSearchParams({ category: primary });
      const res = await fetch(`/api/services/public?${params}`);
      if (!res.ok) throw new Error("fetch");
      const json = (await res.json()) as { services?: PublicService[] };
      setServicesByPrimary((prev) => ({
        ...prev,
        [primary]: json.services ?? [],
      }));
    } catch {
      setLoadErrorPrimary(primary);
    } finally {
      setLoadingPrimary(null);
    }
  }

  function togglePrimary(primary: string) {
    const willOpen = !expandedPrimaries.has(primary);
    setExpandedPrimaries((prev) => {
      const next = new Set(prev);
      if (next.has(primary)) next.delete(primary);
      else next.add(primary);
      return next;
    });
    if (willOpen) void loadPrimaryServices(primary);
  }

  function toggleService(service: PublicService) {
    if (selectedIds.has(service.id)) {
      onChange(selected.filter((s) => s.serviceId !== service.id));
      return;
    }
    if (selected.length >= 20) return;
    onChange([...selected, toPick(service)]);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-emerald-950/15 bg-emerald-950/[0.04] px-4 py-3">
        <p className="text-sm font-semibold text-emerald-950">ספקים נוספים מהמאגר (אופציונלי)</p>
        <p className="mt-1 text-[11px] leading-relaxed text-neutral-600">
          בחרו קטגוריה כדי לראות ספקים — DJ, צילום, פרחים ועוד. אפשר לדלג ולהמשיך לשליחה בלי
          להוסיף.
        </p>
      </div>

      {selected.length > 0 ? (
        <div className="rounded-xl border border-[#C9A227]/35 bg-amber-50/60 p-3">
          <p className="text-xs font-semibold text-emerald-950">
            נבחרו {selected.length} שירותים לצירוף לבקשה
          </p>
          <ul className="mt-2 space-y-2">
            {selected.map((item) => (
              <li
                key={item.serviceId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2"
              >
                <div className="min-w-0 flex-1 text-right">
                  <p className="text-sm font-medium text-neutral-900">{item.name}</p>
                  <p className="text-[11px] text-neutral-600">{item.providerName}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {item.minPrice != null ? (
                    <span className="text-[11px] font-semibold tabular-nums text-emerald-950">
                      {formatFreelancerServicePriceShekelCompact(
                        item.minPrice,
                        item.maxPrice
                      )}
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() =>
                      onChange(selected.filter((s) => s.serviceId !== item.serviceId))
                    }
                    className="rounded-lg border border-red-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-50"
                  >
                    הסר
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="space-y-2">
        <p className="text-xs font-semibold text-emerald-950">קטגוריות במאגר</p>
        <ul className="space-y-2">
          {FREELANCER_SERVICE_CATEGORIES.map((primary) => {
            const open = expandedPrimaries.has(primary);
            const services = servicesByPrimary[primary];
            const loading = loadingPrimary === primary;
            const selectedInCategory = selectedCountByPrimary.get(primary) ?? 0;
            const description = getPrimaryCategoryDescription(primary);

            return (
              <li
                key={primary}
                className={`overflow-hidden rounded-xl border transition ${
                  open ? "border-amber-400/50 bg-white shadow-sm" : "border-neutral-200 bg-neutral-50/80"
                }`}
              >
                <button
                  type="button"
                  onClick={() => togglePrimary(primary)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-right"
                  aria-expanded={open}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs transition ${
                      open ? "bg-amber-400 text-white" : "bg-emerald-950/10 text-emerald-950"
                    }`}
                    aria-hidden
                  >
                    <svg
                      className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-emerald-950">{primary}</span>
                    {description ? (
                      <span className="mt-0.5 block text-[10px] leading-snug text-neutral-600">
                        {description}
                      </span>
                    ) : null}
                  </span>
                  {selectedInCategory > 0 ? (
                    <span className="shrink-0 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-white">
                      {selectedInCategory} נבחרו
                    </span>
                  ) : null}
                </button>

                {open ? (
                  <div className="border-t border-neutral-200/80 bg-white px-3 py-3">
                    {loading ? (
                      <p className="py-4 text-center text-xs text-neutral-600">
                        טוען ספקים בקטגוריה…
                      </p>
                    ) : loadErrorPrimary === primary ? (
                      <p className="py-4 text-center text-xs text-red-700">
                        לא הצלחנו לטעון.{" "}
                        <button
                          type="button"
                          onClick={() => void loadPrimaryServices(primary, true)}
                          className="font-semibold underline"
                        >
                          נסו שוב
                        </button>
                      </p>
                    ) : services === undefined || services.length === 0 ? (
                      <p className="py-4 text-center text-xs text-neutral-600">
                        אין שירותים בקטגוריה זו כרגע במאגר.
                      </p>
                    ) : (
                      <CategoryServiceGroups
                        services={services}
                        selectedIds={selectedIds}
                        addDisabled={selected.length >= 20}
                        onToggle={toggleService}
                      />
                    )}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>

      <p className="text-center text-[11px] text-neutral-500">
        <Link
          href="/providers"
          className="font-semibold text-emerald-950 underline-offset-2 hover:underline"
        >
          מעבר לחיפוש מלא במאגר הספקים
        </Link>
      </p>
    </div>
  );
}
