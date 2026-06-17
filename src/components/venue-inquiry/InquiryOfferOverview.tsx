"use client";

import {
  inquiryServiceAllowsExternalSource,
  type InquiryInfoTrait,
  type InquiryServiceOption,
  type ServiceChoiceSource,
} from "@/lib/venueInquiryAmenities";
import { INQUIRY_EXTERNAL_SOURCE_COPY, inquiryReplacementCopy } from "@/lib/venueAmenitySeekerExternal";
import { formatFreelancerServicePriceShekelCompact } from "@/lib/freelancerServicePriceForm";
import { PARKING_KIND_LABELS, type ParkingKind } from "@/lib/venueParkingKind";
import type { InquiryDealInsight } from "@/lib/inquiryDealInsights";
import { inquiryServiceHallComparePrice } from "@/lib/venueInquiryFreelancerMatch";
import type { InquiryVenueOptionReplacement } from "@/lib/inquiryVenueOptionReplacement";
import InquiryChuppahSection from "./InquiryChuppahSection";
import InquiryDealInsightBadge from "./InquiryDealInsightBadge";
import InquiryFreelancerAlternatives from "./InquiryFreelancerAlternatives";
import InquirySavingsSummary from "./InquirySavingsSummary";
import InquiryServicePriceBadge from "./InquiryServicePriceBadge";
import type { InquiryChuppaSplit } from "@/lib/venueInquiryOfferGroups";

export type MarketplaceAvailability = {
  available: boolean;
  totalCount: number;
  browseCategory: string | null;
};

function OfferRow({
  opt,
  replacement,
  onReplacementChange,
  marketplace,
  marketplaceLoading,
  dealInsight,
}: {
  opt: InquiryServiceOption;
  replacement: InquiryVenueOptionReplacement | null;
  onReplacementChange: (replacement: InquiryVenueOptionReplacement | null) => void;
  marketplace?: MarketplaceAvailability;
  marketplaceLoading?: boolean;
  dealInsight?: InquiryDealInsight;
}) {
  const configAllowsExternal = inquiryServiceAllowsExternalSource(opt);
  const hasMarketplace =
    marketplace?.available === true && (marketplace.totalCount ?? 0) > 0;
  const showExternalChoice = configAllowsExternal && hasMarketplace;
  const hallPrice = inquiryServiceHallComparePrice(opt);
  const replacementCopy = inquiryReplacementCopy(opt.priceMode);
  const isIncludedFree = opt.priceMode === "included";

  return (
    <li className="rounded-lg border border-[#E8E0D6]/80 bg-white px-3 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-neutral-900">{opt.label}</span>
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          {isIncludedFree && showExternalChoice && replacementCopy.upgradeBadge ? (
            <span className="rounded-full border border-amber-300/70 bg-amber-50 px-2 py-0.5 text-[9px] font-semibold text-amber-950">
              {replacementCopy.upgradeBadge}
            </span>
          ) : null}
          <InquiryDealInsightBadge insight={dealInsight} />
          <InquiryServicePriceBadge opt={opt} />
        </div>
      </div>

      {configAllowsExternal ? (
        <>
          {marketplaceLoading ? (
            <p className="mt-2 text-[11px] text-[#9A928A]">בודקים אם יש ספקים במאגר…</p>
          ) : showExternalChoice ? (
            <>
              <div
                className={`mt-2 rounded-lg border px-3 py-2.5 ${
                  replacement
                    ? "border-emerald-950/25 bg-emerald-50/50"
                    : "border-neutral-200 bg-neutral-50/80"
                }`}
              >
                <p className="text-[10px] font-semibold text-neutral-600">הבחירה שלכם</p>
                {replacement ? (
                  <div className="mt-1.5 flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1 text-right">
                      <p className="text-sm font-medium text-emerald-950">{replacement.name}</p>
                      <p className="text-[11px] text-neutral-600">{replacement.providerName}</p>
                      <p className="mt-0.5 text-[10px] text-neutral-500">
                        {replacementCopy.selectedNote}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      {replacement.minPrice != null ? (
                        <span className="text-[11px] font-semibold tabular-nums text-emerald-950">
                          {formatFreelancerServicePriceShekelCompact(
                            replacement.minPrice,
                            replacement.maxPrice
                          )}
                        </span>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => onReplacementChange(null)}
                        className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-emerald-950 hover:bg-neutral-50"
                      >
                        חזרה להצעת האולם
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
                    <div className="text-right">
                      <p className="text-sm font-medium text-neutral-900">
                        {replacementCopy.venueDefaultTitle}
                      </p>
                      <p className="text-[10px] text-neutral-600">
                        {replacementCopy.venueDefaultSubtitle}
                      </p>
                    </div>
                    <InquiryServicePriceBadge opt={opt} />
                  </div>
                )}
              </div>

              <InquiryFreelancerAlternatives
                opt={opt}
                hallPrice={hallPrice}
                prefetched={dealInsight}
                selectedReplacement={replacement}
                onSelectReplacement={onReplacementChange}
                priceMode={opt.priceMode}
              />
            </>
          ) : (
            <p className="mt-2 text-[11px] text-neutral-600">
              {INQUIRY_EXTERNAL_SOURCE_COPY.venueOnlyLine} אין כרגע ספק מתאים במאגר — רק דרך
              האולם.
            </p>
          )}
        </>
      ) : (
        <p className="mt-1 text-[11px] text-neutral-600">
          {INQUIRY_EXTERNAL_SOURCE_COPY.venueOnlyLine}
        </p>
      )}
    </li>
  );
}

function OfferList({
  items,
  emptyText,
  replacementByOptionId,
  onReplacementChange,
  marketplaceById,
  marketplaceLoading,
  dealInsightsById,
}: {
  items: InquiryServiceOption[];
  emptyText: string;
  replacementByOptionId: Record<string, InquiryVenueOptionReplacement | undefined>;
  onReplacementChange: (id: string, replacement: InquiryVenueOptionReplacement | null) => void;
  marketplaceById: Record<string, MarketplaceAvailability>;
  marketplaceLoading: boolean;
  dealInsightsById: Record<string, InquiryDealInsight>;
}) {
  if (items.length === 0) {
    return <p className="py-4 text-center text-[11px] text-[#9A928A]">{emptyText}</p>;
  }
  return (
    <ul className="space-y-2">
      {items.map((opt) => (
        <OfferRow
          key={opt.id}
          opt={opt}
          replacement={replacementByOptionId[opt.id] ?? null}
          onReplacementChange={(replacement) => onReplacementChange(opt.id, replacement)}
          marketplace={marketplaceById[opt.id]}
          marketplaceLoading={marketplaceLoading}
          dealInsight={dealInsightsById[opt.id]}
        />
      ))}
    </ul>
  );
}

type Props = {
  included: InquiryServiceOption[];
  extra: InquiryServiceOption[];
  infoTraits: InquiryInfoTrait[];
  presetLabels?: string[];
  parkingKind: ParkingKind | null;
  eventTypeLabel: string | null;
  weddingFoodNote?: boolean;
  replacementByOptionId: Record<string, InquiryVenueOptionReplacement | undefined>;
  onReplacementChange: (id: string, replacement: InquiryVenueOptionReplacement | null) => void;
  marketplaceById: Record<string, MarketplaceAvailability>;
  marketplaceLoading: boolean;
  dealInsightsById: Record<string, InquiryDealInsight>;
  dealInsightsLoading?: boolean;
  chuppa?: InquiryChuppaSplit;
  chuppahBoth?: boolean;
  chuppahSingleOutdoor?: boolean;
  chuppahSingleCovered?: boolean;
  weddingChuppahPick?: "outdoor" | "covered";
  onWeddingChuppahPick?: (v: "outdoor" | "covered") => void;
};

export default function InquiryOfferOverview({
  included,
  extra,
  infoTraits,
  presetLabels,
  parkingKind,
  eventTypeLabel,
  weddingFoodNote,
  replacementByOptionId,
  onReplacementChange,
  marketplaceById,
  marketplaceLoading,
  dealInsightsById,
  dealInsightsLoading = false,
  chuppa,
  chuppahBoth = false,
  chuppahSingleOutdoor = false,
  chuppahSingleCovered = false,
  weddingChuppahPick = "outdoor",
  onWeddingChuppahPick,
}: Props) {
  const allInfo: { id: string; label: string }[] = [
    ...infoTraits,
    ...(presetLabels ?? [])
      .filter((l) => l.trim())
      .map((label) => ({ id: `preset:${label}`, label: label.trim() })),
  ];
  if (parkingKind && parkingKind !== "none") {
    allInfo.unshift({ id: "parking", label: PARKING_KIND_LABELS[parkingKind] });
  }

  const hasChoosable =
    [...included, ...extra].some((o) => inquiryServiceAllowsExternalSource(o));

  const hallFeaturesSection =
    allInfo.length > 0 ? (
      <section className="rounded-xl border border-emerald-950/15 bg-gradient-to-br from-neutral-100 to-emerald-50/40 p-4">
        <p className="text-sm font-bold text-emerald-950">מאפייני האולם</p>
        <p className="mt-1 text-[11px] leading-relaxed text-neutral-600">
          מה מקבלים במקום — מבנה, נוף ומאפיינים שחלק מהאולם (ללא תמחור נפרד לפריטים אלה).
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {allInfo.map((t) => (
            <li
              key={t.id}
              className="rounded-2xl border border-emerald-950/18 bg-white px-3 py-1.5 text-xs font-medium text-emerald-950 shadow-sm"
            >
              {t.label}
            </li>
          ))}
        </ul>
      </section>
    ) : null;

  return (
    <div className="space-y-4">
      {eventTypeLabel ? (
        <p className="rounded-lg border border-emerald-950/15 bg-emerald-950/[0.05] px-3 py-2 text-[11px] text-neutral-800">
          לפי סוג האירוע שבחרתם: <strong className="font-semibold">{eventTypeLabel}</strong>
        </p>
      ) : null}
      {weddingFoodNote ? (
        <p className="rounded-lg border border-[#C9A227]/25 bg-amber-50 px-3 py-2 text-[11px] text-[#5C564C]">
          בחתונה האוכל כלול בהגדרת האולם — לא מוצג כפריט נפרד לבחירת מקור.
        </p>
      ) : null}

      {hallFeaturesSection}

      {hasChoosable ? (
        <p className="text-[11px] leading-relaxed text-neutral-600">
          בפריטים <strong className="font-semibold">כלולים במחיר</strong> — ברירת המחדל היא מה
          שהאולם מציע בחינם. אפשר גם{" "}
          <strong className="font-semibold">להביא ספק אחר בתשלום</strong> מהמאגר. בפריטים בתוספת
          תשלום — אפשר להחליף בספק חיצוני כשזמין.
        </p>
      ) : null}

      <InquirySavingsSummary
        dealInsightsById={dealInsightsById}
        loading={dealInsightsLoading}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <section className="overflow-hidden rounded-xl border-2 border-dashed border-emerald-950/25 bg-emerald-950/[0.03]">
          <div className="border-b border-emerald-950/15 bg-emerald-950/[0.08] px-3 py-2 text-center">
            <p className="text-xs font-semibold text-emerald-950">כלול במחיר</p>
            {hasChoosable && included.some((o) => inquiryServiceAllowsExternalSource(o)) ? (
              <p className="mt-0.5 text-[10px] font-normal text-emerald-950/75">
                אפשר להשאיר מהאולם או להביא חלופה בתשלום
              </p>
            ) : null}
          </div>
          <div className="p-3">
            <OfferList
              items={included}
              emptyText="אין פריטים כלולים ברשימה זו"
              replacementByOptionId={replacementByOptionId}
              onReplacementChange={onReplacementChange}
              marketplaceById={marketplaceById}
              marketplaceLoading={marketplaceLoading}
              dealInsightsById={dealInsightsById}
            />
          </div>
        </section>
        <section className="overflow-hidden rounded-xl border-2 border-dashed border-[#C9A227]/35 bg-amber-50/50">
          <div className="border-b border-[#C9A227]/25 bg-amber-400/10 px-3 py-2 text-center text-xs font-semibold text-[#8B6914]">
            בתוספת תשלום
          </div>
          <div className="p-3">
            <OfferList
              items={extra}
              emptyText="אין פריטים בתוספת תשלום"
              replacementByOptionId={replacementByOptionId}
              onReplacementChange={onReplacementChange}
              marketplaceById={marketplaceById}
              marketplaceLoading={marketplaceLoading}
              dealInsightsById={dealInsightsById}
            />
          </div>
        </section>
      </div>

      {chuppa && onWeddingChuppahPick ? (
        <InquiryChuppahSection
          chuppa={chuppa}
          chuppahBoth={chuppahBoth}
          chuppahSingleOutdoor={chuppahSingleOutdoor}
          chuppahSingleCovered={chuppahSingleCovered}
          weddingChuppahPick={weddingChuppahPick}
          onWeddingChuppahPick={onWeddingChuppahPick}
        />
      ) : null}
    </div>
  );
}
