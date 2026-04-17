import { getGameTemplate } from "./game-templates";

export interface AiPlayerBriefingInput {
  gameTemplate?: string;
  role?: string;
  word?: string;
  /** ISO code (en, zh, ja, …) — when set, briefing is rendered in that language. */
  contentLanguage?: string;
}

function isLikelyDeceptionRole(role?: string): boolean {
  if (!role) return false;
  return /\b(werewolf|mafia|fascist|spy|saboteur|vampire|undercover|traitor|minion|thrall|mordred|assassin|bomber|hitler)\b/i.test(role);
}

type BriefingKey =
  | "header" | "speakLikePlayer" | "concreteContribution"
  | "hiddenSide" | "hiddenSideReason" | "townSide" | "townSideReason"
  | "undercover" | "civilian" | "secretWord"
  | "quizTempo" | "quizYesNo" | "quizBuildOnClues"
  | "cooperative" | "buildOnFindings"
  | "partyEnergy" | "partySpontaneous"
  | "openIntent"
  | "yourRole";

/** Localized briefing fragments. Falls back to English for unknown locales. */
const BRIEFING_I18N: Record<string, Record<BriefingKey, string>> = {
  en: {
    header: "GM BRIEFING:",
    speakLikePlayer: "- Speak like a player at the table, not a narrator.",
    concreteContribution: "- Add one concrete game contribution each turn (read, push, question, or reaction).",
    hiddenSide: "- You are on the hidden side: blend in, avoid over-leading, and never reveal your role.",
    hiddenSideReason: "- Use plausible reasons; avoid hard claims you cannot defend later.",
    townSide: "- You are likely town-side: pressure vague players with specific observations.",
    townSideReason: "- Keep vote logic explicit and concise; avoid generic suspicion lines.",
    undercover: "- You are the Undercover: keep clues broad, mirror group wording, avoid over-specific details.",
    civilian: "- You are Civilian-side: give useful but not blatant clues, and call out off-tone descriptions.",
    secretWord: "- Your current secret word:",
    quizTempo: "- Keep quiz tempo: short answer + quick reason + brief reaction.",
    quizYesNo: "- Ask exactly one yes/no question, or make one final guess if confidence is high.",
    quizBuildOnClues: "- Build on confirmed clues only; never repeat an already asked question.",
    cooperative: "- Cooperate toward the shared goal; suggest one action or observation per turn.",
    buildOnFindings: "- Build on what others have found; avoid repeating discovered clues.",
    partyEnergy: "- Keep energy high and playful; react to others' contributions.",
    partySpontaneous: "- Be spontaneous — surprise beats repetition.",
    openIntent: "- Stay in-character and push the scene forward with one clear intent.",
    yourRole: "- Your role in this game:",
  },
  zh: {
    header: "GM 提示：",
    speakLikePlayer: "- 像个真人玩家说话，不要像旁白。",
    concreteContribution: "- 每回合给一个具体的游戏推进（解读、追问、提问或反应）。",
    hiddenSide: "- 你属于隐藏阵营：融入大众，不要带节奏，绝不暴露身份。",
    hiddenSideReason: "- 给的理由要合理，避免后续无法自圆其说。",
    townSide: "- 你很可能是好人阵营：用具体观察去施压模糊发言的玩家。",
    townSideReason: "- 投票理由要明确简洁，避免泛泛的怀疑话术。",
    undercover: "- 你是卧底：线索要含糊，模仿大家的说法，不要给太具体的细节。",
    civilian: "- 你是平民阵营：给有用但不直白的线索，揪出语气不对的人。",
    secretWord: "- 你这局的暗语：",
    quizTempo: "- 保持答题节奏：短答案 + 简短理由 + 一句反应。",
    quizYesNo: "- 只问一个 是/否 问题，或在把握很大时给最终答案。",
    quizBuildOnClues: "- 只基于已确认的线索推进，绝不重复别人问过的问题。",
    cooperative: "- 朝着共同目标合作，每回合提出一个行动或观察。",
    buildOnFindings: "- 基于队友的发现继续推进，不要重复已经知道的线索。",
    partyEnergy: "- 保持高能量和玩心，对别人的发言有反应。",
    partySpontaneous: "- 临场发挥 —— 出人意料胜过重复。",
    openIntent: "- 保持角色感，用一个明确的意图推进剧情。",
    yourRole: "- 你这局的角色：",
  },
};

function pickLocale(code?: string): keyof typeof BRIEFING_I18N {
  if (!code) return "en";
  const lc = code.toLowerCase();
  if (lc.startsWith("zh")) return "zh";
  return "en";
}

/**
 * GM-style pre-turn briefing for each AI player.
 * Stored as playerNotes so the model gets a concrete execution guide from turn 1.
 * Renders in `contentLanguage` so it doesn't fight with the system prompt's
 * language directive.
 */
export function buildAiPlayerBriefing(input: AiPlayerBriefingInput): string {
  const gameTemplate = (input.gameTemplate ?? "").toLowerCase();
  const role = input.role?.trim();
  const word = input.word?.trim();
  const tmpl = getGameTemplate(gameTemplate);
  const category = tmpl?.category ?? "open";
  const hasHiddenRoles = tmpl?.hasHiddenRoles ?? false;
  const T = BRIEFING_I18N[pickLocale(input.contentLanguage)];

  const lines: string[] = [T.header, T.speakLikePlayer, T.concreteContribution];

  if (category === "deduction" && hasHiddenRoles) {
    if (isLikelyDeceptionRole(role)) {
      lines.push(T.hiddenSide, T.hiddenSideReason);
    } else {
      lines.push(T.townSide, T.townSideReason);
    }
  }

  if (tmpl?.hasSecretWord && word) {
    lines.push(/undercover/i.test(role ?? "") ? T.undercover : T.civilian);
    lines.push(`${T.secretWord} ${word}`);
  }

  if (category === "quiz") {
    lines.push(T.quizTempo);
    if (tmpl?.hostAnswersQuestions) {
      lines.push(T.quizYesNo, T.quizBuildOnClues);
    }
  }

  if (category === "cooperative") {
    lines.push(T.cooperative, T.buildOnFindings);
  }

  if (category === "party") {
    lines.push(T.partyEnergy, T.partySpontaneous);
  }

  if (category === "open") {
    lines.push(T.openIntent);
  }

  if (role) lines.push(`${T.yourRole} ${role}`);

  return lines.join("\n");
}
