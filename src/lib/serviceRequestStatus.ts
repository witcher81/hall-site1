import { normalizeInquiryStatus, isInquiryRejectedOrCancelled } from "@/lib/inquiryStatus";

/** בקשה לספק בוטלה — ישירות או כי ההזמנה לאולם נדחתה/בוטלה */
export function isServiceRequestCancelled(
  serviceRequestStatus: string,
  inquiryStatus?: string | null
): boolean {
  if (
    serviceRequestStatus === "CANCELLED" ||
    serviceRequestStatus === "CANCELLED_BY_PROVIDER"
  ) {
    return true;
  }
  if (!inquiryStatus) return false;
  const s = normalizeInquiryStatus(inquiryStatus);
  return (
    s === "REJECTED" ||
    s === "CANCELLED" ||
    s === "CANCELLED_BY_PROVIDER"
  );
}

export function isServiceRequestPaid(status: string): boolean {
  return status === "PAID";
}

export function canSeekerPayServiceRequest(status: string): boolean {
  return status === "NEW" || status === "READ" || status === "REPLIED";
}

export function serviceRequestStatusLabel(
  serviceRequestStatus: string,
  inquiryStatus?: string | null
): string {
  if (!isServiceRequestCancelled(serviceRequestStatus, inquiryStatus)) {
    switch (serviceRequestStatus) {
      case "NEW":
        return "חדשה";
      case "READ":
        return "נקראה";
      case "REPLIED":
        return "נענתה";
      case "PAID":
        return "שולם — ההזמנה סגורה";
      default:
        return serviceRequestStatus;
    }
  }
  if (serviceRequestStatus === "CANCELLED_BY_PROVIDER") {
    return "בוטלה — הוחזר תשלום";
  }
  if (serviceRequestStatus === "CANCELLED" && !isInquiryRejectedOrCancelled(inquiryStatus ?? "")) {
    return "ביטלת השתתפות";
  }
  return "ההזמנה בוטלה";
}

export function serviceRequestCancelledDetail(
  serviceRequestStatus: string,
  inquiryStatus?: string | null
): string | null {
  if (!isServiceRequestCancelled(serviceRequestStatus, inquiryStatus)) return null;
  if (serviceRequestStatus === "CANCELLED_BY_PROVIDER") {
    return "הספק ביטל את ההזמנה — הכסף יוחזר. ראו אלטרנטיבות למטה.";
  }
  if (
    serviceRequestStatus === "CANCELLED" &&
    !isInquiryRejectedOrCancelled(inquiryStatus ?? "")
  ) {
    return "ביטלת את ההשתתפות באירוע זה.";
  }
  return "ההזמנה לאולם בוטלה — אין צורך להמשיך לטפל בבקשה.";
}
