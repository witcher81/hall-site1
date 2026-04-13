import { put } from "@vercel/blob";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

function imageExt(file: File): string {
  if ((file.type && file.type.includes("jpeg")) || file.name.toLowerCase().endsWith(".jpg")) {
    return ".jpg";
  }
  if (file.name.toLowerCase().endsWith(".png")) return ".png";
  if (file.name.toLowerCase().endsWith(".webp")) return ".webp";
  return "";
}

/**
 * שומר תמונת אולם — בפרודקשן עם Vercel Blob (BLOB_READ_WRITE_TOKEN), בפיתוח ל־public/uploads.
 */
export async function saveVenueImageFile(
  file: File | null,
  namePrefix: string
): Promise<string | null> {
  if (!file || file.size === 0) return null;

  const ext = imageExt(file);
  const randomName = `${namePrefix}-${crypto.randomUUID()}${ext}`;
  const blobPath = `venues/${randomName}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(blobPath, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return blob.url;
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });
  const filePath = path.join(uploadsDir, randomName);
  const arrayBuffer = await file.arrayBuffer();
  await writeFile(filePath, Buffer.from(arrayBuffer));
  return `/uploads/${randomName}`;
}
