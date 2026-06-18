"use client";

import BusinessProfileFields from "@/components/business-profile/BusinessProfileFields";
import {
  getBusinessProfilePageCopy,
  type BusinessProfileValues,
} from "@/lib/businessProfile";
import { isValidIsraeliPhone } from "@/lib/phone";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type Props = {
  email: string;
  mode: "onboarding" | "edit";
  initial: BusinessProfileValues;
};

export default function VenueOwnerProfileForm({ email, mode, initial }: Props) {
  const router = useRouter();
  const copy = getBusinessProfilePageCopy("venue-owner", mode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<BusinessProfileValues>(initial);
  const hasInvalidPhone =
    (form.phone.trim().length > 0 && !isValidIsraeliPhone(form.phone)) ||
    (form.businessPhone.trim().length > 0 &&
      !isValidIsraeliPhone(form.businessPhone));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (mode === "onboarding") {
      if (!form.businessName.trim()) {
        setError("נא למלא שם עסק");
        return;
      }
      if (!form.phone.trim()) {
        setError("נא למלא טלפון אישי");
        return;
      }
      if (!form.businessPhone.trim()) {
        setError("נא למלא טלפון עסקי");
        return;
      }
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/venue-owner/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone || undefined,
          businessName: form.businessName || undefined,
          businessPhone: form.businessPhone || undefined,
          businessAddress: form.businessAddress || undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "שמירה נכשלה");
        setLoading(false);
        return;
      }
      router.push("/dashboard/venue-owner");
      router.refresh();
    } catch {
      setError("שגיאה בלתי צפויה");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 space-y-5">
      <BusinessProfileFields
        role="venue-owner"
        email={email}
        mode={mode}
        values={form}
        onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
      />

      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      {hasInvalidPhone ? (
        <p className="text-sm text-red-700" role="alert">
          מספר הטלפון לא תקין. יש להזין מספר ישראלי תקין (9–10 ספרות).
        </p>
      ) : null}

      <div className="flex flex-col gap-3 pt-1 sm:flex-row-reverse">
        <button
          type="submit"
          disabled={loading || hasInvalidPhone}
          className="rounded-full bg-amber-400 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-300 disabled:opacity-60"
        >
          {loading ? "שומר..." : copy.submitLabel}
        </button>
        <a
          href="/dashboard/venue-owner"
          className="rounded-full border border-neutral-300 bg-white px-6 py-2.5 text-center text-sm font-semibold text-emerald-950 hover:bg-neutral-50"
        >
          {copy.cancelLabel}
        </a>
      </div>
    </form>
  );
}
