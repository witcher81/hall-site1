"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import IsraeliMobilePhoneInput from "@/components/IsraeliMobilePhoneInput";
import { isValidIsraeliPhone, normalizePhoneInput } from "@/lib/phone";

type Props = {
  initial: {
    name: string;
    phone: string;
    businessName: string;
    businessPhone: string;
    businessAddress: string;
  };
};

export default function VenueOwnerProfileForm({ initial }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(initial);
  const hasInvalidPhone =
    (form.phone.trim().length > 0 && !isValidIsraeliPhone(form.phone)) ||
    (form.businessPhone.trim().length > 0 &&
      !isValidIsraeliPhone(form.businessPhone));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
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
          שם העסק / האולם
        </label>
        <input
          type="text"
          value={form.businessName}
          onChange={(e) =>
            setForm((f) => ({ ...f, businessName: e.target.value }))
          }
          className={input}
          placeholder="לדוגמה: אולם האירועים של דוד"
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
        <p className="mt-1 text-xs text-[#6B6560]">
          מספר שיוצג ללקוחות (קו נפרד מאישי אם רלוונטי)
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#5F5F5F]">
          כתובת העסק (כללית)
        </label>
        <input
          type="text"
          value={form.businessAddress}
          onChange={(e) =>
            setForm((f) => ({ ...f, businessAddress: e.target.value }))
          }
          className={input}
          placeholder="עיר, רחוב (בלי מספר אולם ספציפי)"
        />
      </div>

      {error && (
        <p className="text-sm text-red-700" role="alert">
          {error}
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
          disabled={loading || hasInvalidPhone}
          className="rounded-full bg-[#C9A227] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#E5C96B] disabled:opacity-60"
        >
          {loading ? "שומר..." : "שמירה והמשך לאזור האולמות"}
        </button>
        <a
          href="/dashboard/venue-owner"
          className="rounded-full border border-[#E0D4C3] bg-[#FAF8F4] px-6 py-2.5 text-center text-sm font-medium text-[#0F3B2E] hover:bg-[#EFE6D5]"
        >
          דלג לעכשיו
        </a>
      </div>
    </form>
  );
}
