import { describe, it, expect } from "vitest";
import { SITE_NAME, SITE_DOMAIN, SITE_TITLE, SITE_DESCRIPTION } from "../site";
import { GAME_MASTER_AVATAR } from "../game-master-avatar";

// ─── Site branding constants ─────────────────────────────────────────────────

describe("site constants", () => {
  it("SITE_NAME is TextGame.ai", () => {
    expect(SITE_NAME).toBe("TextGame.ai");
  });

  it("SITE_DOMAIN starts with https", () => {
    expect(SITE_DOMAIN).toMatch(/^https:\/\//);
  });

  it("SITE_DOMAIN contains textgame.ai", () => {
    expect(SITE_DOMAIN).toContain("textgame.ai");
  });

  it("SITE_TITLE includes the site name", () => {
    expect(SITE_TITLE).toContain(SITE_NAME);
  });

  it("SITE_TITLE is a reasonable length for <title> tag", () => {
    expect(SITE_TITLE.length).toBeGreaterThan(20);
    expect(SITE_TITLE.length).toBeLessThan(80);
  });

  it("SITE_DESCRIPTION is SEO-friendly length (120-320 chars)", () => {
    expect(SITE_DESCRIPTION.length).toBeGreaterThan(120);
    expect(SITE_DESCRIPTION.length).toBeLessThan(320);
  });

  it("SITE_DESCRIPTION contains relevant keywords", () => {
    const lower = SITE_DESCRIPTION.toLowerCase();
    expect(lower).toContain("ai");
    expect(lower).toContain("game");
  });

  it("SITE_DESCRIPTION does not end with an incomplete sentence", () => {
    expect(SITE_DESCRIPTION.trimEnd()).toMatch(/[.!?"]$/);
  });
});

// ─── Game master avatar constant ─────────────────────────────────────────────

describe("GAME_MASTER_AVATAR", () => {
  it("is a webp file path", () => {
    expect(GAME_MASTER_AVATAR).toMatch(/\.webp$/);
  });

  it("starts with /", () => {
    expect(GAME_MASTER_AVATAR).toMatch(/^\//);
  });
});
