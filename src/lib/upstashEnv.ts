/**
 * קריאת Upstash ל־Edge middleware ולשרת — בלי קידומת NEXT_PUBLIC (נשאר בשרת/Vercel בלבד).
 */
export function getUpstashRedisConfig(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  return { url, token };
}
