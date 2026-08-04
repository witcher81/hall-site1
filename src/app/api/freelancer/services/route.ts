import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { emailVerificationGuard } from "@/lib/apiAuth";
import {
  sanitizeSocialLinksFromClient,
  serializeSocialLinks,
} from "@/lib/socialLinks";
import {
  sanitizeIncludesNote,
  sanitizeServiceIncludesBundleFromClient,
  serializeServiceIncludesBundle,
} from "@/lib/serviceIncludes";
import {
  deriveServicePricesFromMenu,
  ensureMenuTemplateId,
  parseServiceMenuJson,
  sanitizeServiceMenuFromClient,
  serializeServiceMenuJson,
  serviceUsesCatalogEditor,
  validateServiceMenuForSubmit,
} from "@/lib/serviceMenu";
import { resolveCatalogTemplateFromCategory } from "@/lib/serviceCategoryTemplates";
import { parseServiceCategorySelections } from "@/lib/freelancerServiceCategories";
import { saveServiceImageFile } from "@/lib/serviceImageUpload";
import {
  logListingSubmittedForReview,
  moderationFieldsForNewListing,
  moderationFieldsForOwnerEdit,
} from "@/lib/listingModerationService";
import {
  USER_INPUT_MAX,
  badRequest,
  formDataJsonStringTooLong,
  validateExperienceYearsInt,
  validateOptionalLongText,
  validateOptionalShortText,
  validatePriceMinMax,
  validateRequiredText,
  validateUploadedImageFile,
} from "@/lib/userInputValidation";

const MAX_INT = 2_147_483_647;

function toIntOrNull(value: string | null): number | null {
  if (value === null || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (n > MAX_INT || n < -MAX_INT - 1) return null;
  return Math.trunc(n);
}

function toBool(value: FormDataEntryValue | null): boolean {
  if (typeof value !== "string") return false;
  return value === "true" || value === "on" || value === "1";
}

function parseSocialLinksFormField(
  entry: FormDataEntryValue | null
): string | null {
  if (entry === null || entry === "") return null;
  try {
    const raw = typeof entry === "string" ? entry : "";
    const data = JSON.parse(raw) as unknown;
    return serializeSocialLinks(sanitizeSocialLinksFromClient(data));
  } catch {
    return null;
  }
}

function parseIncludesNoteField(
  entry: FormDataEntryValue | null
): string | null {
  if (entry === null) return null;
  const s = typeof entry === "string" ? entry : "";
  return sanitizeIncludesNote(s);
}

function parseCustomIncludesFormField(
  entry: FormDataEntryValue | null
): string | null {
  if (entry === null || entry === "") return null;
  try {
    const raw = typeof entry === "string" ? entry : "";
    const data = JSON.parse(raw) as unknown;
    const bundle = sanitizeServiceIncludesBundleFromClient(data);
    return serializeServiceIncludesBundle(bundle);
  } catch {
    return null;
  }
}


function resolveCatalogServicePrices(
  category: string | null,
  menuJson: string | null,
  minPrice: number | null,
  maxPrice: number | null
): { minPrice: number | null; maxPrice: number | null } {
  if (!serviceUsesCatalogEditor(category) || !menuJson) {
    return { minPrice, maxPrice };
  }
  const derived = deriveServicePricesFromMenu(parseServiceMenuJson(menuJson));
  return {
    minPrice: derived.minPrice ?? minPrice,
    maxPrice: derived.maxPrice ?? maxPrice,
  };
}

function parseMenuFormField(
  entry: FormDataEntryValue | null,
  category: string | null
): string | null {
  if (entry === null || entry === "") return null;
  try {
    const raw = typeof entry === "string" ? entry : "";
    const data = JSON.parse(raw) as unknown;
    const menu = ensureMenuTemplateId(
      sanitizeServiceMenuFromClient(data),
      category
    );
    return serializeServiceMenuJson(menu);
  } catch {
    return null;
  }
}

function parseGalleryJson(value: string | null): string[] {
  if (!value) return [];
  if (value.length > USER_INPUT_MAX.JSON_FORM_FIELD) return [];
  try {
    const arr = JSON.parse(value);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((x) => typeof x === "string" && x.length > 0 && x.length <= 500)
      .slice(0, USER_INPUT_MAX.MAX_SERVICE_GALLERY_FILES);
  } catch {
    return [];
  }
}

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "FREELANCER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const services = await prisma.service.findMany({
    where: { providerId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ services });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "FREELANCER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const verifyBlock = emailVerificationGuard(user);
  if (verifyBlock) return verifyBlock;

  const formData = await req.formData();
  const name = (formData.get("name") as string | null)?.trim();
  const category = (formData.get("category") as string | null)?.trim() || null;
  const description = (formData.get("description") as string | null)?.trim() || null;
  const serviceArea = (formData.get("serviceArea") as string | null)?.trim() || null;
  const experienceYears = toIntOrNull(
    (formData.get("experienceYears") as string | null) ?? null
  );
  const languages =
    (formData.get("languages") as string | null)?.trim() || null;
  const responseTimeHint =
    (formData.get("responseTimeHint") as string | null)?.trim() || null;
  const socialLinksJson = parseSocialLinksFormField(
    formData.get("socialLinks")
  );
  const includesTravel = toBool(formData.get("includesTravel"));
  const includesEquipment = toBool(formData.get("includesEquipment"));
  const customIncludesJson = parseCustomIncludesFormField(
    formData.get("customIncludesJson")
  );
  const includesNote = parseIncludesNoteField(formData.get("includesNote"));
  const minPrice = toIntOrNull((formData.get("minPrice") as string | null) ?? null);
  const maxPrice = toIntOrNull((formData.get("maxPrice") as string | null) ?? null);

  if (formDataJsonStringTooLong(formData.get("socialLinks"), USER_INPUT_MAX.JSON_FORM_FIELD)) {
    return badRequest("נתוני רשתות חברתיות ארוכים מדי");
  }
  if (formDataJsonStringTooLong(formData.get("customIncludesJson"), USER_INPUT_MAX.JSON_FORM_FIELD)) {
    return badRequest("נתוני תוספות ארוכים מדי");
  }
  if (formDataJsonStringTooLong(formData.get("menuJson"), USER_INPUT_MAX.JSON_FORM_FIELD)) {
    return badRequest("נתוני תפריט ארוכים מדי");
  }

  const nameCheck = validateRequiredText(
    typeof name === "string" ? name : "",
    USER_INPUT_MAX.VENUE_OR_SERVICE_NAME,
    1,
    "שם השירות"
  );
  if (!nameCheck.ok) return badRequest(nameCheck.error);
  const catCheck = validateOptionalShortText(
    category,
    USER_INPUT_MAX.SERVICE_CATEGORY,
    "קטגוריה"
  );
  if (!catCheck.ok) return badRequest(catCheck.error);
  const menuJson = parseMenuFormField(formData.get("menuJson"), catCheck.value);
  const parsedMenuForTemplate = menuJson ? parseServiceMenuJson(menuJson) : null;
  const catalogTemplate = resolveCatalogTemplateFromCategory(catCheck.value, {
    foodPricingMode: parsedMenuForTemplate?.foodPricingMode ?? null,
    foodPricingModesBySecondary:
      parsedMenuForTemplate?.foodPricingModesBySecondary ?? null,
  });
  const descCheck = validateOptionalLongText(
    description,
    USER_INPUT_MAX.DESCRIPTION_LONG,
    "תיאור השירות"
  );
  if (!descCheck.ok) return badRequest(descCheck.error);
  const areaCheck = validateOptionalShortText(
    serviceArea,
    USER_INPUT_MAX.SERVICE_AREA_TEXT,
    "אזור שירות"
  );
  if (!areaCheck.ok) return badRequest(areaCheck.error);
  const langCheck = validateOptionalShortText(
    languages,
    USER_INPUT_MAX.LANGUAGES_LINE,
    "שפות"
  );
  if (!langCheck.ok) return badRequest(langCheck.error);
  const hintCheck = validateOptionalShortText(
    responseTimeHint,
    USER_INPUT_MAX.RESPONSE_TIME_HINT,
    "זמן תגובה"
  );
  if (!hintCheck.ok) return badRequest(hintCheck.error);

  if (!validateExperienceYearsInt(experienceYears)) {
    return badRequest("מספר שנות ניסיון לא תקין");
  }
  const priceErr = validatePriceMinMax(minPrice, maxPrice);
  if (priceErr) return badRequest(priceErr);

  if (catalogTemplate) {
    const menuErr = validateServiceMenuForSubmit(
      parseServiceMenuJson(menuJson),
      catalogTemplate,
      {
        secondaries: parseServiceCategorySelections(catCheck.value ?? "").secondaries,
      }
    );
    if (menuErr) return badRequest(menuErr);
  }

  const resolvedPrices = resolveCatalogServicePrices(
    catCheck.value,
    menuJson,
    minPrice,
    maxPrice
  );

  const coverImage = (formData.get("coverImage") as File | null) ?? null;
  const galleryFiles = formData.getAll("galleryImages") as File[];
  let nonEmptyGallery = 0;
  if (coverImage && coverImage.size > 0) {
    const ie = validateUploadedImageFile(coverImage);
    if (ie) return badRequest(ie);
  }
  for (const file of galleryFiles) {
    if (file.size > 0) {
      nonEmptyGallery += 1;
      const ie = validateUploadedImageFile(file);
      if (ie) return badRequest(ie);
    }
  }
  if (nonEmptyGallery > USER_INPUT_MAX.MAX_SERVICE_GALLERY_FILES) {
    return badRequest("יותר מדי תמונות בגלריה");
  }

  const coverImageUrl = await saveServiceImageFile(coverImage, "service-cover");
  const galleryImageUrls: string[] = [];
  for (const [index, file] of galleryFiles.entries()) {
    const saved = await saveServiceImageFile(file, `service-gallery-${index}`);
    if (saved) galleryImageUrls.push(saved);
  }

  const service = await prisma.service.create({
    data: {
      providerId: user.id,
      name: nameCheck.value,
      category: catCheck.value,
      shortDescription: null,
      description: descCheck.value,
      serviceArea: areaCheck.value,
      experienceYears,
      languages: langCheck.value,
      responseTimeHint: hintCheck.value,
      socialLinksJson,
      includesTravel,
      includesEquipment,
      customIncludesJson,
      menuJson: serviceUsesCatalogEditor(catCheck.value) ? menuJson : null,
      includesNote,
      coverImageUrl,
      galleryImageUrls:
        galleryImageUrls.length > 0 ? JSON.stringify(galleryImageUrls) : null,
      minPrice: resolvedPrices.minPrice,
      maxPrice: resolvedPrices.maxPrice,
      ...moderationFieldsForNewListing(),
    },
  });

  await logListingSubmittedForReview({
    listingType: "SERVICE",
    listingId: service.id,
    fromStatus: null,
    actorUserId: user.id,
  });

  return NextResponse.json({ service }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "FREELANCER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const idParam = searchParams.get("id");
  if (!idParam) {
    return NextResponse.json({ error: "Missing service id" }, { status: 400 });
  }
  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid service id" }, { status: 400 });
  }

  const existing = await prisma.service.findFirst({
    where: { id, providerId: user.id },
  });
  if (!existing) {
    return NextResponse.json(
      { error: "Service not found" },
      { status: 404 }
    );
  }

  const formData = await req.formData();

  const name = ((formData.get("name") as string | null)?.trim() ?? existing.name) || existing.name;
  const category =
    (formData.get("category") as string | null)?.trim() ?? existing.category;
  const description =
    (formData.get("description") as string | null)?.trim() ?? existing.description;
  const serviceArea =
    (formData.get("serviceArea") as string | null)?.trim() ?? existing.serviceArea;
  const experienceYearsRaw = formData.get("experienceYears");
  const experienceYears =
    experienceYearsRaw !== null
      ? toIntOrNull((experienceYearsRaw as string | null) ?? null)
      : existing.experienceYears;
  const languages =
    (formData.get("languages") as string | null)?.trim() || null;
  const responseTimeHint = formData.has("responseTimeHint")
    ? (formData.get("responseTimeHint") as string | null)?.trim() || null
    : existing.responseTimeHint;
  const socialLinksJson =
    formData.get("socialLinks") !== null
      ? parseSocialLinksFormField(formData.get("socialLinks"))
      : existing.socialLinksJson;
  const minPriceRaw = formData.get("minPrice");
  const maxPriceRaw = formData.get("maxPrice");
  const minPrice =
    minPriceRaw !== null
      ? toIntOrNull((minPriceRaw as string | null) ?? null)
      : existing.minPrice;
  const maxPrice =
    maxPriceRaw !== null
      ? toIntOrNull((maxPriceRaw as string | null) ?? null)
      : existing.maxPrice;
  const includesTravel =
    formData.get("includesTravel") !== null
      ? toBool(formData.get("includesTravel"))
      : existing.includesTravel;
  const includesEquipment =
    formData.get("includesEquipment") !== null
      ? toBool(formData.get("includesEquipment"))
      : existing.includesEquipment;
  const customIncludesJson = formData.has("customIncludesJson")
    ? parseCustomIncludesFormField(formData.get("customIncludesJson"))
    : existing.customIncludesJson;
  const includesNote = formData.has("includesNote")
    ? parseIncludesNoteField(formData.get("includesNote"))
    : existing.includesNote;

  if (formData.get("socialLinks") !== null) {
    if (formDataJsonStringTooLong(formData.get("socialLinks"), USER_INPUT_MAX.JSON_FORM_FIELD)) {
      return badRequest("נתוני רשתות חברתיות ארוכים מדי");
    }
  }
  if (formData.has("customIncludesJson")) {
    if (formDataJsonStringTooLong(formData.get("customIncludesJson"), USER_INPUT_MAX.JSON_FORM_FIELD)) {
      return badRequest("נתוני תוספות ארוכים מדי");
    }
  }
  if (formData.has("menuJson")) {
    if (formDataJsonStringTooLong(formData.get("menuJson"), USER_INPUT_MAX.JSON_FORM_FIELD)) {
      return badRequest("נתוני תפריט ארוכים מדי");
    }
  }

  const nameCheckPut = validateRequiredText(
    String(name ?? ""),
    USER_INPUT_MAX.VENUE_OR_SERVICE_NAME,
    1,
    "שם השירות"
  );
  if (!nameCheckPut.ok) return badRequest(nameCheckPut.error);
  const catCheckPut = validateOptionalShortText(
    category,
    USER_INPUT_MAX.SERVICE_CATEGORY,
    "קטגוריה"
  );
  if (!catCheckPut.ok) return badRequest(catCheckPut.error);
  const menuJson = formData.has("menuJson")
    ? parseMenuFormField(formData.get("menuJson"), catCheckPut.value)
    : existing.menuJson;
  const parsedMenuPut = menuJson ? parseServiceMenuJson(menuJson) : null;
  const catalogTemplatePut = resolveCatalogTemplateFromCategory(catCheckPut.value, {
    foodPricingMode: parsedMenuPut?.foodPricingMode ?? null,
    foodPricingModesBySecondary:
      parsedMenuPut?.foodPricingModesBySecondary ?? null,
  });
  const descCheckPut = validateOptionalLongText(
    description,
    USER_INPUT_MAX.DESCRIPTION_LONG,
    "תיאור השירות"
  );
  if (!descCheckPut.ok) return badRequest(descCheckPut.error);
  const areaCheckPut = validateOptionalShortText(
    serviceArea,
    USER_INPUT_MAX.SERVICE_AREA_TEXT,
    "אזור שירות"
  );
  if (!areaCheckPut.ok) return badRequest(areaCheckPut.error);
  const langCheckPut = validateOptionalShortText(
    languages,
    USER_INPUT_MAX.LANGUAGES_LINE,
    "שפות"
  );
  if (!langCheckPut.ok) return badRequest(langCheckPut.error);
  const hintCheckPut = validateOptionalShortText(
    responseTimeHint,
    USER_INPUT_MAX.RESPONSE_TIME_HINT,
    "זמן תגובה"
  );
  if (!hintCheckPut.ok) return badRequest(hintCheckPut.error);

  if (!validateExperienceYearsInt(experienceYears)) {
    return badRequest("מספר שנות ניסיון לא תקין");
  }
  const priceErrPut = validatePriceMinMax(minPrice, maxPrice);
  if (priceErrPut) return badRequest(priceErrPut);

  if (catalogTemplatePut) {
    const menuErr = validateServiceMenuForSubmit(
      parseServiceMenuJson(menuJson),
      catalogTemplatePut,
      {
        secondaries: parseServiceCategorySelections(catCheckPut.value ?? "").secondaries,
      }
    );
    if (menuErr) return badRequest(menuErr);
  }

  const resolvedPricesPut = resolveCatalogServicePrices(
    catCheckPut.value,
    menuJson,
    minPrice,
    maxPrice
  );

  const coverImageFile = (formData.get("coverImage") as File | null) ?? null;
  if (coverImageFile && coverImageFile.size > 0) {
    const ie = validateUploadedImageFile(coverImageFile);
    if (ie) return badRequest(ie);
  }

  const galleryFiles = formData.getAll("galleryImages") as File[];
  for (const file of galleryFiles) {
    if (file.size > 0) {
      const ie = validateUploadedImageFile(file);
      if (ie) return badRequest(ie);
    }
  }

  let coverImageUrl = existing.coverImageUrl;
  if (coverImageFile && coverImageFile.size > 0) {
    const saved = await saveServiceImageFile(coverImageFile, "service-cover");
    if (saved) coverImageUrl = saved;
  }

  let galleryImageUrls = existing.galleryImageUrls;
  const existingGalleryRaw = (formData.get("existingGallery") as string | null) ?? null;
  if (
    existingGalleryRaw !== null &&
    existingGalleryRaw.length > USER_INPUT_MAX.JSON_FORM_FIELD
  ) {
    return badRequest("נתוני גלריה ארוכים מדי");
  }
  if (existingGalleryRaw !== null) {
    galleryImageUrls =
      parseGalleryJson(existingGalleryRaw).length > 0
        ? JSON.stringify(parseGalleryJson(existingGalleryRaw))
        : null;
  }
  if (galleryFiles.length > 0) {
    const current = parseGalleryJson(galleryImageUrls);
    for (const [index, file] of galleryFiles.entries()) {
      const saved = await saveServiceImageFile(file, `service-gallery-${index}`);
      if (saved) current.push(saved);
    }
    galleryImageUrls = current.length > 0 ? JSON.stringify(current) : null;
  }

  const service = await prisma.service.update({
    where: { id },
    data: {
      name: nameCheckPut.value,
      category: catCheckPut.value,
      shortDescription: null,
      description: descCheckPut.value,
      serviceArea: areaCheckPut.value,
      experienceYears,
      languages: langCheckPut.value,
      responseTimeHint: hintCheckPut.value,
      socialLinksJson,
      includesTravel,
      includesEquipment,
      customIncludesJson,
      menuJson: serviceUsesCatalogEditor(catCheckPut.value) ? menuJson : null,
      includesNote,
      coverImageUrl,
      galleryImageUrls,
      minPrice: resolvedPricesPut.minPrice,
      maxPrice: resolvedPricesPut.maxPrice,
      ...moderationFieldsForOwnerEdit({
        moderationStatus: existing.moderationStatus,
        contentRevision: existing.contentRevision,
      }),
    },
  });

  await logListingSubmittedForReview({
    listingType: "SERVICE",
    listingId: service.id,
    fromStatus: existing.moderationStatus,
    actorUserId: user.id,
  });

  return NextResponse.json({ service });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "FREELANCER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const idParam = searchParams.get("id");
  if (!idParam) {
    return NextResponse.json({ error: "Missing service id" }, { status: 400 });
  }
  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid service id" }, { status: 400 });
  }

  const existing = await prisma.service.findFirst({
    where: { id, providerId: user.id },
  });
  if (!existing) {
    return NextResponse.json(
      { error: "Service not found" },
      { status: 404 }
    );
  }

  // ניתוק רשומות קשורות לפני המחיקה כדי שלא תיכשל מ־FK constraint:
  // שיחות נשמרות בלי שיוך לשירות, פניות (ServiceRequest) נמחקות.
  try {
    await prisma.$transaction([
      prisma.conversation.updateMany({
        where: { serviceId: id },
        data: { serviceId: null },
      }),
      prisma.serviceRequest.deleteMany({ where: { serviceId: id } }),
      prisma.service.delete({ where: { id } }),
    ]);
  } catch (err) {
    console.error("[freelancer.services.DELETE] failed", err);
    return NextResponse.json(
      { error: "מחיקת השירות נכשלה. ייתכן שיש פריטים מקושרים." },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}
