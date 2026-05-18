"use client";

import { INQUIRY_EXTERNAL_SOURCE_COPY } from "@/lib/venueAmenitySeekerExternal";
import type { InquiryChuppaSplit } from "@/lib/venueInquiryOfferGroups";
import type { InquiryServiceOption } from "@/lib/venueInquiryAmenities";
import InquiryServicePriceBadge from "./InquiryServicePriceBadge";

type Props = {
  choosable: InquiryServiceOption[];
  chuppa: InquiryChuppaSplit;
  chuppahBoth: boolean;
  chuppahSingleOutdoor: boolean;
  chuppahSingleCovered: boolean;
  weddingChuppahPick: "outdoor" | "covered";
  onWeddingChuppahPick: (v: "outdoor" | "covered") => void;
  sourceById: Record<string, "venue" | "external">;
  onSourceChange: (id: string, source: "venue" | "external") => void;
};

function ChuppaVenueOnlyCard({ opt }: { opt: InquiryServiceOption }) {
  return (
    <div className="rounded-lg border border-[#E0D4C3] bg-white px-3 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-[#1A1A1A]">{opt.label}</p>
        <InquiryServicePriceBadge opt={opt} />
      </div>
      <p className="mt-1 text-[11px] text-[#6B6560]">{INQUIRY_EXTERNAL_SOURCE_COPY.venueOnlyLine}</p>
    </div>
  );
}

export default function InquiryServiceChoicesStep({
  choosable,
  chuppa,
  chuppahBoth,
  chuppahSingleOutdoor,
  chuppahSingleCovered,
  weddingChuppahPick,
  onWeddingChuppahPick,
  sourceById,
  onSourceChange,
}: Props) {
  const hasChuppah =
    chuppahBoth || chuppahSingleOutdoor || chuppahSingleCovered;
  const hasChoices = choosable.length > 0 || hasChuppah;

  if (!hasChoices) {
    return (
      <p className="rounded-xl border border-[#E8E0D4] bg-[#FAF8F4] px-4 py-6 text-center text-sm text-[#6B6560]">
        אין בחירות נוספות — כל השירותים כפי שהאולם הגדיר. המשיכו לשלב השליחה.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-[11px] leading-relaxed text-[#6B6560]">
        {INQUIRY_EXTERNAL_SOURCE_COPY.servicesSectionHelp}
      </p>

      {hasChuppah ? (
        <div className="space-y-3">
          {chuppahBoth && chuppa.outdoor && chuppa.covered ? (
            <div className="rounded-lg border border-[#E0D4C3] bg-white px-3 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-[#1A1A1A]">חופה</p>
                <InquiryServicePriceBadge opt={chuppa.outdoor} />
              </div>
              <p className="mt-1 text-[11px] text-[#6B6560]">דרך האולם בלבד — בחרו סוג אחד:</p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                <label className="flex cursor-pointer items-center gap-2 text-xs text-[#2A261F]">
                  <input
                    type="radio"
                    name="wedding-chuppah-type"
                    checked={weddingChuppahPick === "outdoor"}
                    onChange={() => onWeddingChuppahPick("outdoor")}
                    className="h-4 w-4 accent-[#0F3B2E]"
                  />
                  {chuppa.outdoor.label}
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-xs text-[#2A261F]">
                  <input
                    type="radio"
                    name="wedding-chuppah-type"
                    checked={weddingChuppahPick === "covered"}
                    onChange={() => onWeddingChuppahPick("covered")}
                    className="h-4 w-4 accent-[#0F3B2E]"
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
      ) : null}

      {choosable.length > 0 ? (
        <ul className="space-y-3">
          {choosable.map((opt) => (
            <li
              key={opt.id}
              className="rounded-lg border border-[#E0D4C3] bg-white px-3 py-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-[#1A1A1A]">{opt.label}</p>
                <InquiryServicePriceBadge opt={opt} />
              </div>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                <label className="flex cursor-pointer items-center gap-2 text-xs text-[#2A261F]">
                  <input
                    type="radio"
                    name={`svc-${opt.id}`}
                    checked={(sourceById[opt.id] ?? "venue") === "venue"}
                    onChange={() => onSourceChange(opt.id, "venue")}
                    className="h-4 w-4 accent-[#0F3B2E]"
                  />
                  {INQUIRY_EXTERNAL_SOURCE_COPY.venueRadio}
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-xs text-[#2A261F]">
                  <input
                    type="radio"
                    name={`svc-${opt.id}`}
                    checked={(sourceById[opt.id] ?? "venue") === "external"}
                    onChange={() => onSourceChange(opt.id, "external")}
                    className="h-4 w-4 accent-[#0F3B2E]"
                  />
                  {INQUIRY_EXTERNAL_SOURCE_COPY.externalRadio}
                </label>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
