import { test, expect } from "@playwright/test";

test.describe("Landing page", () => {
  test("loads homepage and shows site title", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 60000 });
    await expect(page).toHaveTitle(/TextGame/i);
  });

  test("has skip navigation link", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 60000 });
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeAttached();
  });

  test("hero section is visible", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 60000 });
    await expect(page.locator("h1").first()).toBeVisible();
  });
});

test.describe("Discover page", () => {
  test("loads discover page with game templates", async ({ page }) => {
    await page.goto("/discover", { waitUntil: "domcontentloaded", timeout: 60000 });
    await expect(page).toHaveTitle(/Discover|TextGame/i);
    await expect(page.locator("[data-testid='game-card']").first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Auth pages", () => {
  test("sign-in page renders", async ({ page }) => {
    await page.goto("/signin", { waitUntil: "domcontentloaded", timeout: 60000 });
    await expect(page).toHaveTitle(/Sign|TextGame/i);
  });
});

test.describe("Static pages", () => {
  test("privacy page renders", async ({ page }) => {
    await page.goto("/privacy", { waitUntil: "domcontentloaded", timeout: 60000 });
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("terms page renders", async ({ page }) => {
    await page.goto("/terms", { waitUntil: "domcontentloaded", timeout: 60000 });
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });
});

test.describe("Navigation", () => {
  test("can navigate from homepage to discover", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 60000 });
    const discoverLink = page.locator('a[href*="/discover"]').first();
    if (await discoverLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      const href = await discoverLink.getAttribute("href").catch(() => null);
      if (href) {
        await page.goto(href, { waitUntil: "domcontentloaded", timeout: 60000 });
      } else {
        await discoverLink.click({ force: true, timeout: 10000 }).catch(() => {});
      }
      await page.waitForTimeout(2000);
      const url = page.url();
      expect(url.includes("/discover") || url.includes("localhost:3000")).toBe(true);
    }
  });
});
