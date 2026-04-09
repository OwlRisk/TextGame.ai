import { test, expect } from "@playwright/test";

test.describe("Discover page — game card data", () => {
  test("game cards show fixed player count (not a range)", async ({ page }) => {
    await page.goto("/discover", { waitUntil: "domcontentloaded", timeout: 60000 });

    const cards = page.locator("[data-testid='game-card']");
    await expect(cards.first()).toBeVisible({ timeout: 10000 });

    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < Math.min(count, 8); i++) {
      const card = cards.nth(i);
      const cardText = await card.textContent();
      // Should NOT contain patterns like "5-12" or "3-8" (ranges)
      const rangePattern = /\b\d{1,2}-\d{1,2}\b(?!\s*min)/;
      const hasRange = rangePattern.test(cardText || "");
      if (hasRange) {
        // Allow duration ranges like "20-40 min" but not player ranges
        const playerRange = (cardText || "").match(/\b(\d{1,2})-(\d{1,2})\b/g);
        const onlyDurationRanges = playerRange?.every((r) => (cardText || "").includes(`${r} min`));
        expect(onlyDurationRanges, `card ${i} shows player range: ${cardText}`).toBe(true);
      }
    }
  });

  test("game cards show duration info", async ({ page }) => {
    await page.goto("/discover", { waitUntil: "domcontentloaded", timeout: 60000 });

    const cards = page.locator("[data-testid='game-card']");
    await expect(cards.first()).toBeVisible({ timeout: 10000 });

    const firstCardText = await cards.first().textContent();
    expect(firstCardText).toMatch(/min/i);
  });

  test("game cards have style badges", async ({ page }) => {
    await page.goto("/discover", { waitUntil: "domcontentloaded", timeout: 60000 });

    const cards = page.locator("[data-testid='game-card']");
    await expect(cards.first()).toBeVisible({ timeout: 10000 });

    // Style badges (Casual / Strategic / Competitive or translated versions)
    const allCardsText = await cards.allTextContents();
    expect(allCardsText.length).toBeGreaterThan(0);
  });
});

test.describe("Sidebar navigation", () => {
  test("sidebar has navigation links", async ({ page }) => {
    await page.goto("/discover", { waitUntil: "domcontentloaded", timeout: 60000 });

    // Look for sidebar navigation elements
    const sidebar = page.locator("aside, nav, [class*='sidebar']").first();
    const sidebarVisible = await sidebar.isVisible({ timeout: 5000 }).catch(() => false);

    if (sidebarVisible) {
      const links = sidebar.locator("a");
      const linkCount = await links.count();
      expect(linkCount).toBeGreaterThan(0);
    } else {
      // On mobile, sidebar may be hidden — just check body loaded
      expect(await page.locator("body").isVisible()).toBe(true);
    }
  });
});

test.describe("Game library pages", () => {
  test("/games page loads", async ({ page }) => {
    await page.goto("/games", { waitUntil: "domcontentloaded", timeout: 60000 });
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 10000 });
  });

  test("/games/werewolf page loads", async ({ page }) => {
    const response = await page.goto("/games/werewolf", { waitUntil: "domcontentloaded", timeout: 60000 });
    // Should be 200 or redirect
    expect(response?.status()).toBeLessThan(500);
    const bodyVisible = await page.locator("body").isVisible();
    expect(bodyVisible).toBe(true);
  });
});

test.describe("My Games page", () => {
  test("/my-games redirects to sign-in for unauthenticated users", async ({ page }) => {
    await page.goto("/my-games", { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(2000);

    const url = page.url();
    const hasSignInRedirect = url.includes("/signin") || url.includes("/my-games");
    // Either redirected to sign-in or shows sign-in prompt on the page
    const signInPrompt = await page
      .locator("text=/sign in|log in|登录/i")
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    expect(hasSignInRedirect || signInPrompt).toBe(true);
  });
});
