import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "אימות אימייל",
  description: "אימות כתובת האימייל לחשבון EventForYou.",
};

export default function VerifyEmailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
