import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRateLimiter, rateLimitResponse } from "../rate-limit";

describe("createRateLimiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests under the limit", () => {
    const limiter = createRateLimiter("test-allow", { limit: 3, windowSeconds: 60 });
    expect(limiter.check("user1").success).toBe(true);
    expect(limiter.check("user1").success).toBe(true);
    expect(limiter.check("user1").success).toBe(true);
  });

  it("blocks requests over the limit", () => {
    const limiter = createRateLimiter("test-block", { limit: 2, windowSeconds: 60 });
    limiter.check("user1");
    limiter.check("user1");
    const result = limiter.check("user1");
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("resets after the window expires", () => {
    const limiter = createRateLimiter("test-reset", { limit: 1, windowSeconds: 10 });
    expect(limiter.check("user1").success).toBe(true);
    expect(limiter.check("user1").success).toBe(false);

    vi.advanceTimersByTime(11_000);

    expect(limiter.check("user1").success).toBe(true);
  });

  it("tracks users independently", () => {
    const limiter = createRateLimiter("test-users", { limit: 1, windowSeconds: 60 });
    expect(limiter.check("alice").success).toBe(true);
    expect(limiter.check("bob").success).toBe(true);
    expect(limiter.check("alice").success).toBe(false);
    expect(limiter.check("bob").success).toBe(false);
  });

  it("returns correct remaining count", () => {
    const limiter = createRateLimiter("test-remaining", { limit: 5, windowSeconds: 60 });
    expect(limiter.check("u").remaining).toBe(4);
    expect(limiter.check("u").remaining).toBe(3);
    expect(limiter.check("u").remaining).toBe(2);
  });

  it("returns limit in result", () => {
    const limiter = createRateLimiter("test-meta", { limit: 42, windowSeconds: 30 });
    const result = limiter.check("x");
    expect(result.limit).toBe(42);
  });

  it("different limiter names are independent", () => {
    const a = createRateLimiter("ns-a", { limit: 1, windowSeconds: 60 });
    const b = createRateLimiter("ns-b", { limit: 1, windowSeconds: 60 });
    expect(a.check("user").success).toBe(true);
    expect(b.check("user").success).toBe(true);
    expect(a.check("user").success).toBe(false);
    expect(b.check("user").success).toBe(false);
  });

  it("uses defaults when no options provided", () => {
    const limiter = createRateLimiter("test-defaults");
    const result = limiter.check("user");
    expect(result.limit).toBe(60);
    expect(result.remaining).toBe(59);
  });
});

describe("rateLimitResponse", () => {
  it("returns a 429 response with correct headers", async () => {
    const result = {
      success: false,
      limit: 10,
      remaining: 0,
      resetAt: Date.now() + 30_000,
    };
    const response = rateLimitResponse(result);
    expect(response.status).toBe(429);
    expect(response.headers.get("X-RateLimit-Limit")).toBe("10");
    expect(response.headers.get("X-RateLimit-Remaining")).toBe("0");
    expect(response.headers.get("Retry-After")).toBeDefined();

    const body = await response.json();
    expect(body.error).toContain("Too many requests");
  });
});
