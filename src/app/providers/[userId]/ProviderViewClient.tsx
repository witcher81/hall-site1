"use client";

import ReportContentButton from "@/components/ReportContentButton";
import ShareButton from "@/components/ShareButton";
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end gap-2">
        <ShareButton
          sharePath={`/providers/${provider.id}`}
          title={provider.businessName || provider.name || "ספק"}
        />
      </div>
      {provider.socialLinks.length > 0 && (
        <div className="site-card-padded">
          <p className="mb-2 text-right text-xs font-medium text-neutral-600">
            רשתות וקישורים
          </p>
          <SocialLinksRow links={provider.socialLinks} />
        </div>
      )}

      <section className="site-card-padded text-right text-sm">
        <h2 className="text-base font-semibold text-emerald-950">השירותים של הספק</h2>
        <p className="mt-1 text-xs text-neutral-600">
          לחיצה על שירות פותחת את עמוד השירות עם הפרטים המלאים וטופס שליחת בקשה.
        </p>
        {services.length === 0 ? (
          <p className="mt-3 text-neutral-600">אין שירותים מוגדרים.</p>
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
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
                    className="site-card flex h-full flex-col overflow-hidden transition hover:border-amber-400/50 hover:shadow-lg"
                  >
                    {s.coverImageUrl && (
                      <img
                        src={s.coverImageUrl}
                        alt={s.name}
                        className="h-32 w-full object-cover"
                      />
                    )}
                    <div className="p-4 text-right">
                      <p className="font-semibold text-neutral-900">{s.name}</p>
                      {s.category && (
                        <p className="mt-0.5 text-xs text-emerald-950">{s.category}</p>
                      )}
                      {blurb && (
                        <p className="mt-1 line-clamp-2 text-xs text-neutral-600">
                          {blurb}
                        </p>
                      )}
                      {priceLine != null && (
                        <p className="mt-2 text-xs font-semibold text-amber-700">
                          {priceLine}
                        </p>
                      )}
                      <span className="mt-2 inline-flex text-[11px] font-semibold text-emerald-950">
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

      <div className="text-right">
        <ReportContentButton targetType="provider" targetId={provider.id} />
      </div>
    </div>
  );
}
