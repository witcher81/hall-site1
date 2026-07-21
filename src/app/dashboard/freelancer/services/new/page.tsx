"use client";

import ServiceCatalogEditor from "@/components/ServiceCatalogEditor";
import ServiceIncludesEditor from "@/components/ServiceIncludesEditor";
import DashboardMain from "@/components/dashboard/DashboardMain";
import DashboardPageHero from "@/components/dashboard/DashboardPageHero";
import FreelancerCategoryTreePicker from "@/components/FreelancerCategoryTreePicker";
import ServiceAreaTagsField from "@/components/ServiceAreaTagsField";
import ServiceLanguagesTagsField from "@/components/ServiceLanguagesTagsField";
import {
  composeServiceCategoryValue,
} from "@/lib/freelancerServiceCategories";
import { catalogReplacesIncludesEditor, resolveCatalogTemplateFromCategory } from "@/lib/serviceCategoryTemplates";
import OptionalPriceRangeFields from "@/components/OptionalPriceRangeFields";
import { buildMinMaxStringsForSubmit } from "@/lib/freelancerServicePriceForm";
import type {
  ServiceCustomInclude,
  ServicePaidExtraItem,
} from "@/lib/serviceIncludes";
import {
  ensureMenuTemplateId,
  parseServiceMenuJson,
  type ServiceMenuConfig,
} from "@/lib/serviceMenu";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

export default function NewServicePage() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    primaryCategory: "",
    secondaryCategories: [] as string[],
    description: "",
    serviceArea: "",
    experienceYears: "",
    languages: "",
    exactPrice: "",
    priceUseRange: false,
    minPrice: "",
    maxPrice: "",
  });
  const [customIncludes, setCustomIncludes] = useState<ServiceCustomInclude[]>(
    []
  );
  const [paidExtras, setPaidExtras] = useState<ServicePaidExtraItem[]>([]);
  const [menu, setMenu] = useState<ServiceMenuConfig>(() => parseServiceMenuJson(null));
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [galleryImages, setGalleryImages] = useState<File[]>([]);
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

  const categoryValue = useMemo(
    () =>
      composeServiceCategoryValue(form.primaryCategory, form.secondaryCategories),
    [form.primaryCategory, form.secondaryCategories]
  );
  const catalogTemplate = useMemo(
    () => resolveCatalogTemplateFromCategory(categoryValue),
    [categoryValue]
  );
  const usesCatalog = form.primaryCategory.trim().length > 0;
  const showCatalogEditor = usesCatalog && catalogTemplate != null;
  const showIncludesEditor =
    !catalogTemplate || !catalogReplacesIncludesEditor(catalogTemplate.id);
  const showSimplePrice = !showCatalogEditor;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append("name", form.name.trim());
      const categoryValue = composeServiceCategoryValue(
        form.primaryCategory,
        form.secondaryCategories
      );
      if (categoryValue) fd.append("category", categoryValue);
      if (form.description.trim()) fd.append("description", form.description.trim());
      if (form.serviceArea.trim()) fd.append("serviceArea", form.serviceArea.trim());
      if (form.experienceYears.trim()) fd.append("experienceYears", form.experienceYears.trim());
      if (form.languages.trim()) fd.append("languages", form.languages.trim());
      fd.append("includesTravel", "false");
      fd.append("includesEquipment", "false");
      fd.append("includesNote", "");
      fd.append(
        "customIncludesJson",
        JSON.stringify({
          included: customIncludes.map((c) => ({
            ...c,
            checked: c.label.trim().length > 0 ? true : c.checked,
          })),
          paidExtras:
            showCatalogEditor && catalogReplacesIncludesEditor(catalogTemplate.id)
              ? []
              : paidExtras,
        })
      );
      if (showCatalogEditor && catalogTemplate) {
        fd.append(
          "menuJson",
          JSON.stringify(ensureMenuTemplateId(menu, categoryValue))
        );
      }
      if (showSimplePrice) {
        const { minPrice: minP, maxPrice: maxP } = buildMinMaxStringsForSubmit({
          priceUseRange: form.priceUseRange,
          exactPrice: form.exactPrice,
          minPrice: form.minPrice,
          maxPrice: form.maxPrice,
        });
        if (minP) fd.append("minPrice", minP);
        if (maxP) fd.append("maxPrice", maxP);
      }
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
    <>
      <DashboardPageHero
        role="freelancer"
        title="הוספת שירות חדש"
        description="כאן ממלאים רק פרטי השירות עצמו. שם המותג, תיאור עליי, טלפון ורשתות — בפרופיל העסקי."
        backHref="/dashboard/freelancer"
        backLabel="חזרה לשירותים שלי"
      />
      <DashboardMain width="narrow">
      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 text-right text-sm shadow-[0_12px_40px_rgba(15,59,46,0.08)]"
      >
        <div>
          <FreelancerCategoryTreePicker
            primaryValue={form.primaryCategory}
            secondaryValues={form.secondaryCategories}
            onChange={({ primary, secondaries }) =>
              setForm((f) => ({
                ...f,
                primaryCategory: primary,
                secondaryCategories: secondaries,
              }))
            }
            label="קטגוריה ראשית + תת־קטגוריה (אפשר כמה)"
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

        <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 px-3 py-2.5 text-xs leading-relaxed text-amber-950">
          שם העסק, תיאור קצר עליך, טלפון ורשתות חברתיות נערכים ב־
          <a
            href="/dashboard/freelancer/profile"
            className="mx-1 font-semibold underline underline-offset-2"
          >
            הפרופיל העסקי
          </a>
          ומוצגים גם בעמוד הספק הציבורי.
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-600">
            תיאור השירות
          </label>
          <textarea
            rows={5}
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            className={input}
            placeholder="מה כולל השירות הזה בפועל: סוגי אירועים, חבילות, משך, ציוד מיוחד — לא סיפור כללי על העסק (זה בפרופיל)."
          />
          <p className="mt-1 text-[11px] text-neutral-600">
            תיאור כללי על העסק / עליך — בפרופיל העסקי.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-neutral-600">
              אזור שירות (לשירות זה)
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

        {showCatalogEditor && catalogTemplate ? (
          <ServiceCatalogEditor
            template={catalogTemplate}
            value={menu}
            onChange={setMenu}
            secondary={form.secondaryCategories[0] ?? null}
          />
        ) : null}

        {showIncludesEditor ? (
          <>
            <ServiceIncludesEditor
              customIncludes={customIncludes}
              onCustomIncludesChange={setCustomIncludes}
              paidExtras={paidExtras}
              onPaidExtrasChange={setPaidExtras}
            />

            {showSimplePrice ? (
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
            ) : null}
          </>
        ) : null}

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
            className="mt-1 w-full text-xs text-neutral-800 file:mr-3 file:rounded-full file:border-0 file:bg-amber-400 file:px-4 file:py-1.5 file:text-xs file:font-semibold file:text-neutral-950 hover:file:bg-[#E5C96B]"
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
            disabled={creating}
            className="rounded-full bg-amber-400 px-6 py-2 text-xs font-semibold text-neutral-950 shadow-sm hover:bg-amber-300 disabled:opacity-60"
          >
            {creating ? "שומר..." : "שמירת שירות"}
          </button>
        </div>
      </form>
      </DashboardMain>
    </>
  );
}
