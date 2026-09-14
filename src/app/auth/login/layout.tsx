import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "התחברות",
  description: "התחברות לחשבון EventForYou — מחפשים, ספקים ובעלי אולמות.",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
