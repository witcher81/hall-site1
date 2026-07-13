import { expect, test } from "@playwright/test";

/**
 * Smoke E2E — מסלולים ציבוריים שלא דורשים התחברות.
 * מסלולי auth: smoke-auth.spec.ts (מופעלים עם E2E_EMAIL).
 */

async function gotoReady(page: import("@playwright/test").Page, path: string) {
  const res = await page.goto(path, { waitUntil: "domcontentloaded" });
  expect(res).toBeTruthy();
  await expect(page.locator("body")).toBeVisible();
  return res!;
}

test.describe("public smoke", () => {
  test("health API responds", async ({ request }) => {
    const res = await request.get("/api/health");
    expect([200, 503]).toContain(res.status());
    const body = await res.json();
    expect(body).toHaveProperty("ok");
    expect(body).toHaveProperty("production");
  });

  test("home page loads", async ({ page }) => {
    await gotoReady(page, "/");
  });

  test("halls search page loads and includes bachelor event type", async ({
    page,
  }) => {
    const res = await page.goto("/halls", { waitUntil: "networkidle" });
    expect(res).toBeTruthy();
    const openFilters = page.getByRole("button", { name: /פתח מסננים/i });
    await expect(openFilters).toBeVisible();
    await openFilters.click();
    await expect(page.getByRole("button", { name: /סגור מסננים/i })).toBeVisible();
    await expect(
      page.locator("option", { hasText: "מסיבת רווקים / רווקות" }).first()
    ).toBeAttached();
  });

  test("packages search page loads", async ({ page }) => {
    await gotoReady(page, "/packages");
  });

  test("auth login page loads", async ({ page }) => {
    await gotoReady(page, "/auth/login");
    await expect(
      page.locator('input[type="email"], input[name="email"]').first()
    ).toBeVisible();
  });

  test("auth register page loads", async ({ page }) => {
    await gotoReady(page, "/auth/register");
  });

  test("freelancer new service page redirects or loads (auth gate)", async ({
    page,
  }) => {
    await gotoReady(page, "/dashboard/freelancer/services/new");
  });

  test("venue owner new venue page redirects or loads (auth gate)", async ({
    page,
  }) => {
    await gotoReady(page, "/dashboard/venue-owner/venues/new");
  });
});
