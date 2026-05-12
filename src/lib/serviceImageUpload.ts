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
 * שומר תמונה לשירות פרילנסר.
 * - אם מוגדר `BLOB_READ_WRITE_TOKEN` (בפרודקשן) → מעלה ל-Vercel Blob ומחזיר URL ציבורי.
 * - אחרת (פיתוח מקומי) → שומר ל-`public/uploads/` ומחזיר נתיב יחסי `/uploads/...`.
 *
 * חשוב: נקרא רק עבור קבצים שאינם ריקים (size > 0). הפונקציה לא מנסה
 * ליצור תיקייה אם אין מה לשמור — כדי לא לקרוס ב-serverless על EROFS.
 */
export async function saveServiceImageFile(
  file: File | null,
  namePrefix: string
): Promise<string | null> {
  if (!file || file.size === 0) return null;

  const ext = imageExt(file);
  const randomName = `${namePrefix}-${crypto.randomUUID()}${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`services/${randomName}`, file, {
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
