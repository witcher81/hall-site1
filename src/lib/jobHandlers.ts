import "server-only";

import { createNotification } from "@/lib/notifications";

type RegisterPostCreatePayload = {
  userId: number;
  role: string;
  email: string;
  name: string | null;
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
    default:
      throw new Error(`Unknown job type: ${jobType}`);
  }
}
