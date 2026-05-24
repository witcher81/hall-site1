import type { NextRequest } from "next/server";
import { isSameOriginApiRequest } from "@/lib/sameOriginGuard";

/** מניעת שליחת צפיות מסקריפט חיצוני */
export function assertAnalyticsViewRequest(req: NextRequest): boolean {
  return isSameOriginApiRequest(req);
}
