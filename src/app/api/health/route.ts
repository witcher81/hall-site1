import { NextResponse } from "next/server";
import { buildProductionHealthReport } from "@/lib/productionHealth";

export const runtime = "edge";

/** בדיקת תצורה בסיסית (לניטור / אחרי deploy) — ללא סודות */
export async function GET() {
  const report = buildProductionHealthReport();
  return NextResponse.json(report, { status: report.ok ? 200 : 503 });
}
