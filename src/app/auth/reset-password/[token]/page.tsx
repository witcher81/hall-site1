import { Suspense } from "react";
import { redirect } from "next/navigation";
import { isPasswordResetTokenFormat } from "@/lib/passwordResetUrl";
import ResetPasswordClient from "../ResetPasswordClient";

export default async function ResetPasswordWithTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const normalized = token.trim();

  if (!isPasswordResetTokenFormat(normalized)) {
    redirect("/auth/reset-password");
  }

  return (
    <Suspense
      fallback={
        <div className="site-page px-4 py-12 text-center text-sm text-neutral-600">
          טוען...
        </div>
      }
    >
      <ResetPasswordClient initialToken={normalized} />
    </Suspense>
  );
}
