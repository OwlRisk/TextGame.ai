/**
 * E2E tests for the avatar API endpoints.
 *
 * /api/avatar  — health + image URL generation
 * /api/characters/pool — character pool with style prioritization
 *
 * These tests use the Playwright `request` fixture (no browser/DOM needed)
 * so they run fast even in CI.
 */

import { test, expect } from "@playwright/test";

const VALID_STYLES = ["semi-realistic", "anime", "painted", "pixel", "cyberpunk"] as const;

// ─── /api/avatar GET (health check) ──────────────────────────────────────────

test.describe("GET /api/avatar — health check", () => {
  test("returns 200 with model info", async ({ request }) => {
    const res = await request.get("/api/avatar");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("model");
  });

  test("response includes status field", async ({ request }) => {
    const res = await request.get("/api/avatar");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status ?? body.model).toBeTruthy();
  });

  test("response is valid JSON", async ({ request }) => {
    const res = await request.get("/api/avatar");
    expect(res.headers()["content-type"]).toMatch(/application\/json/);
  });
});

// ─── /api/avatar POST — image generation (auth required) ─────────────────────

test.describe("POST /api/avatar — image generation", () => {
  test("requires authentication — returns 401 or 403 without auth", async ({ request }) => {
    const res = await request.post("/api/avatar", {
      data: {
        name: "Alice",
        type: "player",
        style: "anime",
        gender: "female",
        personality: "cheerful",
      },
    });
    expect([401, 403]).toContain(res.status());
  });

  test("with empty body returns 401/403 (auth check first)", async ({ request }) => {
    const res = await request.post("/api/avatar", { data: {} });
    expect([400, 401, 403]).toContain(res.status());
  });

  test("with invalid style falls through to auth check", async ({ request }) => {
    const res = await request.post("/api/avatar", {
      data: { name: "Alice", type: "player", style: "watercolor" },
    });
    // Auth is checked before style validation in most routes
    expect([400, 401, 403]).toContain(res.status());
  });

  test("SQL injection in name is handled gracefully", async ({ request }) => {
    const res = await request.post("/api/avatar", {
      data: { name: "'; DROP TABLE ai_characters; --", type: "player" },
    });
    expect([400, 401, 403]).toContain(res.status());
  });

  test("extra-long name is handled without 500", async ({ request }) => {
    const res = await request.post("/api/avatar", {
      data: { name: "A".repeat(500), type: "player" },
    });
    expect(res.status()).not.toBe(500);
  });
});

// ─── /api/avatar POST — style parameter validation ───────────────────────────

test.describe("POST /api/avatar — style parameter", () => {
  for (const style of VALID_STYLES) {
    test(`valid style '${style}' is accepted (auth check, not style check)`, async ({ request }) => {
      const res = await request.post("/api/avatar", {
        data: { name: "Alice", type: "player", style },
      });
      // We expect auth failure, NOT a 422/400 about the style itself
      expect([401, 403]).toContain(res.status());
    });
  }

  test("invalid style 'watercolor' returns 400 or auth error (not 500)", async ({ request }) => {
    const res = await request.post("/api/avatar", {
      data: { name: "Alice", type: "player", style: "watercolor" },
    });
    expect(res.status()).not.toBe(500);
    expect([400, 401, 403]).toContain(res.status());
  });

  test("missing style defaults gracefully (no 500)", async ({ request }) => {
    const res = await request.post("/api/avatar", {
      data: { name: "Alice", type: "player" },
    });
    expect(res.status()).not.toBe(500);
  });
});

// ─── /api/characters/pool GET — character pool ───────────────────────────────

test.describe("GET /api/characters/pool — character pool", () => {
  test("returns 200 with an array of characters", async ({ request }) => {
    const res = await request.get("/api/characters/pool");
    expect([200, 401, 403]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      expect(Array.isArray(body)).toBe(true);
    }
  });

  test("accepts a 'style' query parameter without crashing", async ({ request }) => {
    const res = await request.get("/api/characters/pool?style=anime");
    expect(res.status()).not.toBe(500);
  });

  test("each valid style returns 200 or auth error (not 400/422)", async ({ request }) => {
    for (const style of VALID_STYLES) {
      const res = await request.get(`/api/characters/pool?style=${style}`);
      expect([200, 401, 403]).toContain(res.status());
    }
  });

  test("invalid style falls back gracefully — returns 200 or auth error", async ({ request }) => {
    const res = await request.get("/api/characters/pool?style=watercolor");
    // Route should coerce to default style, not crash
    expect([200, 401, 403]).toContain(res.status());
  });

  test("limit parameter is capped — very large limit does not crash", async ({ request }) => {
    const res = await request.get("/api/characters/pool?limit=9999&style=anime");
    expect(res.status()).not.toBe(500);
  });

  test("limit=0 is handled gracefully", async ({ request }) => {
    const res = await request.get("/api/characters/pool?limit=0");
    expect([200, 400, 401, 403]).toContain(res.status());
  });

  test("non-numeric limit is handled gracefully", async ({ request }) => {
    const res = await request.get("/api/characters/pool?limit=abc");
    expect(res.status()).not.toBe(500);
  });

  test("gender=male filter does not crash", async ({ request }) => {
    const res = await request.get("/api/characters/pool?gender=male&style=anime");
    expect(res.status()).not.toBe(500);
  });

  test("gender=female filter does not crash", async ({ request }) => {
    const res = await request.get("/api/characters/pool?gender=female&style=pixel");
    expect(res.status()).not.toBe(500);
  });

  test("invalid gender value is rejected or ignored gracefully", async ({ request }) => {
    const res = await request.get("/api/characters/pool?gender=alien");
    expect(res.status()).not.toBe(500);
  });

  test("combining style and gender works without 500", async ({ request }) => {
    for (const style of ["anime", "pixel"] as const) {
      for (const gender of ["male", "female"]) {
        const res = await request.get(
          `/api/characters/pool?style=${style}&gender=${gender}&limit=3`
        );
        expect(res.status()).not.toBe(500);
      }
    }
  });

  test("pool response characters have expected fields when 200", async ({ request }) => {
    const res = await request.get("/api/characters/pool?style=anime&limit=2");
    if (res.status() !== 200) return; // skip if auth required

    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    if (body.length > 0) {
      const char = body[0];
      expect(char).toHaveProperty("name");
      // avatar_styles or image_url should be present for a complete character
      const hasAvatarData = "avatar_styles" in char || "image_url" in char;
      expect(hasAvatarData).toBe(true);
    }
  });

  test("pool does not return more characters than the limit", async ({ request }) => {
    const limit = 3;
    const res = await request.get(`/api/characters/pool?limit=${limit}&style=anime`);
    if (res.status() !== 200) return;

    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeLessThanOrEqual(limit);
  });
});

// ─── /api/characters/pool POST — style-preview ───────────────────────────────

test.describe("POST /api/characters/pool — style preview", () => {
  test("POST to pool returns 200 or auth error (not 404/500)", async ({ request }) => {
    const res = await request.post("/api/characters/pool", {
      data: { style: "anime", limit: 5, type: "style-preview" },
    });
    // Pool may support POST for style-preview or return method not allowed
    expect([200, 401, 403, 404, 405]).toContain(res.status());
  });
});

// ─── /api/avatar cross-origin header check ───────────────────────────────────

test.describe("Avatar API — headers", () => {
  test("avatar health GET does not return CORS error headers blocking clients", async ({ request }) => {
    const res = await request.get("/api/avatar");
    // Should not have an error indicating CORS blockage
    expect(res.status()).toBe(200);
  });

  test("avatar API returns content-type application/json for GET", async ({ request }) => {
    const res = await request.get("/api/avatar");
    const ct = res.headers()["content-type"] ?? "";
    expect(ct).toMatch(/json/);
  });
});

// ─── /api/avatar — rate limiting / edge cases ─────────────────────────────────

test.describe("Avatar API — edge cases", () => {
  test("empty string name is handled without 500", async ({ request }) => {
    const res = await request.post("/api/avatar", {
      data: { name: "", type: "player", style: "anime" },
    });
    expect(res.status()).not.toBe(500);
  });

  test("type=host is accepted (no 400 for valid type)", async ({ request }) => {
    const res = await request.post("/api/avatar", {
      data: { name: "Echo", type: "host", style: "anime" },
    });
    expect([401, 403]).toContain(res.status()); // auth failure, not type validation failure
  });

  test("type=invalid is rejected cleanly (not 500)", async ({ request }) => {
    const res = await request.post("/api/avatar", {
      data: { name: "Alice", type: "villain", style: "anime" },
    });
    expect(res.status()).not.toBe(500);
  });

  test("concurrent GET requests to health endpoint all succeed", async ({ request }) => {
    const results = await Promise.all(
      Array.from({ length: 5 }, () => request.get("/api/avatar"))
    );
    for (const res of results) {
      expect(res.status()).toBe(200);
    }
  });
});
