import { isProductionRuntime } from "@/lib/isProduction";
import { isStripeConfigured } from "@/lib/stripe";

/** קידום בתוצאות חיפוש */
export const VENUE_BOOST_PRICE_NIS = 299;
export const VENUE_BOOST_DAYS = 7;

/**
 * קידום «דמו» (ללא סליקה) — מותר בפיתוח מקומי בלבד, או בפרוד עם
 * VENUE_BOOST_ALLOW_DEMO=true (לסביבות בדיקה). בפרוד רגיל — חסום.
 */
export function isVenueBoostDemoPurchaseEnabled(): boolean {
  if (!isProductionRuntime()) return true;
  return process.env.VENUE_BOOST_ALLOW_DEMO?.trim() === "true";
}

/** תשלום אמיתי דרך Stripe — זמין כשהמפתחות מוגדרים */
export function isVenueBoostStripeEnabled(): boolean {
  return isStripeConfigured();
}

/** האם להציג UI רכישת קידום */
export function isVenueBoostPurchaseUiEnabled(): boolean {
  return isVenueBoostStripeEnabled() || isVenueBoostDemoPurchaseEnabled();
}
