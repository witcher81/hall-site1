"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import IsraeliMobilePhoneInput from "@/components/IsraeliMobilePhoneInput";
import SocialLinksEditor from "@/components/SocialLinksEditor";
import { isValidIsraeliPhone, normalizePhoneInput } from "@/lib/phone";
import { normalizeSocialUrl, type SocialLink } from "@/lib/socialLinks";

type Props = {
  initial: {
    name: string;
    phone: string;
    businessName: string;
    businessPhone: string;
    businessAddress: string;
    socialLinks: SocialLink[];
  };
};

export default function FreelancerProfileForm({ initial }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
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

  const input =
    "mt-1 w-full rounded-xl border border-[#E0D4C3] bg-white px-3 py-2.5 text-[#1A1A1A] outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/40";
  const mobileSelect =
    "shrink-0 rounded-xl border border-[#E0D4C3] bg-white px-2 py-2.5 text-[#1A1A1A] outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/40";
  const mobileRest =
    "min-w-0 flex-1 rounded-xl border border-[#E0D4C3] bg-white px-3 py-2.5 text-[#1A1A1A] outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/40";

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 space-y-5 rounded-2xl border border-[#E0D4C3] bg-white p-6 text-right shadow-[0_12px_40px_rgba(15,59,46,0.08)]"
    >
      <div>
        <label className="block text-sm font-medium text-[#5F5F5F]">
          שם מלא (איש קשר)
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className={input}
          placeholder="השם שיופיע ללקוחות"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#5F5F5F]">
          טלפון אישי (נייד)
        </label>
        <IsraeliMobilePhoneInput
          value={form.phone}
          onChange={(phone) => setForm((f) => ({ ...f, phone }))}
          forceMobile
          selectClassName={mobileSelect}
          inputClassName={mobileRest}
        />
        <p className="mt-1 text-xs text-[#6B6560]">
          בחרו קידומת והזינו 7 ספרות (סה״כ 10 ספרות כולל 0)
        </p>
      </div>

      <hr className="border-[#E0D4C3]" />

      <div>
        <label className="block text-sm font-medium text-[#5F5F5F]">
          שם העסק / המותג
        </label>
        <input
          type="text"
          value={form.businessName}
          onChange={(e) =>
            setForm((f) => ({ ...f, businessName: e.target.value }))
          }
          className={input}
          placeholder="למשל: סטודיו צילום XYZ"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#5F5F5F]">
          טלפון עסקי
        </label>
        <input
          type="tel"
          inputMode="numeric"
          maxLength={10}
          value={form.businessPhone}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              businessPhone: normalizePhoneInput(e.target.value),
            }))
          }
          className={input}
          placeholder="03-xxxxxxx או 05xxxxxxxx"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#5F5F5F]">
          כתובת (כללית)
        </label>
        <input
          type="text"
          value={form.businessAddress}
          onChange={(e) =>
            setForm((f) => ({ ...f, businessAddress: e.target.value }))
          }
          className={input}
          placeholder="עיר, אזור שירות"
        />
      </div>

      <hr className="border-[#E0D4C3]" />

      <SocialLinksEditor
        value={socialRows}
        onChange={setSocialRows}
        title="רשתות חברתיות"
        description="הוסיפו קישורים לעמודים שלכם — במסך חיפוש הספקים יופיעו אייקון הרשת והטקסט (למשל שם משתמש), בלחיצה יפתח הקישור."
        addButtonText="+ הוסף רשת חברתית"
      />

      {error && (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      {hasInvalidSocialLinks && (
        <p className="text-sm text-red-700" role="alert">
          יש קישורי רשת לא תקינים. תקן/י אותם לפני שמירה.
        </p>
      )}
      {hasInvalidPhone && (
        <p className="text-sm text-red-700" role="alert">
          מספר הטלפון לא תקין. יש להזין מספר ישראלי תקין (9-10 ספרות בלבד).
        </p>
      )}

      <div className="flex flex-col gap-3 pt-2 sm:flex-row-reverse">
        <button
          type="submit"
          disabled={loading || hasInvalidSocialLinks || hasInvalidPhone}
          className="rounded-full bg-[#C9A227] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#E5C96B] disabled:opacity-60"
        >
          {loading ? "שומר..." : "שמירה"}
        </button>
        <a
          href="/dashboard/freelancer"
          className="rounded-full border border-[#E0D4C3] bg-[#FAF8F4] px-6 py-2.5 text-center text-sm font-medium text-[#0F3B2E] hover:bg-[#EFE6D5]"
        >
          חזרה לשירותים שלי
        </a>
      </div>
    </form>
  );
}
