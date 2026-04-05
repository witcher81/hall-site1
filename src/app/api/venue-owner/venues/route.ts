import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { geocodeIsraelAddress } from "@/lib/geocode";
import { createNotification } from "@/lib/notifications";
import {
  USER_INPUT_MAX,
  badRequest,
  clampEventTypeLabels,
  formDataJsonStringTooLong,
  validateGuestRange,
  validateOptionalLongText,
  validateOptionalShortText,
  validatePriceMinMax,
  validateRequiredText,
  validateUploadedImageFile,
} from "@/lib/userInputValidation";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

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

function toFloatOrNull(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseEventTypes(raw: FormDataEntryValue | null): string[] {
  if (typeof raw !== "string" || raw.trim() === "") return [];
  if (raw.length > USER_INPUT_MAX.JSON_FORM_FIELD) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const list = parsed
      .map((v) => (typeof v === "string" ? v.trim() : ""))
      .filter((v) => v.length > 0);
    return clampEventTypeLabels(list);
  } catch {
    return [];
  }
}

/**
 * שומר customAmenitiesJson ב-SQL כדי שלא ייכשל אימות Prisma כשהלקוח לא נוצר מחדש
 * אחרי שינוי סכמה (למשל EPERM ב-prisma generate ב-Windows).
 */
async function persistCustomAmenitiesJson(
  venueId: number,
  json: string | null
): Promise<void> {
  await prisma.$executeRaw`
    UPDATE Venue SET customAmenitiesJson = ${json} WHERE id = ${venueId}
  `;
}

type ParsedAmenitiesResult = { json: string | null; error: string | null };

/** עד 40 פריטים, עד 80 תווים לתווית — נשמר כ-JSON במסד */
function parseCustomAmenitiesJson(
  raw: FormDataEntryValue | null
): ParsedAmenitiesResult {
  if (typeof raw !== "string" || raw.trim() === "") return { json: null, error: null };
  if (raw.length > USER_INPUT_MAX.JSON_FORM_FIELD) {
    return { json: null, error: "נתוני שירותים מותאמים ארוכים מדי." };
  }
  try {
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) return { json: null, error: "פורמט שירותים לא תקין." };
    const rows: {
      label: string;
      checked: boolean;
      priceMode: "included" | "extra";
      extraPrice: number | null;
    }[] = [];
    const seen = new Set<string>();
    for (const item of v) {
      if (rows.length >= 40) break;
      if (typeof item !== "object" || item === null) continue;
      const o = item as Record<string, unknown>;
      const label = typeof o.label === "string" ? o.label.trim() : "";
      if (!label || label.length > 80) continue;
      const dedupe = label.toLowerCase();
      if (seen.has(dedupe)) continue;
      seen.add(dedupe);
      const priceMode = o.priceMode === "extra" ? "extra" : "included";
      const checked = o.checked === true;
      let extraPrice: number | null = null;
      if (priceMode === "extra") {
        const rawPrice = o.extraPrice;
        const n =
          typeof rawPrice === "number"
            ? rawPrice
            : typeof rawPrice === "string"
              ? Number(rawPrice)
              : NaN;
        if (checked && (!Number.isFinite(n) || n <= 0 || n > MAX_INT)) {
          return {
            json: null,
            error: `נדרש מחיר תקין עבור "${label}" (בתוספת תשלום).`,
          };
        }
        if (Number.isFinite(n) && n > 0) {
          extraPrice = Math.trunc(n);
        }
      }
      rows.push({ label, checked, priceMode, extraPrice });
    }
    return { json: rows.length > 0 ? JSON.stringify(rows) : null, error: null };
  } catch {
    return { json: null, error: "פורמט שירותים לא תקין." };
  }
}

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const venues = await prisma.venue.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ venues });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();

  let name = (formData.get("name") as string | null)?.trim();
  let city = (formData.get("city") as string | null)?.trim();
  let address = (formData.get("address") as string | null)?.trim();
  const minGuests = formData.get("minGuests") as string | null;
  const maxGuests = formData.get("maxGuests") as string | null;
  const minPrice = formData.get("minPrice") as string | null;
  const maxPrice = formData.get("maxPrice") as string | null;
  const hallRentalMin = formData.get("hallRentalMin") as string | null;
  const hallRentalMax = formData.get("hallRentalMax") as string | null;
  let description = (formData.get("description") as string | null)?.trim();
  let autoReplyMessage =
    (formData.get("autoReplyMessage") as string | null)?.trim() || null;
  const hasChuppa = toBool(formData.get("hasChuppa"));
  const hasFood = toBool(formData.get("hasFood"));
  const hasDanceFloor = toBool(formData.get("hasDanceFloor"));
  const hasTableSetup = toBool(formData.get("hasTableSetup"));
  const hasSoundSystem = toBool(formData.get("hasSoundSystem"));
  const hasBridalRoom = toBool(formData.get("hasBridalRoom"));
  const hasChuppaOutdoor = toBool(formData.get("hasChuppaOutdoor"));
  const hasChuppaCovered = toBool(formData.get("hasChuppaCovered"));
  const hasVeganFood = toBool(formData.get("hasVeganFood"));
  if (formDataJsonStringTooLong(formData.get("eventTypes"), USER_INPUT_MAX.JSON_FORM_FIELD)) {
    return badRequest("נתוני סוגי אירוע ארוכים מדי");
  }
  const eventTypes = parseEventTypes(formData.get("eventTypes"));
  const amenitiesParsed = parseCustomAmenitiesJson(
    formData.get("customAmenitiesJson")
  );
  if (amenitiesParsed.error) {
    return NextResponse.json({ error: amenitiesParsed.error }, { status: 400 });
  }
  const customAmenitiesJson = amenitiesParsed.json;

  const nameCheck = validateRequiredText(
    typeof name === "string" ? name : "",
    USER_INPUT_MAX.VENUE_OR_SERVICE_NAME,
    1,
    "שם האולם"
  );
  if (!nameCheck.ok) return badRequest(nameCheck.error);
  const cityCheck = validateRequiredText(
    typeof city === "string" ? city : "",
    USER_INPUT_MAX.CITY,
    1,
    "עיר"
  );
  if (!cityCheck.ok) return badRequest(cityCheck.error);
  const addrCheck = validateRequiredText(
    typeof address === "string" ? address : "",
    USER_INPUT_MAX.ADDRESS,
    1,
    "כתובת"
  );
  if (!addrCheck.ok) return badRequest(addrCheck.error);
  name = nameCheck.value;
  city = cityCheck.value;
  address = addrCheck.value;

  const descCheck = validateOptionalLongText(
    description ?? null,
    USER_INPUT_MAX.DESCRIPTION_LONG,
    "תיאור"
  );
  if (!descCheck.ok) return badRequest(descCheck.error);
  const autoChk = validateOptionalLongText(
    autoReplyMessage,
    USER_INPUT_MAX.AUTO_REPLY,
    "מענה אוטומטי"
  );
  if (!autoChk.ok) return badRequest(autoChk.error);
  const foodChk = validateOptionalShortText(
    (formData.get("foodKashrut") as string | null)?.trim() || null,
    USER_INPUT_MAX.FOOD_KASHRUT,
    "כשרות"
  );
  if (!foodChk.ok) return badRequest(foodChk.error);

  const gErr = validateGuestRange(toIntOrNull(minGuests), toIntOrNull(maxGuests));
  if (gErr) return badRequest(gErr);
  const pErr = validatePriceMinMax(toIntOrNull(minPrice), toIntOrNull(maxPrice));
  if (pErr) return badRequest(pErr);
  const hErr = validatePriceMinMax(
    toIntOrNull(hallRentalMin),
    toIntOrNull(hallRentalMax)
  );
  if (hErr) return badRequest(hErr);

  const pickedLatitude = toFloatOrNull(formData.get("latitude"));
  const pickedLongitude = toFloatOrNull(formData.get("longitude"));
  const hasWedding = eventTypes.includes("חתונה");
  const finalHasChuppa = hasWedding ? true : hasChuppa;
  /** אוכל לחתונה משתמע מסוג האירוע; hasFood = מציעים אוכל גם באירועים שאינם חתונה */
  const finalHasFood = hasFood;

  if (hasWedding && !hasChuppaOutdoor && !hasChuppaCovered) {
    return NextResponse.json(
      { error: "נא לסמן לפחות אחד: חופה בחוץ או חופה מקורה." },
      { status: 400 }
    );
  }

  const hasPickedCoords =
    pickedLatitude != null &&
    pickedLongitude != null &&
    pickedLatitude >= 29 &&
    pickedLatitude <= 34 &&
    pickedLongitude >= 33 &&
    pickedLongitude <= 36;

  // מוודאים שיש מיקום אמיתי: או דרך פין מהמפָּה או דרך גיאוקוד כתובת.
  const coordsNew = hasPickedCoords
    ? { lat: pickedLatitude, lng: pickedLongitude }
    : await geocodeIsraelAddress(address, city);
  if (!coordsNew) {
    return NextResponse.json(
      {
        error:
          "הכתובת לא זוהתה. נא להזין כתובת אמיתית בישראל בפורמט רחוב ומספר, ולבחור עיר נכונה.",
      },
      { status: 400 }
    );
  }

  const coverImageFile = formData.get("coverImage") as File | null;
  const galleryFilesHall = formData.getAll("galleryImagesHALL") as File[];
  const galleryFilesChuppa = formData.getAll("galleryImagesCHUPPA") as File[];
  const galleryFilesDance = formData.getAll("galleryImagesDANCE") as File[];
  const galleryFilesFood = formData.getAll("galleryImagesFOOD") as File[];
  const galleryFilesLegacy = formData.getAll("galleryImages") as File[];

  const galleryHallFilesToUse =
    galleryFilesHall.length > 0 || galleryFilesLegacy.length > 0
      ? galleryFilesHall.length > 0
        ? galleryFilesHall
        : galleryFilesLegacy
      : [];

  const totalGalleryFiles =
    galleryHallFilesToUse.length +
    galleryFilesChuppa.length +
    galleryFilesDance.length +
    galleryFilesFood.length;
  if (totalGalleryFiles > USER_INPUT_MAX.MAX_VENUE_GALLERY_FILES_TOTAL) {
    return badRequest("יותר מדי תמונות בגלריה");
  }
  for (const f of [
    ...galleryHallFilesToUse,
    ...galleryFilesChuppa,
    ...galleryFilesDance,
    ...galleryFilesFood,
  ]) {
    if (f instanceof File && f.size > 0) {
      const imgErr = validateUploadedImageFile(f);
      if (imgErr) return badRequest(imgErr);
    }
  }
  if (coverImageFile && coverImageFile.size > 0) {
    const imgErr = validateUploadedImageFile(coverImageFile);
    if (imgErr) return badRequest(imgErr);
  }

  // הכנת תיקיית העלאות (public/uploads)
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });

  async function saveFile(file: File | null, prefix: string) {
    if (!file) return null;
    if (file.size === 0) return null;

    const ext =
      (file.type && file.type.includes("jpeg")) || file.name.endsWith(".jpg")
        ? ".jpg"
        : file.name.endsWith(".png")
        ? ".png"
        : file.name.endsWith(".webp")
        ? ".webp"
        : "";

    const randomName = `${prefix}-${crypto.randomUUID()}${ext}`;
    const filePath = path.join(uploadsDir, randomName);
    const arrayBuffer = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(arrayBuffer));

    return `/uploads/${randomName}`;
  }

  const coverImagePath = await saveFile(coverImageFile, "cover");

  async function saveGalleryFiles(
    files: File[],
    prefix: string,
    category: string
  ) {
    const images: { url: string; category: string }[] = [];
    for (const [index, file] of files.entries()) {
      const saved = await saveFile(file, `${prefix}-${index}`);
      if (saved) images.push({ url: saved, category });
    }
    return images;
  }

  const galleryHall = await saveGalleryFiles(
    galleryHallFilesToUse,
    "gallery-hall",
    "HALL"
  );
  const galleryChuppa = await saveGalleryFiles(
    galleryFilesChuppa,
    "gallery-chuppa",
    "CHUPPA"
  );
  const galleryDance = await saveGalleryFiles(
    galleryFilesDance,
    "gallery-dance",
    "DANCE"
  );
  const galleryFood = await saveGalleryFiles(
    galleryFilesFood,
    "gallery-food",
    "FOOD"
  );

  const galleryImages = [
    ...galleryHall,
    ...galleryChuppa,
    ...galleryDance,
    ...galleryFood,
  ];
  const galleryImagePaths = galleryImages.map((img) => img.url);

  let venue = await prisma.venue.create({
    data: {
      ownerId: user.id,
      name,
      city,
      address,
      minGuests: toIntOrNull(minGuests),
      maxGuests: toIntOrNull(maxGuests),
      minPrice: toIntOrNull(minPrice),
      maxPrice: toIntOrNull(maxPrice),
      hallRentalMin: toIntOrNull(hallRentalMin),
      hallRentalMax: toIntOrNull(hallRentalMax),
      description: descCheck.value,
      eventTypes: eventTypes.length > 0 ? JSON.stringify(eventTypes) : null,
      hasChuppa: finalHasChuppa,
      hasFood: finalHasFood,
      hasDanceFloor,
      hasTableSetup,
      hasSoundSystem,
      hasBridalRoom,
      hasChuppaOutdoor,
      hasChuppaCovered,
      hasVeganFood,
      kashrut: foodChk.value,
      coverImageUrl: coverImagePath,
      galleryImageUrls:
        galleryImagePaths.length > 0 ? JSON.stringify(galleryImagePaths) : null,
      autoReplyMessage: autoChk.value,
    },
  });

  try {
    await persistCustomAmenitiesJson(venue.id, customAmenitiesJson);
  } catch (e) {
    console.error("persistCustomAmenitiesJson (create):", e);
    await prisma.venue.delete({ where: { id: venue.id } });
    return NextResponse.json(
      {
        error:
          "שמירת מאפיינים מותאמים נכשלה. הרץ בטרמינל: npx prisma db push && npx prisma generate (עצור קודם את שרת הפיתוח).",
      },
      { status: 500 }
    );
  }

  venue = await prisma.venue.update({
    where: { id: venue.id },
    data: { latitude: coordsNew.lat, longitude: coordsNew.lng },
  });

  if (galleryImages.length > 0) {
    await prisma.venueGalleryImage.createMany({
      data: galleryImages.map((img) => ({
        venueId: venue.id,
        url: img.url,
        category: img.category,
      })),
    });
  }

  // התראה למחפשים שכבר מתעניינים באולמות בעיר הזו (מועדפים / פניות קודמות).
  const seekers = await prisma.user.findMany({
    where: {
      role: "SEEKER",
      OR: [
        { favorites: { some: { venue: { city: venue.city } } } },
        { inquiriesSent: { some: { venue: { city: venue.city } } } },
      ],
    },
    select: { id: true },
  });
  await Promise.all(
    seekers.map((s) =>
      createNotification({
        userId: s.id,
        type: "NEW_VENUE_IN_CITY",
        title: "אולם חדש בעיר שלך",
        body: `נוסף אולם חדש בעיר ${venue.city}: "${venue.name}".`,
        href: "/halls",
      })
    )
  );

  return NextResponse.json({ venue }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const idParam = searchParams.get("id");

  if (!idParam) {
    return NextResponse.json({ error: "Missing venue id" }, { status: 400 });
  }

  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid venue id" }, { status: 400 });
  }

  const existing = await prisma.venue.findUnique({
    where: { id },
    select: { id: true, ownerId: true },
  });

  if (!existing || existing.ownerId !== user.id) {
    return NextResponse.json(
      { error: "Venue not found for this user" },
      { status: 404 }
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.inquiry.deleteMany({ where: { venueId: id } });
      await tx.favorite.deleteMany({ where: { venueId: id } });
      await tx.venueReview.deleteMany({ where: { venueId: id } });
      await tx.venueAvailability.deleteMany({ where: { venueId: id } });
      // שיחות צ'אט על האולם — Message נמחק בקסקדה עם Conversation
      await tx.conversation.deleteMany({ where: { venueId: id } });
      // EventPackage, VenueGalleryImage, VenuePageView: onDelete Cascade בסכמה
      await tx.venue.delete({ where: { id } });
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      return NextResponse.json(
        {
          error:
            "לא ניתן למחוק את האולם — עדיין יש נתונים מקושרים. נסו שוב או פנו לתמיכה.",
        },
        { status: 409 }
      );
    }
    throw e;
  }

  return NextResponse.json({ ok: true });
}

async function saveUploadedFile(
  file: File | null,
  uploadsDir: string,
  prefix: string
): Promise<string | null> {
  if (!file || file.size === 0) return null;
  const ext =
    (file.type && file.type.includes("jpeg")) || file.name.endsWith(".jpg")
      ? ".jpg"
      : file.name.endsWith(".png")
        ? ".png"
        : file.name.endsWith(".webp")
          ? ".webp"
          : "";
  const randomName = `${prefix}-${crypto.randomUUID()}${ext}`;
  const filePath = path.join(uploadsDir, randomName);
  const arrayBuffer = await file.arrayBuffer();
  await writeFile(filePath, Buffer.from(arrayBuffer));
  return `/uploads/${randomName}`;
}

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const idParam = searchParams.get("id");
  if (!idParam) {
    return NextResponse.json({ error: "Missing venue id" }, { status: 400 });
  }
  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid venue id" }, { status: 400 });
  }

  const existing = await prisma.venue.findUnique({
    where: { id },
  });
  if (!existing || existing.ownerId !== user.id) {
    return NextResponse.json(
      { error: "Venue not found for this user" },
      { status: 404 }
    );
  }

  const formData = await req.formData();
  const name = (formData.get("name") as string | null)?.trim() ?? existing.name;
  const city = (formData.get("city") as string | null)?.trim() ?? existing.city;
  const address =
    (formData.get("address") as string | null)?.trim() ?? existing.address;
  const minGuests = formData.get("minGuests") as string | null;
  const maxGuests = formData.get("maxGuests") as string | null;
  const minPrice = formData.get("minPrice") as string | null;
  const maxPrice = formData.get("maxPrice") as string | null;
  const hallRentalMin = formData.get("hallRentalMin") as string | null;
  const hallRentalMax = formData.get("hallRentalMax") as string | null;
  const description = (formData.get("description") as string | null)?.trim();
  const autoReplyMessage =
    (formData.get("autoReplyMessage") as string | null)?.trim() || null;
  const hasChuppa = toBool(formData.get("hasChuppa"));
  const hasFood = toBool(formData.get("hasFood"));
  const hasDanceFloor = toBool(formData.get("hasDanceFloor"));
  const hasTableSetup = toBool(formData.get("hasTableSetup"));
  const hasSoundSystem = toBool(formData.get("hasSoundSystem"));
  const hasBridalRoom = toBool(formData.get("hasBridalRoom"));
  const hasChuppaOutdoor = toBool(formData.get("hasChuppaOutdoor"));
  const hasChuppaCovered = toBool(formData.get("hasChuppaCovered"));
  const hasVeganFood = toBool(formData.get("hasVeganFood"));
  if (formDataJsonStringTooLong(formData.get("eventTypes"), USER_INPUT_MAX.JSON_FORM_FIELD)) {
    return badRequest("נתוני סוגי אירוע ארוכים מדי");
  }
  const eventTypes = parseEventTypes(formData.get("eventTypes"));
  const amenitiesParsed = parseCustomAmenitiesJson(
    formData.get("customAmenitiesJson")
  );
  if (amenitiesParsed.error) {
    return NextResponse.json({ error: amenitiesParsed.error }, { status: 400 });
  }
  const customAmenitiesJson = amenitiesParsed.json;

  const nameCheck = validateRequiredText(
    name ?? "",
    USER_INPUT_MAX.VENUE_OR_SERVICE_NAME,
    1,
    "שם האולם"
  );
  if (!nameCheck.ok) return badRequest(nameCheck.error);
  const cityCheck = validateRequiredText(city ?? "", USER_INPUT_MAX.CITY, 1, "עיר");
  if (!cityCheck.ok) return badRequest(cityCheck.error);
  const addrCheck = validateRequiredText(
    address ?? "",
    USER_INPUT_MAX.ADDRESS,
    1,
    "כתובת"
  );
  if (!addrCheck.ok) return badRequest(addrCheck.error);

  let descriptionOut: string | null = existing.description;
  if (description !== undefined) {
    const dch = validateOptionalLongText(
      description ?? null,
      USER_INPUT_MAX.DESCRIPTION_LONG,
      "תיאור"
    );
    if (!dch.ok) return badRequest(dch.error);
    descriptionOut = dch.value;
  }

  const autoChk = validateOptionalLongText(
    autoReplyMessage,
    USER_INPUT_MAX.AUTO_REPLY,
    "מענה אוטומטי"
  );
  if (!autoChk.ok) return badRequest(autoChk.error);
  const foodChk = validateOptionalShortText(
    (formData.get("foodKashrut") as string | null)?.trim() || null,
    USER_INPUT_MAX.FOOD_KASHRUT,
    "כשרות"
  );
  if (!foodChk.ok) return badRequest(foodChk.error);
  const autoReplyOut = autoChk.value;

  const gErrPut = validateGuestRange(toIntOrNull(minGuests), toIntOrNull(maxGuests));
  if (gErrPut) return badRequest(gErrPut);
  const pErrPut = validatePriceMinMax(toIntOrNull(minPrice), toIntOrNull(maxPrice));
  if (pErrPut) return badRequest(pErrPut);
  const hErrPut = validatePriceMinMax(
    toIntOrNull(hallRentalMin),
    toIntOrNull(hallRentalMax)
  );
  if (hErrPut) return badRequest(hErrPut);

  const pickedLatitude = toFloatOrNull(formData.get("latitude"));
  const pickedLongitude = toFloatOrNull(formData.get("longitude"));
  const hasWedding = eventTypes.includes("חתונה");
  const finalHasChuppa = hasWedding ? true : hasChuppa;
  /** אוכל לחתונה משתמע מסוג האירוע; hasFood = מציעים אוכל גם באירועים שאינם חתונה */
  const finalHasFood = hasFood;

  if (hasWedding && !hasChuppaOutdoor && !hasChuppaCovered) {
    return NextResponse.json(
      { error: "נא לסמן לפחות אחד: חופה בחוץ או חופה מקורה." },
      { status: 400 }
    );
  }

  const addressOrCityChanged =
    city !== existing.city || address !== existing.address;
  const hasPickedCoords =
    pickedLatitude != null &&
    pickedLongitude != null &&
    pickedLatitude >= 29 &&
    pickedLatitude <= 34 &&
    pickedLongitude >= 33 &&
    pickedLongitude <= 36;

  const coverImageFile = formData.get("coverImage") as File | null;
  const galleryFilesHall = formData.getAll("galleryImagesHALL") as File[];
  const galleryFilesChuppa = formData.getAll("galleryImagesCHUPPA") as File[];
  const galleryFilesDance = formData.getAll("galleryImagesDANCE") as File[];
  const galleryFilesFood = formData.getAll("galleryImagesFOOD") as File[];
  const galleryFilesLegacy = formData.getAll("galleryImages") as File[];

  const shouldReplaceGalleryPut =
    galleryFilesHall.length > 0 ||
    galleryFilesChuppa.length > 0 ||
    galleryFilesDance.length > 0 ||
    galleryFilesFood.length > 0 ||
    galleryFilesLegacy.length > 0;
  const galleryHallFilesPut =
    galleryFilesHall.length > 0 || galleryFilesLegacy.length > 0
      ? galleryFilesHall.length > 0
        ? galleryFilesHall
        : galleryFilesLegacy
      : [];
  if (shouldReplaceGalleryPut) {
    const totalPut =
      galleryHallFilesPut.length +
      galleryFilesChuppa.length +
      galleryFilesDance.length +
      galleryFilesFood.length;
    if (totalPut > USER_INPUT_MAX.MAX_VENUE_GALLERY_FILES_TOTAL) {
      return badRequest("יותר מדי תמונות בגלריה");
    }
    for (const f of [
      ...galleryHallFilesPut,
      ...galleryFilesChuppa,
      ...galleryFilesDance,
      ...galleryFilesFood,
    ]) {
      if (f instanceof File && f.size > 0) {
        const ie = validateUploadedImageFile(f);
        if (ie) return badRequest(ie);
      }
    }
  }
  if (coverImageFile && coverImageFile.size > 0) {
    const ie = validateUploadedImageFile(coverImageFile);
    if (ie) return badRequest(ie);
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });

  let coverImageUrl = existing.coverImageUrl;
  if (coverImageFile && coverImageFile.size > 0) {
    const saved = await saveUploadedFile(
      coverImageFile as File,
      uploadsDir,
      "cover"
    );
    if (saved) coverImageUrl = saved;
  }

  let galleryImageUrls = existing.galleryImageUrls;

  if (shouldReplaceGalleryPut) {
    // מוחקים ומחליפים את כל התמונות עבור האולם
    await prisma.venueGalleryImage.deleteMany({ where: { venueId: id } });

    const imagesToCreate: { url: string; category: string }[] = [];

    async function saveUploadedGalleryFiles(
      files: File[],
      prefix: string,
      category: string
    ) {
      for (const [index, file] of files.entries()) {
        const saved = await saveUploadedFile(
          file as File,
          uploadsDir,
          `${prefix}-${index}`
        );
        if (saved) imagesToCreate.push({ url: saved, category });
      }
    }

    await saveUploadedGalleryFiles(galleryHallFilesPut, "gallery-hall", "HALL");
    await saveUploadedGalleryFiles(galleryFilesChuppa, "gallery-chuppa", "CHUPPA");
    await saveUploadedGalleryFiles(galleryFilesDance, "gallery-dance", "DANCE");
    await saveUploadedGalleryFiles(galleryFilesFood, "gallery-food", "FOOD");

    const paths = imagesToCreate.map((img) => img.url);
    galleryImageUrls =
      paths.length > 0 ? JSON.stringify(paths) : existing.galleryImageUrls;

    if (imagesToCreate.length > 0) {
      await prisma.venueGalleryImage.createMany({
        data: imagesToCreate.map((img) => ({
          venueId: id,
          url: img.url,
          category: img.category,
        })),
      });
    }
  }

  let coordPatch: { latitude: number | null; longitude: number | null } | undefined;
  if (hasPickedCoords) {
    coordPatch = {
      latitude: pickedLatitude,
      longitude: pickedLongitude,
    };
  } else if (addressOrCityChanged) {
    const coords = await geocodeIsraelAddress(address, city);
    if (!coords) {
      return NextResponse.json(
        {
          error:
            "הכתובת לא זוהתה. נא להזין כתובת אמיתית בישראל בפורמט רחוב ומספר, ולבחור עיר נכונה.",
        },
        { status: 400 }
      );
    }
    coordPatch = {
      latitude: coords.lat,
      longitude: coords.lng,
    };
  }

  const venue = await prisma.venue.update({
    where: { id },
    data: {
      name,
      city,
      address,
      minGuests: toIntOrNull(minGuests),
      maxGuests: toIntOrNull(maxGuests),
      minPrice: toIntOrNull(minPrice),
      maxPrice: toIntOrNull(maxPrice),
      hallRentalMin: toIntOrNull(hallRentalMin),
      hallRentalMax: toIntOrNull(hallRentalMax),
      description: descriptionOut,
      eventTypes: eventTypes.length > 0 ? JSON.stringify(eventTypes) : null,
      hasChuppa: finalHasChuppa,
      hasFood: finalHasFood,
      hasDanceFloor,
      hasTableSetup,
      hasSoundSystem,
      hasBridalRoom,
      hasChuppaOutdoor,
      hasChuppaCovered,
      hasVeganFood,
      kashrut: foodChk.value,
      coverImageUrl,
      galleryImageUrls,
      autoReplyMessage: autoReplyOut,
      ...(coordPatch ?? {}),
    },
  });

  try {
    await persistCustomAmenitiesJson(id, customAmenitiesJson);
  } catch (e) {
    console.error("persistCustomAmenitiesJson (update):", e);
    return NextResponse.json(
      {
        error:
          "שמירת מאפיינים מותאמים נכשלה. הרץ בטרמינל: npx prisma db push && npx prisma generate (עצור קודם את שרת הפיתוח).",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ venue });
}
