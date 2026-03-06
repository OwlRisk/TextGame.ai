import { test, expect, type Page } from "@playwright/test";

test.describe("Discover → Game Template Selection", () => {
  test("can browse game templates on discover page", async ({ page }) => {
    await page.goto("/discover");
    await page.waitForLoadState("networkidle");

    const cards = page.locator("a[href*='/games/'], [data-testid='game-card']");
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test("can click a game template to view details", async ({ page }) => {
    await page.goto("/discover");
    await page.waitForLoadState("networkidle");

    const firstCard = page.locator("a[href*='/games/']").first();
    if (await firstCard.isVisible()) {
      await firstCard.click();
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveURL(/\/games\//);
      await expect(page.locator("h1, h2").first()).toBeVisible();
    }
  });

  test("discover page has search or filter functionality", async ({ page }) => {
    await page.goto("/discover");
    await page.waitForLoadState("networkidle");

    const searchOrFilter = page.locator(
      'input[type="search"], input[placeholder*="Search"], input[placeholder*="search"], [role="tablist"], button:has-text("All")'
    );
    const count = await searchOrFilter.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe("Game Master (GM) Interface", () => {
  test("GM page loads for unauthenticated users and shows sign-in prompt or GM interface", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const gmButton = page.locator('a[href*="/create"], button:has-text("Create"), a:has-text("Create")').first();
    if (await gmButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await gmButton.click();
      await page.waitForLoadState("networkidle");

      const hasContent = await page.locator("h1, h2, textarea, [contenteditable]").first().isVisible({ timeout: 10000 }).catch(() => false);
      expect(hasContent).toBe(true);
    }
  });
});

test.describe("Responsive Layout", () => {
  test("landing page is responsive on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("h1").first()).toBeVisible();
    const hero = page.locator("h1").first();
    const box = await hero.boundingBox();
    expect(box).toBeTruthy();
    if (box) {
      expect(box.width).toBeLessThanOrEqual(375);
    }
  });

  test("discover page is responsive on tablet viewport", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/discover");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("h1, h2").first()).toBeVisible();
  });
});

test.describe("Accessibility - Keyboard Navigation", () => {
  test("can tab through main navigation links on landing page", async ({ page }) => {
    await page.goto("/");

    await page.keyboard.press("Tab");
    const firstFocused = await page.evaluate(() => document.activeElement?.tagName);
    expect(firstFocused).toBeTruthy();

    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    const thirdFocused = await page.evaluate(() => {
      const el = document.activeElement;
      return el ? { tag: el.tagName, href: el.getAttribute("href") } : null;
    });
    expect(thirdFocused).toBeTruthy();
  });

  test("skip navigation link works", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const skipLink = page.locator('a[href="#main-content"]');

    if (await skipLink.evaluate((el) => el === document.activeElement)) {
      await page.keyboard.press("Enter");
      const mainContent = page.locator("#main-content");
      await expect(mainContent).toBeAttached();
    }
  });
});

test.describe("Error handling", () => {
  test("404 page for non-existent routes", async ({ page }) => {
    const response = await page.goto("/this-route-does-not-exist-12345");
    expect(response?.status()).toBe(404);
  });

  test("non-existent game shows appropriate error or redirect", async ({ page }) => {
    await page.goto("/game/non-existent-game-id-99999");
    await page.waitForLoadState("networkidle");

    const hasErrorOrRedirect =
      page.url().includes("/signin") ||
      page.url().includes("/discover") ||
      (await page.locator("text=/not found|error|sign in/i").first().isVisible({ timeout: 5000 }).catch(() => false));

    expect(hasErrorOrRedirect).toBe(true);
  });
});

test.describe("Cookie Consent", () => {
  test("cookie consent banner does not appear for non-EEA users", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await page.waitForTimeout(2000);
    const banner = page.locator('text=/cookie|Cookie/i');
    const bannerVisible = await banner.first().isVisible({ timeout: 2000 }).catch(() => false);
    // Non-EEA users (localhost) should NOT see the banner
    expect(bannerVisible).toBe(false);
  });
});

test.describe("API Health", () => {
  test("avatar API health check returns config status", async ({ request }) => {
    const response = await request.get("/api/avatar");
    expect(response.status()).toBe(200);
    const json = await response.json();
    expect(json).toHaveProperty("model");
  });
});

test.describe("SEO", () => {
  test("landing page has proper meta tags", async ({ page }) => {
    await page.goto("/");

    const title = await page.title();
    expect(title.length).toBeGreaterThan(10);

    const description = await page.locator('meta[name="description"]').getAttribute("content");
    expect(description).toBeTruthy();
    expect(description!.length).toBeGreaterThan(50);
  });

  test("discover page has Open Graph tags", async ({ page }) => {
    await page.goto("/discover");

    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute("content");
    expect(ogTitle).toBeTruthy();

    const ogDescription = await page.locator('meta[property="og:description"]').getAttribute("content");
    expect(ogDescription).toBeTruthy();
  });
});
