import { describe, it, expect } from "vitest";
import {
  LANDING_AVATAR_MAP,
  INSIDE_GAME_STEPS,
  GAME_SCENARIOS,
  FEATURES,
  FEATURED_GAMES,
  FAQ_ITEMS,
  MARQUEE_CHARACTERS,
} from "@/data/landing-content";

describe("Landing content — LANDING_AVATAR_MAP", () => {
  it("is a non-empty record", () => {
    expect(Object.keys(LANDING_AVATAR_MAP).length).toBeGreaterThan(0);
  });

  it("every entry has a valid src string", () => {
    for (const [name, src] of Object.entries(LANDING_AVATAR_MAP)) {
      expect(typeof name).toBe("string");
      expect(typeof src).toBe("string");
      expect(src.length).toBeGreaterThan(0);
    }
  });
});

describe("Landing content — INSIDE_GAME_STEPS", () => {
  it("has at least 3 steps", () => {
    expect(INSIDE_GAME_STEPS.length).toBeGreaterThanOrEqual(3);
  });

  it("each step has required fields", () => {
    for (const step of INSIDE_GAME_STEPS) {
      expect(step.id).toBeTruthy();
      expect(step.step).toBeTruthy();
      expect(step.total).toBeTruthy();
      expect(step.title).toBeTruthy();
      expect(step.heading).toBeTruthy();
      expect(step.description).toBeTruthy();
      expect(Array.isArray(step.messages)).toBe(true);
      expect(step.messages.length).toBeGreaterThan(0);
    }
  });

  it("each step has unique id", () => {
    const ids = INSIDE_GAME_STEPS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("messages in each step have name and text", () => {
    for (const step of INSIDE_GAME_STEPS) {
      for (const msg of step.messages) {
        expect(msg.name).toBeTruthy();
        expect(msg.text).toBeTruthy();
        expect(typeof msg.time).toBe("string");
      }
    }
  });
});

describe("Landing content — GAME_SCENARIOS", () => {
  it("has at least 3 scenarios", () => {
    const keys = Object.keys(GAME_SCENARIOS);
    expect(keys.length).toBeGreaterThanOrEqual(3);
  });

  it("each scenario has title and messages", () => {
    for (const scenario of Object.values(GAME_SCENARIOS)) {
      expect(scenario.title).toBeTruthy();
      expect(Array.isArray(scenario.messages)).toBe(true);
      expect(scenario.messages.length).toBeGreaterThan(0);
    }
  });
});

describe("Landing content — FEATURES", () => {
  it("has at least 4 features", () => {
    expect(FEATURES.length).toBeGreaterThanOrEqual(4);
  });

  it("each feature has icon, title, description", () => {
    for (const f of FEATURES) {
      expect(f.icon).toBeTruthy();
      expect(f.title).toBeTruthy();
      expect(f.description).toBeTruthy();
    }
  });
});

describe("Landing content — FEATURED_GAMES", () => {
  it("has at least 2 featured games", () => {
    expect(FEATURED_GAMES.length).toBeGreaterThanOrEqual(2);
  });

  it("each featured game has title, emoji, players", () => {
    for (const g of FEATURED_GAMES) {
      expect(g.title).toBeTruthy();
      expect(g.emoji).toBeTruthy();
      expect(g.players).toBeTruthy();
    }
  });
});

describe("Landing content — FAQ_ITEMS", () => {
  it("has at least 5 FAQ items", () => {
    expect(FAQ_ITEMS.length).toBeGreaterThanOrEqual(5);
  });

  it("each FAQ has question and answer", () => {
    for (const faq of FAQ_ITEMS) {
      expect(faq.question).toBeTruthy();
      expect(faq.answer).toBeTruthy();
      expect(faq.question.endsWith("?")).toBe(true);
    }
  });

  it("no duplicate questions", () => {
    const questions = FAQ_ITEMS.map((f) => f.question);
    expect(new Set(questions).size).toBe(questions.length);
  });
});

describe("Landing content — MARQUEE_CHARACTERS", () => {
  it("is doubled for infinite scroll effect", () => {
    expect(MARQUEE_CHARACTERS.length % 2).toBe(0);
    const half = MARQUEE_CHARACTERS.length / 2;
    for (let i = 0; i < half; i++) {
      expect(MARQUEE_CHARACTERS[i].name).toBe(MARQUEE_CHARACTERS[i + half].name);
    }
  });

  it("each character has name, role, personality, game", () => {
    for (const c of MARQUEE_CHARACTERS) {
      expect(c.name).toBeTruthy();
      expect(c.role).toBeTruthy();
      expect(c.personality).toBeTruthy();
      expect(c.game).toBeTruthy();
    }
  });
});
