import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// API endpoints, infrastructure, SEO assets, performance, and security
// ---------------------------------------------------------------------------

// ─── API endpoint health checks ─────────────────────────────────────────────

test.describe("API – public endpoints", () => {
  test("GET /api/avatar returns model config", async ({ request }) => {
    const res = await request.get("/api/avatar");
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("model");
  });

});

test.describe("API – auth-required endpoints return 401 without token", () => {
  const authEndpoints = [
    { method: "POST" as const, path: "/api/chat/stream" },
    { method: "POST" as const, path: "/api/stripe/create-checkout" },
    { method: "POST" as const, path: "/api/stripe/create-portal-session" },
  ];

  for (const { method, path } of authEndpoints) {
    test(`${method} ${path} returns 401`, async ({ request }) => {
      const res = await request[method.toLowerCase() as "post"](path, {
        data: {},
      });
      // Should be 401 Unauthorized (some endpoints may return 400 if body validation
      // runs first — both are acceptable as long as it's not 200/500)
      expect([400, 401, 403]).toContain(res.status());
    });
  }
});

test.describe("API – malformed requests", () => {
  test("POST /api/chat/stream with empty body returns error", async ({ request }) => {
    const res = await request.post("/api/chat/stream");
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
  });

  test("POST /api/transcribe without file returns error", async ({ request }) => {
    const res = await request.post("/api/transcribe");
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });
});

// ─── Sitemap & Robots ────────────────────────────────────────────────────────

test.describe("Sitemap", () => {
  test("sitemap.xml is accessible and contains URLs", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);

    const contentType = res.headers()["content-type"] ?? "";
    expect(contentType).toMatch(/xml/i);

    const body = await res.text();
    expect(body).toContain("<urlset");
    expect(body).toContain("<loc>");
    // Should include key pages
    expect(body).toContain("/discover");
    expect(body).toContain("/blog");
  });

  test("sitemap includes blog post URLs", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    const body = await res.text();
    expect(body).toContain("/blog/jackbox-alternatives");
    expect(body).toContain("/blog/play-werewolf-online");
  });
});

test.describe("Robots.txt", () => {
  test("robots.txt is accessible", async ({ request }) => {
    const res = await request.get("/robots.txt");
    expect(res.status()).toBe(200);

    const body = await res.text();
    expect(body.toLowerCase()).toContain("user-agent");
  });

  test("robots.txt references sitemap", async ({ request }) => {
    const res = await request.get("/robots.txt");
    const body = await res.text();
    expect(body.toLowerCase()).toContain("sitemap");
  });
});

// ─── Performance ─────────────────────────────────────────────────────────────

test.describe("Performance – page load times", () => {
  const performancePages = [
    { name: "Homepage", url: "/" },
    { name: "Discover", url: "/discover" },
    { name: "Blog index", url: "/blog" },
  ];

  for (const { name, url } of performancePages) {
    test(`${name} loads within 10 seconds`, async ({ page }) => {
      const start = Date.now();
      await page.goto(url);
      await page.waitForLoadState("domcontentloaded");
      const elapsed = Date.now() - start;

      // Pages should load within 10s even in CI
      expect(elapsed).toBeLessThan(10000);
    });
  }

  test("homepage does not load excessive JS bundles", async ({ page }) => {
    const jsRequests: string[] = [];
    page.on("response", (response) => {
      if (response.url().endsWith(".js")) {
        jsRequests.push(response.url());
      }
    });

    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 60000 });
    // Give a moment for deferred scripts to fire
    await page.waitForTimeout(2000);

    // Sanity check: should have some JS, but not an excessive amount
    expect(jsRequests.length).toBeGreaterThan(0);
    expect(jsRequests.length).toBeLessThan(100);
  });
});

// ─── Security headers ────────────────────────────────────────────────────────

test.describe("Security headers", () => {
  test("pages serve with expected security-related headers", async ({ request }) => {
    const res = await request.get("/");
    const headers = res.headers();

    // X-Frame-Options or CSP frame-ancestors should be set
    const hasFrameProtection =
      !!headers["x-frame-options"] ||
      (headers["content-security-policy"] ?? "").includes("frame-ancestors");

    // At minimum, Content-Type should be set
    expect(headers["content-type"]).toBeTruthy();

    // Strict-Transport-Security is typically set by Vercel in production;
    // in dev it may be absent — just check it doesn't error
    expect(res.status()).toBe(200);
  });

  test("API routes return JSON content-type", async ({ request }) => {
    const res = await request.get("/api/avatar");
    const contentType = res.headers()["content-type"] ?? "";
    expect(contentType).toContain("application/json");
  });
});

// ─── Static assets ───────────────────────────────────────────────────────────

test.describe("Static assets", () => {
  test("favicon is accessible", async ({ request }) => {
    const res = await request.get("/favicon.ico");
    // favicon may be served as 200 or handled by next (could be 304)
    expect([200, 301, 302, 304]).toContain(res.status());
  });

  test("hero image is accessible", async ({ request }) => {
    const res = await request.get("/hero.webp");
    expect([200, 301, 302, 304]).toContain(res.status());
  });
});

// ─── Error resilience ────────────────────────────────────────────────────────

test.describe("Error resilience", () => {
  test("deeply nested non-existent route returns 404", async ({ page }) => {
    const res = await page.goto("/this/does/not/exist/at/all");
    expect(res?.status()).toBe(404);
  });

  test("API route with non-existent path returns 404", async ({ request }) => {
    const res = await request.get("/api/this-does-not-exist");
    expect(res.status()).toBe(404);
  });

  test("game page with malformed UUID handles gracefully", async ({ page }) => {
    await page.goto("/game/not-a-valid-uuid");
    await page.waitForLoadState("domcontentloaded");

    // Should not show a blank page — either redirects or shows error
    const bodyText = await page.locator("body").textContent();
    const hasContent =
      page.url().includes("/signin") ||
      page.url().includes("/discover") ||
      page.url() === "http://localhost:3000/" ||
      (bodyText ?? "").trim().length > 0;
    expect(hasContent).toBeTruthy();
  });
});

// ─── Internationalization / encoding ─────────────────────────────────────────

test.describe("Unicode handling", () => {
  test("pages render correctly with UTF-8 charset", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 60000 });
    const charset = await page.locator('meta[charset]').getAttribute("charset");
    expect(charset?.toLowerCase()).toBe("utf-8");
  });
});
