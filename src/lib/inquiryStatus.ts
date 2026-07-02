/**
 * סטטוסי פנייה / בקשת הזמנה לאולם.
 */

export type InquiryStatus =
  | "NEW"
  | "READ"
  | "REPLIED"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

const VALID_STATUSES = new Set<string>([
  "NEW",
  "READ",
  "REPLIED",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
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
  return s === "APPROVED" || s === "REJECTED" || s === "CANCELLED";
}

export function isInquiryRejectedOrCancelled(status: string): boolean {
  const s = normalizeInquiryStatus(status);
  return s === "REJECTED" || s === "CANCELLED";
}

export function canOwnerApprove(status: string): boolean {
  const s = normalizeInquiryStatus(status);
  return s === "NEW" || s === "READ" || s === "REPLIED";
}

export function canOwnerReject(status: string): boolean {
  return canOwnerApprove(status);
}

export function canSeekerCancel(status: string): boolean {
  const s = normalizeInquiryStatus(status);
  return (
    s === "NEW" ||
    s === "READ" ||
    s === "REPLIED" ||
    s === "APPROVED"
  );
}

export function canOwnerCancelApproved(status: string): boolean {
  return normalizeInquiryStatus(status) === "APPROVED";
}

/** מחפש יכול לפתוח דף תשלום (מקדמה) — אחרי אישור האולם */
export function canSeekerCheckout(status: string): boolean {
  return normalizeInquiryStatus(status) === "APPROVED";
}

/** תצוגה מקדימה של דף התשלום לפני אישור */
export function canSeekerPreviewCheckout(status: string): boolean {
  const s = normalizeInquiryStatus(status);
  return s === "NEW" || s === "READ" || s === "REPLIED";
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
    case "CANCELLED":
      return "בוטלה על ידך";
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
    case "CANCELLED":
      return "בוטלה";
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
    case "CANCELLED":
      return "bg-neutral-200 text-neutral-800";
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
  /** צבע השלב הסופי — אושרה / נדחתה */
  variant?: "default" | "success" | "danger";
};

/** פס התקדמות למחפש */
export function inquirySeekerProgressSteps(status: string): InquiryStatusStep[] {
  const s = normalizeInquiryStatus(status);
  const submitted = true;
  const viewed = s !== "NEW";
  const decided =
    s === "APPROVED" || s === "REJECTED" || s === "CANCELLED";

  if (s === "CANCELLED") {
    return [
      { id: "submitted", label: "נשלחה", done: true, active: false },
      { id: "viewed", label: "נצפתה", done: viewed, active: false },
      {
        id: "cancelled",
        label: "בוטלה על ידך",
        done: true,
        active: true,
        variant: "danger",
      },
    ];
  }

  if (s === "REJECTED") {
    return [
      { id: "submitted", label: "נשלחה", done: true, active: false },
      { id: "viewed", label: "נצפתה", done: viewed, active: false },
      {
        id: "rejected",
        label: "נדחתה",
        done: true,
        active: true,
        variant: "danger",
      },
    ];
  }

  return [
    { id: "submitted", label: "נשלחה", done: submitted, active: !viewed && !decided },
    { id: "viewed", label: "נצפתה", done: viewed, active: viewed && !decided },
    {
      id: "approved",
      label: s === "APPROVED" ? "אושרה" : "ממתינה",
      done: s === "APPROVED",
      active: s === "APPROVED",
      variant: s === "APPROVED" ? "success" : "default",
    },
  ];
}

export function inquiryStepPillClass(step: InquiryStatusStep): string {
  if (step.variant === "danger" && (step.active || step.done)) {
    return step.active
      ? "bg-red-500 text-white shadow-sm"
      : "bg-red-100 text-red-900";
  }
  if (step.variant === "success" && (step.active || step.done)) {
    return step.active
      ? "bg-emerald-600 text-white shadow-sm"
      : "bg-emerald-100 text-emerald-900";
  }
  if (step.active) {
    return "bg-amber-400 text-white";
  }
  if (step.done) {
    return "bg-emerald-100 text-emerald-900";
  }
  return "bg-neutral-100 text-neutral-500";
}

export function inquiryStepIconClass(step: InquiryStatusStep): string {
  if (step.variant === "danger" && (step.active || step.done)) {
    return step.active ? "bg-red-800 text-white" : "bg-red-600 text-white";
  }
  if (step.variant === "success" && step.done) {
    return "bg-emerald-700 text-white";
  }
  if (step.done) {
    return "bg-emerald-700 text-white";
  }
  return "bg-neutral-300 text-neutral-600";
}

export function inquiryStepIconChar(step: InquiryStatusStep): string {
  if ((step.id === "rejected" || step.id === "cancelled") && step.active) return "✕";
  if (step.done) return "✓";
  return "·";
}
