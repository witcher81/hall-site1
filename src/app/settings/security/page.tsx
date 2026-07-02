import { requireVerifiedSession } from "@/lib/requireSession";
import SecuritySettingsForm from "../SecuritySettingsForm";

export const runtime = "nodejs";

export default async function SecuritySettingsPage() {
  await requireVerifiedSession("/settings/security");

  return <SecuritySettingsForm />;
}
