import "server-only";

import {
  DEFAULT_EMAIL_NOTIFICATION_PREFS,
  type EmailNotificationPrefs,
} from "./emailNotificationTypes";

export type { EmailNotificationPrefs } from "./emailNotificationTypes";

export function parseEmailNotificationPrefs(
  raw: string | null | undefined
): EmailNotificationPrefs {
  if (!raw) return { ...DEFAULT_EMAIL_NOTIFICATION_PREFS };
  try {
    const p = JSON.parse(raw) as Partial<EmailNotificationPrefs>;
    return {
      inquiryReply: p.inquiryReply !== false,
      newInquiry: p.newInquiry !== false,
      serviceRequestReply: p.serviceRequestReply !== false,
      newServiceRequest: p.newServiceRequest !== false,
    };
  } catch {
    return { ...DEFAULT_EMAIL_NOTIFICATION_PREFS };
  }
}

export function serializeEmailNotificationPrefs(
  prefs: EmailNotificationPrefs
): string {
  return JSON.stringify(prefs);
}

export async function userWantsEmail(
  userId: number,
  key: keyof EmailNotificationPrefs,
  loadJson: (id: number) => Promise<string | null>
): Promise<boolean> {
  const raw = await loadJson(userId);
  return parseEmailNotificationPrefs(raw)[key];
}
