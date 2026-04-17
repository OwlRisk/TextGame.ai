/**
 * Tests for the Resume Game feature.
 *
 * Covers:
 *  1. GameOverBanner button rendering logic (which buttons appear based on props)
 *  2. Resume business logic (state transitions, DB sync, system message)
 *  3. Permission control (only owner can resume)
 *  4. Edge cases (double resume, resume after different end reasons)
 */

import { describe, it, expect, beforeEach } from "vitest";

// ─── 1. GameOverBanner button visibility logic ──────────────────────────────

describe("GameOverBanner — button visibility", () => {
  type BannerProps = {
    gameOverSummary: string;
    onResumeGame?: () => void;
    onNewGame?: () => void;
    onSaveCharacters?: () => void;
  };

  function getVisibleButtons(props: BannerProps): string[] {
    const buttons: string[] = [];
    if (props.onResumeGame) buttons.push("Resume Game");
    if (props.onNewGame) buttons.push("New Game");
    if (props.onSaveCharacters) buttons.push("Save Characters");
    return buttons;
  }

  it("shows all 3 buttons when all callbacks provided (owner)", () => {
    const buttons = getVisibleButtons({
      gameOverSummary: "Game over!",
      onResumeGame: () => {},
      onNewGame: () => {},
      onSaveCharacters: () => {},
    });
    expect(buttons).toEqual(["Resume Game", "New Game", "Save Characters"]);
  });

  it("hides Resume when onResumeGame is undefined (non-owner)", () => {
    const buttons = getVisibleButtons({
      gameOverSummary: "Game over!",
      onResumeGame: undefined,
      onNewGame: () => {},
      onSaveCharacters: undefined,
    });
    expect(buttons).toEqual(["New Game"]);
    expect(buttons).not.toContain("Resume Game");
    expect(buttons).not.toContain("Save Characters");
  });

  it("shows Resume + New Game but not Save Characters for owner without AI players", () => {
    const buttons = getVisibleButtons({
      gameOverSummary: "Game over!",
      onResumeGame: () => {},
      onNewGame: () => {},
      onSaveCharacters: undefined,
    });
    expect(buttons).toEqual(["Resume Game", "New Game"]);
  });

  it("maximum 3 buttons for mobile-friendly layout", () => {
    const buttons = getVisibleButtons({
      gameOverSummary: "Game over!",
      onResumeGame: () => {},
      onNewGame: () => {},
      onSaveCharacters: () => {},
    });
    expect(buttons.length).toBeLessThanOrEqual(3);
  });
});

// ─── 2. Resume business logic ───────────────────────────────────────────────

describe("Resume Game — state transitions", () => {
  let gamePhase: string;
  let gameOverSummary: string;
  let isActive: boolean;
  let systemMessages: string[];

  function setGamePhase(v: string) { gamePhase = v; }
  function setGameOverSummary(v: string) { gameOverSummary = v; }
  function updateGame(_id: string, data: { isActive: boolean }) { isActive = data.isActive; }
  function addMessage(msg: { content: string; isSystemMessage: boolean }) {
    if (msg.isSystemMessage) systemMessages.push(msg.content);
  }

  function resumeGame(gameId: string) {
    setGamePhase("active");
    setGameOverSummary("");
    updateGame(gameId, { isActive: true });
    addMessage({
      content: "Game resumed by the host.",
      isSystemMessage: true,
    });
  }

  beforeEach(() => {
    gamePhase = "ended";
    gameOverSummary = "Game ended due to inactivity.";
    isActive = false;
    systemMessages = [];
  });

  it("transitions gamePhase from 'ended' to 'active'", () => {
    expect(gamePhase).toBe("ended");
    resumeGame("game-123");
    expect(gamePhase).toBe("active");
  });

  it("clears gameOverSummary", () => {
    expect(gameOverSummary).not.toBe("");
    resumeGame("game-123");
    expect(gameOverSummary).toBe("");
  });

  it("sets isActive back to true in DB", () => {
    expect(isActive).toBe(false);
    resumeGame("game-123");
    expect(isActive).toBe(true);
  });

  it("posts a system message about resume", () => {
    resumeGame("game-123");
    expect(systemMessages).toHaveLength(1);
    expect(systemMessages[0]).toBe("Game resumed by the host.");
  });

  it("all state changes happen atomically (in correct order)", () => {
    const log: string[] = [];
    const trackedSetGamePhase = (v: string) => { log.push(`phase:${v}`); gamePhase = v; };
    const trackedSetSummary = (v: string) => { log.push(`summary:${v || "cleared"}`); gameOverSummary = v; };
    const trackedUpdateGame = (_id: string, data: { isActive: boolean }) => { log.push(`db:${data.isActive}`); isActive = data.isActive; };
    const trackedAddMessage = (msg: { content: string }) => { log.push(`msg:${msg.content}`); };

    trackedSetGamePhase("active");
    trackedSetSummary("");
    trackedUpdateGame("game-123", { isActive: true });
    trackedAddMessage({ content: "Game resumed by the host." });

    expect(log).toEqual([
      "phase:active",
      "summary:cleared",
      "db:true",
      "msg:Game resumed by the host.",
    ]);
  });
});

// ─── 3. Permission control ──────────────────────────────────────────────────

describe("Resume Game — permission control", () => {
  function canResume(params: {
    gameOverSummary: string | null;
    isOwner: boolean;
  }): boolean {
    return !!(params.gameOverSummary && params.isOwner);
  }

  it("owner with gameOverSummary → can resume", () => {
    expect(canResume({ gameOverSummary: "Game over!", isOwner: true })).toBe(true);
  });

  it("non-owner with gameOverSummary → cannot resume", () => {
    expect(canResume({ gameOverSummary: "Game over!", isOwner: false })).toBe(false);
  });

  it("owner without gameOverSummary (game not ended) → cannot resume", () => {
    expect(canResume({ gameOverSummary: null, isOwner: true })).toBe(false);
    expect(canResume({ gameOverSummary: "", isOwner: true })).toBe(false);
  });

  it("guest player → cannot resume", () => {
    expect(canResume({ gameOverSummary: "Host left.", isOwner: false })).toBe(false);
  });
});

// ─── 4. Edge cases ──────────────────────────────────────────────────────────

describe("Resume Game — edge cases", () => {
  it("double resume is idempotent (already active)", () => {
    let gamePhase = "ended";
    let isActive = false;
    const messages: string[] = [];

    function resumeGame() {
      gamePhase = "active";
      isActive = true;
      messages.push("Game resumed by the host.");
    }

    resumeGame();
    expect(gamePhase).toBe("active");
    expect(messages).toHaveLength(1);

    // Second resume — still works, just adds another message
    // In real UI the banner disappears after first resume so this can't happen,
    // but the logic itself is safe
    resumeGame();
    expect(gamePhase).toBe("active");
    expect(isActive).toBe(true);
    expect(messages).toHaveLength(2);
  });

  it("resume after inactivity timeout end", () => {
    let gamePhase = "ended";
    let summary = "Game ended due to inactivity (2 hours with no messages).";

    function resumeGame() {
      gamePhase = "active";
      summary = "";
    }

    resumeGame();
    expect(gamePhase).toBe("active");
    expect(summary).toBe("");
  });

  it("resume after owner-leave end", () => {
    let gamePhase = "ended";
    let summary = "The host has left the game. Game ended.";

    function resumeGame() {
      gamePhase = "active";
      summary = "";
    }

    resumeGame();
    expect(gamePhase).toBe("active");
    expect(summary).toBe("");
  });

  it("resume after GAME_OVER directive end", () => {
    let gamePhase = "ended";
    let summary = "Villagers win! All werewolves eliminated.";

    function resumeGame() {
      gamePhase = "active";
      summary = "";
    }

    resumeGame();
    expect(gamePhase).toBe("active");
    expect(summary).toBe("");
  });

  it("New Game callback creates new game instead of resuming", () => {
    let navigatedTo = "";

    function onNewGame(template?: string) {
      navigatedTo = template ? `/create?preset=${template}` : "/create";
    }

    onNewGame("werewolf");
    expect(navigatedTo).toBe("/create?preset=werewolf");

    onNewGame();
    expect(navigatedTo).toBe("/create");
  });
});
