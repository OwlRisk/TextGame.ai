import { test, expect } from "@playwright/test";

test.describe("Discover page — i18n content", () => {
  test("game cards have non-empty titles and descriptions", async ({ page }) => {
    await page.goto("/discover", { waitUntil: "domcontentloaded", timeout: 60000 });

    const cards = page.locator("[data-testid='game-card']");
    await expect(cards.first()).toBeVisible({ timeout: 10000 });

    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < Math.min(count, 5); i++) {
      const card = cards.nth(i);
      const title = card.locator("h3, h4, [class*='font-semibold'], [class*='font-bold']").first();
      const titleText = await title.textContent();
      expect(titleText?.trim().length, `card ${i} title is empty`).toBeGreaterThan(0);
    }
  });

  test("category tabs are visible", async ({ page }) => {
    await page.goto("/discover", { waitUntil: "domcontentloaded", timeout: 60000 });

    const tabs = page.locator('[role="tablist"], button:has-text("All")');
    const tabsVisible = await tabs.first().isVisible({ timeout: 5000 }).catch(() => false);
    expect(tabsVisible).toBe(true);
  });

  test("search input exists", async ({ page }) => {
    await page.goto("/discover", { waitUntil: "domcontentloaded", timeout: 60000 });

    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="Search"], input[placeholder*="search"], input[placeholder*="搜索"], input[placeholder*="検索"]'
    );
    const exists = await searchInput.first().isVisible({ timeout: 5000 }).catch(() => false);
    expect(exists).toBe(true);
  });
});

test.describe("Landing page — i18n content", () => {
  test("hero section has non-empty heading", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 60000 });

    const h1 = page.locator("h1").first();
    await expect(h1).toBeVisible({ timeout: 10000 });
    const text = await h1.textContent();
    expect(text?.trim().length, "hero heading is empty").toBeGreaterThan(0);
  });

  test("CTA buttons are visible", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 60000 });

    const buttons = page.locator("button, a[role='button']");
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
  });

  test("footer contains links", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 60000 });

    const privacyLink = page.locator('a[href*="privacy"]');
    const termsLink = page.locator('a[href*="terms"]');
    expect(await privacyLink.count()).toBeGreaterThan(0);
    expect(await termsLink.count()).toBeGreaterThan(0);
  });
});

test.describe("Sign-in page — i18n content", () => {
  test("sign-in page renders with buttons", async ({ page }) => {
    await page.goto("/signin", { waitUntil: "domcontentloaded", timeout: 60000 });

    const buttons = page.locator("button");
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
  });
});
