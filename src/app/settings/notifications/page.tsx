import { requireVerifiedSession } from "@/lib/requireSession";
import NotificationPreferencesSection from "../NotificationPreferencesSection";

export const runtime = "nodejs";

export default async function NotificationsSettingsPage() {
  await requireVerifiedSession("/settings/notifications");

  return <NotificationPreferencesSection />;
}
