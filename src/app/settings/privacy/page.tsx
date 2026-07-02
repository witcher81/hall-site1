import { requireVerifiedSession } from "@/lib/requireSession";
import CookiePreferencesSection from "@/components/consent/CookiePreferencesSection";

export const runtime = "nodejs";

export default async function PrivacySettingsPage() {
  await requireVerifiedSession("/settings/privacy");

  return <CookiePreferencesSection />;
}
