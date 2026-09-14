import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "שכחתי סיסמה",
  description: "איפוס סיסמה לחשבון EventForYou.",
};

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
