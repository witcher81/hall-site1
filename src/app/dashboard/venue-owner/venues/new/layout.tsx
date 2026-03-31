import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "יצירת אולם חדש",
};

export default function NewVenueLayout({ children }: { children: ReactNode }) {
  return children;
}
