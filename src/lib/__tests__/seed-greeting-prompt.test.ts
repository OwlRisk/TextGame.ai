import { describe, it, expect } from "vitest";

/**
 * Tests for the isSeedGreeting prompt logic in player-speak route.
 * We replicate the prompt-building logic here for unit testing.
 */

function buildUserContent(opts: {
  gameName: string;
  gameTemplate?: string;
  playerName: string;
  personality?: string;
  background?: string;
  recentMessages: Array<{ senderName: string; content: string }>;
  isSeedGreeting?: boolean;
}): string {
  const { gameName, gameTemplate, playerName, personality, background, recentMessages, isSeedGreeting } = opts;
  const lines: string[] = [];
  lines.push(`Game: ${gameName}`);
  if (gameTemplate) lines.push(`Type: ${gameTemplate}`);
  lines.push("");
  if (personality) lines.push(`Your personality: ${personality}`);
  if (background) lines.push(`Your background: ${background}`);
  lines.push("");
  const recentText = recentMessages.map((m) => `${m.senderName}: ${m.content}`).join("\n");
  lines.push(`Recent conversation:\n${recentText || "(No messages yet)"}`);
  lines.push("");
  if (isSeedGreeting) {
    lines.push(`OPENING TURN (game has just started):
- Do NOT introduce yourself or restate your bio/name.
- Speak like you're already in the match.
- Give one short in-game move: a read, a push, a question, or a reaction to the host opening.
- For social deduction templates, prioritize pressure/suspicion language over chatter.
- Keep it 1 sentence preferred, 2 max.`);
  } else {
    lines.push(`Your turn. Reply as ${playerName}.`);
  }
  return lines.join("\n");
}

describe("seed greeting prompt", () => {
  it("includes opening-turn gameplay instruction when isSeedGreeting is true", () => {
    const content = buildUserContent({
      gameName: "Codenames",
      playerName: "Maya",
      isSeedGreeting: true,
      recentMessages: [{ senderName: "GM", content: "Welcome!" }],
    });
    expect(content).toContain("Do NOT introduce yourself");
    expect(content).toContain("already in the match");
    expect(content).toContain("one short in-game move");
    expect(content).toContain("1 sentence preferred, 2 max");
    expect(content).not.toContain("Your turn. Reply as");
  });

  it("uses standard prompt when isSeedGreeting is false", () => {
    const content = buildUserContent({
      gameName: "Codenames",
      playerName: "Maya",
      isSeedGreeting: false,
      recentMessages: [{ senderName: "GM", content: "Welcome!" }],
    });
    expect(content).toContain("Your turn. Reply as Maya.");
    expect(content).not.toContain("Do NOT introduce yourself");
  });

  it("uses standard prompt when isSeedGreeting is undefined", () => {
    const content = buildUserContent({
      gameName: "Mafia",
      playerName: "Jack",
      recentMessages: [],
    });
    expect(content).toContain("Your turn. Reply as Jack.");
  });

  it("includes recent messages so later speakers see what was already said", () => {
    const content = buildUserContent({
      gameName: "Werewolf",
      playerName: "Inez",
      isSeedGreeting: true,
      recentMessages: [
        { senderName: "GM", content: "Welcome everyone!" },
        { senderName: "Maya", content: "Hey, excited to play!" },
        { senderName: "Jae", content: "Let's get started!" },
      ],
    });
    expect(content).toContain("Maya: Hey, excited to play!");
    expect(content).toContain("Jae: Let's get started!");
    expect(content).toContain("already in the match");
  });

  it("includes personality and background in seed greeting", () => {
    const content = buildUserContent({
      gameName: "RPG",
      gameTemplate: "roleplay",
      playerName: "Warrior",
      personality: "Bold and fearless",
      background: "Former gladiator champion",
      isSeedGreeting: true,
      recentMessages: [{ senderName: "GM", content: "The adventure begins!" }],
    });
    expect(content).toContain("Your personality: Bold and fearless");
    expect(content).toContain("Your background: Former gladiator champion");
    expect(content).toContain("Type: roleplay");
  });
});

describe("seed greeting — prompt structure", () => {
  it("game name and template come first", () => {
    const content = buildUserContent({
      gameName: "Werewolf",
      gameTemplate: "werewolf",
      playerName: "Alice",
      isSeedGreeting: true,
      recentMessages: [],
    });
    const gameIdx = content.indexOf("Game: Werewolf");
    const typeIdx = content.indexOf("Type: werewolf");
    const seedIdx = content.indexOf("OPENING TURN");
    expect(gameIdx).toBeLessThan(typeIdx);
    expect(typeIdx).toBeLessThan(seedIdx);
  });

  it("recent conversation appears before seed instruction", () => {
    const content = buildUserContent({
      gameName: "Game",
      playerName: "Bob",
      isSeedGreeting: true,
      recentMessages: [{ senderName: "GM", content: "Hello" }],
    });
    const recentIdx = content.indexOf("Recent conversation:");
    const seedIdx = content.indexOf("OPENING TURN");
    expect(recentIdx).toBeLessThan(seedIdx);
  });
});
