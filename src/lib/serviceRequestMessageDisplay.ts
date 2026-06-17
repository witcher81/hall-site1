import {
  DEFAULT_INQUIRY_SUPPLIER_MESSAGE,
  formatInquiryPreferredDateForDisplay,
} from "@/lib/inquiryMessageDisplay";

const CONTEXT_MARKER = "---פרטי האירוע---";

const LEGACY_CONTEXT_RE =
  /בקשה דרך הזמנת אולם «([^»]+)»(?:\s*·\s*תאריך:\s*([^\s·]+))?(?:\s*·\s*סוג אירוע:\s*(.+))?$/;

export type ParsedServiceRequestMessage = {
  seekerNote: string | null;
  venueName: string | null;
  preferredDate: string | null;
  eventType: string | null;
  isGenericNote: boolean;
};

export function buildSupplierRequestMessage(input: {
  supplierMessage: string | null;
  venueName: string;
  eventType: string | null;
  preferredDate: string | null;
}): string {
  const note = input.supplierMessage?.trim() || DEFAULT_INQUIRY_SUPPLIER_MESSAGE;
  const lines = [`אולם: «${input.venueName}»`];
  if (input.preferredDate) {
    const formatted = formatInquiryPreferredDateForDisplay(input.preferredDate);
    lines.push(`תאריך האירוע: ${formatted || input.preferredDate}`);
  }
  if (input.eventType?.trim()) {
    lines.push(`סוג אירוע: ${input.eventType.trim()}`);
  }
  return `הודעה מהמזמין:\n${note}\n\n${CONTEXT_MARKER}\n${lines.join("\n")}`;
}

export function parseServiceRequestMessage(raw: string): ParsedServiceRequestMessage {
  const text = raw?.trim() ?? "";
  if (!text) {
    return {
      seekerNote: null,
      venueName: null,
      preferredDate: null,
      eventType: null,
      isGenericNote: true,
    };
  }

  const markerIdx = text.indexOf(CONTEXT_MARKER);
  if (markerIdx !== -1) {
    const head = text.slice(0, markerIdx).trim();
    const tail = text.slice(markerIdx + CONTEXT_MARKER.length).trim();
    let seekerNote = head;
    if (seekerNote.startsWith("הודעה מהמזמין:")) {
      seekerNote = seekerNote.slice("הודעה מהמזמין:".length).trim();
    }
    const venueMatch = tail.match(/^אולם:\s*«([^»]+)»/m);
    const dateMatch = tail.match(/^תאריך האירוע:\s*(.+)$/m);
    const eventMatch = tail.match(/^סוג אירוע:\s*(.+)$/m);
    const isGenericNote =
      !seekerNote || seekerNote === DEFAULT_INQUIRY_SUPPLIER_MESSAGE;
    return {
      seekerNote: seekerNote || null,
      venueName: venueMatch?.[1]?.trim() || null,
      preferredDate: dateMatch?.[1]?.trim() || null,
      eventType: eventMatch?.[1]?.trim() || null,
      isGenericNote,
    };
  }

  const legacySplit = text.split(/\n\nבקשה דרך הזמנת אולם /);
  if (legacySplit.length === 2) {
    const seekerNote = legacySplit[0].trim() || null;
    const contextPart = `בקשה דרך הזמנת אולם ${legacySplit[1]}`.replace(/\n/g, " ").trim();
    const m = contextPart.match(LEGACY_CONTEXT_RE);
    const isGenericNote =
      !seekerNote || seekerNote === DEFAULT_INQUIRY_SUPPLIER_MESSAGE;
    return {
      seekerNote,
      venueName: m?.[1]?.trim() || null,
      preferredDate: m?.[2]?.trim() || null,
      eventType: m?.[3]?.trim() || null,
      isGenericNote,
    };
  }

  return {
    seekerNote: text,
    venueName: null,
    preferredDate: null,
    eventType: null,
    isGenericNote: text === DEFAULT_INQUIRY_SUPPLIER_MESSAGE,
  };
}

export function serviceRequestSeekerNoteLabel(parsed: ParsedServiceRequestMessage): string {
  if (!parsed.seekerNote) return "לא צורפה הודעה אישית מהמזמין.";
  if (parsed.isGenericNote) {
    return "המזמין מבקש הצעת מחיר — לא צורפו הערות נוספות.";
  }
  return parsed.seekerNote;
}
