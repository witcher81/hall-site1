/** סוגי רשומה בבקרת תוכן */
export type ListingType = "VENUE" | "SERVICE";

/** סטטוס אישור פרסום */
export const ListingModerationStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export type ListingModerationStatusValue =
  (typeof ListingModerationStatus)[keyof typeof ListingModerationStatus];

/** מקור החלטה — מוכן ל־API / אוטומציה */
export const ListingModerationSource = {
  ADMIN: "ADMIN",
  OWNER: "OWNER",
  SYSTEM: "SYSTEM",
  API: "API",
  AUTO: "AUTO",
} as const;

export type ListingModerationSourceValue =
  (typeof ListingModerationSource)[keyof typeof ListingModerationSource];

export const LISTING_MODERATION_STATUS_SET = new Set<string>(
  Object.values(ListingModerationStatus)
);

export function isListingModerationStatus(
  value: string | null | undefined
): value is ListingModerationStatusValue {
  return !!value && LISTING_MODERATION_STATUS_SET.has(value);
}

export function isListingPubliclyVisible(
  status: string | null | undefined
): boolean {
  return status === ListingModerationStatus.APPROVED;
}

export const LISTING_MODERATION_LABELS: Record<ListingModerationStatusValue, string> = {
  PENDING: "ממתין לאישור",
  APPROVED: "מפורסם",
  REJECTED: "נדחה",
};

export const LISTING_TYPE_LABELS: Record<ListingType, string> = {
  VENUE: "אולם",
  SERVICE: "שירות",
};

/** מסנן Prisma לרשימות ציבוריות */
export function approvedListingWhere() {
  return { moderationStatus: ListingModerationStatus.APPROVED } as const;
}

export type ExternalModerationDecisionPayload = {
  listingType: ListingType;
  listingId: number;
  decision: "APPROVED" | "REJECTED";
  note?: string | null;
  source?: ListingModerationSourceValue;
  metadata?: Record<string, unknown>;
  actorUserId?: number | null;
};
