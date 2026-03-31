import {
  isRedundantLegacyBoilerplate,
  shouldShowInquiryFreeText,
  stripEmbeddedServiceChoicesFromInquiryMessage,
} from "@/lib/inquiryMessageDisplay";

/** תצוגת JSON בחירות שירותים שנשמר בפנייה */
export default function InquiryServiceChoicesFromSeeker({
  json,
}: {
  json: string | null | undefined;
}) {
  if (!json?.trim()) return null;
  try {
    const arr = JSON.parse(json) as { id?: string; label?: string; source?: string }[];
    if (!Array.isArray(arr) || arr.length === 0) return null;
    return (
      <div className="mt-4 overflow-hidden rounded-2xl border border-[#E0D4C3] bg-gradient-to-b from-[#FFFCF7] to-[#F5EFE3] shadow-[0_4px_24px_rgba(15,59,46,0.07)]">
        <div className="border-b border-[#C9A227]/25 bg-[#0F3B2E]/[0.05] px-4 py-3 sm:px-5">
          <p className="font-serif text-base font-semibold text-[#1A1612]">שירותים שהמבקש ציין</p>
          <p className="mt-1 text-[11px] leading-relaxed text-[#6B6560]">
            לפי ההגדרות באולם שלך (כולל שירותים מותאמים אישית).
          </p>
        </div>
        <ul className="divide-y divide-[#E8E0D4]/90 bg-white/90">
          {arr.map((row, i) => {
            const label = typeof row.label === "string" && row.label.trim() ? row.label : "—";
            const via =
              row.source === "venue" ? (
                <span className="inline-flex shrink-0 rounded-full border border-[#0F3B2E]/20 bg-[#0F3B2E]/[0.08] px-2.5 py-1 text-[11px] font-semibold text-[#0F3B2E]">
                  דרך האולם
                </span>
              ) : (
                <span className="inline-flex shrink-0 rounded-full border border-[#D4C4B0] bg-[#FAF6EF] px-2.5 py-1 text-[11px] font-semibold text-[#4A453C]">
                  ספק חיצוני
                </span>
              );
            return (
              <li
                key={typeof row.id === "string" ? row.id : `row-${i}`}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 text-right sm:px-5"
              >
                <span className="min-w-0 flex-1 text-sm font-medium text-[#1A1612]">{label}</span>
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

/** טקסט חופשי מהמבקש — בלי בלוק שירותים ישן שהודבק להודעה */
export function InquiryFreeTextFromSeeker({
  message,
  hasStructuredServiceChoices,
  preferredDate = null,
  guestCount = null,
}: {
  message: string;
  hasStructuredServiceChoices: boolean;
  preferredDate?: string | null;
  guestCount?: number | null;
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
    <div className="mt-4 overflow-hidden rounded-2xl border border-[#E0D4C3] bg-gradient-to-b from-[#FFFCF7] to-[#F7F0E6] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_4px_20px_rgba(15,59,46,0.06)]">
      <div className="border-b border-[#C9A227]/20 bg-[#0F3B2E]/[0.04] px-4 py-2.5 sm:px-5">
        <p className="font-serif text-sm font-semibold text-[#2A261F]">הערות מהמבקש</p>
      </div>
      <p className="px-4 py-4 text-sm leading-[1.7] text-[#2A261F] whitespace-pre-wrap sm:px-5">
        {text}
      </p>
    </div>
  );
}
