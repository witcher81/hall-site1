import "server-only";

/** עמלת פלטפורמה על הזמנות ששולמו דרך האתר */
export const BOOKING_PLATFORM_FEE_PERCENT = 10;

export function isBookingPaymentsEnabled(): boolean {
  return process.env.ENABLE_BOOKING_PAYMENTS?.trim() === "true";
}

export function isStripeConnectConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function bookingPlatformFeeNis(grossAmountNis: number): number {
  return Math.round((grossAmountNis * BOOKING_PLATFORM_FEE_PERCENT) / 100);
}

export function bookingProviderNetNis(grossAmountNis: number): number {
  return grossAmountNis - bookingPlatformFeeNis(grossAmountNis);
}

export const PAYMENT_PURPOSE = {
  VENUE_BOOKING: "venue_booking",
  SERVICE_BOOKING: "service_booking",
  VENUE_BOOST: "venue_boost",
  SERVICE_BOOST: "service_boost",
} as const;

export type BookingPaymentPurpose =
  | typeof PAYMENT_PURPOSE.VENUE_BOOKING
  | typeof PAYMENT_PURPOSE.SERVICE_BOOKING;
