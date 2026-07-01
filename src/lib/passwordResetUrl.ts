/** פורמט טוקן איפוס סיסמה — שיתוף בין לקוח לשרת */

export const PASSWORD_RESET_TOKEN_HEX_LENGTH = 64;

export function isPasswordResetTokenFormat(raw: string): boolean {
  return (
    raw.length === PASSWORD_RESET_TOKEN_HEX_LENGTH &&
    /^[a-f0-9]+$/i.test(raw)
  );
}

export function buildPasswordResetUrl(
  siteUrl: string,
  rawToken: string
): string {
  const base = siteUrl.replace(/\/$/, "");
  return `${base}/auth/reset-password/${rawToken}`;
}

/** מחלץ טוקן מנתיב או מ-query (תאימות לאחור) */
export function extractPasswordResetToken(
  pathname: string,
  searchToken: string | null | undefined
): string {
  const fromQuery = (searchToken ?? "").trim();
  if (isPasswordResetTokenFormat(fromQuery)) return fromQuery;

  const pathMatch = pathname.match(
    /\/auth\/reset-password\/([a-f0-9]{64})\/?$/i
  );
  const fromPath = pathMatch?.[1]?.trim() ?? "";
  if (isPasswordResetTokenFormat(fromPath)) return fromPath;

  return "";
}

/** מחלץ טוקן מכתובת מלאה (sessionStorage / מייל) */
export function extractPasswordResetTokenFromUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl, "https://placeholder.local");
    const fromSearch = extractPasswordResetToken("", parsed.searchParams.get("token"));
    if (fromSearch) return fromSearch;
    return extractPasswordResetToken(parsed.pathname, null);
  } catch {
    const queryMatch = rawUrl.match(/[?&]token=([a-f0-9]{64})/i);
    if (queryMatch?.[1] && isPasswordResetTokenFormat(queryMatch[1])) {
      return queryMatch[1];
    }
    const pathMatch = rawUrl.match(/\/auth\/reset-password\/([a-f0-9]{64})/i);
    if (pathMatch?.[1] && isPasswordResetTokenFormat(pathMatch[1])) {
      return pathMatch[1];
    }
    return "";
  }
}
