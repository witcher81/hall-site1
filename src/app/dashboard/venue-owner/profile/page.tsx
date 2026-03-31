import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import VenueOwnerProfileForm from "./VenueOwnerProfileForm";

export default async function VenueOwnerProfilePage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "VENUE_OWNER") {
    redirect("/auth/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      name: true,
      email: true,
      phone: true,
      businessName: true,
      businessPhone: true,
      businessAddress: true,
    },
  });

  if (!dbUser) redirect("/auth/login");

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <p className="text-[11px] font-semibold tracking-[0.25em] text-[#C9A227]">
        HALLS HUB
      </p>
      <h1 className="mt-1 text-2xl font-bold text-[#0F3B2E]">
          השלם את פרטי העסק שלך
        </h1>
        <p className="mt-2 text-sm text-[#6B6560]">
          לפני שניצור אולמות, נצטרך כמה פרטים בסיסיים עליך ועל העסק. אפשר
          לעדכן אותם גם אחר כך.
        </p>

        <VenueOwnerProfileForm
          initial={{
            name: dbUser.name ?? "",
            phone: dbUser.phone ?? "",
            businessName: dbUser.businessName ?? "",
            businessPhone: dbUser.businessPhone ?? "",
            businessAddress: dbUser.businessAddress ?? "",
          }}
        />
    </main>
  );
}
