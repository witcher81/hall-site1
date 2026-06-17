import { USER_INPUT_MAX, validateOptionalLongText } from "@/lib/userInputValidation";

export type StoredSupplierMessage = {
  serviceId: number;
  serviceName: string;
  message: string;
};

const MAX_ENTRIES = 20;

export function parseStoredSupplierMessagesJson(raw: string | null | undefined): StoredSupplierMessage[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return normalizeStoredSupplierMessages(parsed);
  } catch {
    return [];
  }
}

export function normalizeStoredSupplierMessages(raw: unknown): StoredSupplierMessage[] {
  if (!Array.isArray(raw)) return [];
  const out: StoredSupplierMessage[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) continue;
    const o = item as Record<string, unknown>;
    const serviceId =
      typeof o.serviceId === "number"
        ? o.serviceId
        : Number(o.serviceId);
    const serviceName = typeof o.serviceName === "string" ? o.serviceName.trim() : "";
    const message = typeof o.message === "string" ? o.message.trim() : "";
    if (!Number.isInteger(serviceId) || serviceId <= 0 || !message) continue;
    if (out.some((x) => x.serviceId === serviceId)) continue;
    out.push({
      serviceId,
      serviceName: serviceName || `ספק #${serviceId}`,
      message,
    });
    if (out.length >= MAX_ENTRIES) break;
  }
  return out;
}

export function serializeStoredSupplierMessages(entries: StoredSupplierMessage[]): string | null {
  const cleaned = entries.filter((e) => e.message.trim());
  if (cleaned.length === 0) return null;
  return JSON.stringify(cleaned);
}

export function supplierMessagesMapFromStored(
  entries: StoredSupplierMessage[]
): Map<number, string> {
  return new Map(entries.map((e) => [e.serviceId, e.message]));
}

type ParseResult =
  | { ok: true; entries: StoredSupplierMessage[]; outreachIds: number[] }
  | { ok: false; error: string };

/** מפרק payload מהלקוח — מערך אובייקטים או map לפי serviceId */
export function parseSupplierMessagesPayload(
  raw: unknown,
  linkedIds: number[],
  nameByServiceId: Map<number, string>
): ParseResult {
  const linked = new Set(linkedIds);
  const entries: StoredSupplierMessage[] = [];

  const pushEntry = (
    serviceId: number,
    messageRaw: unknown
  ): { ok: true } | { ok: false; error: string } => {
    if (!linked.has(serviceId)) return { ok: true };
    const msgRes = validateOptionalLongText(
      messageRaw,
      USER_INPUT_MAX.INQUIRY_MESSAGE,
      "הערות לספק"
    );
    if (!msgRes.ok) return { ok: false, error: msgRes.error };
    const message = msgRes.value?.trim() ?? "";
    if (!message) return { ok: true };
    if (entries.some((e) => e.serviceId === serviceId)) return { ok: true };
    entries.push({
      serviceId,
      serviceName: nameByServiceId.get(serviceId) ?? `ספק #${serviceId}`,
      message,
    });
    return { ok: true };
  };

  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (typeof item !== "object" || item === null) continue;
      const o = item as Record<string, unknown>;
      const serviceId =
        typeof o.serviceId === "number" ? o.serviceId : Number(o.serviceId);
      if (!Number.isInteger(serviceId) || serviceId <= 0) continue;
      const pushed = pushEntry(serviceId, o.message);
      if (!pushed.ok) return pushed;
      if (entries.length >= MAX_ENTRIES) break;
    }
  } else if (raw && typeof raw === "object") {
    for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
      const serviceId = Number(key);
      if (!Number.isInteger(serviceId) || serviceId <= 0) continue;
      const pushed = pushEntry(serviceId, value);
      if (!pushed.ok) return pushed;
      if (entries.length >= MAX_ENTRIES) break;
    }
  }

  return {
    ok: true,
    entries,
    outreachIds: entries.map((e) => e.serviceId),
  };
}

/** תאימות לאחור — הודעה אחת לכל הספקים שנבחרו */
export function legacySingleSupplierMessageEntries(
  supplierMessage: string | null,
  outreachIds: number[],
  nameByServiceId: Map<number, string>
): StoredSupplierMessage[] {
  const text = supplierMessage?.trim();
  if (!text) return [];
  return outreachIds.map((serviceId) => ({
    serviceId,
    serviceName: nameByServiceId.get(serviceId) ?? `ספק #${serviceId}`,
    message: text,
  }));
}
