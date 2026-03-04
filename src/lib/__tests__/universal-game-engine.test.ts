import { describe, it, expect } from "vitest";
import { parseHostActions } from "../host-actions";
import { DEFAULT_GAME_PHASE } from "@/app/config/game-phase";
import type { GamePhaseState, GameMood, ActiveVote } from "@/app/config/game-phase";

// ═══════════════════════════════════════════════════════════════════════════════
// 1. game-phase.ts — universal phase types and defaults
// ═══════════════════════════════════════════════════════════════════════════════

describe("GamePhaseState defaults", () => {
  it("defaults to waiting phase with neutral mood", () => {
    expect(DEFAULT_GAME_PHASE.phase).toBe("waiting");
    expect(DEFAULT_GAME_PHASE.mood).toBe("neutral");
    expect(DEFAULT_GAME_PHASE.phaseLabel).toBe("");
  });

  it("has no active vote, timer, or game over summary by default", () => {
    expect(DEFAULT_GAME_PHASE.activeVote).toBeNull();
    expect(DEFAULT_GAME_PHASE.timerEndsAt).toBeNull();
    expect(DEFAULT_GAME_PHASE.gameOverSummary).toBe("");
  });

  it("only allows waiting | active | ended for phase", () => {
    const validPhases: GamePhaseState["phase"][] = ["waiting", "active", "ended"];
    validPhases.forEach((p) => {
      const state: GamePhaseState = { ...DEFAULT_GAME_PHASE, phase: p };
      expect(state.phase).toBe(p);
    });
  });

  it("only allows neutral | dark | light for mood", () => {
    const validMoods: GameMood[] = ["neutral", "dark", "light"];
    validMoods.forEach((m) => {
      const state: GamePhaseState = { ...DEFAULT_GAME_PHASE, mood: m };
      expect(state.mood).toBe(m);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. PHASE directive parsing
// ═══════════════════════════════════════════════════════════════════════════════

describe("parseHostActions — PHASE directive", () => {
  it("parses a simple PHASE label", () => {
    const raw = "The night begins.\n---\nPHASE: Night · Round 2\nNEXT_SPEAKER: Alice";
    const { cleanContent, actions } = parseHostActions(raw);
    const phase = actions.find((a) => a.type === "phase");
    expect(phase).toBeDefined();
    expect(phase!.type === "phase" && phase!.label).toBe("Night · Round 2");
    expect(cleanContent).not.toContain("PHASE:");
  });

  it("parses PHASE for trivia-style games", () => {
    const raw = "PHASE: Round 3 of 10";
    const { actions } = parseHostActions(raw);
    const phase = actions.find((a) => a.type === "phase");
    expect(phase).toBeDefined();
    if (phase?.type === "phase") expect(phase.label).toBe("Round 3 of 10");
  });

  it("parses PHASE for escape room puzzles", () => {
    const { actions } = parseHostActions("PHASE: Puzzle 2 — The Library");
    const phase = actions.find((a) => a.type === "phase");
    if (phase?.type === "phase") expect(phase.label).toBe("Puzzle 2 — The Library");
  });

  it("strips PHASE from cleanContent", () => {
    const raw = "Hello!\nPHASE: Chapter 3\nGoodbye!";
    const { cleanContent } = parseHostActions(raw);
    expect(cleanContent).not.toContain("PHASE:");
    expect(cleanContent).toContain("Hello!");
    expect(cleanContent).toContain("Goodbye!");
  });

  it("handles case-insensitive PHASE", () => {
    const { actions } = parseHostActions("phase: Night Round 1");
    expect(actions.some((a) => a.type === "phase")).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. ANNOUNCE directive parsing
// ═══════════════════════════════════════════════════════════════════════════════

describe("parseHostActions — ANNOUNCE directive", () => {
  it("parses ANNOUNCE text", () => {
    const raw = "ANNOUNCE: Night Falls — Close Your Eyes";
    const { actions } = parseHostActions(raw);
    const announce = actions.find((a) => a.type === "announce");
    expect(announce).toBeDefined();
    if (announce?.type === "announce") {
      expect(announce.text).toBe("Night Falls — Close Your Eyes");
    }
  });

  it("strips ANNOUNCE from cleanContent", () => {
    const raw = "Welcome.\nANNOUNCE: Voting Time\nChoose wisely.";
    const { cleanContent } = parseHostActions(raw);
    expect(cleanContent).not.toContain("ANNOUNCE:");
    expect(cleanContent).toContain("Welcome.");
    expect(cleanContent).toContain("Choose wisely.");
  });

  it("parses multiple ANNOUNCE directives in order", () => {
    const raw = "ANNOUNCE: Round 1\nSome text\nANNOUNCE: Round 2";
    const { actions } = parseHostActions(raw);
    const announces = actions.filter((a) => a.type === "announce");
    expect(announces).toHaveLength(2);
    if (announces[0]?.type === "announce") expect(announces[0].text).toBe("Round 1");
    if (announces[1]?.type === "announce") expect(announces[1].text).toBe("Round 2");
  });

  it("handles case-insensitive ANNOUNCE", () => {
    const { actions } = parseHostActions("announce: Game Over Phase");
    expect(actions.some((a) => a.type === "announce")).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. MOOD directive parsing
// ═══════════════════════════════════════════════════════════════════════════════

describe("parseHostActions — MOOD directive", () => {
  it("parses MOOD: dark", () => {
    const { actions } = parseHostActions("MOOD: dark");
    const mood = actions.find((a) => a.type === "mood");
    expect(mood).toBeDefined();
    if (mood?.type === "mood") expect(mood.value).toBe("dark");
  });

  it("parses MOOD: light", () => {
    const { actions } = parseHostActions("MOOD: light");
    const mood = actions.find((a) => a.type === "mood");
    if (mood?.type === "mood") expect(mood.value).toBe("light");
  });

  it("parses MOOD: neutral", () => {
    const { actions } = parseHostActions("MOOD: neutral");
    const mood = actions.find((a) => a.type === "mood");
    if (mood?.type === "mood") expect(mood.value).toBe("neutral");
  });

  it("ignores invalid MOOD values", () => {
    const { actions } = parseHostActions("MOOD: spooky");
    expect(actions.filter((a) => a.type === "mood")).toHaveLength(0);
  });

  it("strips MOOD from cleanContent", () => {
    const raw = "It's getting dark.\nMOOD: dark";
    const { cleanContent } = parseHostActions(raw);
    expect(cleanContent).not.toContain("MOOD:");
    expect(cleanContent).toContain("It's getting dark.");
  });

  it("handles case-insensitive MOOD", () => {
    const { actions } = parseHostActions("mood: Dark");
    const mood = actions.find((a) => a.type === "mood");
    expect(mood).toBeDefined();
    if (mood?.type === "mood") expect(mood.value).toBe("dark");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. START_VOTE / END_VOTE directive parsing
// ═══════════════════════════════════════════════════════════════════════════════

describe("parseHostActions — START_VOTE / END_VOTE directives", () => {
  it("parses START_VOTE with player-based options (no pipe)", () => {
    const raw = "START_VOTE: Who should be banished?";
    const { actions } = parseHostActions(raw);
    const vote = actions.find((a) => a.type === "start_vote");
    expect(vote).toBeDefined();
    if (vote?.type === "start_vote") {
      expect(vote.question).toBe("Who should be banished?");
      expect(vote.options).toBe("players");
    }
  });

  it("parses START_VOTE with custom options (pipe-separated)", () => {
    const raw = "START_VOTE: Approve or reject? | Approve, Reject";
    const { actions } = parseHostActions(raw);
    const vote = actions.find((a) => a.type === "start_vote");
    if (vote?.type === "start_vote") {
      expect(vote.question).toBe("Approve or reject?");
      expect(vote.options).toEqual(["Approve", "Reject"]);
    }
  });

  it("parses START_VOTE with three custom options", () => {
    const raw = "START_VOTE: Which is the lie? | Statement A, Statement B, Statement C";
    const { actions } = parseHostActions(raw);
    const vote = actions.find((a) => a.type === "start_vote");
    if (vote?.type === "start_vote") {
      expect(vote.question).toBe("Which is the lie?");
      expect(vote.options).toEqual(["Statement A", "Statement B", "Statement C"]);
    }
  });

  it("parses END_VOTE", () => {
    const raw = "END_VOTE";
    const { actions } = parseHostActions(raw);
    expect(actions.some((a) => a.type === "end_vote")).toBe(true);
  });

  it("strips both START_VOTE and END_VOTE from cleanContent", () => {
    const raw = "Let's vote.\nSTART_VOTE: Pick one | A, B\nSome chat.\nEND_VOTE\nDone.";
    const { cleanContent } = parseHostActions(raw);
    expect(cleanContent).not.toContain("START_VOTE:");
    expect(cleanContent).not.toContain("END_VOTE");
    expect(cleanContent).toContain("Let's vote.");
    expect(cleanContent).toContain("Done.");
  });

  it("handles empty options after pipe as 'players'", () => {
    const raw = "START_VOTE: Who dies? | ";
    const { actions } = parseHostActions(raw);
    const vote = actions.find((a) => a.type === "start_vote");
    if (vote?.type === "start_vote") {
      expect(vote.options).toBe("players");
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 6. TIMER directive parsing
// ═══════════════════════════════════════════════════════════════════════════════

describe("parseHostActions — TIMER directive", () => {
  it("parses TIMER with seconds", () => {
    const { actions } = parseHostActions("TIMER: 60");
    const timer = actions.find((a) => a.type === "timer");
    expect(timer).toBeDefined();
    if (timer?.type === "timer") expect(timer.seconds).toBe(60);
  });

  it("parses TIMER with large value", () => {
    const { actions } = parseHostActions("TIMER: 300");
    const timer = actions.find((a) => a.type === "timer");
    if (timer?.type === "timer") expect(timer.seconds).toBe(300);
  });

  it("parses TIMER: stop", () => {
    const { actions } = parseHostActions("TIMER: stop");
    const timer = actions.find((a) => a.type === "timer");
    if (timer?.type === "timer") expect(timer.seconds).toBe("stop");
  });

  it("strips TIMER from cleanContent", () => {
    const raw = "Hurry up!\nTIMER: 30\nChoose now.";
    const { cleanContent } = parseHostActions(raw);
    expect(cleanContent).not.toContain("TIMER:");
    expect(cleanContent).toContain("Hurry up!");
    expect(cleanContent).toContain("Choose now.");
  });

  it("handles case-insensitive TIMER", () => {
    const { actions } = parseHostActions("timer: 45");
    expect(actions.some((a) => a.type === "timer")).toBe(true);
  });

  it("ignores TIMER with non-numeric non-stop values", () => {
    const { actions } = parseHostActions("TIMER: abc");
    expect(actions.filter((a) => a.type === "timer")).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 7. Combined directive parsing — realistic GM output
// ═══════════════════════════════════════════════════════════════════════════════

describe("parseHostActions — combined GM output", () => {
  it("parses a realistic Werewolf night transition", () => {
    const raw = [
      "The village sleeps as darkness falls.",
      "---",
      "PHASE: Night · Round 2",
      "ANNOUNCE: Night Falls — Close Your Eyes",
      "MOOD: dark",
      "TIMER: 60",
      "NEXT_SPEAKER: Alice, Bob",
    ].join("\n");

    const { actions } = parseHostActions(raw);
    expect(actions.find((a) => a.type === "phase")).toBeDefined();
    expect(actions.find((a) => a.type === "announce")).toBeDefined();
    expect(actions.find((a) => a.type === "mood")).toBeDefined();
    expect(actions.find((a) => a.type === "timer")).toBeDefined();
  });

  it("parses a realistic voting phase", () => {
    const raw = [
      "Time to vote!",
      "---",
      "PHASE: Voting",
      "ANNOUNCE: Voting Time",
      "MOOD: light",
      "START_VOTE: Who should be banished?",
      "TIMER: 90",
    ].join("\n");

    const { actions } = parseHostActions(raw);
    const phase = actions.find((a) => a.type === "phase");
    const vote = actions.find((a) => a.type === "start_vote");
    const timer = actions.find((a) => a.type === "timer");
    expect(phase).toBeDefined();
    expect(vote).toBeDefined();
    expect(timer).toBeDefined();
    if (vote?.type === "start_vote") {
      expect(vote.question).toBe("Who should be banished?");
      expect(vote.options).toBe("players");
    }
  });

  it("parses a trivia round with custom vote options", () => {
    const raw = [
      "Question 5: What is the capital of France?",
      "---",
      "PHASE: Round 5 of 10",
      "START_VOTE: What is the capital of France? | Paris, London, Berlin, Madrid",
      "TIMER: 30",
    ].join("\n");

    const { actions } = parseHostActions(raw);
    const vote = actions.find((a) => a.type === "start_vote");
    if (vote?.type === "start_vote") {
      expect(vote.question).toBe("What is the capital of France?");
      expect(vote.options).toEqual(["Paris", "London", "Berlin", "Madrid"]);
    }
  });

  it("parses game over with summary", () => {
    const raw = [
      "The werewolves have won!",
      "---",
      "PHASE: Game Over",
      "MOOD: neutral",
      "[GAME_OVER]The werewolves eliminated all villagers. Victory for the wolves![/GAME_OVER]",
    ].join("\n");

    const { actions } = parseHostActions(raw);
    const gameOver = actions.find((a) => a.type === "game_over");
    expect(gameOver).toBeDefined();
    if (gameOver?.type === "game_over") {
      expect(gameOver.summary).toContain("werewolves");
    }
  });

  it("correctly strips all directives from cleanContent leaving only public message", () => {
    const raw = [
      "Welcome to the game!",
      "---",
      "PHASE: Intro",
      "ANNOUNCE: Game Start",
      "MOOD: neutral",
      "NEXT_SPEAKER: Alice",
    ].join("\n");

    const { cleanContent } = parseHostActions(raw);
    expect(cleanContent).not.toContain("PHASE:");
    expect(cleanContent).not.toContain("ANNOUNCE:");
    expect(cleanContent).not.toContain("MOOD:");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 8. ActiveVote type validation
// ═══════════════════════════════════════════════════════════════════════════════

describe("ActiveVote type", () => {
  it("supports 'players' as options", () => {
    const vote: ActiveVote = { question: "Who?", options: "players" };
    expect(vote.options).toBe("players");
  });

  it("supports string array as options", () => {
    const vote: ActiveVote = { question: "Choose", options: ["A", "B", "C"] };
    expect(vote.options).toEqual(["A", "B", "C"]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 9. Backward compatibility — existing directives still work
// ═══════════════════════════════════════════════════════════════════════════════

describe("parseHostActions — backward compatibility", () => {
  it("still parses [BOARD:Player] blocks alongside new directives", () => {
    const raw = [
      "Good morning!",
      "[BOARD:You]",
      "You are the Seer.",
      "[/BOARD]",
      "PHASE: Night · Round 1",
    ].join("\n");

    const { actions, cleanContent } = parseHostActions(raw);
    const board = actions.find((a) => a.type === "my_board");
    const phase = actions.find((a) => a.type === "phase");
    expect(board).toBeDefined();
    expect(phase).toBeDefined();
    expect(cleanContent).toContain("Good morning!");
    expect(cleanContent).not.toContain("[BOARD");
    expect(cleanContent).not.toContain("PHASE:");
  });

  it("still parses [SECTION:Title] blocks", () => {
    const raw = [
      "[SECTION:Vote Log]",
      "Round 1: Alice was eliminated.",
      "[/SECTION]",
      "ANNOUNCE: Round 2 Begins",
    ].join("\n");

    const { actions } = parseHostActions(raw);
    expect(actions.some((a) => a.type === "section")).toBe(true);
    expect(actions.some((a) => a.type === "announce")).toBe(true);
  });

  it("still parses [GAME_OVER] blocks", () => {
    const raw = "[GAME_OVER]Villagers win![/GAME_OVER]";
    const { actions } = parseHostActions(raw);
    const gameOver = actions.find((a) => a.type === "game_over");
    expect(gameOver).toBeDefined();
    if (gameOver?.type === "game_over") {
      expect(gameOver.summary).toBe("Villagers win!");
    }
  });

  it("still parses [MY_NOTES] blocks", () => {
    const raw = "[MY_NOTES]I suspect Alice is the wolf.[/MY_NOTES]\nMOOD: dark";
    const { actions } = parseHostActions(raw);
    expect(actions.some((a) => a.type === "player_notes")).toBe(true);
    expect(actions.some((a) => a.type === "mood")).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 10. Edge cases
// ═══════════════════════════════════════════════════════════════════════════════

describe("parseHostActions — edge cases", () => {
  it("does not parse PHASE-like text in the middle of a sentence", () => {
    const raw = "I think the PHASE: something is wrong";
    const { actions } = parseHostActions(raw);
    // PHASE must start at the beginning of a line
    expect(actions.filter((a) => a.type === "phase")).toHaveLength(0);
  });

  it("does not parse START_VOTE embedded in a sentence", () => {
    const raw = "Let's discuss START_VOTE: something before voting";
    const { actions } = parseHostActions(raw);
    expect(actions.filter((a) => a.type === "start_vote")).toHaveLength(0);
  });

  it("handles TIMER: 0 as valid (immediate expiry)", () => {
    const { actions } = parseHostActions("TIMER: 0");
    const timer = actions.find((a) => a.type === "timer");
    if (timer?.type === "timer") expect(timer.seconds).toBe(0);
  });

  it("handles empty input", () => {
    const { cleanContent, actions } = parseHostActions("");
    expect(cleanContent).toBe("");
    expect(actions).toHaveLength(0);
  });

  it("handles PHASE with trailing whitespace", () => {
    const { actions } = parseHostActions("PHASE: Night · Round 1   ");
    const phase = actions.find((a) => a.type === "phase");
    if (phase?.type === "phase") expect(phase.label).toBe("Night · Round 1");
  });

  it("handles END_VOTE with trailing whitespace", () => {
    const { actions } = parseHostActions("END_VOTE   ");
    expect(actions.some((a) => a.type === "end_vote")).toBe(true);
  });
});
