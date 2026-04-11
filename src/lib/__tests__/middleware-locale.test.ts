import { describe, it, expect } from "vitest";
import { SEO_LOCALES, isValidSEOLocale } from "../seo-locales";

/**
 * Unit tests for the middleware locale / URL normalization logic.
 *
 * NextRequest/NextResponse require the Next.js runtime, so we extract
 * the pure decision logic and test it here (same pattern as middleware-eea.test.ts).
 */

// ─── Extracted middleware logic ─────────────────────────────────────────────

type MiddlewareAction =
  | { type: "redirect-www"; target: string }
  | { type: "redirect-trailing-slash"; target: string }
  | { type: "set-locale"; locale: string; contentLanguage: string }
  | { type: "pass" };

function classifyRequest(pathname: string, host: string): MiddlewareAction {
  if (host.startsWith("www.")) {
    return { type: "redirect-www", target: host.replace(/^www\./, "") };
  }

  if (pathname !== "/" && pathname.endsWith("/")) {
    return { type: "redirect-trailing-slash", target: pathname.replace(/\/+$/, "") };
  }

  const segments = pathname.split("/").filter(Boolean);
  const maybeLocale = segments[0];

  if (maybeLocale && isValidSEOLocale(maybeLocale)) {
    return {
      type: "set-locale",
      locale: maybeLocale,
      contentLanguage: maybeLocale === "zh" ? "zh-CN" : maybeLocale,
    };
  }

  return { type: "pass" };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("www → non-www redirect", () => {
  it("redirects www.textgame.ai to textgame.ai", () => {
    const result = classifyRequest("/", "www.textgame.ai");
    expect(result).toEqual({ type: "redirect-www", target: "textgame.ai" });
  });

  it("redirects www subdomain with path", () => {
    const result = classifyRequest("/games/werewolf", "www.textgame.ai");
    expect(result).toEqual({ type: "redirect-www", target: "textgame.ai" });
  });

  it("does not redirect non-www host", () => {
    const result = classifyRequest("/", "textgame.ai");
    expect(result.type).not.toBe("redirect-www");
  });

  it("does not redirect localhost", () => {
    const result = classifyRequest("/", "localhost:3000");
    expect(result.type).not.toBe("redirect-www");
  });
});

describe("trailing slash normalization", () => {
  it("removes trailing slash from /games/", () => {
    const result = classifyRequest("/games/", "textgame.ai");
    expect(result).toEqual({ type: "redirect-trailing-slash", target: "/games" });
  });

  it("removes trailing slash from /zh/discover/", () => {
    const result = classifyRequest("/zh/discover/", "textgame.ai");
    expect(result).toEqual({ type: "redirect-trailing-slash", target: "/zh/discover" });
  });

  it("removes multiple trailing slashes", () => {
    const result = classifyRequest("/blog///", "textgame.ai");
    expect(result).toEqual({ type: "redirect-trailing-slash", target: "/blog" });
  });

  it("does NOT strip trailing slash from root /", () => {
    const result = classifyRequest("/", "textgame.ai");
    expect(result.type).not.toBe("redirect-trailing-slash");
  });
});

describe("locale detection", () => {
  it("detects all 18 valid SEO locales", () => {
    for (const locale of SEO_LOCALES) {
      const result = classifyRequest(`/${locale}`, "textgame.ai");
      expect(result.type, `Failed for /${locale}`).toBe("set-locale");
      if (result.type === "set-locale") {
        expect(result.locale).toBe(locale);
      }
    }
  });

  it("sets Content-Language to zh-CN for /zh", () => {
    const result = classifyRequest("/zh", "textgame.ai");
    expect(result).toEqual({ type: "set-locale", locale: "zh", contentLanguage: "zh-CN" });
  });

  it("sets Content-Language to locale code for non-zh locales", () => {
    const result = classifyRequest("/ja/discover", "textgame.ai");
    expect(result).toEqual({ type: "set-locale", locale: "ja", contentLanguage: "ja" });
  });

  it("detects locale with subpath", () => {
    const result = classifyRequest("/de/games/werewolf", "textgame.ai");
    if (result.type === "set-locale") {
      expect(result.locale).toBe("de");
      expect(result.contentLanguage).toBe("de");
    }
  });

  it("does not detect 'en' as a locale prefix", () => {
    const result = classifyRequest("/en/discover", "textgame.ai");
    expect(result.type).toBe("pass");
  });

  it("does not detect 'games' as a locale prefix", () => {
    const result = classifyRequest("/games/werewolf", "textgame.ai");
    expect(result.type).toBe("pass");
  });

  it("does not detect 'api' as a locale prefix", () => {
    const result = classifyRequest("/api/health", "textgame.ai");
    expect(result.type).toBe("pass");
  });

  it("does not detect 'blog' as a locale prefix", () => {
    const result = classifyRequest("/blog/play-werewolf-online", "textgame.ai");
    expect(result.type).toBe("pass");
  });

  it("does not detect uppercase locale as valid", () => {
    const result = classifyRequest("/ZH", "textgame.ai");
    expect(result.type).toBe("pass");
  });
});

describe("priority: www redirect beats trailing slash", () => {
  it("www redirect takes precedence", () => {
    const result = classifyRequest("/games/", "www.textgame.ai");
    expect(result.type).toBe("redirect-www");
  });
});

describe("priority: trailing slash beats locale detection", () => {
  it("trailing slash redirect takes precedence over locale", () => {
    const result = classifyRequest("/zh/", "textgame.ai");
    expect(result.type).toBe("redirect-trailing-slash");
  });
});

describe("pass-through for normal requests", () => {
  it("passes through root /", () => {
    expect(classifyRequest("/", "textgame.ai")).toEqual({ type: "pass" });
  });

  it("passes through /discover", () => {
    expect(classifyRequest("/discover", "textgame.ai")).toEqual({ type: "pass" });
  });

  it("passes through /profile", () => {
    expect(classifyRequest("/profile", "textgame.ai")).toEqual({ type: "pass" });
  });
});
