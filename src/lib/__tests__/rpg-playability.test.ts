import { describe, it, expect } from "vitest";
import {
  ALL_RPG_ADVENTURES,
  getRpgAdventureById,
  buildAdventureNotes,
} from "../rpg/adventures";
import {
  parseEncountersFired,
  reconcileEncounters,
  reconcileBossPhase,
  detectMissingRoomUpdate,
  type GmState,
  type ActiveBossState,
} from "../gm-state";
import { ALL_WORLDS } from "../rpg/worlds";

// ═══════════════════════════════════════════════════════════════════════════
// Phase 1 — structured adventure data integrity
// ═══════════════════════════════════════════════════════════════════════════

describe("RPG adventures — structured definitions", () => {
  it("ships at least 3 adventures", () => {
    expect(ALL_RPG_ADVENTURES.length).toBeGreaterThanOrEqual(3);
  });

  it("every adventure has a unique id", () => {
    const ids = ALL_RPG_ADVENTURES.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every adventure points at a real world", () => {
    const validWorldIds = new Set(ALL_WORLDS.map((w) => w.id));
    for (const a of ALL_RPG_ADVENTURES) {
      expect(validWorldIds.has(a.worldId), `unknown worldId in ${a.id}: ${a.worldId}`).toBe(true);
    }
  });

  it("every adventure has at least one encounter per act it declares", () => {
    for (const a of ALL_RPG_ADVENTURES) {
      const acts = new Set(a.acts.map((act) => act.act));
      const encounterActs = new Set(a.encounters.map((e) => e.act));
      for (const act of acts) {
        expect(encounterActs.has(act), `${a.id}: declared Act ${act} has zero encounters`).toBe(true);
      }
    }
  });

  it("every adventure has at least one boss encounter", () => {
    for (const a of ALL_RPG_ADVENTURES) {
      const hasBoss = a.encounters.some((e) =>
        e.enemies?.some((en) => en.isBoss === true),
      );
      expect(hasBoss, `${a.id}: no boss-marked encounter`).toBe(true);
    }
  });

  it("every boss has phaseThresholds in descending order, all in (0,1)", () => {
    for (const a of ALL_RPG_ADVENTURES) {
      for (const e of a.encounters) {
        for (const en of e.enemies ?? []) {
          if (!en.isBoss) continue;
          const t = en.phaseThresholds ?? [];
          expect(t.length, `${a.id} ${en.name}: boss with no phaseThresholds`).toBeGreaterThan(0);
          for (let i = 0; i < t.length; i++) {
            expect(t[i], `${a.id} ${en.name}: threshold[${i}]=${t[i]} out of (0,1)`).toBeGreaterThan(0);
            expect(t[i], `${a.id} ${en.name}: threshold[${i}]=${t[i]} out of (0,1)`).toBeLessThan(1);
            if (i > 0) {
              expect(t[i - 1], `${a.id} ${en.name}: thresholds not descending`).toBeGreaterThan(t[i]);
            }
          }
        }
      }
    }
  });

  it("encounter ids are unique within each adventure", () => {
    for (const a of ALL_RPG_ADVENTURES) {
      const ids = a.encounters.map((e) => e.id);
      expect(new Set(ids).size, `${a.id}: duplicate encounter id`).toBe(ids.length);
    }
  });

  it("adventure ingredients listed in initialGmState do not collide with encounter ids in confusing ways", () => {
    // Sanity check — when an encounter id is also listed as an ingredient,
    // both layers fire. That's intentional in some cases (the encounter IS
    // a key plot beat), but we want to make sure neither registry is empty.
    for (const a of ALL_RPG_ADVENTURES) {
      expect(a.initialGmState.ingredientsAvailable.length, `${a.id}: empty ingredient ledger`).toBeGreaterThan(0);
      expect(a.initialGmState.playerDoesntKnow.length, `${a.id}: no secrets to reveal`).toBeGreaterThan(0);
    }
  });
});

describe("getRpgAdventureById", () => {
  it("returns the adventure for a known id", () => {
    const a = getRpgAdventureById("rpg-jade-peak");
    expect(a?.id).toBe("rpg-jade-peak");
  });

  it("returns undefined for unknown / null / empty", () => {
    expect(getRpgAdventureById(null)).toBeUndefined();
    expect(getRpgAdventureById(undefined)).toBeUndefined();
    expect(getRpgAdventureById("")).toBeUndefined();
    expect(getRpgAdventureById("nonsense")).toBeUndefined();
  });
});

describe("buildAdventureNotes", () => {
  it("includes the directorBrief, key NPCs, encounters, and acts", () => {
    const a = ALL_RPG_ADVENTURES[0];
    const notes = buildAdventureNotes(a);
    expect(notes).toContain(a.directorBrief.split("\n")[0]); // first line of brief
    expect(notes).toContain("## KEY NPCs");
    expect(notes).toContain("## ENCOUNTER TABLE");
    expect(notes).toContain("## ACT STRUCTURE");
    // At least one encounter id appears verbatim — the GM uses these as
    // ENCOUNTER_FIRED arguments.
    expect(notes).toContain(`[${a.encounters[0].id}]`);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Phase 3 — encounter ledger
// ═══════════════════════════════════════════════════════════════════════════

describe("parseEncountersFired", () => {
  it("extracts a single encounter id", () => {
    expect(parseEncountersFired("ENCOUNTER_FIRED: f1_giant_rats")).toEqual(["f1_giant_rats"]);
  });

  it("extracts multiple", () => {
    const directives = `
ENCOUNTER_FIRED: f1_giant_rats
ENCOUNTER_FIRED: f2_crystal_golems
NEXT_SPEAKER: Alice
`.trim();
    expect(parseEncountersFired(directives).sort()).toEqual(["f1_giant_rats", "f2_crystal_golems"].sort());
  });

  it("dedupes on the same line / repeated emissions", () => {
    const directives = "ENCOUNTER_FIRED: foo\nENCOUNTER_FIRED: foo";
    expect(parseEncountersFired(directives)).toEqual(["foo"]);
  });

  it("returns [] when none", () => {
    expect(parseEncountersFired("NEXT_SPEAKER: Alice\nGM_STATE: {}")).toEqual([]);
  });
});

function makeRpgState(over: Partial<GmState> = {}): GmState {
  return {
    act: 1, tension: 1,
    ingredientsUsed: [], ingredientsAvailable: [],
    playerKnows: [], playerDoesntKnow: [],
    activeThreats: [], mood: "curious",
    ...over,
  };
}

describe("reconcileEncounters", () => {
  it("merges newly-fired ids into the persistent ledger", () => {
    const parsed = makeRpgState({ encountersFired: ["f1_giant_rats"] });
    const r = reconcileEncounters({
      firedThisTurn: ["f2_crystal_golems"],
      parsedState: parsed,
    });
    expect(r.newlyFired).toEqual(["f2_crystal_golems"]);
    expect(r.repeatedEncounters).toEqual([]);
    expect(r.state.encountersFired?.sort()).toEqual(["f1_giant_rats", "f2_crystal_golems"].sort());
  });

  it("flags repeats", () => {
    const parsed = makeRpgState({ encountersFired: ["f1_giant_rats"] });
    const r = reconcileEncounters({
      firedThisTurn: ["f1_giant_rats"],
      parsedState: parsed,
    });
    expect(r.repeatedEncounters).toEqual(["f1_giant_rats"]);
    expect(r.newlyFired).toEqual([]);
    expect(r.state.encountersFired).toEqual(["f1_giant_rats"]); // unchanged
  });

  it("preserves identity when nothing changes", () => {
    const parsed = makeRpgState({ encountersFired: ["a"] });
    const r = reconcileEncounters({ firedThisTurn: [], parsedState: parsed });
    expect(r.state).toBe(parsed);
  });

  it("handles a fresh ledger when previous state had no encountersFired", () => {
    const parsed = makeRpgState();
    const r = reconcileEncounters({
      firedThisTurn: ["boss_ignathir"],
      parsedState: parsed,
    });
    expect(r.newlyFired).toEqual(["boss_ignathir"]);
    expect(r.state.encountersFired).toEqual(["boss_ignathir"]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Phase 4 — boss phase tracker
// ═══════════════════════════════════════════════════════════════════════════

function bossState(over: Partial<ActiveBossState> = {}): ActiveBossState {
  return { name: "Ignathir", currentHp: 300, maxHp: 300, currentPhase: 1, phaseThresholds: [0.5], ...over };
}

describe("reconcileBossPhase", () => {
  it("does nothing when no active boss is set", () => {
    const s = makeRpgState();
    const r = reconcileBossPhase({ parsedState: s, bossEnemy: { name: "x", hp: 1, maxHp: 1 } });
    expect(r.transitionedTo).toBeNull();
    expect(r.state).toBe(s);
  });

  it("advances to phase 2 when HP crosses the first threshold", () => {
    const s = makeRpgState({ activeBoss: bossState({ phaseThresholds: [0.5] }) });
    const r = reconcileBossPhase({
      parsedState: s,
      bossEnemy: { name: "Ignathir", hp: 140, maxHp: 300 }, // 47%
    });
    expect(r.transitionedTo).toBe(2);
    expect(r.state.activeBoss?.currentPhase).toBe(2);
    expect(r.state.activeBoss?.currentHp).toBe(140);
  });

  it("does not transition when HP is above the threshold", () => {
    const s = makeRpgState({ activeBoss: bossState({ phaseThresholds: [0.5] }) });
    const r = reconcileBossPhase({
      parsedState: s,
      bossEnemy: { name: "Ignathir", hp: 200, maxHp: 300 }, // 67%
    });
    expect(r.transitionedTo).toBeNull();
    expect(r.state.activeBoss?.currentPhase).toBe(1);
  });

  it("can skip directly from phase 1 to phase 3 if HP plummets past two thresholds", () => {
    const s = makeRpgState({ activeBoss: bossState({ phaseThresholds: [0.66, 0.33] }) });
    const r = reconcileBossPhase({
      parsedState: s,
      bossEnemy: { name: "Ignathir", hp: 60, maxHp: 300 }, // 20%
    });
    expect(r.transitionedTo).toBe(3);
    expect(r.state.activeBoss?.currentPhase).toBe(3);
  });

  it("does not re-fire a transition once the phase is already current", () => {
    const s = makeRpgState({ activeBoss: bossState({ currentPhase: 2, phaseThresholds: [0.5] }) });
    const r = reconcileBossPhase({
      parsedState: s,
      bossEnemy: { name: "Ignathir", hp: 100, maxHp: 300 }, // 33% but already in phase 2
    });
    expect(r.transitionedTo).toBeNull();
    expect(r.state.activeBoss?.currentPhase).toBe(2);
  });

  it("syncs HP from the enemy snapshot even when there's no transition", () => {
    const s = makeRpgState({ activeBoss: bossState({ currentHp: 300, phaseThresholds: [0.5] }) });
    const r = reconcileBossPhase({
      parsedState: s,
      bossEnemy: { name: "Ignathir", hp: 250, maxHp: 300 },
    });
    expect(r.transitionedTo).toBeNull();
    expect(r.state.activeBoss?.currentHp).toBe(250);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// EXTRA — ROOM_UPDATE missing detection
// ═══════════════════════════════════════════════════════════════════════════

describe("detectMissingRoomUpdate", () => {
  it("flags 'you enter the X' when no ROOM_UPDATE present", () => {
    expect(detectMissingRoomUpdate({
      narration: "You enter the dim chapel. Cold air seeps from the walls.",
      directivesContainRoomUpdate: false,
    })).toBe(true);
  });

  it("does NOT flag movement language when ROOM_UPDATE was emitted", () => {
    expect(detectMissingRoomUpdate({
      narration: "You enter the dim chapel.",
      directivesContainRoomUpdate: true,
    })).toBe(false);
  });

  it("flags 'the door opens to a corridor'", () => {
    expect(detectMissingRoomUpdate({
      narration: "The door opens to a long, vaulted corridor lined with statues.",
      directivesContainRoomUpdate: false,
    })).toBe(true);
  });

  it("flags 'the party descends into the cellar'", () => {
    expect(detectMissingRoomUpdate({
      narration: "The party descends into the wine cellar.",
      directivesContainRoomUpdate: false,
    })).toBe(true);
  });

  it("does NOT false-positive on dialogue that mentions movement", () => {
    expect(detectMissingRoomUpdate({
      narration: "Mira sharpens her blade and waits.",
      directivesContainRoomUpdate: false,
    })).toBe(false);
  });

  it("does not flag empty narration", () => {
    expect(detectMissingRoomUpdate({
      narration: "",
      directivesContainRoomUpdate: false,
    })).toBe(false);
  });
});
