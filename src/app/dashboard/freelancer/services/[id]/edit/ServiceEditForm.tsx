"use client";

import ServiceIncludesEditor from "@/components/ServiceIncludesEditor";
import SocialLinksEditor from "@/components/SocialLinksEditor";
import {
  parseCustomIncludesJson,
  type ServiceCustomInclude,
} from "@/lib/serviceIncludes";
import { normalizeSocialUrl, type SocialLink } from "@/lib/socialLinks";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

const CATEGORIES = [
  "צילום",
  "וידאו",
  "DJ",
  "קייטרינג",
  "עיצוב אירועים",
  "פרחים",
  "הנחיה",
  "מוזיקה",
  "אחר",
];

type Props = {
  serviceId: number;
  initial: {
    name: string;
    category: string;
    shortDescription: string;
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
  const [form, setForm] = useState({
    name: initial.name,
    category: initial.category,
    shortDescription: initial.shortDescription,
    description: initial.description,
    serviceArea: initial.serviceArea,
    experienceYears: String(initial.experienceYears ?? ""),
    languages: initial.languages ?? "",
    includesEquipment: initial.includesEquipment,
    includesNote: initial.includesNote ?? "",
    minPrice: String(initial.minPrice),
    maxPrice: String(initial.maxPrice),
  });
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [existingGallery, setExistingGallery] = useState<string[]>(initial.galleryImageUrls);
  const [newGalleryImages, setNewGalleryImages] = useState<File[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(initial.socialLinks);
  const [customIncludes, setCustomIncludes] = useState<ServiceCustomInclude[]>(
    () => parseCustomIncludesJson(initial.customIncludesJson)
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
      fd.append("category", form.category.trim());
      fd.append("shortDescription", form.shortDescription.trim());
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
      fd.append("customIncludesJson", JSON.stringify(customIncludes));
      fd.append("minPrice", form.minPrice.trim());
      fd.append("maxPrice", form.maxPrice.trim());
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
          קטגוריה
        </label>
        <select
          value={form.category}
          onChange={(e) =>
            setForm((f) => ({ ...f, category: e.target.value }))
          }
          className="mt-1 w-full rounded-xl border border-[#E0D4C3] bg-white px-3 py-2 text-[#1A1A1A] outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/40"
        >
          <option value="">בחר קטגוריה</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-[#5F5F5F]">
          תיאור קצר להצגה בכרטיס
        </label>
        <input
          value={form.shortDescription}
          onChange={(e) => setForm((f) => ({ ...f, shortDescription: e.target.value }))}
          className="mt-1 w-full rounded-xl border border-[#E0D4C3] bg-white px-3 py-2 text-[#1A1A1A] outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/40"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-[#5F5F5F]">
          תיאור
        </label>
        <textarea
          rows={3}
          value={form.description}
          onChange={(e) =>
            setForm((f) => ({ ...f, description: e.target.value }))
          }
          className="mt-1 w-full rounded-xl border border-[#E0D4C3] bg-white px-3 py-2 text-[#1A1A1A] outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/40"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-[#5F5F5F]">
            אזור שירות
          </label>
          <input
            value={form.serviceArea}
            onChange={(e) => setForm((f) => ({ ...f, serviceArea: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-[#E0D4C3] bg-white px-3 py-2 text-[#1A1A1A] outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/40"
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
        <input
          value={form.languages}
          onChange={(e) => setForm((f) => ({ ...f, languages: e.target.value }))}
          className="mt-1 w-full rounded-xl border border-[#E0D4C3] bg-white px-3 py-2 text-[#1A1A1A] outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/40"
        />
      </div>

      <SocialLinksEditor
        value={socialLinks}
        onChange={setSocialLinks}
        title="קישורים לאתר, פורטפוליו ורשתות חברתיות"
        description="ניתן להוסיף מספר שורות. לכל שורה בוחרים סוג רשת ומדביקים קישור מלא — יוצגו למחפשים עם אייקון."
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
      />

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
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-[#5F5F5F]">
          תמונה ראשית
        </label>
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
