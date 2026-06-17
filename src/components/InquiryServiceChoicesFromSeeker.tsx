import {
  isRedundantLegacyBoilerplate,
  shouldShowInquiryFreeText,
  stripEmbeddedServiceChoicesFromInquiryMessage,
} from "@/lib/inquiryMessageDisplay";
import { INQUIRY_EXTERNAL_SOURCE_COPY } from "@/lib/venueAmenitySeekerExternal";
import {
  formatInquiryPriceHint,
  inquiryServiceAllowsExternalSource,
} from "@/lib/venueInquiryAmenities";

/** תצוגת JSON בחירות שירותים שנשמר בפנייה */
export default function InquiryServiceChoicesFromSeeker({
  json,
}: {
  json: string | null | undefined;
}) {
  if (!json?.trim()) return null;
  try {
    const arr = JSON.parse(json) as {
      id?: string;
      label?: string;
      source?: string;
      priceMode?: string;
      extraPrice?: number | null;
      extraPriceMax?: number | null;
      replacementName?: string;
      replacementProvider?: string;
      marketplaceServiceId?: number;
      paidExtrasSelected?: Array<{ label?: string }>;
    }[];
    if (!Array.isArray(arr) || arr.length === 0) return null;
    return (
      <div className="mt-4 overflow-hidden rounded-2xl border border-neutral-200 bg-gradient-to-b from-[#FFFCF7] to-[#F5EFE3] shadow-[0_4px_24px_rgba(15,59,46,0.07)]">
        <div className="border-b border-[#C9A227]/25 bg-emerald-950/[0.05] px-4 py-3 sm:px-5">
          <p className="font-serif text-base font-semibold text-[#1A1612]">שירותים שהמבקש ציין</p>
          <p className="mt-1 text-[11px] leading-relaxed text-neutral-600">
            לפי ההגדרות באולם שלך (כולל שירותים מותאמים אישית).
          </p>
        </div>
        <ul className="divide-y divide-[#E8E0D4]/90 bg-white/90">
          {arr.map((row, i) => {
            const label = typeof row.label === "string" && row.label.trim() ? row.label : "—";
            const priceMode = row.priceMode === "extra" ? "extra" : "included";
            const extraPrice =
              typeof row.extraPrice === "number" && Number.isFinite(row.extraPrice)
                ? Math.trunc(row.extraPrice)
                : null;
            const extraPriceMax =
              typeof row.extraPriceMax === "number" && Number.isFinite(row.extraPriceMax)
                ? Math.trunc(row.extraPriceMax)
                : null;
            const priceHint = formatInquiryPriceHint(priceMode, extraPrice, extraPriceMax);
            const venueOnly =
              typeof row.id === "string" && !inquiryServiceAllowsExternalSource({ id: row.id });
            const marketplaceAddon =
              typeof row.id === "string" && row.id.startsWith("marketplace:");
            const hasReplacement =
              typeof row.replacementName === "string" && row.replacementName.trim();
            const via = marketplaceAddon ? (
              <span className="inline-flex shrink-0 rounded-full border border-[#D4C4B0] bg-[#FAF6EF] px-2.5 py-1 text-[11px] font-semibold text-[#4A453C]">
                נוסף מהמאגר
              </span>
            ) : venueOnly ? (
              <span className="inline-flex shrink-0 rounded-full border border-emerald-950/20 bg-emerald-950/[0.08] px-2.5 py-1 text-[11px] font-semibold text-emerald-950">
                חלק מהאולם
              </span>
            ) : row.source === "external" && hasReplacement ? (
              <span className="inline-flex shrink-0 rounded-full border border-[#D4C4B0] bg-[#FAF6EF] px-2.5 py-1 text-[11px] font-semibold text-[#4A453C]">
                חלופה במאגר
              </span>
            ) : row.source === "venue" ? (
              <span className="inline-flex shrink-0 rounded-full border border-emerald-950/20 bg-emerald-950/[0.08] px-2.5 py-1 text-[11px] font-semibold text-emerald-950">
                {INQUIRY_EXTERNAL_SOURCE_COPY.venueRadio}
              </span>
            ) : (
              <span className="inline-flex shrink-0 rounded-full border border-[#D4C4B0] bg-[#FAF6EF] px-2.5 py-1 text-[11px] font-semibold text-[#4A453C]">
                {INQUIRY_EXTERNAL_SOURCE_COPY.externalRadio}
              </span>
            );
            return (
              <li
                key={typeof row.id === "string" ? row.id : `row-${i}`}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 text-right sm:px-5"
              >
                <span className="min-w-0 flex-1 text-sm font-medium text-[#1A1612]">
                  {label}
                  {hasReplacement ? (
                    <span className="mt-0.5 block text-[11px] font-normal text-neutral-700">
                      חלופה במאגר: {row.replacementName}
                      {typeof row.replacementProvider === "string" &&
                      row.replacementProvider.trim()
                        ? ` · ${row.replacementProvider.trim()}`
                        : ""}
                    </span>
                  ) : null}
                  {Array.isArray(row.paidExtrasSelected) && row.paidExtrasSelected.length > 0 ? (
                    <span className="mt-1 block text-[11px] text-neutral-700">
                      תוספות בתשלום:{" "}
                      {row.paidExtrasSelected
                        .map((p) => (typeof p.label === "string" ? p.label.trim() : ""))
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  ) : null}
                  <span className="mt-0.5 block text-[11px] font-normal text-neutral-600">
                    {priceHint}
                  </span>
                </span>
                {via}
              </li>
            );
          })}
        </ul>
      </div>
    );
  } catch {
    return null;
  }
}

/** טקסט חופשי מהמבקש לבעל האולם */
export function InquiryFreeTextFromSeeker({
  message,
  hasStructuredServiceChoices,
  preferredDate = null,
  guestCount = null,
  title = "הערות לבעל האולם",
}: {
  message: string;
  hasStructuredServiceChoices: boolean;
  preferredDate?: string | null;
  guestCount?: number | null;
  title?: string;
}) {
  if (
    preferredDate != null &&
    guestCount != null &&
    isRedundantLegacyBoilerplate(message, preferredDate, guestCount)
  ) {
    return null;
  }
  if (!shouldShowInquiryFreeText(message, hasStructuredServiceChoices)) return null;
  const text = stripEmbeddedServiceChoicesFromInquiryMessage(message);
  if (!text) return null;
  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-neutral-200 bg-gradient-to-b from-[#FFFCF7] to-[#F7F0E6] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_4px_20px_rgba(15,59,46,0.06)]">
      <div className="border-b border-[#C9A227]/20 bg-emerald-950/[0.04] px-4 py-2.5 sm:px-5">
        <p className="font-serif text-sm font-semibold text-neutral-800">{title}</p>
      </div>
      <p className="px-4 py-4 text-sm leading-[1.7] text-neutral-800 whitespace-pre-wrap sm:px-5">
        {text}
      </p>
    </div>
  );
}

import { parseStoredSupplierMessagesJson } from "@/lib/inquirySupplierMessages";

/** הערות מהמבקש לספקים במאגר */
export function InquirySupplierNotesFromSeeker({
  supplierMessage,
  supplierMessagesJson,
}: {
  supplierMessage?: string | null;
  supplierMessagesJson?: string | null;
}) {
  const entries = parseStoredSupplierMessagesJson(supplierMessagesJson);
  if (entries.length > 0) {
    return (
      <div className="mt-4 overflow-hidden rounded-2xl border border-neutral-200 bg-gradient-to-b from-[#FFFCF7] to-[#F7F0E6] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_4px_20px_rgba(15,59,46,0.06)]">
        <div className="border-b border-[#C9A227]/20 bg-emerald-950/[0.04] px-4 py-2.5 sm:px-5">
          <p className="font-serif text-sm font-semibold text-neutral-800">הערות לספקים</p>
        </div>
        <ul className="divide-y divide-neutral-200/70">
          {entries.map((entry) => (
            <li key={entry.serviceId} className="px-4 py-3.5 sm:px-5">
              <p className="text-xs font-semibold text-emerald-950">{entry.serviceName}</p>
              <p className="mt-1.5 text-sm leading-[1.7] text-neutral-800 whitespace-pre-wrap">
                {entry.message}
              </p>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const text = supplierMessage?.trim();
  if (!text) return null;
  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-neutral-200 bg-gradient-to-b from-[#FFFCF7] to-[#F7F0E6] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_4px_20px_rgba(15,59,46,0.06)]">
      <div className="border-b border-[#C9A227]/20 bg-emerald-950/[0.04] px-4 py-2.5 sm:px-5">
        <p className="font-serif text-sm font-semibold text-neutral-800">הערות לספקים</p>
      </div>
      <p className="px-4 py-4 text-sm leading-[1.7] text-neutral-800 whitespace-pre-wrap sm:px-5">
        {text}
      </p>
    </div>
  );
}
