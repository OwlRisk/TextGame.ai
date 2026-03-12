import { describe, it, expect } from "vitest";
import { buildAiPlayerBriefing } from "@/lib/ai-player-briefing";

describe("buildAiPlayerBriefing", () => {
  it("always includes concise pacing guardrails", () => {
    const out = buildAiPlayerBriefing({});
    expect(out).toContain("1 sentence preferred, 2 max");
    expect(out).toContain("not a narrator");
    expect(out).toContain("No meta talk");
  });

  it("adds deception guidance for hidden roles in werewolf/mafia", () => {
    const out = buildAiPlayerBriefing({ gameTemplate: "werewolf", role: "Werewolf" });
    expect(out).toContain("hidden side");
    expect(out).toContain("never reveal your role");
  });

  it("adds undercover-specific wording and includes secret word when present", () => {
    const out = buildAiPlayerBriefing({ gameTemplate: "undercover", role: "Undercover", word: "Orange" });
    expect(out).toContain("Undercover");
    expect(out).toContain("secret word: Orange");
  });
});

