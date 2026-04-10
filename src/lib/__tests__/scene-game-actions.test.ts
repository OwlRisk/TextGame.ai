import { describe, it, expect } from "vitest";
import { getSceneQuickActions, getSceneDialogueChips, getPhaseType } from "@/hooks/useGameActions";
import type { GameAction } from "@/hooks/useGameActions";

describe("getPhaseType", () => {
  it("maps combat-related labels", () => {
    expect(getPhaseType("Combat Phase")).toBe("combat");
    expect(getPhaseType("Battle")).toBe("combat");
    expect(getPhaseType("An encounter begins")).toBe("combat");
  });

  it("maps exploration-related labels", () => {
    expect(getPhaseType("Exploration")).toBe("exploration");
    expect(getPhaseType("Search the room")).toBe("exploration");
    expect(getPhaseType("Travel to dungeon")).toBe("exploration");
  });

  it("maps social-related labels", () => {
    expect(getPhaseType("Social interaction")).toBe("social");
    expect(getPhaseType("Negotiation")).toBe("social");
    expect(getPhaseType("Talk to the stranger")).toBe("social");
  });

  it("returns 'unknown' for unrecognized labels", () => {
    expect(getPhaseType("")).toBe("unknown");
    expect(getPhaseType("Something else")).toBe("unknown");
  });
});

describe("getSceneQuickActions (Do-type only)", () => {
  function labels(actions: GameAction[]): string[] {
    return actions.map((a) => a.label);
  }

  it("returns only Do actions (no Say actions)", () => {
    const actions = getSceneQuickActions("unknown");
    expect(actions.length).toBeGreaterThanOrEqual(1);
    for (const a of actions) {
      expect(a.inputMode).toBeUndefined();
    }
  });

  it("includes 'Run' in combat phase", () => {
    const actions = getSceneQuickActions("combat");
    expect(labels(actions)).toContain("Run");
  });

  it("includes 'Investigate' in exploration phase", () => {
    const actions = getSceneQuickActions("exploration");
    expect(labels(actions)).toContain("Investigate");
  });

  it("always includes 'Look around'", () => {
    for (const phase of ["unknown", "combat", "exploration", "social", "rest"]) {
      const actions = getSceneQuickActions(phase);
      const lookAround = actions.find((a) => a.label === "Look around");
      expect(lookAround).toBeDefined();
    }
  });

  it("templates do NOT contain [ACTION] or [SAY] prefixes (handled by input layer)", () => {
    const actions = getSceneQuickActions("unknown");
    for (const a of actions) {
      expect(a.template.startsWith("[ACTION]")).toBe(false);
      expect(a.template.startsWith("[SAY]")).toBe(false);
    }
  });

  it("has max 3 actions", () => {
    const actions = getSceneQuickActions("unknown");
    expect(actions.length).toBeLessThanOrEqual(3);
  });
});

describe("getSceneDialogueChips (Say-type)", () => {
  it("includes 'Ask' in social phase instead of 'Let's go'", () => {
    const chips = getSceneDialogueChips("social");
    const chipLabels = chips.map((c) => c.label);
    expect(chipLabels).toContain("Ask");
    expect(chipLabels).not.toContain("Let's go");
  });

  it("includes 'Let's go' in non-social phases", () => {
    const chips = getSceneDialogueChips("unknown");
    expect(chips.map((c) => c.label)).toContain("Let's go");
  });

  it("always includes 'Wait'", () => {
    for (const phase of ["unknown", "combat", "exploration", "social", "rest"]) {
      const chips = getSceneDialogueChips(phase);
      expect(chips.map((c) => c.label)).toContain("Wait");
    }
  });

  it("starters do NOT have tag prefixes", () => {
    const chips = getSceneDialogueChips("unknown");
    for (const c of chips) {
      expect(c.starter.startsWith("[SAY]")).toBe(false);
      expect(c.starter.startsWith("[ACTION]")).toBe(false);
    }
  });
});
