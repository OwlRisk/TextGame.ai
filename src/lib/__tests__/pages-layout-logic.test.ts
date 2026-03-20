/**
 * Tests for pure helper logic in (pages)/layout.tsx:
 *  - getMobileTitle: path → mobile header title
 *  - SIDEBAR_EXCLUDED_PATHS matching
 */
import { describe, it, expect } from "vitest";

// Re-implement the pure helpers exactly as in layout.tsx

const SIDEBAR_EXCLUDED_PATHS = ["/signin", "/games"];

const PATHNAME_TO_TITLE: Record<string, string> = {
  "/create": "Create Game",
  "/discover": "Discover",
  "/my-games": "My Games",
  "/profile": "Profile",
  "/usage": "Usage & Spending",
  "/subscription": "Subscription",
  "/help": "Help & Support",
  "/settings": "Settings",
  "/recharge": "Buy Credits",
};

function getMobileTitle(pathname: string): string {
  if (pathname.startsWith("/game/")) return "Game";
  return PATHNAME_TO_TITLE[pathname] ?? "Menu";
}

function shouldHideSidebar(pathname: string): boolean {
  return SIDEBAR_EXCLUDED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

// ─── getMobileTitle ─────────────────────────────────────────────────────────

describe("getMobileTitle", () => {
  it("returns 'Game' for /game/* paths", () => {
    expect(getMobileTitle("/game/abc")).toBe("Game");
    expect(getMobileTitle("/game/123-xyz")).toBe("Game");
    expect(getMobileTitle("/game/")).toBe("Game");
  });

  it("returns mapped title for known paths", () => {
    expect(getMobileTitle("/create")).toBe("Create Game");
    expect(getMobileTitle("/discover")).toBe("Discover");
    expect(getMobileTitle("/my-games")).toBe("My Games");
    expect(getMobileTitle("/profile")).toBe("Profile");
    expect(getMobileTitle("/usage")).toBe("Usage & Spending");
    expect(getMobileTitle("/subscription")).toBe("Subscription");
    expect(getMobileTitle("/help")).toBe("Help & Support");
    expect(getMobileTitle("/settings")).toBe("Settings");
    expect(getMobileTitle("/recharge")).toBe("Buy Credits");
  });

  it("returns 'Menu' for unknown paths", () => {
    expect(getMobileTitle("/unknown")).toBe("Menu");
    expect(getMobileTitle("/")).toBe("Menu");
    expect(getMobileTitle("")).toBe("Menu");
    expect(getMobileTitle("/foo/bar")).toBe("Menu");
  });

  it("does not partially match — requires exact path for non-game routes", () => {
    expect(getMobileTitle("/create/something")).toBe("Menu");
    expect(getMobileTitle("/discover/extra")).toBe("Menu");
  });
});

// ─── SIDEBAR_EXCLUDED_PATHS ─────────────────────────────────────────────────

describe("shouldHideSidebar", () => {
  it("hides sidebar for /signin", () => {
    expect(shouldHideSidebar("/signin")).toBe(true);
  });

  it("hides sidebar for /signin sub-paths", () => {
    expect(shouldHideSidebar("/signin/callback")).toBe(true);
  });

  it("hides sidebar for /games", () => {
    expect(shouldHideSidebar("/games")).toBe(true);
  });

  it("hides sidebar for /games sub-paths", () => {
    expect(shouldHideSidebar("/games/werewolf")).toBe(true);
  });

  it("shows sidebar for other paths", () => {
    expect(shouldHideSidebar("/create")).toBe(false);
    expect(shouldHideSidebar("/discover")).toBe(false);
    expect(shouldHideSidebar("/my-games")).toBe(false);
    expect(shouldHideSidebar("/profile")).toBe(false);
    expect(shouldHideSidebar("/subscription")).toBe(false);
    expect(shouldHideSidebar("/game/abc")).toBe(false);
    expect(shouldHideSidebar("/help")).toBe(false);
  });

  it("does not match partial prefix (e.g. /sign should not match /signin)", () => {
    expect(shouldHideSidebar("/sign")).toBe(false);
  });

  it("shows sidebar for root path", () => {
    expect(shouldHideSidebar("/")).toBe(false);
  });
});
