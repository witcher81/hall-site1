import { NextResponse } from "next/server";
import { getSearchAvailability } from "@/lib/searchAvailability";

export const runtime = "nodejs";

/** מלאי ערים/קטגוריות עם מודעות מאושרות — לחיפוש ציבורי */
export async function GET() {
  try {
    const data = await getSearchAvailability();
    return NextResponse.json(data);
  } catch (e) {
    console.error("search-availability failed", e);
    return NextResponse.json(
      { error: "שגיאה בטעינת זמינות חיפוש" },
      { status: 500 }
    );
  }
}
