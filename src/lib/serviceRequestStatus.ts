import { normalizeInquiryStatus } from "@/lib/inquiryStatus";

/** בקשה לספק בוטלה — ישירות או כי ההזמנה לאולם נדחתה/בוטלה */
export function isServiceRequestCancelled(
  serviceRequestStatus: string,
  inquiryStatus?: string | null
): boolean {
  if (serviceRequestStatus === "CANCELLED") return true;
  if (!inquiryStatus) return false;
  return normalizeInquiryStatus(inquiryStatus) === "REJECTED";
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
      default:
        return serviceRequestStatus;
    }
  }
  if (serviceRequestStatus === "CANCELLED" && inquiryStatus !== "REJECTED") {
    return "ביטלת השתתפות";
  }
  return "ההזמנה בוטלה";
}

export function serviceRequestCancelledDetail(
  serviceRequestStatus: string,
  inquiryStatus?: string | null
): string | null {
  if (!isServiceRequestCancelled(serviceRequestStatus, inquiryStatus)) return null;
  if (serviceRequestStatus === "CANCELLED" && normalizeInquiryStatus(inquiryStatus) !== "REJECTED") {
    return "ביטלת את ההשתתפות באירוע זה.";
  }
  return "ההזמנה לאולם בוטלה — אין צורך להמשיך לטפל בבקשה.";
}
