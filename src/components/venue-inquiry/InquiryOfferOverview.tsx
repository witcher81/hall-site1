"use client";

import {
  inquiryServiceAllowsExternalSource,
  type InquiryInfoTrait,
  type InquiryServiceOption,
  type ServiceChoiceSource,
} from "@/lib/venueInquiryAmenities";
import { INQUIRY_EXTERNAL_SOURCE_COPY } from "@/lib/venueAmenitySeekerExternal";
import { PARKING_KIND_LABELS, type ParkingKind } from "@/lib/venueParkingKind";
import type { InquiryDealInsight } from "@/lib/inquiryDealInsights";
import { inquiryServiceHallComparePrice } from "@/lib/venueInquiryFreelancerMatch";
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
  source,
  onSourceChange,
  marketplace,
  marketplaceLoading,
  dealInsight,
}: {
  opt: InquiryServiceOption;
  source: ServiceChoiceSource;
  onSourceChange: (source: ServiceChoiceSource) => void;
  marketplace?: MarketplaceAvailability;
  marketplaceLoading?: boolean;
  dealInsight?: InquiryDealInsight;
}) {
  const configAllowsExternal = inquiryServiceAllowsExternalSource(opt);
  const hasMarketplace =
    marketplace?.available === true && (marketplace.totalCount ?? 0) > 0;
  const showExternalChoice = configAllowsExternal && hasMarketplace;
  const hallPrice = inquiryServiceHallComparePrice(opt);
  const external = source === "external";
  const showDealHint =
    dealInsight?.recommendExternal === true && !external && showExternalChoice;
  const showAlternatives =
    showExternalChoice &&
    (external ||
      (dealInsight?.recommendExternal &&
        (dealInsight.topServices.length > 0 || dealInsight.totalCount > 0)));

  return (
    <li className="rounded-lg border border-[#E8E0D6]/80 bg-white px-3 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-neutral-900">{opt.label}</span>
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <InquiryDealInsightBadge insight={dealInsight} />
          <InquiryServicePriceBadge opt={opt} />
        </div>
      </div>

      {configAllowsExternal ? (
        <>
          {marketplaceLoading ? (
            <p className="mt-2 text-[11px] text-[#9A928A]">בודקים אם יש ספקים במאגר…</p>
          ) : showExternalChoice ? (
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
              <label className="flex cursor-pointer items-center gap-2 text-xs text-neutral-800">
                <input
                  type="radio"
                  name={`offer-${opt.id}`}
                  checked={source === "venue"}
                  onChange={() => onSourceChange("venue")}
                  className="h-4 w-4 accent-emerald-950"
                />
                {INQUIRY_EXTERNAL_SOURCE_COPY.venueRadio}
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-xs text-neutral-800">
                <input
                  type="radio"
                  name={`offer-${opt.id}`}
                  checked={source === "external"}
                  onChange={() => onSourceChange("external")}
                  className="h-4 w-4 accent-emerald-950"
                />
                {INQUIRY_EXTERNAL_SOURCE_COPY.externalRadio}
              </label>
            </div>
          ) : (
            <p className="mt-2 text-[11px] text-neutral-600">
              {INQUIRY_EXTERNAL_SOURCE_COPY.venueOnlyLine} אין כרגע ספק מתאים במאגר — רק דרך
              האולם.
            </p>
          )}
          {showDealHint ? (
            <p className="mt-2 rounded-md border border-emerald-950/20 bg-emerald-50/50 px-2.5 py-1.5 text-[10px] text-neutral-800">
              במאגר יש הצעות זולות יותר — בחרו «ספק חיצוני» כדי לשמור את ההעדפה בפנייה, או לחצו
              «הצג המלצות במאגר» להשוואה.
            </p>
          ) : null}
          {showAlternatives ? (
            <InquiryFreelancerAlternatives
              opt={opt}
              hallPrice={hallPrice}
              prefetched={dealInsight}
            />
          ) : null}
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
  sourceById,
  onSourceChange,
  marketplaceById,
  marketplaceLoading,
  dealInsightsById,
}: {
  items: InquiryServiceOption[];
  emptyText: string;
  sourceById: Record<string, ServiceChoiceSource>;
  onSourceChange: (id: string, source: ServiceChoiceSource) => void;
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
          source={sourceById[opt.id] ?? "venue"}
          onSourceChange={(src) => onSourceChange(opt.id, src)}
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
  sourceById: Record<string, ServiceChoiceSource>;
  onSourceChange: (id: string, source: ServiceChoiceSource) => void;
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
  sourceById,
  onSourceChange,
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
          {INQUIRY_EXTERNAL_SOURCE_COPY.servicesSectionHelp} המערכת משווה מחיר מול דירוג וביקורות
          וממליצה מה הכי משתלם — לא רק את הרשימה הזולה ביותר.
        </p>
      ) : null}

      <InquirySavingsSummary
        dealInsightsById={dealInsightsById}
        loading={dealInsightsLoading}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <section className="overflow-hidden rounded-xl border-2 border-dashed border-emerald-950/25 bg-emerald-950/[0.03]">
          <div className="border-b border-emerald-950/15 bg-emerald-950/[0.08] px-3 py-2 text-center text-xs font-semibold text-emerald-950">
            כלול במחיר
          </div>
          <div className="p-3">
            <OfferList
              items={included}
              emptyText="אין פריטים כלולים ברשימה זו"
              sourceById={sourceById}
              onSourceChange={onSourceChange}
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
              sourceById={sourceById}
              onSourceChange={onSourceChange}
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

