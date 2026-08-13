import "server-only";

import { isProductionRuntime } from "@/lib/isProduction";
import { isStripeConfigured } from "@/lib/stripe";

export {
  SERVICE_BOOST_DAYS,
  SERVICE_BOOST_PRICE_NIS,
  VENUE_BOOST_DAYS,
  VENUE_BOOST_PRICE_NIS,
} from "@/lib/venueBoostConfig";

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
