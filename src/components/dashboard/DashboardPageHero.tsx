"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { DASHBOARD_NAV, type DashboardRole } from "@/components/dashboard/dashboardNavConfig";

type Props = {
  role: DashboardRole;
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  action?: ReactNode;
};

export default function DashboardPageHero({
  role,
  title,
  description,
  backHref,
  backLabel,
  action,
}: Props) {
  const badge = DASHBOARD_NAV[role].badge;
  const back =
    backHref && backLabel ? (
      <Link href={backHref} className="dashboard-hero-back">
        {backLabel}
      </Link>
    ) : null;
  const trailing = action ?? back;

  return (
    <section className="dashboard-hero">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 text-right">
            <p className="dashboard-hero-kicker">
              HALLS HUB · {badge}
            </p>
            <h1 className="dashboard-hero-title">{title}</h1>
            {description ? (
              <p className="dashboard-hero-lead">{description}</p>
            ) : null}
          </div>
          {trailing ? (
            <div className="flex shrink-0 justify-end sm:pb-1">{trailing}</div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
