import { getSiteUrl } from "@/lib/siteUrl";

/** קיצור טקסט ל־meta description / Open Graph */
export function truncateMeta(s: string, max: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

/** URL מוחלט לתמונת OG (יחסי או מלא) */
export function absoluteImageUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/")) return `${getSiteUrl()}${url}`;
  return undefined;
}
