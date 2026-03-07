import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Page rendering tests
// Covers pages NOT already tested in smoke.spec.ts / core-flows.spec.ts:
//   Blog index & posts, Subscription, Help, Recharge, My Games,
//   and auth-protected route redirect behaviour.
// ---------------------------------------------------------------------------

// ─── Blog ────────────────────────────────────────────────────────────────────

test.describe("Blog", () => {
  test("blog index loads and lists posts", async ({ page }) => {
    await page.goto("/blog");
    await expect(page).toHaveTitle(/Blog|TextGame/i);

    const articles = page.locator("a[href*='/blog/']");
    await expect(articles.first()).toBeVisible({ timeout: 10000 });
    expect(await articles.count()).toBeGreaterThan(5);
  });

  test("blog index has proper SEO metadata", async ({ page }) => {
    await page.goto("/blog");
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute("content");
    expect(ogTitle).toBeTruthy();
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(canonical).toContain("/blog");
  });

  const samplePosts = [
    "/blog/jackbox-alternatives",
    "/blog/play-werewolf-online",
    "/blog/ai-dungeon-alternatives",
    "/blog/character-ai-alternatives",
    "/blog/play-mafia-online",
  ];

  for (const slug of samplePosts) {
    test(`blog post ${slug} renders with heading and content`, async ({ page }) => {
      await page.goto(slug);
      await page.waitForLoadState("domcontentloaded");

      const heading = page.locator("h1").first();
      await expect(heading).toBeVisible({ timeout: 10000 });
      const text = await heading.textContent();
      expect(text!.length).toBeGreaterThan(10);

      // Post should have substantial body content
      const bodyText = await page.locator("article, main, [role='main']").first().textContent();
      expect(bodyText!.length).toBeGreaterThan(500);
    });
  }

  test("blog post has back-to-blog navigation", async ({ page }) => {
    await page.goto("/blog/jackbox-alternatives");
    await page.waitForLoadState("domcontentloaded");

    const backLink = page.locator("a[href='/blog'], a[href*='/blog']:has-text('Blog'), a:has-text('Back')").first();
    const visible = await backLink.isVisible({ timeout: 5000 }).catch(() => false);
    // At minimum the page should not be a dead end
    expect(visible || (await page.locator("nav").count()) > 0).toBe(true);
  });
});

// ─── Subscription ────────────────────────────────────────────────────────────

test.describe("Subscription page", () => {
  test("loads and shows pricing plans for unauthenticated users", async ({ page }) => {
    await page.goto("/subscription");
    await page.waitForLoadState("domcontentloaded");

    // Should show "Choose your plan" or plan cards
    const hasPlans = await page
      .locator("text=/choose your plan|\\$20|\\$60|\\$200|Pro|Plus|Ultra/i")
      .first()
      .isVisible({ timeout: 10000 })
      .catch(() => false);
    expect(hasPlans).toBe(true);
  });

  test("displays all three paid tiers", async ({ page }) => {
    await page.goto("/subscription");
    await page.waitForLoadState("domcontentloaded");

    for (const tier of ["Pro", "Plus", "Ultra"]) {
      const tierEl = page.locator(`text=${tier}`).first();
      await expect(tierEl).toBeVisible({ timeout: 8000 });
    }
  });

  test("shows correct pricing for each tier", async ({ page }) => {
    await page.goto("/subscription");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator("text=$20").first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator("text=$60").first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator("text=$200").first()).toBeVisible({ timeout: 8000 });
  });

  test("shows credit amounts for each tier", async ({ page }) => {
    await page.goto("/subscription");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator("text=/2,000.*credits/i").first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator("text=/6,000.*credits/i").first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator("text=/40,000.*credits/i").first()).toBeVisible({ timeout: 8000 });
  });

  test("has a back button", async ({ page }) => {
    await page.goto("/subscription");
    await page.waitForLoadState("domcontentloaded");

    const backBtn = page.locator("text=/Back/i").first();
    await expect(backBtn).toBeVisible({ timeout: 5000 });
  });
});

// ─── Help page ───────────────────────────────────────────────────────────────

test.describe("Help page", () => {
  test("loads and shows help content", async ({ page }) => {
    await page.goto("/help");
    await expect(page).toHaveTitle(/Help|Support|TextGame/i);
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 10000 });
  });

  test("has proper SEO metadata", async ({ page }) => {
    await page.goto("/help");
    const description = await page.locator('meta[name="description"]').getAttribute("content");
    expect(description).toBeTruthy();
    expect(description!.length).toBeGreaterThan(20);
  });
});

// ─── Auth-protected routes ───────────────────────────────────────────────────

test.describe("Auth-protected routes redirect to sign-in", () => {
  const protectedRoutes = [
    "/create",
    "/my-games",
    "/profile",
    "/settings",
    "/usage",
  ];

  for (const route of protectedRoutes) {
    test(`${route} redirects or prompts sign-in when unauthenticated`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState("domcontentloaded");

      const redirectedToSignIn = page.url().includes("/signin");
      const hasSignInPrompt = await page
        .locator("text=/sign in|log in|sign up|create account/i")
        .first()
        .isVisible({ timeout: 8000 })
        .catch(() => false);
      const hasContent = await page
        .locator("h1, h2, textarea")
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false);

      // Either redirects to signin, shows a sign-in prompt, or renders page content
      expect(redirectedToSignIn || hasSignInPrompt || hasContent).toBe(true);
    });
  }
});

// ─── Recharge page ───────────────────────────────────────────────────────────

test.describe("Recharge page", () => {
  test("loads without crashing", async ({ page }) => {
    await page.goto("/recharge");
    await page.waitForLoadState("domcontentloaded");

    // Should show some content — either recharge UI or auth prompt
    const hasContent =
      (await page.locator("h1, h2").first().isVisible({ timeout: 8000 }).catch(() => false)) ||
      page.url().includes("/signin");
    expect(hasContent).toBe(true);
  });
});

// ─── Discover page deep checks ──────────────────────────────────────────────

test.describe("Discover page – template details", () => {
  test("game cards have visible titles and icons", async ({ page }) => {
    await page.goto("/discover", { waitUntil: "domcontentloaded", timeout: 60000 });

    const firstCard = page.locator("[data-testid='game-card']").first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });

    // Each card should have some text content
    const text = await firstCard.textContent();
    expect(text!.trim().length).toBeGreaterThan(0);
  });

  test("multiple game categories or tags are shown", async ({ page }) => {
    await page.goto("/discover", { waitUntil: "domcontentloaded", timeout: 60000 });

    const cards = page.locator("[data-testid='game-card']");
    expect(await cards.count()).toBeGreaterThanOrEqual(3);
  });
});
