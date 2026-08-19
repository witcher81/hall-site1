"use client";

import ListingPromoBadges from "@/components/ListingPromoBadges";
import ServiceIncludeBadges from "@/components/ServiceIncludeBadges";
import {
  SERVICE_BOOST_DAYS,
  SERVICE_BOOST_PRICE_NIS,
} from "@/lib/venueBoostConfig";
import { BETA_BOOST_COPY } from "@/lib/betaPayments";
import {
  hasAnyServiceIncludes,
  type ServiceCustomInclude,
  type ServicePaidExtraItem,
} from "@/lib/serviceIncludes";
import { mergeFreelancerServiceDescriptionForForm } from "@/lib/freelancerServiceDescription";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

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
  includesTravel: boolean;
  includesEquipment: boolean;
  customIncludes: ServiceCustomInclude[];
  paidExtras: ServicePaidExtraItem[];
  includesNote: string | null;
  coverImageUrl: string | null;
  galleryImageUrls: string[];
  minPrice: number | null;
  maxPrice: number | null;
  boostExpiresAt?: string | null;
};

export default function ServiceDetailsClient({
  service,
  providerId,
  boostPurchaseEnabled,
  boostStripeEnabled = false,
  boostDemoEnabled = false,
}: {
  service: Service;
  providerId: number;
  boostPurchaseEnabled: boolean;
  boostStripeEnabled?: boolean;
  boostDemoEnabled?: boolean;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [boostExpiresAt, setBoostExpiresAt] = useState<string | null>(
    service.boostExpiresAt ?? null
  );
  const [boosting, setBoosting] = useState(false);
  const [boostError, setBoostError] = useState<string | null>(null);
  const boostActive = useMemo(() => {
    if (!boostExpiresAt) return false;
    return new Date(boostExpiresAt) > new Date();
  }, [boostExpiresAt]);

  async function handleBoost() {
    setBoosting(true);
    setBoostError(null);
    try {
      if (boostStripeEnabled) {
        const res = await fetch("/api/freelancer/services/boost/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ serviceId: service.id }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.url) {
          setBoostError(data?.error || "פתיחת תשלום נכשלה");
          setBoosting(false);
          return;
        }
        window.location.assign(data.url as string);
        return;
      }
      const res = await fetch("/api/freelancer/services/boost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId: service.id }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setBoostError(data?.error || "הקידום נכשל");
        setBoosting(false);
        return;
      }
      if (typeof data?.boostExpiresAt === "string") {
        setBoostExpiresAt(data.boostExpiresAt);
      }
      router.refresh();
    } catch {
      setBoostError("שגיאה בלתי צפויה");
    } finally {
      setBoosting(false);
    }
  }
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
    <div className="text-right text-sm text-neutral-900">
      <div className="mb-4 flex flex-wrap justify-end gap-2">
          <a
            href={`/services/${service.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-950 hover:border-amber-400/60"
          >
            תצוגה ציבורית — שירות ↗
          </a>
          <a
            href={`/providers/${providerId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-950 hover:border-amber-400/60"
          >
            תצוגה ציבורית — פרופיל ↗
          </a>
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

      {deleteError && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-right text-xs text-red-800">
          {deleteError}
        </p>
      )}

      <section className="mt-6 space-y-3 rounded-2xl border border-[#C9A227]/35 bg-gradient-to-br from-[#FFF9E6] to-white p-6 text-right text-sm shadow-[0_12px_40px_rgba(15,59,46,0.08)]">
        <div className="mb-2 h-1 w-12 rounded-full bg-amber-400" aria-hidden />
        <h2 className="text-lg font-semibold text-emerald-950">
          קידום ממומן — BETA
        </h2>
        <p className="text-xs leading-relaxed text-[#5C564C]">
          הקפצת השירות לראש תוצאות החיפוש + תג «מאומת» למשך {SERVICE_BOOST_DAYS}{" "}
          ימים. {BETA_BOOST_COPY}
        </p>
        {boostActive ? (
          <div className="flex flex-wrap items-center gap-2">
            <ListingPromoBadges active />
            {boostExpiresAt ? (
              <p className="text-xs font-medium text-emerald-950">
                פעיל עד{" "}
                {new Date(boostExpiresAt).toLocaleString("he-IL", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            ) : null}
          </div>
        ) : null}
        {boostPurchaseEnabled ? (
          <button
            type="button"
            onClick={handleBoost}
            disabled={boosting}
            className="mt-1 inline-flex items-center justify-center rounded-full bg-amber-400 px-6 py-2.5 text-sm font-semibold text-neutral-950 shadow-sm transition hover:bg-amber-300 disabled:opacity-60"
          >
            {boosting
              ? "מעבד..."
              : boostActive
                ? `הארך קידום — ₪${SERVICE_BOOST_PRICE_NIS} (BETA)`
                : `קדם את השירות — ₪${SERVICE_BOOST_PRICE_NIS} (BETA)`}
          </button>
        ) : (
          <p className="mt-1 text-xs text-neutral-600">{BETA_BOOST_COPY}</p>
        )}
        {boostError && (
          <p className="text-xs text-red-600" role="alert">
            {boostError}
          </p>
        )}
      </section>

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
        <p className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-700">
          רשתות חברתיות וקישורים נערכים ב־
          <a
            href="/dashboard/freelancer/profile"
            className="mx-1 font-semibold text-emerald-950 underline underline-offset-2"
          >
            הפרופיל העסקי
          </a>
          ומוצגים בעמוד הספק הציבורי.
        </p>
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
    </div>
  );
}
