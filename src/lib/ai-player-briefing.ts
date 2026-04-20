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
  ja: {
    header: "GM ブリーフィング:",
    speakLikePlayer: "- 卓上のプレイヤーらしく話す。ナレーター調は禁止。",
    concreteContribution: "- 毎ターン、具体的な進行（読み・追求・質問・反応）を1つ。",
    hiddenSide: "- 君は隠匿陣営: 紛れ込み、誘導しすぎず、絶対に正体を明かさない。",
    hiddenSideReason: "- 後で破綻しない、もっともらしい理由を選ぶ。",
    townSide: "- 君は市民側に近い: 曖昧な発言者には具体的な観察で詰める。",
    townSideReason: "- 投票理由は明快かつ簡潔に。漠然とした疑念だけで濁さない。",
    undercover: "- 君は潜伏側: ヒントは広めに、皆の言い回しに寄せ、過度に具体化しない。",
    civilian: "- 君は市民側: 露骨でない有用なヒントを出し、口調が浮いた者を指摘する。",
    secretWord: "- 今回の合言葉:",
    quizTempo: "- クイズのテンポ重視: 短い回答+簡潔な理由+一言の反応。",
    quizYesNo: "- Yes/No 質問を1つだけ、または確信があれば最終回答を出す。",
    quizBuildOnClues: "- 確定済みヒントだけを足場に。既出質問は繰り返さない。",
    cooperative: "- 共通目標に向けて協力。毎ターン行動か観察を1つ提案。",
    buildOnFindings: "- 仲間の発見の上に積む。判明済みのヒントは繰り返さない。",
    partyEnergy: "- 高めのテンションで遊び心を維持。他の発言にしっかり反応する。",
    partySpontaneous: "- 即興で。意外性は反復に勝る。",
    openIntent: "- 役柄を保ち、明確な意図でシーンを前に進める。",
    yourRole: "- 今回の君の役:",
  },
  ko: {
    header: "GM 브리핑:",
    speakLikePlayer: "- 식탁의 플레이어처럼 말하라. 나레이터 톤 금지.",
    concreteContribution: "- 매 턴 구체적인 진행(읽기·추궁·질문·반응) 한 가지를 더하라.",
    hiddenSide: "- 너는 은닉 진영: 묻혀가고, 과하게 이끌지 말고, 절대 정체를 밝히지 마라.",
    hiddenSideReason: "- 나중에 무너지지 않을, 그럴듯한 이유를 들어라.",
    townSide: "- 너는 시민 쪽일 가능성이 크다: 모호한 발언자에게 구체적 관찰로 압박하라.",
    townSideReason: "- 투표 논리는 명확하고 간결하게. 막연한 의심으로 메우지 마라.",
    undercover: "- 너는 잠입자: 단서는 넓게, 다수의 표현을 따라가고, 너무 구체적으로 말하지 마라.",
    civilian: "- 너는 시민 쪽: 노골적이지 않은 유용한 단서를 주고, 톤이 어긋난 자를 지적하라.",
    secretWord: "- 이번 라운드의 비밀어:",
    quizTempo: "- 퀴즈 템포 유지: 짧은 답 + 간결한 이유 + 짧은 반응.",
    quizYesNo: "- Yes/No 질문 한 개만 하거나, 확신이 있으면 최종 답을 내라.",
    quizBuildOnClues: "- 확정된 단서로만 진전하고, 이미 나온 질문은 절대 반복하지 마라.",
    cooperative: "- 공동 목표를 향해 협력. 매 턴 행동 또는 관찰 하나를 제안.",
    buildOnFindings: "- 동료가 찾은 것 위에 쌓아 올려라. 이미 알려진 단서는 반복하지 마라.",
    partyEnergy: "- 텐션을 높게 유지. 상대 발언에 또렷이 반응하라.",
    partySpontaneous: "- 즉흥적으로. 의외성이 반복을 이긴다.",
    openIntent: "- 캐릭터를 유지하고 분명한 의도 하나로 장면을 진전시켜라.",
    yourRole: "- 이번 라운드의 네 역할:",
  },
};

function pickLocale(code?: string): keyof typeof BRIEFING_I18N {
  if (!code) return "en";
  const lc = code.toLowerCase();
  if (lc.startsWith("zh")) return "zh";
  if (lc.startsWith("ja")) return "ja";
  if (lc.startsWith("ko")) return "ko";
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
