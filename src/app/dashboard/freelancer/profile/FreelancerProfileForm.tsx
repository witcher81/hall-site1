"use client";

import BusinessProfileFields from "@/components/business-profile/BusinessProfileFields";
import {
  getBusinessProfilePageCopy,
  type BusinessProfileValues,
} from "@/lib/businessProfile";
import { isValidIsraeliPhone } from "@/lib/phone";
import { normalizeSocialUrl, type SocialLink } from "@/lib/socialLinks";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type Props = {
  email: string;
  mode: "onboarding" | "edit";
  initial: BusinessProfileValues & { socialLinks: SocialLink[] };
};

export default function FreelancerProfileForm({ email, mode, initial }: Props) {
  const router = useRouter();
  const copy = getBusinessProfilePageCopy("freelancer", mode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<BusinessProfileValues>({
    name: initial.name,
    phone: initial.phone,
    businessName: initial.businessName,
    businessPhone: initial.businessPhone,
    businessAddress: initial.businessAddress,
  });
  const [socialRows, setSocialRows] = useState<SocialLink[]>(
    initial.socialLinks.length > 0 ? initial.socialLinks : []
  );
  const hasInvalidPhone =
    (form.phone.trim().length > 0 && !isValidIsraeliPhone(form.phone)) ||
    (form.businessPhone.trim().length > 0 &&
      !isValidIsraeliPhone(form.businessPhone));
  const hasInvalidSocialLinks = socialRows.some(
    (l) => l.url.trim().length > 0 && normalizeSocialUrl(l.url) === null
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (mode === "onboarding") {
      if (!form.businessName.trim()) {
        setError("נא למלא שם מותג / עסק");
        return;
      }
      if (!form.phone.trim()) {
        setError("נא למלא טלפון");
        return;
      }
    }
    setLoading(true);
    setError(null);
    try {
      const socialLinks = socialRows.filter((l) => l.url.trim());
      const res = await fetch("/api/freelancer/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone || undefined,
          businessName: form.businessName || undefined,
          businessPhone: form.businessPhone || undefined,
          businessAddress: form.businessAddress || undefined,
          socialLinks,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "שמירה נכשלה");
        setLoading(false);
        return;
      }
      router.push("/dashboard/freelancer");
      router.refresh();
    } catch {
      setError("שגיאה בלתי צפויה");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 space-y-5">
      <BusinessProfileFields
        role="freelancer"
        email={email}
        mode={mode}
        values={form}
        onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
        socialLinks={socialRows}
        onSocialLinksChange={setSocialRows}
      />

      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      {hasInvalidSocialLinks ? (
        <p className="text-sm text-red-700" role="alert">
          יש קישורי רשת לא תקינים. תקן/י אותם לפני שמירה.
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
          disabled={loading || hasInvalidSocialLinks || hasInvalidPhone}
          className="rounded-full bg-amber-400 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-300 disabled:opacity-60"
        >
          {loading ? "שומר..." : copy.submitLabel}
        </button>
        <a
          href="/dashboard/freelancer"
          className="rounded-full border border-neutral-300 bg-white px-6 py-2.5 text-center text-sm font-semibold text-emerald-950 hover:bg-neutral-50"
        >
          {copy.cancelLabel}
        </a>
      </div>
    </form>
  );
}
