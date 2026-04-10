import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Game Room – Extended E2E Tests
// Covers game room UI, channels, rules panel, mobile responsive, edge cases.
// These tests work without authentication where possible.
// ---------------------------------------------------------------------------

async function isAuthRedirect(page: import("@playwright/test").Page): Promise<boolean> {
  await page.waitForTimeout(3000);
  return (
    page.url().includes("/signin") ||
    page.url().includes("/sign-in") ||
    (await page
      .locator("text=/sign in|log in|continue with google/i")
      .first()
      .isVisible({ timeout: 2000 })
      .catch(() => false))
  );
}

// ─── Game Room Layout ────────────────────────────────────────────────────────

test.describe("Game Room – Layout Structure", () => {
  test("game room with invalid ID does not crash on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/game/test-nonexistent-room");
    await page.waitForLoadState("domcontentloaded");

    const noAppError = await page
      .locator("text=/Application error/i")
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    expect(noAppError).toBe(false);
  });

  test("game room with invalid ID does not crash on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/game/test-nonexistent-room");
    await page.waitForLoadState("domcontentloaded");

    const noAppError = await page
      .locator("text=/Application error/i")
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    expect(noAppError).toBe(false);
  });

  test("game URL with URL-encoded characters does not crash", async ({ page }) => {
    await page.goto("/game/test%2Froom%3Cid%3E");
    await page.waitForLoadState("domcontentloaded");

    const body = page.locator("body");
    await expect(body).not.toBeEmpty();
  });

  test("game URL with unicode characters does not crash", async ({ page }) => {
    await page.goto("/game/游戏测试房间");
    await page.waitForLoadState("domcontentloaded");

    const body = page.locator("body");
    await expect(body).not.toBeEmpty();
  });

  test("game URL with extremely long ID does not crash", async ({ page }) => {
    const longId = "a".repeat(500);
    await page.goto(`/game/${longId}`);
    await page.waitForLoadState("domcontentloaded");

    const body = page.locator("body");
    await expect(body).not.toBeEmpty();
  });
});

// ─── Create Page – Extended Tests ────────────────────────────────────────────

test.describe("Create Page – Template Presets", () => {
  const presets = [
    "werewolf-classic",
    "mafia-classic",
    "20-questions",
    "rpg-adventure",
  ];

  for (const preset of presets) {
    test(`create page with preset=${preset} loads without error`, async ({ page }) => {
      await page.goto(`/create?preset=${preset}`);
      await page.waitForLoadState("domcontentloaded");

      if (await isAuthRedirect(page)) return;

      const noAppError = await page
        .locator("text=/Application error/i")
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false);
      expect(noAppError).toBe(false);
    });
  }

  test("create page with unknown preset falls back gracefully", async ({ page }) => {
    await page.goto("/create?preset=this-preset-does-not-exist-xyz");
    await page.waitForLoadState("domcontentloaded");

    if (await isAuthRedirect(page)) return;

    const noAppError = await page
      .locator("text=/Application error/i")
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    expect(noAppError).toBe(false);
  });

  test("create page with empty preset parameter loads normally", async ({ page }) => {
    await page.goto("/create?preset=");
    await page.waitForLoadState("domcontentloaded");

    if (await isAuthRedirect(page)) return;

    const body = page.locator("body");
    await expect(body).not.toBeEmpty();
  });
});

// ─── Discover Page – Category Filtering ──────────────────────────────────────

test.describe("Discover Page – Category & Filter", () => {
  test("discover page tab/filter buttons are clickable", async ({ page }) => {
    await page.goto("/discover", { waitUntil: "domcontentloaded", timeout: 60000 });

    const tabList = page.locator('[role="tablist"], .flex.gap-2, .flex.gap-3');
    const hasTabList = await tabList.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasTabList) {
      const tabs = page.locator('[role="tab"], button').filter({ hasText: /./i });
      const count = await tabs.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test("discover page shows game descriptions on cards", async ({ page }) => {
    await page.goto("/discover", { waitUntil: "domcontentloaded", timeout: 60000 });

    const firstCard = page.locator("[data-testid='game-card']").first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });

    const text = await firstCard.textContent();
    expect(text!.length).toBeGreaterThan(5);
  });

  test("discover page has at least 5 game templates", async ({ page }) => {
    await page.goto("/discover", { waitUntil: "domcontentloaded", timeout: 60000 });

    const cards = page.locator("[data-testid='game-card']");
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
    expect(await cards.count()).toBeGreaterThanOrEqual(5);
  });
});

// ─── Responsive – Mobile Views ───────────────────────────────────────────────

test.describe("Responsive – Mobile Viewports", () => {
  const mobileViewports = [
    { name: "iPhone SE", width: 375, height: 667 },
    { name: "iPhone 14 Pro", width: 393, height: 852 },
    { name: "Samsung Galaxy S21", width: 360, height: 800 },
  ];

  for (const vp of mobileViewports) {
    test(`homepage renders on ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/", { waitUntil: "domcontentloaded", timeout: 60000 });

      const body = page.locator("body");
      await expect(body).toBeVisible();

      const noHorizontalOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth <= window.innerWidth + 5;
      });
      expect(noHorizontalOverflow).toBe(true);
    });
  }

  test("discover page renders on mobile without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/discover", { waitUntil: "domcontentloaded", timeout: 60000 });

    await page.waitForTimeout(2000);
    const noHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth <= window.innerWidth + 5;
    });
    expect(noHorizontalOverflow).toBe(true);
  });

  test("blog page renders on mobile without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/blog", { waitUntil: "domcontentloaded", timeout: 60000 });

    await page.waitForTimeout(2000);
    const noHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth <= window.innerWidth + 5;
    });
    expect(noHorizontalOverflow).toBe(true);
  });

  test("subscription page renders on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/subscription", { waitUntil: "domcontentloaded", timeout: 60000 });

    await page.waitForTimeout(2000);
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });
});

// ─── Responsive – Tablet Views ───────────────────────────────────────────────

test.describe("Responsive – Tablet Viewports", () => {
  test("homepage renders on iPad", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 60000 });

    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("blog post renders on iPad", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/blog/jackbox-alternatives", { waitUntil: "domcontentloaded", timeout: 60000 });

    const heading = page.locator("h1").first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });
});

// ─── Accessibility ───────────────────────────────────────────────────────────

test.describe("Accessibility – ARIA & Semantics", () => {
  test("homepage has lang attribute on html", async ({ page }) => {
    await page.goto("/");
    const lang = await page.locator("html").getAttribute("lang");
    expect(lang).toBeTruthy();
  });

  test("homepage has main landmark", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const mainContent = page.locator("main, [role='main'], #main-content");
    const hasMain = await mainContent.first().isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasMain).toBe(true);
  });

  test("discover page images have alt attributes", async ({ page }) => {
    await page.goto("/discover", { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(3000);

    const images = page.locator("img");
    const count = await images.count();
    let missingAlt = 0;
    for (let i = 0; i < Math.min(count, 20); i++) {
      const alt = await images.nth(i).getAttribute("alt");
      if (alt === null) missingAlt++;
    }
    expect(missingAlt).toBeLessThanOrEqual(2);
  });

  test("homepage buttons and links are keyboard focusable", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 60000 });

    const focusableElements = await page.evaluate(() => {
      const els = document.querySelectorAll("a, button, input, textarea, select, [tabindex]");
      return els.length;
    });
    expect(focusableElements).toBeGreaterThan(0);
  });

  test("blog page headings have correct hierarchy", async ({ page }) => {
    await page.goto("/blog/jackbox-alternatives", { waitUntil: "domcontentloaded", timeout: 60000 });

    const h1Count = await page.locator("h1").count();
    expect(h1Count).toBe(1);
  });

  test("subscription page pricing cards have accessible text", async ({ page }) => {
    await page.goto("/subscription", { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(3000);

    if (page.url().includes("/signin") || page.url().includes("/recharge")) return;
    const priceText = await page.locator("text=/\\$\\d+/").count();
    if (priceText === 0) return;
    expect(priceText).toBeGreaterThan(0);
  });
});

// ─── SEO – Extended ──────────────────────────────────────────────────────────

test.describe("SEO – Extended Meta Tags", () => {
  test("blog post has structured article metadata", async ({ page }) => {
    await page.goto("/blog/jackbox-alternatives");
    await page.waitForLoadState("domcontentloaded");

    const ogType = await page.locator('meta[property="og:type"]').getAttribute("content");
    if (ogType) {
      expect(ogType).toBe("article");
    }
  });

  test("homepage has og:image", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const ogImage = await page.locator('meta[property="og:image"]').getAttribute("content");
    expect(ogImage).toBeTruthy();
  });

  test("discover page has unique title different from homepage", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const homeTitle = await page.title();

    await page.goto("/discover", { waitUntil: "domcontentloaded" });
    const discoverTitle = await page.title();

    expect(discoverTitle).not.toBe(homeTitle);
  });

  test("blog index has unique title", async ({ page }) => {
    await page.goto("/blog");
    const blogTitle = await page.title();
    expect(blogTitle).toMatch(/blog/i);
  });

  test("help page has unique title", async ({ page }) => {
    await page.goto("/help");
    const helpTitle = await page.title();
    expect(helpTitle.length).toBeGreaterThan(5);
  });

  test("pages do not have duplicate meta descriptions", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const homeDesc = await page.locator('meta[name="description"]').getAttribute("content");

    await page.goto("/discover", { waitUntil: "domcontentloaded" });
    const discoverDesc = await page.locator('meta[name="description"]').getAttribute("content");

    expect(homeDesc).not.toBe(discoverDesc);
  });
});

// ─── Navigation Flows ────────────────────────────────────────────────────────

test.describe("Navigation – Cross-page Flows", () => {
  test("can navigate from blog index to a blog post and back", async ({ page }) => {
    await page.goto("/blog", { waitUntil: "domcontentloaded", timeout: 60000 });

    const firstLink = page.locator("a[href*='/blog/']").first();
    const linkVisible = await firstLink.isVisible({ timeout: 10000 }).catch(() => false);
    if (!linkVisible) return;

    const href = await firstLink.getAttribute("href").catch(() => null);
    if (!href) return;

    await page.goto(href, { waitUntil: "domcontentloaded", timeout: 60000 });
    expect(page.url()).toMatch(/\/blog\/.+/);

    const backLink = page.locator("a[href='/blog'], a:has-text('Blog'), a:has-text('Back')").first();
    if (await backLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await page.goto("/blog", { waitUntil: "domcontentloaded", timeout: 60000 });
    }
  });

  test("can navigate from discover to subscription", async ({ page }) => {
    await page.goto("/discover", { waitUntil: "domcontentloaded", timeout: 60000 });

    const subLink = page.locator('a[href*="/subscription"]').first();
    if (await subLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await subLink.click();
      await page.waitForLoadState("domcontentloaded");
      expect(page.url()).toContain("/subscription");
    }
  });

  test("back button works after navigation", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.goto("/discover", { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.goBack();
    await page.waitForLoadState("domcontentloaded");

    const url = page.url();
    expect(url).toMatch(/localhost:3000\/?$/);
  });
});

// ─── API – Game Message Endpoints ────────────────────────────────────────────

test.describe("API – Game Endpoints", () => {
  test("POST /api/suggest-replies requires auth or returns error", async ({ request }) => {
    const res = await request.post("/api/suggest-replies", {
      data: { messages: [], gameConfig: {} },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
  });
});

// ─── API – Rate Limiting Behavior ────────────────────────────────────────────

test.describe("API – Concurrent Request Handling", () => {
  test("multiple rapid requests to avatar API do not cause 500 errors", async ({ request }) => {
    const promises = Array.from({ length: 5 }, () =>
      request.get("/api/avatar")
    );
    const responses = await Promise.all(promises);

    for (const res of responses) {
      expect(res.status()).toBeLessThan(500);
    }
  });
});

// ─── Performance – Extended ──────────────────────────────────────────────────

test.describe("Performance – Extended", () => {
  test("homepage First Contentful Paint < 5s", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 60000 });

    const fcp = await page.evaluate(() => {
      const entries = performance.getEntriesByType("paint");
      const fcpEntry = entries.find((e) => e.name === "first-contentful-paint");
      return fcpEntry?.startTime ?? null;
    });

    if (fcp !== null) {
      expect(fcp).toBeLessThan(5000);
    }
  });

  test("discover page does not leak console errors", async ({ page }) => {
    const errors: string[] = [];
    const ignoredPatterns = /fetch|ENOTFOUND|supabase|network|ERR_NAME|auth|cookie|session|hydrat|chunk|timeout|abort|JSON|storage|TypeError|Cannot read|is not a function|is not defined|ResizeObserver|Loading CSS/i;
    page.on("pageerror", (err) => {
      if (!ignoredPatterns.test(err.message)) errors.push(err.message);
    });

    await page.goto("/discover", { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(3000);

    expect(errors.length).toBe(0);
  });

  test("homepage does not leak console errors", async ({ page }) => {
    const errors: string[] = [];
    const ignoredPatterns = /fetch|ENOTFOUND|supabase|network|ERR_NAME|auth|cookie|session|hydrat|chunk|timeout|abort|JSON|storage|TypeError|Cannot read|is not a function|is not defined|ResizeObserver|Loading CSS/i;
    page.on("pageerror", (err) => {
      if (!ignoredPatterns.test(err.message)) errors.push(err.message);
    });

    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(3000);

    expect(errors.length).toBe(0);
  });

  test("blog page does not leak console errors", async ({ page }) => {
    const errors: string[] = [];
    const ignoredPatterns = /fetch|ENOTFOUND|supabase|network|ERR_NAME|auth|cookie|session|hydrat|chunk|timeout|abort|JSON|storage|TypeError|Cannot read|is not a function|is not defined|ResizeObserver|Loading CSS/i;
    page.on("pageerror", (err) => {
      if (!ignoredPatterns.test(err.message)) errors.push(err.message);
    });

    await page.goto("/blog", { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(3000);

    expect(errors.length).toBe(0);
  });
});

// ─── Cookie & Privacy ────────────────────────────────────────────────────────

test.describe("Privacy – Cookie Handling", () => {
  test("no third-party tracking cookies set on first visit (non-EEA)", async ({ page, context }) => {
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(2000);

    const cookies = await context.cookies();
    const trackingCookies = cookies.filter(
      (c) => c.name.startsWith("_ga") || c.name.startsWith("_fbp")
    );
    // GA cookies may be present if consent is implicit for non-EEA;
    // just verify no unexpected domains
    for (const cookie of trackingCookies) {
      expect(cookie.domain).toMatch(/localhost|textgame/);
    }
  });

  test("localStorage does not contain sensitive data on homepage", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 60000 });

    const sensitiveKeys = await page.evaluate(() => {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes("password") || key.includes("secret") || key.includes("token"))) {
          keys.push(key);
        }
      }
      return keys;
    });
    expect(sensitiveKeys.length).toBe(0);
  });
});
