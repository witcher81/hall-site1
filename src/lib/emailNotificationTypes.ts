export type EmailNotificationPrefs = {
  inquiryReply: boolean;
  newInquiry: boolean;
  serviceRequestReply: boolean;
  newServiceRequest: boolean;
};

export const DEFAULT_EMAIL_NOTIFICATION_PREFS: EmailNotificationPrefs = {
  inquiryReply: true,
  newInquiry: true,
  serviceRequestReply: true,
  newServiceRequest: true,
};
