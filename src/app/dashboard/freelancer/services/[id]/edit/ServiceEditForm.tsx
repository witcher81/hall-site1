"use client";

import ServiceIncludesEditor from "@/components/ServiceIncludesEditor";
import FreelancerCategoryTreePicker from "@/components/FreelancerCategoryTreePicker";
import ServiceAreaTagsField from "@/components/ServiceAreaTagsField";
import ServiceLanguagesTagsField from "@/components/ServiceLanguagesTagsField";
import SocialLinksEditor from "@/components/SocialLinksEditor";
import {
  composeServiceCategoryValue,
  parseServiceCategoryValue,
} from "@/lib/freelancerServiceCategories";
import {
  buildMinMaxStringsForSubmit,
  parseMinMaxToFreelancerPriceForm,
} from "@/lib/freelancerServicePriceForm";
import {
  parseServiceIncludesBundle,
  type ServiceCustomInclude,
  type ServicePaidExtraItem,
} from "@/lib/serviceIncludes";
import { normalizeSocialUrl, type SocialLink } from "@/lib/socialLinks";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Props = {
  serviceId: number;
  initial: {
    name: string;
    category: string;
    description: string;
    serviceArea: string;
    experienceYears: string | number;
    languages: string;
    socialLinks: SocialLink[];
    includesEquipment: boolean;
    includesNote: string | null;
    customIncludesJson: string | null;
    coverImageUrl: string | null;
    galleryImageUrls: string[];
    minPrice: string | number;
    maxPrice: string | number;
  };
};

export default function ServiceEditForm({ serviceId, initial }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialPrice = parseMinMaxToFreelancerPriceForm(
    initial.minPrice,
    initial.maxPrice
  );
  const initialCategory = parseServiceCategoryValue(initial.category);
  const [form, setForm] = useState({
    name: initial.name,
    primaryCategory: initialCategory.primary,
    secondaryCategory: initialCategory.secondary,
    description: initial.description,
    serviceArea: initial.serviceArea,
    experienceYears: String(initial.experienceYears ?? ""),
    languages: initial.languages ?? "",
    includesEquipment: initial.includesEquipment,
    includesNote: initial.includesNote ?? "",
    exactPrice: initialPrice.exactPrice,
    priceUseRange: initialPrice.priceUseRange,
    minPrice: initialPrice.minPrice,
    maxPrice: initialPrice.maxPrice,
  });
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [existingGallery, setExistingGallery] = useState<string[]>(initial.galleryImageUrls);
  const [newGalleryImages, setNewGalleryImages] = useState<File[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(initial.socialLinks);
  const initialIncludes = parseServiceIncludesBundle(
    initial.customIncludesJson
  );
  const [customIncludes, setCustomIncludes] = useState<ServiceCustomInclude[]>(
    () => initialIncludes.included
  );
  const [paidExtras, setPaidExtras] = useState<ServicePaidExtraItem[]>(
    () => initialIncludes.paidExtras
  );
  const hasInvalidSocialLinks = socialLinks.some(
    (l) => l.url.trim().length > 0 && normalizeSocialUrl(l.url) === null
  );
  const coverPreview = useMemo(
    () => (coverImage ? URL.createObjectURL(coverImage) : initial.coverImageUrl),
    [coverImage, initial.coverImageUrl]
  );

  const newGalleryPreviewUrls = useMemo(
    () => newGalleryImages.map((file) => URL.createObjectURL(file)),
    [newGalleryImages]
  );

  useEffect(() => {
    return () => {
      newGalleryPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [newGalleryPreviewUrls]);

  useEffect(() => {
    return () => {
      if (coverImage && coverPreview && coverPreview.startsWith("blob:")) {
        URL.revokeObjectURL(coverPreview);
      }
    };
  }, [coverImage, coverPreview]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("name", form.name.trim());
      fd.append(
        "category",
        composeServiceCategoryValue(form.primaryCategory, form.secondaryCategory)
      );
      fd.append("description", form.description.trim());
      fd.append("serviceArea", form.serviceArea.trim());
      fd.append("experienceYears", form.experienceYears.trim());
      fd.append("languages", form.languages.trim());
      fd.append(
        "socialLinks",
        JSON.stringify(socialLinks.filter((l) => l.url.trim()))
      );
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
      fd.append("minPrice", minP);
      fd.append("maxPrice", maxP);
      fd.append("existingGallery", JSON.stringify(existingGallery));
      if (coverImage) fd.append("coverImage", coverImage);
      newGalleryImages.forEach((file) => fd.append("galleryImages", file));

      const res = await fetch(`/api/freelancer/services?id=${serviceId}`, {
        method: "PUT",
        body: fd,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "שמירה נכשלה");
        setLoading(false);
        return;
      }
      router.push(`/dashboard/freelancer/services/${serviceId}`);
      router.refresh();
    } catch {
      setError("שגיאה בלתי צפויה");
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 space-y-4 rounded-2xl border border-[#E0D4C3] bg-white p-6 text-right text-sm shadow-[0_12px_40px_rgba(15,59,46,0.08)]"
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
        <label className="block text-xs font-medium text-[#5F5F5F]">
          שם השירות *
        </label>
        <input
          type="text"
          required
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="mt-1 w-full rounded-xl border border-[#E0D4C3] bg-white px-3 py-2 text-[#1A1A1A] outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/40"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-[#5F5F5F]">
          ספרו קצת עליכם ומה אתם עושים
        </label>
        <textarea
          rows={5}
          value={form.description}
          onChange={(e) =>
            setForm((f) => ({ ...f, description: e.target.value }))
          }
          className="mt-1 w-full rounded-xl border border-[#E0D4C3] bg-white px-3 py-2 text-[#1A1A1A] outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/40"
          placeholder="למשל: מי אתם, מה הניסיון שלכם, באילו סוגי אירועים אתם מתמחים והסבר קצר על השירות שאתם נותנים..."
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-[#5F5F5F]">
            אזור שירות
          </label>
          <ServiceAreaTagsField
            value={form.serviceArea}
            onChange={(serviceArea) => setForm((f) => ({ ...f, serviceArea }))}
            className="mt-1"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#5F5F5F]">
            שנות ניסיון בתחום
          </label>
          <input
            type="number"
            min={0}
            value={form.experienceYears}
            onChange={(e) => setForm((f) => ({ ...f, experienceYears: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-[#E0D4C3] bg-white px-3 py-2 text-[#1A1A1A] outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/40"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-[#5F5F5F]">
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
        description="לחצו על הכפתור «+ הוסף רשת / קישור» כדי להוסיף שורה חדשה. בכל שורה בוחרים רשת ומדביקים קישור מלא — יוצג למחפשים."
      />

      <ServiceIncludesEditor
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

      <div className="rounded-xl border border-[#E0D4C3]/80 bg-[#FAF8F4]/50 p-4">
        {!form.priceUseRange ? (
          <div>
            <label className="block text-xs font-medium text-[#5F5F5F]">
              מחיר לשירות (₪)
            </label>
            <input
              type="number"
              min={0}
              value={form.exactPrice}
              onChange={(e) =>
                setForm((f) => ({ ...f, exactPrice: e.target.value }))
              }
              className="mt-1 w-full rounded-xl border border-[#E0D4C3] bg-white px-3 py-2 text-[#1A1A1A] outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/40"
              placeholder="למשל 2500"
            />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-[#5F5F5F]">
                מחיר מינימלי (₪)
              </label>
              <input
                type="number"
                min={0}
                value={form.minPrice}
                onChange={(e) =>
                  setForm((f) => ({ ...f, minPrice: e.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-[#E0D4C3] bg-white px-3 py-2 text-[#1A1A1A] outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/40"
                placeholder="1500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5F5F5F]">
                מחיר מקסימלי (₪)
              </label>
              <input
                type="number"
                min={0}
                value={form.maxPrice}
                onChange={(e) =>
                  setForm((f) => ({ ...f, maxPrice: e.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-[#E0D4C3] bg-white px-3 py-2 text-[#1A1A1A] outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/40"
                placeholder="5000"
              />
            </div>
          </div>
        )}
        <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs text-[#0F3B2E]">
          <input
            type="checkbox"
            checked={form.priceUseRange}
            onChange={(e) => {
              const checked = e.target.checked;
              setForm((f) => {
                if (checked) {
                  const ex = f.exactPrice.trim();
                  return {
                    ...f,
                    priceUseRange: true,
                    minPrice: ex || f.minPrice,
                    maxPrice: ex || f.maxPrice,
                    exactPrice: "",
                  };
                }
                const ep =
                  f.minPrice && f.minPrice === f.maxPrice ? f.minPrice : "";
                return {
                  ...f,
                  priceUseRange: false,
                  exactPrice: ep,
                  minPrice: "",
                  maxPrice: "",
                };
              });
            }}
            className="h-4 w-4 shrink-0 rounded border-[#E0D4C3] text-[#0F3B2E] focus:ring-[#C9A227]/40"
          />
          אין לי מחיר מדויק — אציג טווח מחירים
        </label>
      </div>

      <div>
        <label className="block text-xs font-medium text-[#5F5F5F]">
          תמונה ראשית
        </label>
        <p className="mt-0.5 text-[11px] text-[#6B6560]">
          זו תמונת השער של השירות — היא תוצג ראשונה בכרטיס ובדף השירות.
        </p>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setCoverImage(e.target.files?.[0] ?? null)}
          className="mt-1 w-full text-xs text-[#2A261F] file:mr-3 file:rounded-full file:border-0 file:bg-[#C9A227] file:px-4 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-[#E5C96B]"
        />
        {coverPreview && (
          <img src={coverPreview} alt="cover" className="mt-2 h-28 w-28 rounded-xl object-cover" />
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-[#5F5F5F]">גלריה קיימת</label>
        <p className="mt-0.5 text-[11px] text-[#6B6560]">
          הגלריה מיועדת לדוגמאות של עבודות, תוצרים או דברים שאתה נותן במסגרת השירות.
        </p>
        {existingGallery.length === 0 ? (
          <p className="mt-1 text-xs text-[#6B6560]">אין תמונות גלריה.</p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            {existingGallery.map((url) => (
              <div key={url} className="relative">
                <img src={url} alt="gallery" className="h-16 w-16 rounded-lg object-cover" />
                <button
                  type="button"
                  onClick={() => setExistingGallery((prev) => prev.filter((x) => x !== url))}
                  className="absolute -left-1 -top-1 rounded-full bg-red-600 px-1.5 text-[10px] text-white"
                >
                  x
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-[#5F5F5F]">הוספת תמונות גלריה חדשות</label>
        <p className="mt-0.5 text-[11px] text-[#6B6560]">
          ניתן להוסיף תמונות נוספות כדוגמאות לשירותים ולעבודות שלך.
        </p>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => {
            const files = e.target.files;
            if (!files) return;
            setNewGalleryImages((prev) => [...prev, ...Array.from(files)]);
          }}
          className="mt-1 w-full text-xs text-[#2A261F] file:mr-3 file:rounded-full file:border-0 file:bg-[#0F3B2E] file:px-4 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-[#174D3B]"
        />
        {newGalleryImages.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-3">
            {newGalleryImages.map((f, idx) => (
              <div
                key={`${f.name}-${f.size}-${f.lastModified}-${idx}`}
                className="relative"
              >
                <img
                  src={newGalleryPreviewUrls[idx]}
                  alt={f.name}
                  className="h-20 w-20 rounded-xl border border-[#E0D4C3] object-cover shadow-sm"
                />
                <button
                  type="button"
                  onClick={() =>
                    setNewGalleryImages((prev) => prev.filter((_, i) => i !== idx))
                  }
                  className="absolute -left-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow hover:bg-red-700"
                  aria-label="הסר תמונה"
                >
                  ×
                </button>
                <p className="mt-1 max-w-[5.5rem] truncate text-center text-[10px] text-[#6B6560]">
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
        <a
          href={`/dashboard/freelancer/services/${serviceId}`}
          className="rounded-full border border-[#E0D4C3] bg-[#FAF8F4] px-5 py-2 text-xs font-medium text-[#0F3B2E] hover:bg-[#EFE6D5]"
        >
          ביטול
        </a>
        <button
          type="submit"
          disabled={loading || hasInvalidSocialLinks}
          className="rounded-full bg-[#C9A227] px-6 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#E5C96B] disabled:opacity-60"
        >
          {loading ? "שומר..." : "שמירה"}
        </button>
      </div>
    </form>
  );
}
