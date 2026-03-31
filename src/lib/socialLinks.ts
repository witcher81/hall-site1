/** רשתות חברתיות נתמכות – מזהה פנימי + תווית בעברית */

export const SOCIAL_PLATFORM_OPTIONS = [
  { id: "instagram", label: "Instagram" },
  { id: "x", label: "X (טוויטר)" },
  { id: "youtube", label: "YouTube" },
  { id: "tiktok", label: "TikTok" },
  { id: "facebook", label: "Facebook" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "website", label: "אתר / אחר" },
] as const;

export type SocialPlatformId = (typeof SOCIAL_PLATFORM_OPTIONS)[number]["id"];

export type SocialLink = {
  platform: SocialPlatformId;
  url: string;
};

const PLATFORM_SET = new Set<string>(SOCIAL_PLATFORM_OPTIONS.map((p) => p.id));

function isPlatformId(p: string): p is SocialPlatformId {
  return PLATFORM_SET.has(p);
}

const MAX_LINKS = 10;

/** מוסיף https:// אם חסר ומחזיר URL תקין או null */
export function normalizeSocialUrl(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  try {
    const withProto =
      /^https?:\/\//i.test(t) ? t : `https://${t.replace(/^\/+/, "")}`;
    const u = new URL(withProto);
    if (!["http:", "https:"].includes(u.protocol)) return null;
    return u.toString();
  } catch {
    return null;
  }
}

/** טקסט קצר להצגה ליד האייקון (כמו @handle / שם ערוץ) */
export function socialLinkDisplayLabel(link: SocialLink): string {
  try {
    const u = new URL(link.url);
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    const path = u.pathname.replace(/\/+$/, "");
    const segments = path.split("/").filter(Boolean);

    if (link.platform === "youtube") {
      if (host.includes("youtu.be") && segments[0]) return segments[0];
      const ch = segments.find((_, i, a) => a[i - 1] === "channel" || a[i - 1] === "c" || a[i - 1] === "user");
      if (ch) return ch.length > 20 ? `${ch.slice(0, 12)}…` : ch;
      if (segments[0]) return segments[0].length > 24 ? `${segments[0].slice(0, 20)}…` : segments[0];
    }

    if (link.platform === "tiktok") {
      const uIdx = segments.indexOf("@");
      if (uIdx >= 0 && segments[uIdx + 1]) return `@${segments[uIdx + 1]}`;
      const at = segments.find((s) => s.startsWith("@"));
      if (at) return at;
    }

    if (segments.length > 0) {
      const last = segments[segments.length - 1];
      if (last && last !== "profile") {
        const clean = last.replace(/^@/, "");
        return clean.length > 32 ? `${clean.slice(0, 28)}…` : clean;
      }
    }

    if (u.searchParams.get("id")) return u.searchParams.get("id")!.slice(0, 20);

    return host.replace(/^m\./, "") || link.url;
  } catch {
    return link.url.replace(/^https?:\/\//, "").slice(0, 40);
  }
}

export function parseSocialLinksJson(
  raw: string | null | undefined
): SocialLink[] {
  if (!raw || !raw.trim()) return [];
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    const out: SocialLink[] = [];
    for (const item of data) {
      if (out.length >= MAX_LINKS) break;
      if (!item || typeof item !== "object") continue;
      const platform = (item as { platform?: string }).platform;
      const urlRaw = (item as { url?: string }).url;
      if (!platform || !isPlatformId(platform)) continue;
      const url = normalizeSocialUrl(typeof urlRaw === "string" ? urlRaw : "");
      if (!url) continue;
      out.push({ platform, url });
    }
    return out;
  } catch {
    return [];
  }
}

export function serializeSocialLinks(links: SocialLink[]): string | null {
  if (links.length === 0) return null;
  return JSON.stringify(links);
}

export function sanitizeSocialLinksFromClient(input: unknown): SocialLink[] {
  if (!Array.isArray(input)) return [];
  const out: SocialLink[] = [];
  for (const item of input) {
    if (out.length >= MAX_LINKS) break;
    if (!item || typeof item !== "object") continue;
    const platform = (item as { platform?: string }).platform;
    const urlRaw = (item as { url?: string }).url;
    if (!platform || !isPlatformId(platform)) continue;
    const url = normalizeSocialUrl(typeof urlRaw === "string" ? urlRaw : "");
    if (!url) continue;
    out.push({ platform, url });
  }
  return out;
}
