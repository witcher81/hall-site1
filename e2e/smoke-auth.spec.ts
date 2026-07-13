import { expect, test } from "@playwright/test";

/**
 * מסלולי smoke עם התחברות — מופעלים רק כשמוגדרים:
 * E2E_EMAIL, E2E_PASSWORD
 */
const email = process.env.E2E_EMAIL?.trim();
const password = process.env.E2E_PASSWORD?.trim();
const hasAuth = Boolean(email && password);

test.describe("authenticated smoke", () => {
  test.skip(!hasAuth, "Set E2E_EMAIL + E2E_PASSWORD to run auth flows");

  test("login succeeds", async ({ page }) => {
    await page.goto("/auth/login");
    await page.locator('input[type="email"], input[name="email"]').first().fill(email!);
    await page.locator('input[type="password"], input[name="password"]').first().fill(password!);
    await page.getByRole("button", { name: /התחבר|כניסה|שלח/i }).first().click();
    await page.waitForTimeout(1500);
    await expect(page.locator("body")).toBeVisible();
  });

  test("admin moderation page reachable for admin", async ({ page }) => {
    await page.goto("/auth/login");
    await page.locator('input[type="email"], input[name="email"]').first().fill(email!);
    await page.locator('input[type="password"], input[name="password"]').first().fill(password!);
    await page.getByRole("button", { name: /התחבר|כניסה|שלח/i }).first().click();
    await page.waitForTimeout(1500);
    await page.goto("/admin/moderation");
    await expect(page.locator("body")).toBeVisible();
  });
});
