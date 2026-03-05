import { describe, it, expect } from "vitest";
import { parseHostActions } from "../host-actions";

describe("parseHostActions — inline directives", () => {
  describe("PHASE directive", () => {
    it("extracts a simple phase label", () => {
      const { cleanContent, actions } = parseHostActions("Welcome everyone!\nPHASE: Night · Round 2\nLet the night begin.");
      expect(actions).toContainEqual({ type: "phase", label: "Night · Round 2" });
      expect(cleanContent).not.toContain("PHASE:");
      expect(cleanContent).toContain("Welcome everyone!");
      expect(cleanContent).toContain("Let the night begin.");
    });

    it("handles multiple PHASE directives (last one wins in actions list)", () => {
      const { actions } = parseHostActions("PHASE: Day 1\nSome text\nPHASE: Night 1");
      const phases = actions.filter(a => a.type === "phase");
      expect(phases).toHaveLength(2);
      expect(phases[0]).toEqual({ type: "phase", label: "Day 1" });
      expect(phases[1]).toEqual({ type: "phase", label: "Night 1" });
    });

    it("ignores PHASE in the middle of a line", () => {
      const { actions } = parseHostActions("This is not a PHASE: directive");
      expect(actions.filter(a => a.type === "phase")).toHaveLength(0);
    });
  });

  describe("ANNOUNCE directive", () => {
    it("extracts announcement text", () => {
      const { cleanContent, actions } = parseHostActions("ANNOUNCE: Vote time!\nPlease vote now.");
      expect(actions).toContainEqual({ type: "announce", text: "Vote time!" });
      expect(cleanContent).not.toContain("ANNOUNCE:");
      expect(cleanContent).toContain("Please vote now.");
    });
  });

  describe("MOOD directive", () => {
    it("extracts dark mood", () => {
      const { actions } = parseHostActions("MOOD: dark\nThe night is upon us.");
      expect(actions).toContainEqual({ type: "mood", value: "dark" });
    });

    it("extracts light mood", () => {
      const { actions } = parseHostActions("MOOD: light");
      expect(actions).toContainEqual({ type: "mood", value: "light" });
    });

    it("extracts neutral mood", () => {
      const { actions } = parseHostActions("MOOD: neutral");
      expect(actions).toContainEqual({ type: "mood", value: "neutral" });
    });

    it("ignores invalid mood values", () => {
      const { actions } = parseHostActions("MOOD: scary");
      expect(actions.filter(a => a.type === "mood")).toHaveLength(0);
    });

    it("is case-insensitive for value", () => {
      const { actions } = parseHostActions("MOOD: Dark");
      expect(actions).toContainEqual({ type: "mood", value: "dark" });
    });
  });

  describe("START_VOTE directive", () => {
    it("extracts vote with player options", () => {
      const { actions } = parseHostActions("START_VOTE: Who should be eliminated?");
      const vote = actions.find(a => a.type === "start_vote");
      expect(vote).toEqual({ type: "start_vote", question: "Who should be eliminated?", options: "players" });
    });

    it("extracts vote with custom options", () => {
      const { actions } = parseHostActions("START_VOTE: Which role to reveal? | Seer, Werewolf, Villager");
      const vote = actions.find(a => a.type === "start_vote");
      expect(vote).toBeDefined();
      if (vote && vote.type === "start_vote") {
        expect(vote.question).toBe("Which role to reveal?");
        expect(vote.options).toEqual(["Seer", "Werewolf", "Villager"]);
      }
    });

    it("falls back to players when options after pipe are empty", () => {
      const { actions } = parseHostActions("START_VOTE: Pick one |");
      const vote = actions.find(a => a.type === "start_vote");
      expect(vote).toBeDefined();
      if (vote && vote.type === "start_vote") {
        expect(vote.options).toBe("players");
      }
    });

    it("is removed from clean content", () => {
      const { cleanContent } = parseHostActions("Before\nSTART_VOTE: Who dies?\nAfter");
      expect(cleanContent).not.toContain("START_VOTE");
      expect(cleanContent).toContain("Before");
      expect(cleanContent).toContain("After");
    });
  });

  describe("END_VOTE directive", () => {
    it("extracts end_vote action", () => {
      const { actions } = parseHostActions("END_VOTE\nVoting is closed.");
      expect(actions).toContainEqual({ type: "end_vote" });
    });

    it("works with trailing whitespace", () => {
      const { actions } = parseHostActions("END_VOTE   ");
      expect(actions).toContainEqual({ type: "end_vote" });
    });
  });

  describe("TIMER directive", () => {
    it("extracts numeric timer", () => {
      const { actions } = parseHostActions("TIMER: 30\nYou have 30 seconds.");
      expect(actions).toContainEqual({ type: "timer", seconds: 30 });
    });

    it("extracts stop timer", () => {
      const { actions } = parseHostActions("TIMER: stop");
      expect(actions).toContainEqual({ type: "timer", seconds: "stop" });
    });

    it("handles large timer values", () => {
      const { actions } = parseHostActions("TIMER: 300");
      expect(actions).toContainEqual({ type: "timer", seconds: 300 });
    });

    it("is removed from clean content", () => {
      const { cleanContent } = parseHostActions("Ready?\nTIMER: 60\nGo!");
      expect(cleanContent).not.toContain("TIMER");
      expect(cleanContent).toContain("Ready?");
      expect(cleanContent).toContain("Go!");
    });
  });

  describe("multiple directives combined", () => {
    it("extracts all directives from a complex message", () => {
      const raw = `PHASE: Night · Round 3
MOOD: dark
ANNOUNCE: The werewolf awakens
The werewolf must choose a victim.
TIMER: 45
START_VOTE: Who to eliminate? | Alice, Bob, Charlie`;
      const { cleanContent, actions } = parseHostActions(raw);
      expect(actions.find(a => a.type === "phase")).toBeDefined();
      expect(actions.find(a => a.type === "mood")).toBeDefined();
      expect(actions.find(a => a.type === "announce")).toBeDefined();
      expect(actions.find(a => a.type === "timer")).toBeDefined();
      expect(actions.find(a => a.type === "start_vote")).toBeDefined();
      expect(cleanContent).toBe("The werewolf must choose a victim.");
    });

    it("returns empty clean content when message is only directives", () => {
      const { cleanContent } = parseHostActions("PHASE: End\nMOOD: neutral\nEND_VOTE");
      expect(cleanContent).toBe("");
    });
  });

  describe("block directives with inline directives", () => {
    it("extracts both BOARD blocks and inline PHASE", () => {
      const raw = `PHASE: Day 2
[BOARD:Alice] You are the Seer. [/BOARD]
The sun rises.`;
      const { cleanContent, actions } = parseHostActions(raw);
      expect(actions.find(a => a.type === "phase")).toBeDefined();
      expect(actions.find(a => a.type === "my_board")).toBeDefined();
      expect(cleanContent).toBe("The sun rises.");
    });
  });
});
