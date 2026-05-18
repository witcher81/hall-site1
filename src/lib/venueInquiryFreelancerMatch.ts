import type { InquiryServiceOption } from "@/lib/venueInquiryAmenities";
import type { HallMoneyBuiltinKey } from "@/lib/venueAfterHallGuide";
import {
  providerCategoryForCustomLabel,
  providerCategoryForHallBuiltin,
  providersHrefForCategory,
} from "@/lib/venueAfterHallGuide";

const HALL_BUILTIN_IDS = new Set<HallMoneyBuiltinKey>([
  "hasFood",
  "hasDanceFloor",
  "hasTableSetup",
  "hasSoundSystem",
]);

export type InquiryMarketplaceSearch = {
  /** קטגוריות ראשיות / משניות במאגר */
  categories: string[];
  /** מילות מפתח לשירותים שמביאים ציוד (למשל DJ + הגברה) */
  keywords: string[];
  /** קטגוריה לקישור «כל הספקים» */
  browseCategory: string;
};

/** חיפוש במאגר — לא רק שירות עצמאי אלא גם ספקים שמביאים ציוד */
export function getInquiryMarketplaceSearch(
  opt: Pick<InquiryServiceOption, "id" | "label">
): InquiryMarketplaceSearch | null {
  if (opt.id.startsWith("service:")) {
    const key = opt.id.slice("service:".length);
    if (key === "hasSoundSystem") {
      return {
        categories: ["ציוד ולוגיסטיקה", "מוזיקה ובמה"],
        keywords: ["הגברה", "תאורה", "DJ", "די ג׳יי", "מערכת הגברה"],
        browseCategory: "ציוד ולוגיסטיקה",
      };
    }
    if (key === "hasFood") {
      return {
        categories: ["אוכל ומשקאות"],
        keywords: ["קייטרינג", "אוכל"],
        browseCategory: "אוכל ומשקאות",
      };
    }
    if (HALL_BUILTIN_IDS.has(key as HallMoneyBuiltinKey)) {
      const cat = providerCategoryForHallBuiltin(key as HallMoneyBuiltinKey);
      if (!cat) return null;
      const primary =
        key === "hasFood"
          ? "אוכל ומשקאות"
          : key === "hasTableSetup"
            ? "עיצוב ומיתוג"
            : cat;
      return {
        categories: [primary],
        keywords: [],
        browseCategory: primary,
      };
    }
  }

  const fromLabel = providerCategoryForCustomLabel(opt.label);
  if (!fromLabel) return null;
  return {
    categories: [fromLabel],
    keywords: [opt.label.trim()].filter(Boolean),
    browseCategory: fromLabel,
  };
}

/** @deprecated — השתמשו ב-getInquiryMarketplaceSearch */
export function inquiryServiceProviderCategory(
  opt: Pick<InquiryServiceOption, "id" | "label">
): string | null {
  return getInquiryMarketplaceSearch(opt)?.browseCategory ?? null;
}

export function inquiryProvidersHref(
  opt: Pick<InquiryServiceOption, "id" | "label">
): string {
  const search = getInquiryMarketplaceSearch(opt);
  if (!search) return "/providers";
  return providersHrefForCategory(search.browseCategory);
}

/** מחיר השוואה מול האולם — תוספת או null אם כלול */
export function inquiryServiceHallComparePrice(opt: InquiryServiceOption): number | null {
  if (opt.priceMode === "extra" && opt.extraPrice != null && opt.extraPrice > 0) {
    return opt.extraPrice;
  }
  return null;
}
