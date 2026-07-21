import { put } from "@vercel/blob";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

function imageExt(file: File): string {
  const name = (file.name || "").toLowerCase();
  if ((file.type && file.type.includes("jpeg")) || name.endsWith(".jpg")) {
    return ".jpg";
  }
  if (name.endsWith(".png")) return ".png";
  if (name.endsWith(".webp")) return ".webp";
  return "";
}

/**
 * תמונת פרופיל משתמש (לוגו / תמונה לספק).
 * אותו דפוס כמו serviceImageUpload — Blob בפרוד, public/uploads בלוקאל.
 */
export async function saveProfileImageFile(
  file: File | null,
  namePrefix: string
): Promise<string | null> {
  if (!file || file.size === 0) return null;

  const ext = imageExt(file);
  const randomName = `${namePrefix}-${crypto.randomUUID()}${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`profiles/${randomName}`, file, {
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
