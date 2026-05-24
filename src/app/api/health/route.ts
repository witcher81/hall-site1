import { NextResponse } from "next/server";
import { isProductionRuntime } from "@/lib/isProduction";
import { getUpstashRedisConfig } from "@/lib/upstashEnv";

export const runtime = "edge";

/** בדיקת תצורה בסיסית (לניטור / אחרי deploy) — ללא סודות */
export async function GET() {
  const upstash = Boolean(getUpstashRedisConfig());
  const cronOk =
    !isProductionRuntime() || Boolean(process.env.CRON_SECRET?.trim());

  const ok = (!isProductionRuntime() || upstash) && cronOk;

  return NextResponse.json(
    {
      ok,
      production: isProductionRuntime(),
      rateLimitConfigured: upstash,
      cronConfigured: cronOk,
    },
    { status: ok ? 200 : 503 }
  );
}
