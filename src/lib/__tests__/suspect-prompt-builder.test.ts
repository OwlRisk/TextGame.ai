import { describe, it, expect } from "vitest";
import {
  buildSuspectPrompt,
  buildCaseRulesText,
  buildInitialEvidenceBoard,
} from "../suspect-prompt-builder";
import type { MysteryCase, Suspect } from "@/types/mystery-case";

const stubCase: MysteryCase = {
  id: "test-case",
  title: "The Test Murder",
  difficulty: 1,
  estimatedMinutes: 10,
  setting: "A cozy library on a rainy night",
  victim: {
    name: "Dr. Finch",
    description: "A retired professor",
    causeOfDeath: "blunt force trauma",
  },
  timeline: [
    { time: "9:00 PM", actor: "All", action: "Dinner begins", isPublic: true },
    { time: "10:00 PM", actor: "Alice", action: "Sneaks into study", isPublic: false },
  ],
  evidence: [
    {
      id: "broken-vase",
      name: "Broken vase",
      description: "Shards near the desk",
      revealAct: 1,
      type: "physical",
      pointsTo: "alice",
      isRedHerring: false,
    },
    {
      id: "fake-letter",
      name: "Forged letter",
      description: "A letter implicating Bob",
      revealAct: 1,
      type: "document",
      pointsTo: "bob",
      isRedHerring: true,
    },
    {
      id: "blood-sample",
      name: "Blood sample",
      description: "DNA matches Alice",
      revealAct: 2,
      type: "physical",
      pointsTo: "alice",
      isRedHerring: false,
    },
    {
      id: "diary-entry",
      name: "Victim's diary",
      description: "Mentions a confrontation",
      revealAct: 3,
      type: "document",
      pointsTo: "alice",
      isRedHerring: false,
    },
  ],
  suspects: [
    {
      id: "alice",
      name: "Alice",
      personality: "nervous and fidgety",
      relationship: "the victim's assistant",
      alibi: "I was reading in my room",
      alibiTruth: false,
      secrets: ["She was in the study at the time of murder"],
      lies: ["I never left my room"],
      breakpoints: ["broken-vase", "Asking about her shoes with dust"],
    },
    {
      id: "bob",
      name: "Bob",
      personality: "calm and collected",
      relationship: "the victim's neighbor",
      alibi: "I was walking the dog",
      alibiTruth: true,
      secrets: ["He heard screaming but said nothing"],
      lies: ["I heard nothing unusual"],
      breakpoints: ["Asking what time he got home"],
    },
  ],
  solution: {
    culpritId: "alice",
    motive: "Alice discovered the professor was going to fire her",
    method: "struck him with the vase in the study",
    keyEvidence: ["broken-vase", "blood-sample"],
  },
};

const culprit = stubCase.suspects[0]; // alice
const innocent = stubCase.suspects[1]; // bob

describe("buildSuspectPrompt", () => {
  it("includes the suspect's name and victim name", () => {
    const prompt = buildSuspectPrompt(culprit, stubCase);
    expect(prompt).toContain("You are Alice");
    expect(prompt).toContain("Dr. Finch");
  });

  it("includes personality and relationship", () => {
    const prompt = buildSuspectPrompt(culprit, stubCase);
    expect(prompt).toContain("nervous and fidgety");
    expect(prompt).toContain("the victim's assistant");
  });

  it("includes the alibi", () => {
    const prompt = buildSuspectPrompt(culprit, stubCase);
    expect(prompt).toContain("I was reading in my room");
  });

  it("marks false alibi as FALSE", () => {
    const prompt = buildSuspectPrompt(culprit, stubCase);
    expect(prompt).toContain("FALSE");
    expect(prompt).not.toContain("TRUE");
  });

  it("marks true alibi as TRUE", () => {
    const prompt = buildSuspectPrompt(innocent, stubCase);
    expect(prompt).toContain("TRUE");
  });

  it("includes secrets", () => {
    const prompt = buildSuspectPrompt(culprit, stubCase);
    expect(prompt).toContain("She was in the study at the time of murder");
  });

  it("includes lies", () => {
    const prompt = buildSuspectPrompt(culprit, stubCase);
    expect(prompt).toContain("I never left my room");
  });

  it("includes breakpoints", () => {
    const prompt = buildSuspectPrompt(culprit, stubCase);
    expect(prompt).toContain("broken-vase");
    expect(prompt).toContain("Asking about her shoes with dust");
  });

  it("labels the culprit as THE KILLER with motive and method", () => {
    const prompt = buildSuspectPrompt(culprit, stubCase);
    expect(prompt).toContain("YOU ARE THE KILLER");
    expect(prompt).toContain("going to fire her");
    expect(prompt).toContain("struck him with the vase");
  });

  it("labels an innocent suspect as INNOCENT", () => {
    const prompt = buildSuspectPrompt(innocent, stubCase);
    expect(prompt).toContain("YOU ARE INNOCENT");
    expect(prompt).not.toContain("YOU ARE THE KILLER");
  });

  it("includes interrogation behavior instructions", () => {
    const prompt = buildSuspectPrompt(culprit, stubCase);
    expect(prompt).toContain("2-3 sentences max");
    expect(prompt).toContain("BREAKPOINTS");
  });
});

describe("buildCaseRulesText", () => {
  const rulesText = buildCaseRulesText(stubCase);

  it("includes the case title in uppercase", () => {
    expect(rulesText).toContain("THE TEST MURDER");
  });

  it("includes the setting", () => {
    expect(rulesText).toContain("A cozy library on a rainy night");
  });

  it("includes victim information", () => {
    expect(rulesText).toContain("Dr. Finch");
    expect(rulesText).toContain("blunt force trauma");
  });

  it("includes timeline events with public/hidden markers", () => {
    expect(rulesText).toContain("9:00 PM");
    expect(rulesText).toContain("Dinner begins");
    expect(rulesText).toContain("[HIDDEN]");
  });

  it("does not mark public timeline events as hidden", () => {
    const dinnerLine = rulesText.split("\n").find((l) => l.includes("Dinner begins"));
    expect(dinnerLine).not.toContain("[HIDDEN]");
  });

  it("groups evidence by act", () => {
    expect(rulesText).toContain("Act 1 Evidence");
    expect(rulesText).toContain("Act 2 Evidence");
    expect(rulesText).toContain("Act 3 Evidence");
  });

  it("marks red herring evidence", () => {
    expect(rulesText).toContain("[RED HERRING]");
  });

  it("labels culprit and innocent suspects", () => {
    expect(rulesText).toContain("[CULPRIT]");
    expect(rulesText).toContain("[INNOCENT]");
  });

  it("includes suspect details: alibi, secrets, lies, breakpoints", () => {
    expect(rulesText).toContain("Alibi:");
    expect(rulesText).toContain("Secrets:");
    expect(rulesText).toContain("Lies:");
    expect(rulesText).toContain("Breakpoints:");
  });

  it("includes the solution section", () => {
    expect(rulesText).toContain("SOLUTION");
    expect(rulesText).toContain("Alice");
    expect(rulesText).toContain("going to fire her");
  });

  it("includes question budget", () => {
    expect(rulesText).toContain("Act 1: 3 questions");
    expect(rulesText).toContain("Act 2: 5 questions");
    expect(rulesText).toContain("Act 3: 3 questions");
  });
});

describe("buildInitialEvidenceBoard", () => {
  const board = buildInitialEvidenceBoard(stubCase);

  it("includes the case title", () => {
    expect(board).toContain("The Test Murder");
  });

  it("includes victim and cause of death", () => {
    expect(board).toContain("Dr. Finch");
    expect(board).toContain("blunt force trauma");
  });

  it("shows only Act 1 evidence", () => {
    expect(board).toContain("Broken vase");
    expect(board).toContain("Forged letter");
    expect(board).not.toContain("Blood sample");
    expect(board).not.toContain("Victim's diary");
  });

  it("includes evidence type in parentheses", () => {
    expect(board).toContain("(physical)");
    expect(board).toContain("(document)");
  });

  it("lists all suspects with alibi", () => {
    expect(board).toContain("Alice");
    expect(board).toContain("I was reading in my room");
    expect(board).toContain("Bob");
    expect(board).toContain("I was walking the dog");
  });

  it("includes suspect relationships", () => {
    expect(board).toContain("the victim's assistant");
    expect(board).toContain("the victim's neighbor");
  });

  it("handles case with no Act 1 evidence gracefully", () => {
    const noAct1Case: MysteryCase = {
      ...stubCase,
      evidence: stubCase.evidence.filter((e) => e.revealAct !== 1),
    };
    const board = buildInitialEvidenceBoard(noAct1Case);
    expect(board).toContain("Suspect Notes");
    expect(board).not.toContain("Broken vase");
  });

  it("uses translations when lang is provided", () => {
    const translatedCase: MysteryCase = {
      ...stubCase,
      translations: {
        zh: {
          title: "测试谋杀案",
          victim: { causeOfDeath: "钝器打击致死" },
          evidence: {
            "broken-vase": { name: "破碎的花瓶", description: "书桌旁的碎片" },
          },
          suspects: {
            alice: { relationship: "受害者的助手", alibi: "我在房间里看书" },
          },
        },
      },
    };
    const board = buildInitialEvidenceBoard(translatedCase, "zh");
    expect(board).toContain("测试谋杀案");
    expect(board).toContain("钝器打击致死");
    expect(board).toContain("破碎的花瓶");
    expect(board).toContain("书桌旁的碎片");
    expect(board).toContain("受害者的助手");
    expect(board).toContain("我在房间里看书");
    expect(board).not.toContain("The Test Murder");
    expect(board).not.toContain("blunt force trauma");
  });

  it("falls back to English when translation lang is missing", () => {
    const board = buildInitialEvidenceBoard(stubCase, "fr");
    expect(board).toContain("The Test Murder");
    expect(board).toContain("blunt force trauma");
  });
});
