import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  sanitizeSocialLinksFromClient,
  serializeSocialLinks,
} from "@/lib/socialLinks";
import {
  sanitizeCustomIncludesFromClient,
  sanitizeIncludesNote,
  serializeCustomIncludesJson,
} from "@/lib/serviceIncludes";
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
    return serializeCustomIncludesJson(sanitizeCustomIncludesFromClient(data));
  } catch {
    return null;
  }
}

function parseGalleryJson(value: string | null): string[] {
  if (!value) return [];
  try {
    const arr = JSON.parse(value);
    if (!Array.isArray(arr)) return [];
    return arr.filter((x) => typeof x === "string" && x.length > 0);
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

  const formData = await req.formData();
  const name = (formData.get("name") as string | null)?.trim();
  const category = (formData.get("category") as string | null)?.trim() || null;
  const shortDescription =
    (formData.get("shortDescription") as string | null)?.trim() || null;
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
  const includesTravel = false;
  const includesEquipment = toBool(formData.get("includesEquipment"));
  const customIncludesJson = parseCustomIncludesFormField(
    formData.get("customIncludesJson")
  );
  const includesNote = parseIncludesNoteField(formData.get("includesNote"));
  const minPrice = toIntOrNull((formData.get("minPrice") as string | null) ?? null);
  const maxPrice = toIntOrNull((formData.get("maxPrice") as string | null) ?? null);
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });
  const coverImage = (formData.get("coverImage") as File | null) ?? null;
  const galleryFiles = formData.getAll("galleryImages") as File[];
  const coverImageUrl = await saveUploadedFile(coverImage, uploadsDir, "service-cover");
  const galleryImageUrls: string[] = [];
  for (const [index, file] of galleryFiles.entries()) {
    const saved = await saveUploadedFile(file, uploadsDir, `service-gallery-${index}`);
    if (saved) galleryImageUrls.push(saved);
  }

  if (!name) {
    return NextResponse.json(
      { error: "שם השירות חובה" },
      { status: 400 }
    );
  }

  const service = await prisma.service.create({
    data: {
      providerId: user.id,
      name,
      category,
      shortDescription,
      description,
      serviceArea,
      experienceYears,
      languages,
      responseTimeHint,
      socialLinksJson,
      includesTravel,
      includesEquipment,
      customIncludesJson,
      includesNote,
      coverImageUrl,
      galleryImageUrls:
        galleryImageUrls.length > 0 ? JSON.stringify(galleryImageUrls) : null,
      minPrice,
      maxPrice,
    },
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
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });

  const name = ((formData.get("name") as string | null)?.trim() ?? existing.name) || existing.name;
  const category =
    (formData.get("category") as string | null)?.trim() ?? existing.category;
  const shortDescription =
    (formData.get("shortDescription") as string | null)?.trim() ?? existing.shortDescription;
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
  const includesTravel = false;
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

  let coverImageUrl = existing.coverImageUrl;
  const coverImageFile = (formData.get("coverImage") as File | null) ?? null;
  if (coverImageFile && coverImageFile.size > 0) {
    const saved = await saveUploadedFile(coverImageFile, uploadsDir, "service-cover");
    if (saved) coverImageUrl = saved;
  }

  let galleryImageUrls = existing.galleryImageUrls;
  const existingGalleryRaw = (formData.get("existingGallery") as string | null) ?? null;
  if (existingGalleryRaw !== null) {
    galleryImageUrls =
      parseGalleryJson(existingGalleryRaw).length > 0
        ? JSON.stringify(parseGalleryJson(existingGalleryRaw))
        : null;
  }
  const galleryFiles = formData.getAll("galleryImages") as File[];
  if (galleryFiles.length > 0) {
    const current = parseGalleryJson(galleryImageUrls);
    for (const [index, file] of galleryFiles.entries()) {
      const saved = await saveUploadedFile(file, uploadsDir, `service-gallery-${index}`);
      if (saved) current.push(saved);
    }
    galleryImageUrls = current.length > 0 ? JSON.stringify(current) : null;
  }

  const service = await prisma.service.update({
    where: { id },
    data: {
      name,
      category,
      shortDescription,
      description,
      serviceArea,
      experienceYears,
      languages,
      responseTimeHint,
      socialLinksJson,
      includesTravel,
      includesEquipment,
      customIncludesJson,
      includesNote,
      coverImageUrl,
      galleryImageUrls,
      minPrice,
      maxPrice,
    },
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

  await prisma.service.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
