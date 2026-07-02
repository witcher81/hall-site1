import { redirect } from "next/navigation";
import { requireVerifiedSession } from "@/lib/requireSession";
import { loadSettingsUser } from "../loadSettingsUser";
import DeleteAccountSection from "../DeleteAccountSection";

export const runtime = "nodejs";

export default async function AccountSettingsPage() {
  const session = await requireVerifiedSession("/settings/account");
  const user = await loadSettingsUser(session.id);
  if (!user) redirect("/auth/login");

  return <DeleteAccountSection email={user.email} />;
}
