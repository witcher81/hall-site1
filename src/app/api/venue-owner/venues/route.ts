import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { geocodeIsraelAddress } from "@/lib/geocode";
import { createNotification } from "@/lib/notifications";
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
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((v) => (typeof v === "string" ? v.trim() : ""))
      .filter((v) => v.length > 0);
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

  const name = (formData.get("name") as string | null)?.trim();
  const city = (formData.get("city") as string | null)?.trim();
  const address = (formData.get("address") as string | null)?.trim();
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
  const foodKashrut = (formData.get("foodKashrut") as string | null)?.trim() || null;
  const eventTypes = parseEventTypes(formData.get("eventTypes"));
  const amenitiesParsed = parseCustomAmenitiesJson(
    formData.get("customAmenitiesJson")
  );
  if (amenitiesParsed.error) {
    return NextResponse.json({ error: amenitiesParsed.error }, { status: 400 });
  }
  const customAmenitiesJson = amenitiesParsed.json;
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

  if (!name || !city || !address) {
    return NextResponse.json(
      { error: "Name, city and address are required" },
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

    // נשמור ב־DB נתיב יחסי מה־public
    return `/uploads/${randomName}`;
  }

  const coverImageFile = formData.get("coverImage") as File | null;
  const galleryFilesHall = formData.getAll("galleryImagesHALL") as File[];
  const galleryFilesChuppa = formData.getAll("galleryImagesCHUPPA") as File[];
  const galleryFilesDance = formData.getAll("galleryImagesDANCE") as File[];
  const galleryFilesFood = formData.getAll("galleryImagesFOOD") as File[];
  // תמיכה אחורה (אם עדיין יש לקוח ששולח galleryImages בלי קטגוריה)
  const galleryFilesLegacy = formData.getAll("galleryImages") as File[];

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

  const galleryHallFilesToUse =
    galleryFilesHall.length > 0 || galleryFilesLegacy.length > 0
      ? galleryFilesHall.length > 0
        ? galleryFilesHall
        : galleryFilesLegacy
      : [];

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
      description: description || null,
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
      kashrut: foodKashrut,
      coverImageUrl: coverImagePath,
      galleryImageUrls:
        galleryImagePaths.length > 0 ? JSON.stringify(galleryImagePaths) : null,
      autoReplyMessage: autoReplyMessage || null,
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
  const foodKashrut = (formData.get("foodKashrut") as string | null)?.trim() || null;
  const eventTypes = parseEventTypes(formData.get("eventTypes"));
  const amenitiesParsed = parseCustomAmenitiesJson(
    formData.get("customAmenitiesJson")
  );
  if (amenitiesParsed.error) {
    return NextResponse.json({ error: amenitiesParsed.error }, { status: 400 });
  }
  const customAmenitiesJson = amenitiesParsed.json;
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

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });

  const coverImageFile = formData.get("coverImage") as File | null;
  const galleryFilesHall = formData.getAll("galleryImagesHALL") as File[];
  const galleryFilesChuppa = formData.getAll("galleryImagesCHUPPA") as File[];
  const galleryFilesDance = formData.getAll("galleryImagesDANCE") as File[];
  const galleryFilesFood = formData.getAll("galleryImagesFOOD") as File[];
  // תמיכה אחורה
  const galleryFilesLegacy = formData.getAll("galleryImages") as File[];

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
  const shouldReplaceGallery =
    galleryFilesHall.length > 0 ||
    galleryFilesChuppa.length > 0 ||
    galleryFilesDance.length > 0 ||
    galleryFilesFood.length > 0 ||
    galleryFilesLegacy.length > 0;

  if (shouldReplaceGallery) {
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

    const galleryHallFilesToUse =
      galleryFilesHall.length > 0 || galleryFilesLegacy.length > 0
        ? galleryFilesHall.length > 0
          ? galleryFilesHall
          : galleryFilesLegacy
        : [];

    await saveUploadedGalleryFiles(galleryHallFilesToUse, "gallery-hall", "HALL");
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
      description:
        description !== undefined && description !== null
          ? (description.trim() || null)
          : existing.description,
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
      kashrut: foodKashrut,
      coverImageUrl,
      galleryImageUrls,
      autoReplyMessage: autoReplyMessage || null,
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
