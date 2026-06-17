/**
 * סטטוסי פנייה / בקשת הזמנה לאולם.
 */

export type InquiryStatus =
  | "NEW"
  | "READ"
  | "REPLIED"
  | "APPROVED"
  | "REJECTED";

const VALID_STATUSES = new Set<string>([
  "NEW",
  "READ",
  "REPLIED",
  "APPROVED",
  "REJECTED",
]);

export function normalizeInquiryStatus(raw: string | null | undefined): InquiryStatus {
  const s = (raw ?? "").trim().toUpperCase();
  if (VALID_STATUSES.has(s)) return s as InquiryStatus;
  return "NEW";
}

/** תאריך YYYY-MM-DD → UTC midnight (כמו לוח זמינות) */
export function inquiryPreferredDateToUtc(raw: string | null | undefined): Date | null {
  const t = (raw ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return null;
  const date = new Date(`${t}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function isTerminalInquiryStatus(status: string): boolean {
  const s = normalizeInquiryStatus(status);
  return s === "APPROVED" || s === "REJECTED";
}

export function canOwnerApprove(status: string): boolean {
  const s = normalizeInquiryStatus(status);
  return s === "NEW" || s === "READ" || s === "REPLIED";
}

export function canOwnerReject(status: string): boolean {
  return canOwnerApprove(status);
}

export function inquiryStatusLabelSeeker(status: string): string {
  const s = normalizeInquiryStatus(status);
  switch (s) {
    case "NEW":
      return "ממתין לאישור";
    case "READ":
      return "נצפתה — ממתין לאישור";
    case "APPROVED":
      return "אושרה";
    case "REJECTED":
      return "נדחתה";
    case "REPLIED":
      return "נענתה (ללא אישור)";
    default:
      return s;
  }
}

export function inquiryStatusLabelOwner(status: string): string {
  const s = normalizeInquiryStatus(status);
  switch (s) {
    case "NEW":
      return "חדשה";
    case "READ":
      return "נקראה";
    case "APPROVED":
      return "אושרה";
    case "REJECTED":
      return "נדחתה";
    case "REPLIED":
      return "נענתה";
    default:
      return s;
  }
}

export function inquiryStatusBadgeClass(status: string): string {
  const s = normalizeInquiryStatus(status);
  switch (s) {
    case "NEW":
      return "bg-[#FFF9E6] text-emerald-950";
    case "READ":
      return "bg-sky-50 text-sky-900";
    case "APPROVED":
      return "bg-emerald-100 text-emerald-900";
    case "REJECTED":
      return "bg-red-50 text-red-800";
    case "REPLIED":
      return "bg-sky-50 text-sky-900";
    default:
      return "bg-neutral-100 text-neutral-700";
  }
}

export type InquiryStatusStep = {
  id: string;
  label: string;
  done: boolean;
  active: boolean;
};

/** פס התקדמות למחפש */
export function inquirySeekerProgressSteps(status: string): InquiryStatusStep[] {
  const s = normalizeInquiryStatus(status);
  const submitted = true;
  const viewed = s !== "NEW";
  const decided = s === "APPROVED" || s === "REJECTED";

  if (s === "REJECTED") {
    return [
      { id: "submitted", label: "נשלחה", done: true, active: false },
      { id: "viewed", label: "נצפתה", done: viewed, active: false },
      { id: "rejected", label: "נדחתה", done: true, active: true },
    ];
  }

  return [
    { id: "submitted", label: "נשלחה", done: submitted, active: !viewed && !decided },
    { id: "viewed", label: "נצפתה", done: viewed, active: viewed && !decided },
    {
      id: "approved",
      label: "אושרה",
      done: s === "APPROVED",
      active: s === "APPROVED",
    },
  ];
}
