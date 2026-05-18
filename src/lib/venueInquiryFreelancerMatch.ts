import type { InquiryServiceOption } from "@/lib/venueInquiryAmenities";
import type { HallMoneyBuiltinKey } from "@/lib/venueAfterHallGuide";
import {
  providerCategoryForCustomLabel,
  providerCategoryForHallBuiltin,
} from "@/lib/venueAfterHallGuide";

const HALL_BUILTIN_IDS = new Set<HallMoneyBuiltinKey>([
  "hasFood",
  "hasDanceFloor",
  "hasTableSetup",
  "hasSoundSystem",
]);

/** מיפוי שירות בטופס הזמנה → קטגוריית חיפוש במאגר הספקים */
export function inquiryServiceProviderCategory(
  opt: Pick<InquiryServiceOption, "id" | "label">
): string | null {
  if (opt.id.startsWith("service:")) {
    const key = opt.id.slice("service:".length);
    if (HALL_BUILTIN_IDS.has(key as HallMoneyBuiltinKey)) {
      if (key === "hasSoundSystem") return "הגברה ותאורה";
      return providerCategoryForHallBuiltin(key as HallMoneyBuiltinKey);
    }
  }
  return providerCategoryForCustomLabel(opt.label);
}

/** מחיר השוואה מול האולם — תוספת או 0 אם כלול */
export function inquiryServiceHallComparePrice(opt: InquiryServiceOption): number | null {
  if (opt.priceMode === "extra" && opt.extraPrice != null && opt.extraPrice > 0) {
    return opt.extraPrice;
  }
  return null;
}
