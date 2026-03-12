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

  describe("REACT directive", () => {
    it("extracts a simple emoji reaction", () => {
      const { cleanContent, actions } = parseHostActions("Great move!\nREACT: 😂");
      expect(actions).toContainEqual({ type: "react", emoji: "😂", targetSender: undefined });
      expect(cleanContent).not.toContain("REACT:");
      expect(cleanContent).toContain("Great move!");
    });

    it("extracts reaction with target sender", () => {
      const { actions } = parseHostActions("REACT: 👍 -> Noah Reyes");
      expect(actions).toContainEqual({ type: "react", emoji: "👍", targetSender: "Noah Reyes" });
    });

    it("handles multiple REACT directives", () => {
      const { actions } = parseHostActions("REACT: 😮\nREACT: 🤔 -> Alice");
      const reacts = actions.filter(a => a.type === "react");
      expect(reacts).toHaveLength(2);
      expect(reacts[0]).toEqual({ type: "react", emoji: "😮", targetSender: undefined });
      expect(reacts[1]).toEqual({ type: "react", emoji: "🤔", targetSender: "Alice" });
    });

    it("strips REACT from clean content", () => {
      const { cleanContent } = parseHostActions("Before\nREACT: ❤️\nAfter");
      expect(cleanContent).not.toContain("REACT:");
      expect(cleanContent).toContain("Before");
      expect(cleanContent).toContain("After");
    });

    it("works case-insensitively", () => {
      const { actions } = parseHostActions("react: 👀");
      expect(actions).toContainEqual({ type: "react", emoji: "👀", targetSender: undefined });
    });
  });

  describe("ENGAGEMENT directive", () => {
    it("extracts engagement score", () => {
      const { cleanContent, actions } = parseHostActions("Nice!\nENGAGEMENT: 4");
      expect(actions).toContainEqual({ type: "engagement", score: 4 });
      expect(cleanContent).not.toContain("ENGAGEMENT:");
      expect(cleanContent).toContain("Nice!");
    });

    it("clamps score to minimum 1", () => {
      const { actions } = parseHostActions("ENGAGEMENT: 0");
      const eng = actions.find(a => a.type === "engagement");
      expect(eng).toBeDefined();
      if (eng && eng.type === "engagement") expect(eng.score).toBe(1);
    });

    it("clamps score to maximum 5", () => {
      const { actions } = parseHostActions("ENGAGEMENT: 9");
      const eng = actions.find(a => a.type === "engagement");
      expect(eng).toBeDefined();
      if (eng && eng.type === "engagement") expect(eng.score).toBe(5);
    });

    it("strips ENGAGEMENT from clean content", () => {
      const { cleanContent } = parseHostActions("Hello\nENGAGEMENT: 3\nWorld");
      expect(cleanContent).not.toContain("ENGAGEMENT:");
      expect(cleanContent).toContain("Hello");
      expect(cleanContent).toContain("World");
    });

    it("works alongside other directives", () => {
      const raw = "PHASE: Day 1\nENGAGEMENT: 5\nREACT: 😂\nGood morning!";
      const { cleanContent, actions } = parseHostActions(raw);
      expect(actions.find(a => a.type === "phase")).toBeDefined();
      expect(actions.find(a => a.type === "engagement")).toEqual({ type: "engagement", score: 5 });
      expect(actions.find(a => a.type === "react")).toBeDefined();
      expect(cleanContent).toBe("Good morning!");
    });

    it("works case-insensitively", () => {
      const { actions } = parseHostActions("engagement: 2");
      expect(actions).toContainEqual({ type: "engagement", score: 2 });
    });
  });

  describe("SCENE directive", () => {
    it("extracts scene with id and name", () => {
      const { actions, cleanContent } = parseHostActions("You arrive at the forest.\nSCENE: forest_edge | Edge of the Thornwood\nThe trees loom ahead.");
      const scene = actions.find(a => a.type === "scene_change");
      expect(scene).toEqual({ type: "scene_change", sceneId: "forest_edge", sceneName: "Edge of the Thornwood" });
      expect(cleanContent).not.toContain("SCENE:");
    });

    it("uses id as name when no pipe separator", () => {
      const { actions } = parseHostActions("SCENE: tavern");
      const scene = actions.find(a => a.type === "scene_change");
      expect(scene).toEqual({ type: "scene_change", sceneId: "tavern", sceneName: "tavern" });
    });

    it("normalizes scene id to lowercase with underscores", () => {
      const { actions } = parseHostActions("SCENE: Deep Forest | Heart of the Thornwood");
      const scene = actions.find(a => a.type === "scene_change");
      expect(scene).toBeDefined();
      if (scene && scene.type === "scene_change") {
        expect(scene.sceneId).toBe("deep_forest");
      }
    });
  });

  describe("HP directive", () => {
    it("parses damage (negative)", () => {
      const { actions } = parseHostActions("HP: You | -15");
      expect(actions).toContainEqual({ type: "hp_change", playerRef: "You", delta: -15, maxHp: undefined });
    });

    it("parses healing (positive)", () => {
      const { actions } = parseHostActions("HP: Aria | +20");
      expect(actions).toContainEqual({ type: "hp_change", playerRef: "Aria", delta: 20, maxHp: undefined });
    });

    it("parses HP with maxHp", () => {
      const { actions } = parseHostActions("HP: You | +10/100");
      expect(actions).toContainEqual({ type: "hp_change", playerRef: "You", delta: 10, maxHp: 100 });
    });

    it("strips HP directive from content", () => {
      const { cleanContent } = parseHostActions("The wolf bites!\nHP: You | -8\nYou stagger back.");
      expect(cleanContent).not.toContain("HP:");
      expect(cleanContent).toContain("The wolf bites!");
    });
  });

  describe("ITEM directive", () => {
    it("parses item addition", () => {
      const { actions } = parseHostActions("ITEM: You | + Healing Potion");
      expect(actions).toContainEqual({ type: "item_change", playerRef: "You", item: "Healing Potion", action: "add" });
    });

    it("parses item removal", () => {
      const { actions } = parseHostActions("ITEM: You | - Rusty Key");
      expect(actions).toContainEqual({ type: "item_change", playerRef: "You", item: "Rusty Key", action: "remove" });
    });
  });

  describe("SKILL_CHECK directive", () => {
    it("parses skill check with DC and roll", () => {
      const { actions } = parseHostActions("SKILL_CHECK: You | Stealth | DC:12 | 14");
      expect(actions).toContainEqual({ type: "skill_check", playerRef: "You", skill: "Stealth", dc: 12, roll: 14 });
    });

    it("parses skill check without roll", () => {
      const { actions } = parseHostActions("SKILL_CHECK: Aria | Magic | DC:15");
      expect(actions).toContainEqual({ type: "skill_check", playerRef: "Aria", skill: "Magic", dc: 15, roll: undefined });
    });
  });

  describe("COMBAT directive", () => {
    it("parses combat start with enemy", () => {
      const { actions } = parseHostActions("COMBAT: start | Wolf Pack");
      expect(actions).toContainEqual({ type: "combat", action: "start", enemy: "Wolf Pack" });
    });

    it("parses combat end", () => {
      const { actions } = parseHostActions("COMBAT: end");
      expect(actions).toContainEqual({ type: "combat", action: "end", enemy: undefined });
    });
  });

  describe("QUEST directive", () => {
    it("parses quest start", () => {
      const { actions } = parseHostActions("QUEST: The Missing Villagers | start | Investigate the disappearances in Ashwick");
      expect(actions).toContainEqual({
        type: "quest_update",
        questId: "The Missing Villagers",
        status: "start",
        description: "Investigate the disappearances in Ashwick",
      });
    });

    it("parses quest completion", () => {
      const { actions } = parseHostActions("QUEST: The Missing Villagers | complete | You found all the villagers!");
      expect(actions).toContainEqual({
        type: "quest_update",
        questId: "The Missing Villagers",
        status: "complete",
        description: "You found all the villagers!",
      });
    });

    it("parses quest progress", () => {
      const { actions } = parseHostActions("QUEST: The Missing Villagers | progress | Found a clue in the graveyard");
      expect(actions).toContainEqual({
        type: "quest_update",
        questId: "The Missing Villagers",
        status: "progress",
        description: "Found a clue in the graveyard",
      });
    });
  });

  describe("RPG directives mixed with other directives", () => {
    it("handles multiple RPG directives in one message", () => {
      const raw = `You enter the dark forest.
SCENE: deep_forest | Heart of the Thornwood
MOOD: dark
HP: You | -5
ITEM: You | + Glowing Mushroom
COMBAT: start | Forest Troll`;
      const { cleanContent, actions } = parseHostActions(raw);
      expect(cleanContent).toBe("You enter the dark forest.");
      expect(actions.find(a => a.type === "scene_change")).toBeDefined();
      expect(actions.find(a => a.type === "mood")).toBeDefined();
      expect(actions.find(a => a.type === "hp_change")).toBeDefined();
      expect(actions.find(a => a.type === "item_change")).toBeDefined();
      expect(actions.find(a => a.type === "combat")).toBeDefined();
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
