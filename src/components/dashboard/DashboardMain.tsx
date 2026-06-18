"use client";

import type { ReactNode } from "react";

type Width = "default" | "narrow" | "wide";

const WIDTH_CLASS: Record<Width, string> = {
  default: "max-w-6xl",
  narrow: "max-w-2xl",
  wide: "max-w-4xl",
};

export default function DashboardMain({
  children,
  width = "default",
  className = "",
}: {
  children: ReactNode;
  width?: Width;
  className?: string;
}) {
  return (
    <main
      className={[
        "dashboard-main mx-auto px-4 sm:px-6 lg:px-8",
        WIDTH_CLASS[width],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </main>
  );
}
