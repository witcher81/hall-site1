"use client";

import { INQUIRY_EXTERNAL_SOURCE_COPY } from "@/lib/venueAmenitySeekerExternal";
import type { InquiryChuppaSplit } from "@/lib/venueInquiryOfferGroups";
import type { InquiryServiceOption } from "@/lib/venueInquiryAmenities";
import InquiryServicePriceBadge from "./InquiryServicePriceBadge";

type Props = {
  chuppa: InquiryChuppaSplit;
  chuppahBoth: boolean;
  chuppahSingleOutdoor: boolean;
  chuppahSingleCovered: boolean;
  weddingChuppahPick: "outdoor" | "covered";
  onWeddingChuppahPick: (v: "outdoor" | "covered") => void;
};

function ChuppaVenueOnlyCard({ opt }: { opt: InquiryServiceOption }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-3 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-neutral-900">{opt.label}</p>
        <InquiryServicePriceBadge opt={opt} />
      </div>
      <p className="mt-1 text-[11px] text-neutral-600">{INQUIRY_EXTERNAL_SOURCE_COPY.venueOnlyLine}</p>
    </div>
  );
}

export default function InquiryChuppahSection({
  chuppa,
  chuppahBoth,
  chuppahSingleOutdoor,
  chuppahSingleCovered,
  weddingChuppahPick,
  onWeddingChuppahPick,
}: Props) {
  const hasChuppah =
    chuppahBoth || chuppahSingleOutdoor || chuppahSingleCovered;

  if (!hasChuppah) return null;

  return (
    <section className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
      <p className="text-xs font-semibold text-emerald-950">חופה (חתונה)</p>
      <p className="mt-1 text-[11px] leading-relaxed text-neutral-600">
        בוחרים סוג חופה אחד דרך האולם — לא ניתן להביא ספק חיצוני לחופה.
      </p>

      <div className="mt-3 space-y-3">
        {chuppahBoth && chuppa.outdoor && chuppa.covered ? (
          <div className="rounded-lg border border-neutral-200 bg-white px-3 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-neutral-900">חופה</p>
              <InquiryServicePriceBadge opt={chuppa.outdoor} />
            </div>
            <p className="mt-1 text-[11px] text-neutral-600">בחרו סוג אחד:</p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
              <label className="flex cursor-pointer items-center gap-2 text-xs text-neutral-800">
                <input
                  type="radio"
                  name="wedding-chuppah-type"
                  checked={weddingChuppahPick === "outdoor"}
                  onChange={() => onWeddingChuppahPick("outdoor")}
                  className="h-4 w-4 accent-emerald-950"
                />
                {chuppa.outdoor.label}
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-xs text-neutral-800">
                <input
                  type="radio"
                  name="wedding-chuppah-type"
                  checked={weddingChuppahPick === "covered"}
                  onChange={() => onWeddingChuppahPick("covered")}
                  className="h-4 w-4 accent-emerald-950"
                />
                {chuppa.covered.label}
              </label>
            </div>
          </div>
        ) : null}
        {chuppahSingleOutdoor && chuppa.outdoor ? (
          <ChuppaVenueOnlyCard opt={chuppa.outdoor} />
        ) : null}
        {chuppahSingleCovered && chuppa.covered ? (
          <ChuppaVenueOnlyCard opt={chuppa.covered} />
        ) : null}
      </div>
    </section>
  );
}
