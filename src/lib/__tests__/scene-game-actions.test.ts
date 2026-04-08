import { describe, it, expect } from "vitest";
import { getSceneQuickActions, getPhaseType } from "@/hooks/useGameActions";
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

describe("getSceneQuickActions", () => {
  function labels(actions: GameAction[]): string[] {
    return actions.map((a) => a.label);
  }

  function modes(actions: GameAction[]): (string | undefined)[] {
    return actions.map((a) => a.inputMode);
  }

  it("returns 4 actions for 'unknown' phase", () => {
    const actions = getSceneQuickActions("unknown");
    expect(actions.length).toBe(4);
  });

  it("includes both say and do actions", () => {
    const actions = getSceneQuickActions("unknown");
    const sayCount = actions.filter((a) => a.inputMode === "say").length;
    const doCount = actions.filter((a) => a.inputMode === "do").length;
    expect(sayCount).toBeGreaterThanOrEqual(1);
    expect(doCount).toBeGreaterThanOrEqual(1);
  });

  it("includes 'Ask' in social phase instead of 'Let's go'", () => {
    const actions = getSceneQuickActions("social");
    const names = labels(actions);
    expect(names).toContain("Ask");
    expect(names).not.toContain("Let's go");
  });

  it("includes 'Let's go' in non-social phases", () => {
    const actions = getSceneQuickActions("unknown");
    expect(labels(actions)).toContain("Let's go");
  });

  it("includes 'Run' in combat phase", () => {
    const actions = getSceneQuickActions("combat");
    expect(labels(actions)).toContain("Run");
  });

  it("includes 'Investigate' in exploration phase", () => {
    const actions = getSceneQuickActions("exploration");
    expect(labels(actions)).toContain("Investigate");
  });

  it("always includes 'Look around' as a do action", () => {
    for (const phase of ["unknown", "combat", "exploration", "social", "rest"]) {
      const actions = getSceneQuickActions(phase);
      const lookAround = actions.find((a) => a.label === "Look around");
      expect(lookAround).toBeDefined();
      expect(lookAround!.inputMode).toBe("do");
    }
  });

  it("always includes 'Wait' as a say action", () => {
    for (const phase of ["unknown", "combat", "exploration", "social", "rest"]) {
      const actions = getSceneQuickActions(phase);
      const wait = actions.find((a) => a.label === "Wait");
      expect(wait).toBeDefined();
      expect(wait!.inputMode).toBe("say");
    }
  });

  it("do-mode actions have asterisk-wrapped templates", () => {
    const actions = getSceneQuickActions("unknown");
    for (const a of actions) {
      if (a.inputMode === "do") {
        expect(a.template.startsWith("*")).toBe(true);
        expect(a.template.endsWith("*")).toBe(true);
      }
    }
  });

  it("say-mode actions do NOT have asterisk-wrapped templates", () => {
    const actions = getSceneQuickActions("unknown");
    for (const a of actions) {
      if (a.inputMode === "say") {
        expect(a.template.startsWith("*")).toBe(false);
      }
    }
  });
});
