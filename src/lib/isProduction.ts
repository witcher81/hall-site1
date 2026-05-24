/** פרודקשן (Vercel / NODE_ENV) — לשימוש ב-Edge ובשרת */
export function isProductionRuntime(): boolean {
  const vercel = process.env.VERCEL_ENV?.trim();
  if (vercel === "production") return true;
  if (vercel === "preview" || vercel === "development") return false;
  return process.env.NODE_ENV === "production";
}
