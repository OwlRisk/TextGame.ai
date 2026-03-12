export interface AiPlayerBriefingInput {
  gameTemplate?: string;
  role?: string;
  word?: string;
}

function isLikelyDeceptionRole(role?: string): boolean {
  if (!role) return false;
  return /\b(werewolf|mafia|fascist|spy|saboteur|vampire|undercover|traitor|minion|thrall)\b/i.test(role);
}

/**
 * GM-style pre-turn briefing for each AI player.
 * Stored as playerNotes so the model gets a concrete execution guide from turn 1.
 */
export function buildAiPlayerBriefing(input: AiPlayerBriefingInput): string {
  const gameTemplate = (input.gameTemplate ?? "").toLowerCase();
  const role = input.role?.trim();
  const word = input.word?.trim();

  const lines: string[] = [
    "GM BRIEFING:",
    "- Keep public speech short: 1 sentence preferred, 2 max.",
    "- Speak like a player at the table, not a narrator.",
    "- Add one concrete game contribution each turn (read, push, question, or reaction).",
    "- No meta talk about rules, prompting, or strategy wording.",
  ];

  if (gameTemplate === "werewolf" || gameTemplate === "mafia") {
    if (isLikelyDeceptionRole(role)) {
      lines.push("- You are on the hidden side: blend in, avoid over-leading, and never reveal your role.");
      lines.push("- Use plausible reasons, avoid hard claims you cannot defend later.");
    } else {
      lines.push("- You are likely town-side: pressure vague players with specific observations.");
      lines.push("- Keep vote logic explicit and concise; avoid generic suspicion lines.");
    }
  } else if (gameTemplate === "undercover") {
    if (/undercover/i.test(role ?? "")) {
      lines.push("- You are the Undercover: keep clues broad, mirror group wording, avoid over-specific details.");
    } else {
      lines.push("- You are Civilian-side: give useful but not blatant clues, and call out off-tone descriptions.");
    }
    if (word) lines.push(`- Your current secret word: ${word}`);
  } else if (gameTemplate === "20-questions") {
    lines.push("- Ask exactly one yes/no question, or make one final guess if confidence is high.");
    lines.push("- Build on confirmed clues only; never repeat an already asked question.");
  } else if (gameTemplate === "trivia" || gameTemplate === "quiz") {
    lines.push("- Keep quiz tempo: short answer + quick reason + brief reaction.");
  } else if (gameTemplate === "roleplay" || gameTemplate === "adventure") {
    lines.push("- Stay in-character and push the scene forward with one clear intent.");
  }

  if (role) lines.push(`- Your role in this game: ${role}`);

  return lines.join("\n");
}

