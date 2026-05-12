/**
 * סוגי הודעות ידועים בתור — ערכים חייבים להתאים ל־`executeJob` ב־`jobHandlers.ts`.
 */
export const MessageTypes = {
  /** אחרי הרשמה: התראת welcome + CRM אופציונלי */
  USER_REGISTER_POST_CREATE: "user.register.postCreate",
  /** בקשת איפוס סיסמה — שליחת הקישור (webhook חיצוני / log בפיתוח) */
  PASSWORD_RESET_REQUESTED: "password.reset.requested",
  NOOP: "noop",
  LOG: "log",
} as const;

export type MessageType = (typeof MessageTypes)[keyof typeof MessageTypes];
