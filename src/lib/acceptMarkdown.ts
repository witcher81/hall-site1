/**
 * Accept header parsing for text/markdown negotiation (acceptmarkdown.com).
 */

export type MediaRange = { type: string; subtype: string; q: number };

export function parseAccept(header: string | null): MediaRange[] {
  if (!header?.trim()) {
    return [{ type: "*", subtype: "*", q: 1 }];
  }
  const parts = header.split(",").map((p) => p.trim()).filter(Boolean);
  const ranges: MediaRange[] = [];
  for (const part of parts) {
    const [media, ...params] = part.split(";").map((s) => s.trim());
    const [type, subtype = "*"] = media.toLowerCase().split("/");
    let q = 1;
    for (const param of params) {
      const [k, v] = param.split("=").map((s) => s.trim());
      if (k === "q" && v) {
        const n = Number(v);
        if (!Number.isNaN(n)) q = Math.max(0, Math.min(1, n));
      }
    }
    ranges.push({ type, subtype, q });
  }
  ranges.sort((a, b) => {
    if (b.q !== a.q) return b.q - a.q;
    const as = a.type === "*" ? 0 : a.subtype === "*" ? 1 : 2;
    const bs = b.type === "*" ? 0 : b.subtype === "*" ? 1 : 2;
    return bs - as;
  });
  return ranges;
}

function matches(range: MediaRange, type: string, subtype: string): boolean {
  if (range.type === "*" && range.subtype === "*") return true;
  if (range.type !== type) return false;
  return range.subtype === "*" || range.subtype === subtype;
}

export function qualityFor(
  ranges: MediaRange[],
  type: string,
  subtype: string
): number {
  for (const r of ranges) {
    if (matches(r, type, subtype)) return r.q;
  }
  return 0;
}

export type NegotiationResult =
  | { kind: "markdown" }
  | { kind: "html" }
  | { kind: "not_acceptable" };

/**
 * Prefer markdown only when its q is strictly greater than html,
 * or equal and listed with higher precedence after sort.
 */
export function negotiateHtmlOrMarkdown(
  acceptHeader: string | null
): NegotiationResult {
  const ranges = parseAccept(acceptHeader);
  const qMd = qualityFor(ranges, "text", "markdown");
  const qHtml = qualityFor(ranges, "text", "html");
  const qStar = qualityFor(ranges, "*", "*");

  if (qMd === 0 && qHtml === 0 && qStar === 0) {
    return { kind: "not_acceptable" };
  }

  if (qMd > 0 && qMd >= qHtml && qMd >= qStar) {
    // If client sent Accept: text/markdown (possibly with */*;q=0.1)
    // and markdown ranks first among positive, serve markdown.
    const firstPositive = ranges.find((r) => r.q > 0);
    if (
      firstPositive &&
      matches(firstPositive, "text", "markdown") &&
      qMd >= qHtml
    ) {
      return { kind: "markdown" };
    }
    if (qMd > qHtml) return { kind: "markdown" };
  }

  if (qHtml > 0 || qStar > 0) return { kind: "html" };
  if (qMd > 0) return { kind: "markdown" };
  return { kind: "not_acceptable" };
}

/** Paths that can return a markdown representation from origin. */
export function isMarkdownNegotiablePath(pathname: string): boolean {
  if (pathname === "/") return true;
  const exact = new Set([
    "/about",
    "/contact",
    "/privacy",
    "/terms",
    "/cookies",
    "/accessibility",
    "/developers",
    "/halls",
    "/providers",
    "/packages",
  ]);
  return exact.has(pathname);
}
