"use client";

import {
  inquiryServiceAllowsExternalSource,
  type InquiryInfoTrait,
  type InquiryServiceOption,
  type ServiceChoiceSource,
} from "@/lib/venueInquiryAmenities";
import { INQUIRY_EXTERNAL_SOURCE_COPY } from "@/lib/venueAmenitySeekerExternal";
import { PARKING_KIND_LABELS, type ParkingKind } from "@/lib/venueParkingKind";
import {
  inquiryServiceHallComparePrice,
  inquiryServiceProviderCategory,
} from "@/lib/venueInquiryFreelancerMatch";
import InquiryFreelancerAlternatives from "./InquiryFreelancerAlternatives";
import InquiryServicePriceBadge from "./InquiryServicePriceBadge";

function OfferRow({
  opt,
  source,
  onSourceChange,
}: {
  opt: InquiryServiceOption;
  source: ServiceChoiceSource;
  onSourceChange: (source: ServiceChoiceSource) => void;
}) {
  const choosable = inquiryServiceAllowsExternalSource(opt);
  const category = choosable ? inquiryServiceProviderCategory(opt) : null;
  const hallPrice = inquiryServiceHallComparePrice(opt);
  const external = source === "external";

  return (
    <li className="rounded-lg border border-[#E8E0D6]/80 bg-white px-3 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-[#1A1A1A]">{opt.label}</span>
        <InquiryServicePriceBadge opt={opt} />
      </div>

      {choosable ? (
        <>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
            <label className="flex cursor-pointer items-center gap-2 text-xs text-[#2A261F]">
              <input
                type="radio"
                name={`offer-${opt.id}`}
                checked={source === "venue"}
                onChange={() => onSourceChange("venue")}
                className="h-4 w-4 accent-[#0F3B2E]"
              />
              {INQUIRY_EXTERNAL_SOURCE_COPY.venueRadio}
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-xs text-[#2A261F]">
              <input
                type="radio"
                name={`offer-${opt.id}`}
                checked={source === "external"}
                onChange={() => onSourceChange("external")}
                className="h-4 w-4 accent-[#0F3B2E]"
              />
              {INQUIRY_EXTERNAL_SOURCE_COPY.externalRadio}
            </label>
          </div>
          {external && category ? (
            <InquiryFreelancerAlternatives
              category={category}
              hallPrice={hallPrice}
              serviceLabel={opt.label}
            />
          ) : external && !category ? (
            <p className="mt-2 text-[11px] text-[#6B6560]">
              אפשר לחפש ספק חיצוני ב־
              <a href="/providers" className="font-semibold text-[#0F3B2E] underline">
                מאגר הספקים
              </a>
              .
            </p>
          ) : null}
        </>
      ) : (
        <p className="mt-1 text-[11px] text-[#6B6560]">
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
}: {
  items: InquiryServiceOption[];
  emptyText: string;
  sourceById: Record<string, ServiceChoiceSource>;
  onSourceChange: (id: string, source: ServiceChoiceSource) => void;
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

  return (
    <div className="space-y-4">
      {eventTypeLabel ? (
        <p className="rounded-lg border border-[#0F3B2E]/15 bg-[#0F3B2E]/[0.05] px-3 py-2 text-[11px] text-[#2A261F]">
          לפי סוג האירוע שבחרתם: <strong className="font-semibold">{eventTypeLabel}</strong>
        </p>
      ) : null}
      {weddingFoodNote ? (
        <p className="rounded-lg border border-[#C9A227]/25 bg-[#FFFBF0] px-3 py-2 text-[11px] text-[#5C564C]">
          בחתונה האוכל כלול בהגדרת האולם — לא מוצג כפריט נפרד לבחירת מקור.
        </p>
      ) : null}

      {hasChoosable ? (
        <p className="text-[11px] leading-relaxed text-[#6B6560]">
          {INQUIRY_EXTERNAL_SOURCE_COPY.servicesSectionHelp} כשבוחרים ספק חיצוני — מציגים
          הצעות מהמאגר שעשויות להיות משתלמות יותר.
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <section className="overflow-hidden rounded-xl border-2 border-dashed border-[#0F3B2E]/25 bg-[#0F3B2E]/[0.03]">
          <div className="border-b border-[#0F3B2E]/15 bg-[#0F3B2E]/[0.08] px-3 py-2 text-center text-xs font-semibold text-[#0F3B2E]">
            כלול במחיר
          </div>
          <div className="p-3">
            <OfferList
              items={included}
              emptyText="אין פריטים כלולים ברשימה זו"
              sourceById={sourceById}
              onSourceChange={onSourceChange}
            />
          </div>
        </section>
        <section className="overflow-hidden rounded-xl border-2 border-dashed border-[#C9A227]/35 bg-[#FFFBF0]/50">
          <div className="border-b border-[#C9A227]/25 bg-[#C9A227]/10 px-3 py-2 text-center text-xs font-semibold text-[#8B6914]">
            בתוספת תשלום
          </div>
          <div className="p-3">
            <OfferList
              items={extra}
              emptyText="אין פריטים בתוספת תשלום"
              sourceById={sourceById}
              onSourceChange={onSourceChange}
            />
          </div>
        </section>
      </div>

      {allInfo.length > 0 ? (
        <section className="rounded-xl border border-[#E0D4C3] bg-[#FAF8F4] p-4">
          <p className="mb-2 text-xs font-semibold text-[#0F3B2E]">מה מיוחד באולם (מידע בלבד)</p>
          <p className="mb-2 text-[11px] text-[#6B6560]">
            פרטים שהאולם סימן לתצוגה — בלי מחיר וללא בחירת ספק חיצוני.
          </p>
          <ul className="flex flex-wrap gap-2">
            {allInfo.map((t) => (
              <li
                key={t.id}
                className="rounded-full border border-[#E0D4C3] bg-white px-3 py-1 text-xs text-[#2A261F]"
              >
                {t.label}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

