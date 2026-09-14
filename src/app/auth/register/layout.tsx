import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "הרשמה",
  description: "יצירת חשבון ב-EventForYou — חיפוש אולמות וספקי אירועים.",
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
