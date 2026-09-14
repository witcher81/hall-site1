import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "הרשמת עסק",
  description:
    "הרשמת ספק שירותים או בעל אולם ל-EventForYou — פרסום בסיסי ללא עלות מראש.",
};

export default function BusinessRegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
