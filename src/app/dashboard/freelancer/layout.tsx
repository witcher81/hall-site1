import { requireSession } from "@/lib/requireSession";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import DashboardNav from "@/components/dashboard/DashboardNav";
import { isEmailVerificationRequired } from "@/lib/emailConfig";

export const runtime = "nodejs";

export default async function FreelancerLayout({
  children,
}: { children: React.ReactNode }) {
  /** מאפשרים פאנל/יצירת שירות גם לפני אימות מייל */
  const user = await requireSession();
  if (user.role !== "FREELANCER") redirect("/");

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true, email: true },
  });

  const showVerifyBanner =
    isEmailVerificationRequired() && !user.emailVerified;

  return (
    <div className="site-page dashboard-area">
      <DashboardNav
        role="freelancer"
        user={{ name: dbUser?.name ?? null, email: dbUser?.email ?? "" }}
      />
      {showVerifyBanner ? (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-center text-sm text-amber-950">
          כתובת המייל עדיין לא אומתה — אפשר ליצור שירותים עכשיו.{" "}
          <Link
            href="/auth/verify-email?redirect=%2Fdashboard%2Ffreelancer"
            className="font-semibold underline underline-offset-2"
          >
            אמתו את המייל
          </Link>
        </div>
      ) : null}
      {children}
    </div>
  );
}
