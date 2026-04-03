import { describe, it, expect } from "vitest";
import { buildScriptKillGame, getCaseIdFromPreset } from "../script-kill-setup";

describe("getCaseIdFromPreset", () => {
  it("maps script-kill-moonlight to moonlight-inn", () => {
    expect(getCaseIdFromPreset("script-kill-moonlight")).toBe("moonlight-inn");
  });

  it("maps script-kill-gallery to silk-gallery", () => {
    expect(getCaseIdFromPreset("script-kill-gallery")).toBe("silk-gallery");
  });

  it("maps script-kill-express to midnight-express", () => {
    expect(getCaseIdFromPreset("script-kill-express")).toBe("midnight-express");
  });

  it("returns undefined for unknown presets", () => {
    expect(getCaseIdFromPreset("werewolf-classic")).toBeUndefined();
  });
});

describe("buildScriptKillGame", () => {
  it("returns null for non-script-kill presets", () => {
    expect(buildScriptKillGame("werewolf-classic")).toBeNull();
  });

  it("returns valid setup for moonlight-inn", () => {
    const setup = buildScriptKillGame("script-kill-moonlight");
    expect(setup).not.toBeNull();
    expect(setup!.caseId).toBe("moonlight-inn");
    expect(setup!.humanRole).toBe("Detective");
    expect(setup!.configuredPlayers).toHaveLength(3);
    expect(setup!.playerCount).toBe(4);
  });

  it("builds configuredPlayers from case suspects", () => {
    const setup = buildScriptKillGame("script-kill-moonlight")!;
    const names = setup.configuredPlayers.map((p) => p.name);
    expect(names).toContain("Diana Cole");
    expect(names).toContain("Marcus Webb");
    expect(names).toContain("Lionel Sharpe");
  });

  it("sets all players to Suspect role", () => {
    const setup = buildScriptKillGame("script-kill-moonlight")!;
    setup.configuredPlayers.forEach((p) => {
      expect(p.role).toBe("Suspect");
    });
  });

  it("injects case data into rules", () => {
    const setup = buildScriptKillGame("script-kill-moonlight")!;
    expect(setup.rules).toContain("SCRIPT KILL");
    expect(setup.rules).toContain("CASE DATA");
    expect(setup.rules).toContain("Gerald Price");
    expect(setup.rules).toContain("[CULPRIT]");
    expect(setup.rules).toContain("[INNOCENT]");
  });

  it("returns correct player counts for all cases", () => {
    expect(buildScriptKillGame("script-kill-moonlight")!.configuredPlayers).toHaveLength(3);
    expect(buildScriptKillGame("script-kill-gallery")!.configuredPlayers).toHaveLength(4);
    expect(buildScriptKillGame("script-kill-express")!.configuredPlayers).toHaveLength(5);
  });
});
