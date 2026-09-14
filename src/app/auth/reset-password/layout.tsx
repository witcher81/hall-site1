import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "איפוס סיסמה",
  description: "בחירת סיסמה חדשה לחשבון EventForYou.",
};

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
