import type { Prisma } from "@prisma/client";
import type { SeekerBundleItem } from "@/lib/seekerEventBundleTypes";
import {
  parseBundleItemsJson,
  serializeBundleItems,
} from "@/lib/seekerEventBundleTypes";

export const BUNDLE_BUILD_MODES = new Set(["manual", "auto"]);
export const BUNDLE_STATUSES = new Set(["draft", "ready", "submitted"]);

export type SeekerEventBundleRow = {
  id: number;
  title: string | null;
  eventType: string;
  eventDate: string | null;
  guestCount: number | null;
  area: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  venueId: number | null;
  sourcePackageId: number | null;
  buildMode: string;
  status: string;
  itemsJson: string;
  createdAt: Date;
  updatedAt: Date;
  venue: { id: number; name: string; city: string } | null;
};

export const bundleInclude = {
  venue: { select: { id: true, name: true, city: true } },
} satisfies Prisma.SeekerEventBundleInclude;

export function bundleToJson(row: SeekerEventBundleRow) {
  const items = parseBundleItemsJson(row.itemsJson);
  return {
    id: row.id,
    title: row.title,
    eventType: row.eventType,
    eventDate: row.eventDate,
    guestCount: row.guestCount,
    area: row.area,
    budgetMin: row.budgetMin,
    budgetMax: row.budgetMax,
    venueId: row.venueId,
    venue: row.venue,
    sourcePackageId: row.sourcePackageId,
    buildMode: row.buildMode,
    status: row.status,
    items,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function normalizeBundleItemsInput(raw: unknown): SeekerBundleItem[] | null {
  if (!Array.isArray(raw)) return null;
  const serialized = serializeBundleItems(
    parseBundleItemsJson(JSON.stringify(raw))
  );
  return parseBundleItemsJson(serialized);
}
