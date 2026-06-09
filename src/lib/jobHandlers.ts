import "server-only";

import { createNotification } from "@/lib/notifications";
import { sendPasswordResetEmail } from "@/lib/passwordResetEmail";
import { sendWelcomeEmail } from "@/lib/welcomeEmail";

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

      if (typeof p.email === "string" && p.email.trim()) {
        await sendWelcomeEmail({
          to: p.email.trim(),
          name: p.name ?? null,
          role: typeof p.role === "string" ? p.role : "SEEKER",
        });
      }

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

      const expiresDate = p.expiresAt ? new Date(p.expiresAt) : new Date();
      const emailResult = await sendPasswordResetEmail({
        to: p.email,
        name: p.name ?? null,
        resetUrl: p.resetUrl,
        expiresAt: expiresDate,
      });
      const emailSkipped = !emailResult.ok && emailResult.skipped === true;
      if (!emailResult.ok && !emailSkipped) {
        throw new Error(`Reset email failed: ${emailResult.error}`);
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
      }

      if (emailSkipped && !webhook && process.env.NODE_ENV !== "production") {
        console.log(
          `[password.reset.requested] לפיתוח: ${p.email} -> ${p.resetUrl} (תוקף עד ${p.expiresAt})`
        );
      }
      return;
    }
    default:
      throw new Error(`Unknown job type: ${jobType}`);
  }
}
