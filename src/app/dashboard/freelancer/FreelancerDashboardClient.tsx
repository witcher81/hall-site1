"use client";

import { mergeFreelancerServiceDescriptionForForm } from "@/lib/freelancerServiceDescription";
import { useState } from "react";

type Service = {
  id: number;
  name: string;
  category: string | null;
  shortDescription: string | null;
  coverImageUrl: string | null;
  description: string | null;
  minPrice: number | null;
  maxPrice: number | null;
};

type Props = {
  initial: {
    user: { name: string | null; email: string; phone: string | null } | null;
    services: Service[];
  };
};

export default function FreelancerDashboardClient({ initial }: Props) {
  const [services] = useState<Service[]>(initial.services);

  return (
    <section className="mt-6 text-right text-sm text-neutral-900">
      <div className="flex items-center justify-between gap-4">
        <div className="text-right">
          <h2 className="text-base font-semibold text-emerald-950">
            השירותים שלך
          </h2>
          <p className="mt-1 text-xs text-neutral-600">
            כאן תראה את כל השירותים שהגדרת – צילום, DJ, קייטרינג ועוד.
          </p>
        </div>
        <a
          href="/dashboard/freelancer/services/new"
          className="rounded-full bg-amber-400 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-300"
        >
          הוספת שירות חדש
        </a>
      </div>

      {services.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-6">
          <p className="text-sm text-neutral-800">עדיין לא הוספת שירותים.</p>
          <p className="mt-1 text-xs text-neutral-600">
            לחץ על &quot;הוספת שירות חדש&quot; כדי להוסיף את השירות הראשון שלך.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {services.map((s) => {
            const detailHref = `/dashboard/freelancer/services/${s.id}`;
            const blurb = mergeFreelancerServiceDescriptionForForm(
              s.shortDescription,
              s.description
            );
            return (
              <div
                key={s.id}
                className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-[0_12px_40px_rgba(15,59,46,0.06)]"
              >
                {s.coverImageUrl && (
                  <div className="mb-3 overflow-hidden rounded-xl">
                    <img
                      src={s.coverImageUrl}
                      alt={s.name}
                      className="h-28 w-full object-cover"
                      draggable={false}
                    />
                  </div>
                )}
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-emerald-950">
                      {s.name}
                      {s.category && (
                        <span className="text-neutral-600"> · {s.category}</span>
                      )}
                    </p>
                    {blurb ? (
                      <p className="mt-1 line-clamp-4 whitespace-pre-wrap text-xs text-neutral-600">
                        {blurb}
                      </p>
                    ) : null}
                    {(s.minPrice != null || s.maxPrice != null) && (
                      <p className="mt-0.5 text-xs text-neutral-600">
                        {s.minPrice != null &&
                        s.maxPrice != null &&
                        s.minPrice === s.maxPrice ? (
                          <>מחיר: {s.minPrice} ₪</>
                        ) : (
                          <>
                            טווח מחירים: {s.minPrice ?? "?"}–{s.maxPrice ?? "?"} ₪
                          </>
                        )}
                      </p>
                    )}
                  </div>
                  <a
                    href={detailHref}
                    className="shrink-0 rounded-full bg-amber-400 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-300"
                  >
                    לצפייה
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
