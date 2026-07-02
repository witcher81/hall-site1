import { redirect } from "next/navigation";
import { requireVerifiedSession } from "@/lib/requireSession";
import { loadSettingsUser } from "../loadSettingsUser";
import ProfileSettingsForm from "../ProfileSettingsForm";

export const runtime = "nodejs";

export default async function ProfileSettingsPage() {
  const session = await requireVerifiedSession("/settings/profile");
  const user = await loadSettingsUser(session.id);
  if (!user) redirect("/auth/login");

  return <ProfileSettingsForm user={user} />;
}
