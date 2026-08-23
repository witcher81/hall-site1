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
    businessBio: initial.businessBio,
    profileImageUrl: initial.profileImageUrl,
  });
  const [socialRows, setSocialRows] = useState<SocialLink[]>(
    initial.socialLinks.length > 0 ? initial.socialLinks : []
  );
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [clearProfileImage, setClearProfileImage] = useState(false);
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
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("phone", form.phone);
      fd.append("businessName", form.businessName);
      fd.append("businessPhone", form.businessPhone);
      fd.append("businessAddress", form.businessAddress);
      fd.append("businessBio", form.businessBio);
      fd.append("socialLinks", JSON.stringify(socialLinks));
      if (clearProfileImage) fd.append("clearProfileImage", "1");
      if (profileImageFile) fd.append("profileImage", profileImageFile);

      const res = await fetch("/api/freelancer/profile", {
        method: "PUT",
        body: fd,
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
        profileImageFile={profileImageFile}
        onProfileImageFileChange={setProfileImageFile}
        clearProfileImage={clearProfileImage}
        onClearProfileImageChange={setClearProfileImage}
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
          className="btn-primary disabled:opacity-60"
        >
          {loading ? "שומר..." : copy.submitLabel}
        </button>
        <a
          href="/dashboard/freelancer"
          className="btn-secondary inline-flex items-center justify-center"
        >
          {copy.cancelLabel}
        </a>
      </div>
    </form>
  );
}
