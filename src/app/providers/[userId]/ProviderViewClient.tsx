"use client";

import SocialLinksRow from "@/components/SocialLinksRow";
import { mergeFreelancerServiceDescriptionForForm } from "@/lib/freelancerServiceDescription";
import { formatFreelancerServicePriceShekelCompact } from "@/lib/freelancerServicePriceForm";
import { recordProviderRecentlyViewed } from "@/lib/recentlyViewedProviders";
import { useEngagedFreelancerProfileView } from "@/lib/useEngagedViewAnalytics";
import type { SocialLink } from "@/lib/socialLinks";
import { useEffect } from "react";

type Provider = {
  id: number;
  name: string | null;
  businessName: string | null;
  businessPhone: string | null;
  businessAddress: string | null;
  socialLinks: SocialLink[];
};

type Service = {
  id: number;
  name: string;
  category: string | null;
  shortDescription: string | null;
  description: string | null;
  coverImageUrl: string | null;
  minPrice: number | null;
  maxPrice: number | null;
};

export default function ProviderViewClient({
  provider,
  services,
}: {
  provider: Provider;
  services: Service[];
}) {
  useEngagedFreelancerProfileView(provider.id);

  useEffect(() => {
    recordProviderRecentlyViewed(provider.id);
  }, [provider.id]);

  const providerName = provider.businessName || provider.name || "ספק";

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div className="text-right">
          <h1 className="text-xl font-semibold text-emerald-950">{providerName}</h1>
          {provider.businessAddress && (
            <p className="mt-1 text-xs text-neutral-600">{provider.businessAddress}</p>
          )}
        </div>
        <a
          href="/providers"
          className="text-sm text-emerald-950 underline-offset-4 hover:text-[#174D3B] hover:underline"
        >
          חזרה לחיפוש ספקים
        </a>
      </header>

      {provider.socialLinks.length > 0 && (
        <div className="mt-4 rounded-xl bg-[#141414] px-4 py-3 shadow-inner">
          <p className="mb-2 text-right text-[11px] font-medium text-white/70">
            רשתות וקישורים
          </p>
          <SocialLinksRow links={provider.socialLinks} dark />
        </div>
      )}

      <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 text-right text-sm shadow-sm">
        <h2 className="text-base font-semibold text-emerald-950">השירותים של הספק</h2>
        <p className="mt-1 text-xs text-neutral-600">
          לחיצה על שירות פותחת את עמוד השירות עם הפרטים המלאים וטופס שליחת בקשה.
        </p>
        {services.length === 0 ? (
          <p className="mt-3 text-neutral-600">אין שירותים מוגדרים.</p>
        ) : (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {services.map((s) => {
              const blurb = mergeFreelancerServiceDescriptionForForm(
                s.shortDescription,
                s.description
              );
              const priceLine = formatFreelancerServicePriceShekelCompact(
                s.minPrice,
                s.maxPrice
              );
              return (
                <li key={s.id}>
                  <a
                    href={`/services/${s.id}`}
                    className="flex h-full flex-col overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 transition hover:border-amber-400/60 hover:shadow"
                  >
                    {s.coverImageUrl && (
                      <img
                        src={s.coverImageUrl}
                        alt={s.name}
                        className="h-28 w-full object-cover"
                      />
                    )}
                    <div className="p-3 text-right">
                      <p className="font-medium text-neutral-900">{s.name}</p>
                      {s.category && (
                        <p className="mt-0.5 text-xs text-emerald-950">{s.category}</p>
                      )}
                      {blurb && (
                        <p className="mt-1 line-clamp-2 text-xs text-neutral-600">
                          {blurb}
                        </p>
                      )}
                      {priceLine != null && (
                        <p className="mt-1 text-xs font-semibold text-emerald-950">
                          {priceLine}
                        </p>
                      )}
                      <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600">
                        לפרטים מלאים ←
                      </span>
                    </div>
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
