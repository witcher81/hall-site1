import "server-only";

import { createNotification } from "@/lib/notifications";

type RegisterPostCreatePayload = {
  userId: number;
  role: string;
  email: string;
  name: string | null;
};

type PasswordResetRequestedPayload = {
  userId: number;
  email: string;
  name: string | null;
  resetUrl: string;
  expiresAt: string;
};

/**
 * מטפלי משימות לפי `type`. הוסף כאן case חדש לכל סוג עבודה רקע.
 */
export async function executeJob(jobType: string, payload: unknown): Promise<void> {
  switch (jobType) {
    case "noop":
      return;
    case "log":
      console.log("[BackgroundJob log]", payload);
      return;
    case "user.register.postCreate": {
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        throw new Error("Invalid payload for user.register.postCreate");
      }
      const p = payload as Partial<RegisterPostCreatePayload>;
      if (!Number.isInteger(p.userId) || (p.userId as number) <= 0) {
        throw new Error("Invalid userId in user.register.postCreate");
      }
      const roleLabel =
        p.role === "VENUE_OWNER"
          ? "בעל/ת אולם"
          : p.role === "FREELANCER"
            ? "ספק/ית שירות"
            : "מחפש/ת";

      await createNotification({
        userId: p.userId as number,
        type: "WELCOME",
        title: "ברוכים הבאים ל־Hall Site",
        body: `החשבון נוצר בהצלחה (${roleLabel}). אפשר להתחיל לעדכן פרופיל ולפעול במערכת.`,
        href: "/",
      });

      const crmWebhook = process.env.REGISTER_CRM_WEBHOOK_URL?.trim();
      if (crmWebhook) {
        const res = await fetch(crmWebhook, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            event: "user_registered",
            userId: p.userId,
            email: p.email ?? null,
            role: p.role ?? null,
            name: p.name ?? null,
            createdAt: new Date().toISOString(),
          }),
        });
        if (!res.ok) {
          throw new Error(`CRM webhook failed with status ${res.status}`);
        }
      }
      return;
    }
    case "password.reset.requested": {
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        throw new Error("Invalid payload for password.reset.requested");
      }
      const p = payload as Partial<PasswordResetRequestedPayload>;
      if (!Number.isInteger(p.userId) || (p.userId as number) <= 0) {
        throw new Error("Invalid userId in password.reset.requested");
      }
      if (typeof p.email !== "string" || typeof p.resetUrl !== "string") {
        throw new Error("Invalid email/resetUrl in password.reset.requested");
      }

      const webhook = process.env.PASSWORD_RESET_WEBHOOK_URL?.trim();
      if (webhook) {
        const res = await fetch(webhook, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            event: "password_reset_requested",
            userId: p.userId,
            email: p.email,
            name: p.name ?? null,
            resetUrl: p.resetUrl,
            expiresAt: p.expiresAt ?? null,
            sentAt: new Date().toISOString(),
          }),
        });
        if (!res.ok) {
          throw new Error(
            `Password reset webhook failed with status ${res.status}`
          );
        }
      } else if (process.env.NODE_ENV !== "production") {
        console.log(
          `[password.reset.requested] שלח את הקישור הבא למשתמש ${p.email}: ${p.resetUrl} (תוקף עד ${p.expiresAt})`
        );
      } else {
        console.warn(
          "[password.reset.requested] PASSWORD_RESET_WEBHOOK_URL לא מוגדר — קישור איפוס לא נשלח"
        );
      }
      return;
    }
    default:
      throw new Error(`Unknown job type: ${jobType}`);
  }
}
