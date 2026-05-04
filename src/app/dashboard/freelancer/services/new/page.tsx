"use client";

import ServiceIncludesEditor from "@/components/ServiceIncludesEditor";
import SocialLinksEditor from "@/components/SocialLinksEditor";
import { buildMinMaxStringsForSubmit } from "@/lib/freelancerServicePriceForm";
import type {
  ServiceCustomInclude,
  ServicePaidExtraItem,
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

export default function NewServicePage() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    category: "",
    description: "",
    serviceArea: "",
    experienceYears: "",
    languages: "",
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
      if (form.category.trim()) fd.append("category", form.category.trim());
      if (form.description.trim()) fd.append("description", form.description.trim());
      if (form.serviceArea.trim()) fd.append("serviceArea", form.serviceArea.trim());
      if (form.experienceYears.trim()) fd.append("experienceYears", form.experienceYears.trim());
      if (form.languages.trim()) fd.append("languages", form.languages.trim());
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
    "mt-1 w-full rounded-xl border border-[#E0D4C3] bg-white px-3 py-2 text-[#1A1A1A] outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/40";

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex items-center justify-between gap-4 border-b border-[#E0D4C3] pb-4">
        <div className="text-right">
          <p className="text-[11px] font-semibold tracking-[0.25em] text-[#C9A227]">
            HALLS HUB
          </p>
          <h1 className="mt-1 text-xl font-semibold text-[#0F3B2E]">
            הוספת שירות חדש
          </h1>
          <p className="mt-1 text-xs text-[#6B6560]">
            מלא/י את פרטי השירות. לאחר השמירה תועבר/י לרשימת השירותים.
          </p>
        </div>
        <a
          href="/dashboard/freelancer"
          className="text-sm text-[#6B6560] underline-offset-4 hover:text-[#0F3B2E] hover:underline"
        >
          חזרה לשירותים שלי
        </a>
      </header>

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
            className={input}
            placeholder="למשל: צילום חתונות"
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
            className={input}
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
            תיאור השירות שלך-פה תוכל לפרט על השירות שאתה נותן
          </label>
          <textarea
            rows={5}
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            className={input}
            placeholder="למשל: סוג האירועים שאתה מלווה, חבילות, ניסיון, מה מיוחד בשירות..."
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-[#5F5F5F]">
              אזור שירות
            </label>
            <input
              type="text"
              value={form.serviceArea}
              onChange={(e) => setForm((f) => ({ ...f, serviceArea: e.target.value }))}
              className={input}
              placeholder="למשל: כל הארץ / מרכז"
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
              className={input}
              placeholder="למשל: 5"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#5F5F5F]">
            שפות עבודה
          </label>
          <input
            type="text"
            value={form.languages}
            onChange={(e) => setForm((f) => ({ ...f, languages: e.target.value }))}
            className={input}
            placeholder="למשל: עברית, אנגלית"
          />
        </div>

        <SocialLinksEditor
          value={socialLinks}
          onChange={setSocialLinks}
          title="קישורים לאתר, פורטפוליו ורשתות חברתיות"
          description="ניתן להוסיף מספר שורות — בוחרים סוג רשת ומדביקים קישור מלא."
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
                className={input}
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
                  className={input}
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
                  className={input}
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
            תמונת שירות ראשית
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setCoverImage(e.target.files?.[0] ?? null)}
            className="mt-1 w-full text-xs text-[#2A261F] file:mr-3 file:rounded-full file:border-0 file:bg-[#C9A227] file:px-4 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-[#E5C96B]"
          />
          {coverPreview && (
            <img src={coverPreview} alt="preview" className="mt-2 h-28 w-28 rounded-xl object-cover" />
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-[#5F5F5F]">
            גלריית תמונות (ניתן לבחור כמה)
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              const files = e.target.files;
              if (!files) return;
              setGalleryImages((prev) => [...prev, ...Array.from(files)]);
            }}
            className="mt-1 w-full text-xs text-[#2A261F] file:mr-3 file:rounded-full file:border-0 file:bg-[#0F3B2E] file:px-4 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-[#174D3B]"
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
                    className="h-20 w-20 rounded-xl border border-[#E0D4C3] object-cover shadow-sm"
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
          <button
            type="button"
            onClick={() => router.push("/dashboard/freelancer")}
            className="rounded-full border border-[#E0D4C3] bg-[#FAF8F4] px-5 py-2 text-xs font-medium text-[#0F3B2E] hover:bg-[#EFE6D5]"
          >
            ביטול
          </button>
          <button
            type="submit"
            disabled={creating || hasInvalidSocialLinks}
            className="rounded-full bg-[#C9A227] px-6 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#E5C96B] disabled:opacity-60"
          >
            {creating ? "שומר..." : "שמירת שירות"}
          </button>
        </div>
      </form>
    </main>
  );
}
