"use client";

import ServiceIncludesEditor from "@/components/ServiceIncludesEditor";
import FreelancerCategoryTreePicker from "@/components/FreelancerCategoryTreePicker";
import ServiceAreaTagsField from "@/components/ServiceAreaTagsField";
import ServiceLanguagesTagsField from "@/components/ServiceLanguagesTagsField";
import SocialLinksEditor from "@/components/SocialLinksEditor";
import {
  composeServiceCategoryValue,
} from "@/lib/freelancerServiceCategories";
import OptionalPriceRangeFields from "@/components/OptionalPriceRangeFields";
import { buildMinMaxStringsForSubmit } from "@/lib/freelancerServicePriceForm";
import type {
  ServiceCustomInclude,
  ServicePaidExtraItem,
} from "@/lib/serviceIncludes";
import { normalizeSocialUrl, type SocialLink } from "@/lib/socialLinks";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

export default function NewServicePage() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    primaryCategory: "",
    secondaryCategory: "",
    description: "",
    serviceArea: "",
    experienceYears: "",
    languages: "",
    includesTravel: false,
    includesEquipment: false,
    includesNote: "",
    exactPrice: "",
    priceUseRange: false,
    minPrice: "",
    maxPrice: "",
  });
  const [customIncludes, setCustomIncludes] = useState<ServiceCustomInclude[]>(
    []
  );
  const [paidExtras, setPaidExtras] = useState<ServicePaidExtraItem[]>([]);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [galleryImages, setGalleryImages] = useState<File[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const hasInvalidSocialLinks = socialLinks.some(
    (l) => l.url.trim().length > 0 && normalizeSocialUrl(l.url) === null
  );
  const coverPreview = useMemo(
    () => (coverImage ? URL.createObjectURL(coverImage) : null),
    [coverImage]
  );

  const galleryPreviewUrls = useMemo(
    () => galleryImages.map((file) => URL.createObjectURL(file)),
    [galleryImages]
  );

  useEffect(() => {
    return () => {
      galleryPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [galleryPreviewUrls]);

  useEffect(() => {
    return () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
    };
  }, [coverPreview]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append("name", form.name.trim());
      const categoryValue = composeServiceCategoryValue(
        form.primaryCategory,
        form.secondaryCategory
      );
      if (categoryValue) fd.append("category", categoryValue);
      if (form.description.trim()) fd.append("description", form.description.trim());
      if (form.serviceArea.trim()) fd.append("serviceArea", form.serviceArea.trim());
      if (form.experienceYears.trim()) fd.append("experienceYears", form.experienceYears.trim());
      if (form.languages.trim()) fd.append("languages", form.languages.trim());
      fd.append(
        "socialLinks",
        JSON.stringify(socialLinks.filter((l) => l.url.trim()))
      );
      fd.append("includesTravel", String(form.includesTravel));
      fd.append("includesEquipment", String(form.includesEquipment));
      fd.append("includesNote", form.includesNote.trim());
      fd.append(
        "customIncludesJson",
        JSON.stringify({
          included: customIncludes.map((c) => ({
            ...c,
            checked: c.label.trim().length > 0 ? true : c.checked,
          })),
          paidExtras,
        })
      );
      const { minPrice: minP, maxPrice: maxP } = buildMinMaxStringsForSubmit({
        priceUseRange: form.priceUseRange,
        exactPrice: form.exactPrice,
        minPrice: form.minPrice,
        maxPrice: form.maxPrice,
      });
      if (minP) fd.append("minPrice", minP);
      if (maxP) fd.append("maxPrice", maxP);
      if (coverImage) fd.append("coverImage", coverImage);
      galleryImages.forEach((file) => fd.append("galleryImages", file));

      const res = await fetch("/api/freelancer/services", {
        method: "POST",
        body: fd,
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "הוספת השירות נכשלה");
        setCreating(false);
        return;
      }

      router.push("/dashboard/freelancer");
      router.refresh();
    } catch {
      setError("שגיאה בלתי צפויה");
      setCreating(false);
    }
  }

  const input =
    "mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-neutral-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40";

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div className="text-right">
          <p className="text-[11px] font-semibold tracking-[0.25em] text-amber-600">
            HALLS HUB
          </p>
          <h1 className="mt-1 text-xl font-semibold text-emerald-950">
            הוספת שירות חדש
          </h1>
          <p className="mt-1 text-xs text-neutral-600">
            מלא/י את פרטי השירות. לאחר השמירה תועבר/י לרשימת השירותים.
          </p>
        </div>
        <a
          href="/dashboard/freelancer"
          className="text-sm text-neutral-600 underline-offset-4 hover:text-emerald-950 hover:underline"
        >
          חזרה לשירותים שלי
        </a>
      </header>

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 text-right text-sm shadow-[0_12px_40px_rgba(15,59,46,0.08)]"
      >
        <div>
          <FreelancerCategoryTreePicker
            primaryValue={form.primaryCategory}
            secondaryValue={form.secondaryCategory}
            onChange={({ primary, secondary }) =>
              setForm((f) => ({
                ...f,
                primaryCategory: primary,
                secondaryCategory: secondary,
              }))
            }
            label="קטגוריה ראשית + תת־קטגוריה"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-600">
            שם השירות *
          </label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className={input}
            placeholder="למשל: צילום חתונות"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-600">
            ספרו קצת עליכם ומה אתם עושים
          </label>
          <textarea
            rows={5}
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            className={input}
            placeholder="למשל: מי אתם, מה הניסיון שלכם, באילו סוגי אירועים אתם מתמחים והסבר קצר על השירות שאתם נותנים..."
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-neutral-600">
              אזור שירות
            </label>
            <ServiceAreaTagsField
              value={form.serviceArea}
              onChange={(serviceArea) =>
                setForm((f) => ({ ...f, serviceArea }))
              }
              className="mt-1"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600">
              שנות ניסיון בתחום
            </label>
            <input
              type="number"
              min={0}
              value={form.experienceYears}
              onChange={(e) => setForm((f) => ({ ...f, experienceYears: e.target.value }))}
              className={input}
              placeholder="למשל: 5"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-600">
            שפות עבודה
          </label>
          <ServiceLanguagesTagsField
            value={form.languages}
            onChange={(languages) => setForm((f) => ({ ...f, languages }))}
            className="mt-1"
          />
        </div>

        <SocialLinksEditor
          value={socialLinks}
          onChange={setSocialLinks}
          description="לחצו על הכפתור «+ הוסף רשת / קישור» כדי להוסיף שורה חדשה. בכל שורה בוחרים רשת ומדביקים קישור מלא."
        />

        <ServiceIncludesEditor
          includesTravel={form.includesTravel}
          onIncludesTravel={(v) => setForm((f) => ({ ...f, includesTravel: v }))}
          includesEquipment={form.includesEquipment}
          onIncludesEquipment={(v) =>
            setForm((f) => ({ ...f, includesEquipment: v }))
          }
          includesNote={form.includesNote}
          onIncludesNoteChange={(v) =>
            setForm((f) => ({ ...f, includesNote: v }))
          }
          customIncludes={customIncludes}
          onCustomIncludesChange={setCustomIncludes}
          paidExtras={paidExtras}
          onPaidExtrasChange={setPaidExtras}
        />

        <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-4">
          <OptionalPriceRangeFields
            useRange={form.priceUseRange}
            onUseRangeChange={(useRange) =>
              setForm((f) => {
                if (useRange) {
                  const ex = f.exactPrice.trim();
                  return {
                    ...f,
                    priceUseRange: true,
                    minPrice: ex || f.minPrice,
                    maxPrice: ex || f.maxPrice || ex,
                    exactPrice: "",
                  };
                }
                const ep =
                  f.minPrice && f.minPrice === f.maxPrice
                    ? f.minPrice
                    : f.minPrice || f.maxPrice || "";
                return {
                  ...f,
                  priceUseRange: false,
                  exactPrice: ep,
                  minPrice: "",
                  maxPrice: "",
                };
              })
            }
            minPrice={form.priceUseRange ? form.minPrice : form.exactPrice}
            maxPrice={form.priceUseRange ? form.maxPrice : form.exactPrice}
            onChange={(min, max) =>
              setForm((f) =>
                f.priceUseRange
                  ? { ...f, minPrice: min, maxPrice: max }
                  : { ...f, exactPrice: min, minPrice: "", maxPrice: "" }
              )
            }
            singleLabel="מחיר לשירות (₪)"
            singlePlaceholder="למשל 2500"
            expandRangeLabel="אין לי מחיר מדויק — אציג טווח מחירים"
            collapseRangeLabel="יש לי מחיר קבוע לשירות"
            inputClassName={input}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-600">
            תמונת שירות ראשית
          </label>
          <p className="mt-0.5 text-[11px] text-neutral-600">
            זו תמונת השער של השירות — היא תוצג ראשונה בכרטיס ובדף השירות.
          </p>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setCoverImage(e.target.files?.[0] ?? null)}
            className="mt-1 w-full text-xs text-neutral-800 file:mr-3 file:rounded-full file:border-0 file:bg-amber-400 file:px-4 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-[#E5C96B]"
          />
          {coverPreview && (
            <img src={coverPreview} alt="preview" className="mt-2 h-28 w-28 rounded-xl object-cover" />
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-600">
            גלריית תמונות (ניתן לבחור כמה)
          </label>
          <p className="mt-0.5 text-[11px] text-neutral-600">
            כאן מעלים דוגמאות של עבודות, תוצרים או דברים שאתה נותן במסגרת השירות.
          </p>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              const files = e.target.files;
              if (!files) return;
              setGalleryImages((prev) => [...prev, ...Array.from(files)]);
            }}
            className="mt-1 w-full text-xs text-neutral-800 file:mr-3 file:rounded-full file:border-0 file:bg-emerald-950 file:px-4 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-emerald-900"
          />
          {galleryImages.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-3">
              {galleryImages.map((f, idx) => (
                <div
                  key={`${f.name}-${f.size}-${f.lastModified}-${idx}`}
                  className="relative"
                >
                  <img
                    src={galleryPreviewUrls[idx]}
                    alt={f.name}
                    className="h-20 w-20 rounded-xl border border-neutral-200 object-cover shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setGalleryImages((prev) => prev.filter((_, i) => i !== idx))
                    }
                    className="absolute -left-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow hover:bg-red-700"
                    aria-label="הסר תמונה"
                  >
                    ×
                  </button>
                  <p className="mt-1 max-w-[5.5rem] truncate text-center text-[10px] text-neutral-600">
                    {f.name}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <p className="text-xs text-red-700" role="alert">
            {error}
          </p>
        )}
        {hasInvalidSocialLinks && (
          <p className="text-xs text-red-700" role="alert">
            יש קישורי רשת לא תקינים. תקן/י אותם לפני שמירה.
          </p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.push("/dashboard/freelancer")}
            className="rounded-full border border-neutral-200 bg-neutral-50 px-5 py-2 text-xs font-medium text-emerald-950 hover:bg-neutral-50"
          >
            ביטול
          </button>
          <button
            type="submit"
            disabled={creating || hasInvalidSocialLinks}
            className="rounded-full bg-amber-400 px-6 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-300 disabled:opacity-60"
          >
            {creating ? "שומר..." : "שמירת שירות"}
          </button>
        </div>
      </form>
    </main>
  );
}
