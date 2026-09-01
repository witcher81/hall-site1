"use client";

import FreelancerServicesList, {
  type FreelancerServiceListItem,
} from "../FreelancerServicesList";

type Props = {
  services: FreelancerServiceListItem[];
  profileIncomplete: boolean;
};

export default function FreelancerServicesPageClient({
  services,
  profileIncomplete,
}: Props) {
  return (
    <div className="space-y-6 text-right">
      {profileIncomplete ? (
        <div className="rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-right text-sm text-amber-950">
          <p className="font-semibold">השלימו את פרופיל הספק</p>
          <p className="mt-1 text-xs">
            חסרים שם מותג או טלפון — מחפשים רואים פרטים חלקיים.{" "}
            <a
              href="/dashboard/freelancer/profile"
              className="font-semibold underline"
            >
              לעריכת פרופיל
            </a>
          </p>
        </div>
      ) : null}

      <section className="biz-panel">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-[var(--heading)]">
              השירותים שלך ({services.length})
            </h2>
            <p className="mt-1 text-xs text-[var(--muted)]">
              ניהול פרסומים, תמונות, מחירים וקידום.
            </p>
          </div>
          <a
            href="/dashboard/freelancer/services/new"
            className="biz-btn biz-btn--primary"
          >
            הוספת שירות חדש
          </a>
        </div>
        <FreelancerServicesList services={services} />
      </section>
    </div>
  );
}
