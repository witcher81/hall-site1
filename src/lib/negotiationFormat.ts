import { USER_INPUT_MAX } from "@/lib/userInputValidation";

export function parseNegotiationAmount(
  raw: unknown
): { ok: true; value: number } | { ok: false; error: string } {
  if (raw == null || raw === "") {
    return { ok: false, error: "נא לציין סכום" };
  }
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) {
    return { ok: false, error: "סכום לא תקין" };
  }
  if (n > USER_INPUT_MAX.PRICE_MAX) {
    return { ok: false, error: "סכום גבוה מדי" };
  }
  return { ok: true, value: n };
}

export function parseNegotiationOfferAmounts(body: {
  amountMinNis?: unknown;
  amountMaxNis?: unknown;
  amountNis?: unknown;
}):
  | { ok: true; amountMinNis: number; amountMaxNis: number | null }
  | { ok: false; error: string } {
  if (body.amountNis != null && body.amountNis !== "") {
    const single = parseNegotiationAmount(body.amountNis);
    if (!single.ok) return single;
    return { ok: true, amountMinNis: single.value, amountMaxNis: null };
  }

  const minRes = parseNegotiationAmount(body.amountMinNis);
  if (!minRes.ok) return minRes;
  let max: number | null = null;
  if (body.amountMaxNis != null && body.amountMaxNis !== "") {
    const maxRes = parseNegotiationAmount(body.amountMaxNis);
    if (!maxRes.ok) return maxRes;
    if (maxRes.value < minRes.value) {
      return { ok: false, error: "מחיר מקסימום נמוך מהמינימום" };
    }
    max = maxRes.value;
  }
  return { ok: true, amountMinNis: minRes.value, amountMaxNis: max };
}

export function formatOfferAmount(
  min: number | null,
  max: number | null
): string {
  if (min == null && max == null) return "—";
  const fmt = (n: number) => `₪${n.toLocaleString("he-IL")}`;
  if (min != null && max != null && max !== min) {
    return `${fmt(min)}–${fmt(max)}`;
  }
  const v = min ?? max;
  return v != null ? fmt(v) : "—";
}
