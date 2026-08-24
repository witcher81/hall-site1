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
 * Serve markdown only when text/markdown is explicit.
 * Wildcards (* / *) must NOT count as markdown — otherwise curl and many
 * crawlers receive a markdown stub with no H1/JSON-LD.
 */
export function negotiateHtmlOrMarkdown(
  acceptHeader: string | null
): NegotiationResult {
  const ranges = parseAccept(acceptHeader);
  const qHtml = qualityFor(ranges, "text", "html");
  const qStar = qualityFor(ranges, "*", "*");
  const explicitMd = ranges.filter(
    (r) => r.type === "text" && r.subtype === "markdown" && r.q > 0
  );
  const qMd = explicitMd.length ? Math.max(...explicitMd.map((r) => r.q)) : 0;

  if (qMd === 0 && qHtml === 0 && qStar === 0) {
    return { kind: "not_acceptable" };
  }

  if (qMd > 0 && qMd > qHtml) return { kind: "markdown" };
  if (qMd > 0 && qHtml === 0 && qStar === 0) return { kind: "markdown" };

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
    "/docs",
    "/developers",
    "/developers/versioning",
    "/halls",
    "/providers",
    "/packages",
  ]);
  return exact.has(pathname);
}
