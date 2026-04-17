import { describe, it, expect } from "vitest";
import { buildAiPlayerBriefing } from "@/lib/ai-player-briefing";

describe("buildAiPlayerBriefing", () => {
  it("always includes concise pacing guardrails", () => {
    const out = buildAiPlayerBriefing({});
    expect(out).toContain("not a narrator");
    expect(out).toContain("one concrete game contribution");
  });

  it("includes role when supplied", () => {
    const out = buildAiPlayerBriefing({ gameTemplate: "rpg-fantasy", role: "Wizard" });
    expect(out).toContain("Wizard");
  });
});
