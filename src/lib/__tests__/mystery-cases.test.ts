import { describe, it, expect } from "vitest";
import {
  MYSTERY_CASES,
  getMysteryCase,
  getCasesByDifficulty,
  moonlightInn,
  silkGallery,
  midnightExpress,
} from "@/data/mystery-cases";
import type { MysteryCase, Evidence, Suspect } from "@/types/mystery-case";

describe("MYSTERY_CASES registry", () => {
  it("contains all registered cases", () => {
    expect(MYSTERY_CASES.length).toBeGreaterThanOrEqual(3);
  });

  it("covers all three difficulty levels", () => {
    const levels = new Set(MYSTERY_CASES.map((c) => c.difficulty));
    expect(levels).toContain(1);
    expect(levels).toContain(2);
    expect(levels).toContain(3);
  });

  it("each case has a unique id", () => {
    const ids = MYSTERY_CASES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("getMysteryCase", () => {
  it("returns a case by valid id", () => {
    const c = getMysteryCase("moonlight-inn");
    expect(c).toBeDefined();
    expect(c!.title).toBe("The Moonlight Inn Murder");
  });

  it("returns undefined for unknown id", () => {
    expect(getMysteryCase("nonexistent")).toBeUndefined();
  });
});

describe("getCasesByDifficulty", () => {
  it("returns beginner cases for difficulty 1", () => {
    const cases = getCasesByDifficulty(1);
    expect(cases.length).toBeGreaterThan(0);
    cases.forEach((c) => expect(c.difficulty).toBe(1));
  });

  it("returns standard cases for difficulty 2", () => {
    const cases = getCasesByDifficulty(2);
    expect(cases.length).toBeGreaterThan(0);
    cases.forEach((c) => expect(c.difficulty).toBe(2));
  });

  it("returns hard cases for difficulty 3", () => {
    const cases = getCasesByDifficulty(3);
    expect(cases.length).toBeGreaterThan(0);
    cases.forEach((c) => expect(c.difficulty).toBe(3));
  });
});

describe.each([
  ["moonlight-inn", moonlightInn],
  ["silk-gallery", silkGallery],
  ["midnight-express", midnightExpress],
] as [string, MysteryCase][])("case data integrity: %s", (_id, caseData) => {
  it("has required metadata fields", () => {
    expect(caseData.id).toBeTruthy();
    expect(caseData.title).toBeTruthy();
    expect([1, 2, 3]).toContain(caseData.difficulty);
    expect(caseData.estimatedMinutes).toBeGreaterThan(0);
    expect(caseData.setting.length).toBeGreaterThan(50);
  });

  it("has a victim with cause of death", () => {
    expect(caseData.victim.name).toBeTruthy();
    expect(caseData.victim.description).toBeTruthy();
    expect(caseData.victim.causeOfDeath).toBeTruthy();
  });

  it("has at least 3 suspects", () => {
    expect(caseData.suspects.length).toBeGreaterThanOrEqual(3);
  });

  it("has at least 3 evidence items", () => {
    expect(caseData.evidence.length).toBeGreaterThanOrEqual(3);
  });

  it("has at least 3 timeline events", () => {
    expect(caseData.timeline.length).toBeGreaterThanOrEqual(3);
  });

  it("solution culpritId references an existing suspect", () => {
    const suspectIds = caseData.suspects.map((s) => s.id);
    expect(suspectIds).toContain(caseData.solution.culpritId);
  });

  it("solution keyEvidence ids reference existing evidence", () => {
    const evidenceIds = caseData.evidence.map((e) => e.id);
    for (const keyId of caseData.solution.keyEvidence) {
      expect(evidenceIds).toContain(keyId);
    }
  });

  it("evidence pointsTo references existing suspects", () => {
    const suspectIds = caseData.suspects.map((s) => s.id);
    for (const e of caseData.evidence) {
      expect(suspectIds).toContain(e.pointsTo);
    }
  });

  it("has evidence spread across all 3 acts", () => {
    const acts = new Set(caseData.evidence.map((e) => e.revealAct));
    expect(acts.has(1)).toBe(true);
    expect(acts.has(2)).toBe(true);
    // Act 3 evidence is optional for beginner cases
    if (caseData.difficulty >= 2) {
      expect(acts.has(3)).toBe(true);
    }
  });

  it("exactly one suspect is the culprit", () => {
    const culprits = caseData.suspects.filter(
      (s) => s.id === caseData.solution.culpritId,
    );
    expect(culprits).toHaveLength(1);
  });

  it("the culprit has a false alibi", () => {
    const culprit = caseData.suspects.find(
      (s) => s.id === caseData.solution.culpritId,
    )!;
    expect(culprit.alibiTruth).toBe(false);
  });

  it("every suspect has at least one breakpoint", () => {
    for (const s of caseData.suspects) {
      expect(s.breakpoints.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("every suspect has at least one lie", () => {
    for (const s of caseData.suspects) {
      expect(s.lies.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("every suspect has personality and relationship defined", () => {
    for (const s of caseData.suspects) {
      expect(s.personality.length).toBeGreaterThan(10);
      expect(s.relationship.length).toBeGreaterThan(5);
    }
  });

  it("standard+ cases have at least one red herring evidence item", () => {
    if (caseData.difficulty >= 2) {
      const redHerrings = caseData.evidence.filter((e) => e.isRedHerring);
      expect(redHerrings.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("has both public and private timeline events", () => {
    const publicEvents = caseData.timeline.filter((t) => t.isPublic);
    const privateEvents = caseData.timeline.filter((t) => !t.isPublic);
    expect(publicEvents.length).toBeGreaterThanOrEqual(1);
    expect(privateEvents.length).toBeGreaterThanOrEqual(1);
  });

  it("solution has non-empty motive and method", () => {
    expect(caseData.solution.motive.length).toBeGreaterThan(20);
    expect(caseData.solution.method.length).toBeGreaterThan(20);
  });

  it("no key evidence is a red herring", () => {
    const redHerringIds = new Set(
      caseData.evidence.filter((e) => e.isRedHerring).map((e) => e.id),
    );
    for (const keyId of caseData.solution.keyEvidence) {
      expect(redHerringIds.has(keyId)).toBe(false);
    }
  });

  it("all evidence ids are unique", () => {
    const ids = caseData.evidence.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all suspect ids are unique", () => {
    const ids = caseData.suspects.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
