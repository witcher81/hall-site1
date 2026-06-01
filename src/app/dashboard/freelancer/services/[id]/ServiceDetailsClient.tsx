"use client";

import ServiceIncludeBadges from "@/components/ServiceIncludeBadges";
import SocialLinksRow from "@/components/SocialLinksRow";
import {
  hasAnyServiceIncludes,
  type ServiceCustomInclude,
  type ServicePaidExtraItem,
} from "@/lib/serviceIncludes";
import { mergeFreelancerServiceDescriptionForForm } from "@/lib/freelancerServiceDescription";
import type { SocialLink } from "@/lib/socialLinks";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Service = {
  id: number;
  name: string;
  category: string | null;
  shortDescription: string | null;
  description: string | null;
  serviceArea: string | null;
  experienceYears: number | null;
  languages: string | null;
  responseTimeHint: string | null;
  socialLinks: SocialLink[];
  includesTravel: boolean;
  includesEquipment: boolean;
  customIncludes: ServiceCustomInclude[];
  paidExtras: ServicePaidExtraItem[];
  includesNote: string | null;
  coverImageUrl: string | null;
  galleryImageUrls: string[];
  minPrice: number | null;
  maxPrice: number | null;
};

export default function ServiceDetailsClient({
  service,
}: { service: Service }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const descriptionDisplay = mergeFreelancerServiceDescriptionForForm(
    service.shortDescription,
    service.description
  );

  async function handleDelete() {
    if (!confirm("למחוק את השירות?")) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(
        `/api/freelancer/services?id=${service.id}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        router.push("/dashboard/freelancer");
        router.refresh();
        return;
      }
      const data = await res.json().catch(() => null);
      setDeleteError(data?.error || "מחיקת השירות נכשלה");
    } catch {
      setDeleteError("שגיאת רשת במחיקת השירות");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div className="text-right">
          <p className="text-[11px] font-semibold tracking-[0.25em] text-amber-600">
            HALLS HUB
          </p>
          <h1 className="mt-1 text-xl font-semibold text-emerald-950">{service.name}</h1>
          {service.category && (
            <p className="mt-1 text-xs text-neutral-600">{service.category}</p>
          )}
        </div>
        <div className="flex gap-2">
          <a
            href={`/dashboard/freelancer/services/${service.id}/edit`}
            className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-emerald-950 hover:border-amber-400/60"
          >
            עריכה
          </a>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-full border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-50 disabled:opacity-50"
          >
            {deleting ? "מוחק..." : "מחיקה"}
          </button>
          <a
            href="/dashboard/freelancer"
            className="text-sm text-neutral-600 underline-offset-4 hover:text-emerald-950 hover:underline"
          >
            חזרה
          </a>
        </div>
      </header>

      {deleteError && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-right text-xs text-red-800">
          {deleteError}
        </p>
      )}

      <section className="mt-6 space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 text-right text-sm shadow-[0_12px_40px_rgba(15,59,46,0.08)]">
        {service.coverImageUrl && (
          <img
            src={service.coverImageUrl}
            alt={service.name}
            className="h-44 w-full rounded-xl object-cover"
          />
        )}
        {(service.minPrice != null || service.maxPrice != null) && (
          <p className="text-neutral-900">
            {service.minPrice != null &&
            service.maxPrice != null &&
            service.minPrice === service.maxPrice ? (
              <>
                <span className="font-semibold text-emerald-950">מחיר: </span>
                {service.minPrice} ₪
              </>
            ) : (
              <>
                <span className="font-semibold text-emerald-950">טווח מחירים: </span>
                {service.minPrice ?? "?"}–{service.maxPrice ?? "?"} ₪
              </>
            )}
          </p>
        )}
        {descriptionDisplay ? (
          <p className="text-neutral-900">
            <span className="font-semibold text-emerald-950">תיאור השירות: </span>
            <span className="whitespace-pre-wrap text-neutral-800">{descriptionDisplay}</span>
          </p>
        ) : (
          <p className="text-xs text-neutral-600">אין תיאור.</p>
        )}
        {(service.serviceArea ||
          service.experienceYears != null ||
          service.languages ||
          service.responseTimeHint) && (
          <div className="space-y-2 text-neutral-900">
            {service.serviceArea && (
              <p>
                <span className="font-semibold text-emerald-950">אזור שירות: </span>
                {service.serviceArea}
              </p>
            )}
            {service.experienceYears != null && (
              <p>
                <span className="font-semibold text-emerald-950">שנות ניסיון: </span>
                {service.experienceYears}
              </p>
            )}
            {service.languages && (
              <p>
                <span className="font-semibold text-emerald-950">שפות: </span>
                {service.languages}
              </p>
            )}
            {service.responseTimeHint && (
              <p>
                <span className="font-semibold text-emerald-950">זמן תגובה צפוי: </span>
                {service.responseTimeHint}
              </p>
            )}
          </div>
        )}
        {service.socialLinks.length > 0 && (
          <div>
            <p className="font-semibold text-emerald-950">קישורים</p>
            <SocialLinksRow links={service.socialLinks} className="mt-2" />
          </div>
        )}
        {hasAnyServiceIncludes(
          service.includesTravel,
          service.includesEquipment,
          service.customIncludes,
          service.includesNote,
          service.paidExtras
        ) && (
          <div>
            <p className="text-xs font-semibold text-emerald-950">
              מה כלול בשירות
            </p>
            <ServiceIncludeBadges
              className="mt-2"
              includesTravel={service.includesTravel}
              includesEquipment={service.includesEquipment}
              customIncludes={service.customIncludes}
              paidExtras={service.paidExtras}
              includesNote={service.includesNote}
            />
          </div>
        )}
        {service.galleryImageUrls.length > 0 && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {service.galleryImageUrls.map((url) => (
              <img key={url} src={url} alt="service gallery" className="h-24 w-full rounded-lg object-cover" />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
