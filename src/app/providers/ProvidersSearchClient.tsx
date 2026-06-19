"use client";

import OptionalPriceRangeFields from "@/components/OptionalPriceRangeFields";
import PopularBadge from "@/components/PopularBadge";
import {
  FREELANCER_SERVICE_CATEGORIES,
  getSecondaryServicesForPrimary,
} from "@/lib/freelancerServiceCategories";
import { resolveProviderCategoryFilter } from "@/lib/serviceCategoryQuery";
import { mergeFreelancerServiceDescriptionForForm } from "@/lib/freelancerServiceDescription";
import { formatFreelancerServicePriceShekelCompact } from "@/lib/freelancerServicePriceForm";
import RecentlyViewedBar from "@/components/RecentlyViewedBar";
import SocialLinksRow from "@/components/SocialLinksRow";
import { parseSocialLinksJson } from "@/lib/socialLinks";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Service = {
  id: number;
  name: string;
  category: string | null;
  shortDescription: string | null;
  description: string | null;
  serviceArea: string | null;
  experienceYears: number | null;
  languages: string | null;
  coverImageUrl: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  providerId: number;
  provider: {
    id: number;
    name: string | null;
    businessName: string | null;
    businessPhone: string | null;
    socialLinksJson: string | null;
  };
};

import type { PublicProviderServiceItem } from "@/lib/publicProvidersSearch";

export default function ProvidersSearchClient({
  initialServices = [],
}: {
  initialServices?: PublicProviderServiceItem[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [services, setServices] = useState<Service[]>(initialServices);
  const [popularProviderIds, setPopularProviderIds] = useState<Set<number>>(
    new Set()
  );
  const [loading, setLoading] = useState(initialServices.length === 0);
  const [form, setForm] = useState({
    category: "",
    secondary: "",
    minPrice: "",
    maxPrice: "",
  });

  useEffect(() => {
    const rawCat = searchParams.get("category") ?? "";
    const rawSec = searchParams.get("secondary") ?? "";
    const { primary, secondary } = resolveProviderCategoryFilter(rawCat, rawSec);
    setForm({
      category: primary,
      secondary,
      minPrice: searchParams.get("minPrice") ?? "",
      maxPrice: searchParams.get("maxPrice") ?? "",
    });
  }, [searchParams]);

  const secondaryOptions = form.category
    ? getSecondaryServicesForPrimary(form.category)
    : [];

  useEffect(() => {
    fetch("/api/trending")
      .then((r) => r.json())
      .then((data: { popularProviderIds?: unknown }) => {
        const raw = data.popularProviderIds;
        const ids = Array.isArray(raw)
          ? raw.filter(
              (n): n is number =>
                typeof n === "number" && Number.isInteger(n) && n > 0
            )
          : [];
        setPopularProviderIds(new Set(ids));
      })
      .catch(() => setPopularProviderIds(new Set()));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    const category = searchParams.get("category");
    const secondary = searchParams.get("secondary");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    if (category) params.set("category", category);
    if (secondary) params.set("secondary", secondary);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    const qs = params.toString();
    fetch(`/api/services/public${qs ? `?${qs}` : ""}`)
      .then((res) => res.json())
      .then((data) => setServices(data.services ?? []))
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  }, [searchParams]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (form.category) params.set("category", form.category);
    if (form.secondary) params.set("secondary", form.secondary);
    if (form.minPrice) params.set("minPrice", form.minPrice);
    if (form.maxPrice) params.set("maxPrice", form.maxPrice);
    router.push(`/providers${params.toString() ? `?${params.toString()}` : ""}`);
  }

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (form.category) n += 1;
    if (form.secondary) n += 1;
    if (form.minPrice || form.maxPrice) n += 1;
    return n;
  }, [form]);

  return (
    <div className="mt-6 space-y-6">
      <form
        onSubmit={handleSubmit}
        className="site-card-padded text-right text-sm"
      >
        <p className="mb-3 text-xs font-semibold text-emerald-950">סינון חיפוש</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="block text-xs font-medium text-neutral-600">קטגוריה ראשית</label>
            <select
              value={form.category}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  category: e.target.value,
                  secondary: "",
                }))
              }
              className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-neutral-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40"
            >
              <option value="">הכל</option>
              {FREELANCER_SERVICE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600">שירות (משני)</label>
            <select
              value={form.secondary}
              disabled={!form.category || secondaryOptions.length === 0}
              onChange={(e) => setForm((f) => ({ ...f, secondary: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-neutral-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40 disabled:opacity-50"
            >
              <option value="">כל השירותים בקטגוריה</option>
              {secondaryOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <OptionalPriceRangeFields
              minPrice={form.minPrice}
              maxPrice={form.maxPrice}
              onChange={(min, max) =>
                setForm((f) => ({ ...f, minPrice: min, maxPrice: max }))
              }
              singleLabel="מחיר לשירות (₪)"
              singlePlaceholder="למשל 2500"
              minLabel="מחיר מינימלי (₪)"
              maxLabel="מחיר מקסימלי (₪)"
              expandRangeLabel="אין לי מחיר מדויק — חפש לפי טווח"
              collapseRangeLabel="יש לי מחיר מדויק"
              inputClassName="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-neutral-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded-full bg-amber-400 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-300"
            >
              חפש
            </button>
          </div>
        </div>
      </form>

      {activeFilterCount === 0 ? (
        <RecentlyViewedBar variant="providers" layout="section" />
      ) : null}

      {loading ? (
        <p className="py-8 text-center text-sm text-neutral-600">טוען תוצאות…</p>
      ) : services.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center text-sm text-neutral-600">
          לא נמצאו שירותים לפי הסינון. נסה לשנות פרמטרים.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => {
            const socialLinks = parseSocialLinksJson(s.provider.socialLinksJson);
            const blurb = mergeFreelancerServiceDescriptionForForm(
              s.shortDescription,
              s.description
            );
            const priceLine = formatFreelancerServicePriceShekelCompact(
              s.minPrice,
              s.maxPrice
            );
            return (
              <div
                key={s.id}
                className="site-card overflow-hidden text-right transition hover:border-amber-400/50 hover:shadow-lg"
              >
                <a
                  href={`/services/${s.id}`}
                  className="block p-4 pb-3"
                >
                  {s.coverImageUrl ? (
                    <div className="relative mb-2">
                      {popularProviderIds.has(s.providerId) && (
                        <PopularBadge className="absolute right-2 top-2 z-10" />
                      )}
                      <img
                        src={s.coverImageUrl}
                        alt={s.name}
                        className="h-32 w-full rounded-xl object-cover"
                      />
                    </div>
                  ) : (
                    popularProviderIds.has(s.providerId) && (
                      <div className="mb-2 flex justify-end">
                        <PopularBadge />
                      </div>
                    )
                  )}
                  <h2 className="font-semibold text-emerald-950">{s.name}</h2>
                  {s.category && (
                    <p className="mt-0.5 text-xs text-neutral-600">{s.category}</p>
                  )}
                  {blurb ? (
                    <p className="mt-1 line-clamp-4 whitespace-pre-wrap text-xs text-neutral-600">
                      {blurb}
                    </p>
                  ) : null}
                  {s.serviceArea && (
                    <p className="mt-1 text-xs text-neutral-600">אזור שירות: {s.serviceArea}</p>
                  )}
                  {(s.experienceYears != null || s.languages) && (
                    <p className="mt-1 text-xs text-neutral-600">
                      {[
                        s.experienceYears != null ? `ניסיון: ${s.experienceYears} שנים` : null,
                        s.languages ? `שפות: ${s.languages}` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-neutral-600">
                    {s.provider.businessName || s.provider.name || "ספק"}
                  </p>
                  {priceLine != null && (
                    <p className="mt-1 text-xs text-neutral-800">{priceLine}</p>
                  )}
                </a>
                {socialLinks.length > 0 && (
                  <div className="border-t border-neutral-200/80 bg-[#141414] px-3 py-2.5">
                    <SocialLinksRow links={socialLinks} compact dark />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
