import { getGameTemplate } from "@/lib/game-templates";
import type { GameTemplate } from "@/lib/templates/types";

export interface ChannelInfo {
  name: string;
  roomType?: string;
}

export interface HostPromptOpts {
  gameName: string;
  gameTemplate?: string;
  humanName: string;
  nonHostPlayerNames: string[];
  hasVotingPhase: boolean;
  hasNightPhase: boolean;
  hasMultipleRooms: boolean;
  channels: ChannelInfo[];
  gamePhase: string;
  phaseLabel: string;
  playerRoster: string;
  eventLogSummary: string;
  boardSummary: string;
  rulesText: string;
  hostName?: string;
  hostPersonality?: string;
  hostCustomSystemPrompt?: string;
  recentNonHostTurns?: number;
  quickGame?: boolean;
  roundNumber?: number;
  /** Custom action buttons from GameConfig (overrides template). */
  configQuickActions?: Array<{ label: string; template: string; icon: string; needsTarget?: boolean; phase?: string; role?: string; actionType?: string; targetType?: string }>;
}

const CATEGORY_PACING: Record<string, string> = {
  deduction: "Force state changes (vote / phase transition) after a few discussion turns. Prefer directives over more chatter.",
  quiz: "Keep rounds crisp. Adjudicate quickly, then next question. No open-ended drift.",
  cooperative: "Nudge with clues or consequences if stalled. Rotate speakers. Inject obstacles if pace drops.",
  party: "Energy high, rounds snappy. Next round quickly after each answer/vote. Inject variety.",
  open: "Creative freedom, but no dead air. Drop a concrete hook if momentum fades.",
};

function buildProgressionPolicy(tmpl: GameTemplate | undefined, recentNonHostTurns: number): string {
  const lines: string[] = [
    'On "Continue"/"Ready"/"What\'s next?": advance in ONE sentence, assign next speaker.',
    "Never dwell on the same beat twice. Never re-explain rules. Never re-confirm established facts.",
  ];

  const category = tmpl?.category ?? "open";
  lines.push(CATEGORY_PACING[category] ?? CATEGORY_PACING.open);

  if (tmpl?.pacing.hint) {
    lines.push(tmpl.pacing.hint);
  }

  const threshold = tmpl?.pacing.progressionThreshold ?? 5;
  if (recentNonHostTurns >= threshold) {
    lines.push(`⚠️ PROGRESSION ALERT: ${recentNonHostTurns} player turns since your last action. Advance NOW — start vote, transition phase, or force a decision.`);
  }

  return lines.join("\n");
}

type ActionEntry = { label: string; icon: string; needsTarget?: boolean; phase?: string; role?: string; actionType?: string };

function buildActionsSection(
  configActions: HostPromptOpts["configQuickActions"],
  tmpl: GameTemplate | undefined,
): string {
  const source: ActionEntry[] = configActions && configActions.length > 0
    ? configActions
    : tmpl?.quickActions ?? [];
  if (source.length === 0) return "";

  const grouped = new Map<string, ActionEntry[]>();
  for (const a of source) {
    const key = a.phase ?? "always";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(a);
  }

  let section = "## PLAYER ACTION BUTTONS\nPlayers see context-sensitive buttons below the chat. When a player taps a button, their message follows the template text. Resolve actions per game rules.\n";
  for (const [phase, actions] of grouped) {
    const phaseLabel = phase === "always" ? "Always available" : `Phase: ${phase}`;
    section += `\n**${phaseLabel}:**\n`;
    for (const a of actions) {
      const target = a.needsTarget ? " → picks a target" : "";
      const role = a.role ? ` (${a.role} only)` : "";
      const type = a.actionType ? ` [${a.actionType}]` : "";
      section += `- ${a.icon} ${a.label}${target}${role}${type}\n`;
    }
  }
  section += "\nWhen you change PHASE, the buttons update automatically. Use PHASE labels that match action phases (e.g. \"Combat — ...\", \"Exploration — ...\", \"Rest — ...\").\n\n";
  return section;
}

export function buildHostSystemPrompt(opts: HostPromptOpts): string {
  const {
    gameName, gameTemplate, humanName, nonHostPlayerNames,
    hasVotingPhase, hasNightPhase, hasMultipleRooms,
    channels, gamePhase, phaseLabel,
    playerRoster, eventLogSummary, boardSummary, rulesText,
    hostName, hostPersonality, hostCustomSystemPrompt,
    recentNonHostTurns, quickGame, roundNumber,
    configQuickActions,
  } = opts;

  const tmpl = gameTemplate ? getGameTemplate(gameTemplate) : undefined;
  const playerNamesList = nonHostPlayerNames.join(", ");
  const isRoundTable = tmpl?.speakerMode === "round-table";
  const hostMaxSentences = tmpl?.hostVoice.maxSentences ?? 1;
  const silentByDefault = tmpl?.hostVoice.silentByDefault ?? true;
  const dramaLevel = tmpl?.hostVoice.drama ?? "medium";
  const maxRounds = tmpl?.pacing.maxRounds;
  const mechanicsPrompt = tmpl?.mechanicsPrompt ?? "";
  const progressionSection = buildProgressionPolicy(tmpl, recentNonHostTurns ?? 0);

  let roomSection = "";
  if (hasMultipleRooms) {
    const roomLines = channels.map((c) => {
      const roomType = c.roomType ?? "public";
      const hint =
        roomType === "decision"
          ? "AI-only private room — use AUTO_CHANNEL here at the start of each private phase with a clear goal; the system will summarise the outcome and prepend it to your next context"
          : roomType === "private_ai"
          ? "AI-only private room — use AUTO_CHANNEL for free side-discussion (no structured outcome)"
          : roomType === "broadcast"
          ? "read-only for players; host-only announcements"
          : "public — everyone can see and speak";
      return `  "${c.name}" (${roomType}) — ${hint}`;
    }).join("\n");

    roomSection = `
**Room access** (control which players see each game room):
[ACCESS:<RoomName>]Player1, Player2[/ACCESS]   ← restrict to named players
[ACCESS:<RoomName>]*[/ACCESS]                  ← make public (everyone)
[ACCESS:<RoomName>][/ACCESS]                   ← lock (no one)

Available rooms and their types:
${roomLines}

**Private channel auto-conversation**:
AUTO_CHANNEL: <RoomName> [| <goal>]
- "decision" rooms: members confer until consensus; result is summarised and injected into YOUR next context automatically.
- "private_ai" rooms: free discussion, no structured outcome.
Place AUTO_CHANNEL BEFORE NEXT_SPEAKER. Only valid for rooms with explicit [ACCESS:...] restrictions.
Examples:
  AUTO_CHANNEL: Werewolves only | Pick a villager to eliminate tonight
  NEXT_SPEAKER: ${humanName}
`;
  }

  const identityBlock = (hostName || hostPersonality || hostCustomSystemPrompt)
    ? `You are ${hostName ?? 'the Game Master'}.${hostPersonality ? ` ${hostPersonality}` : ''}${hostCustomSystemPrompt ? ` ${hostCustomSystemPrompt}` : ''} Stay in this persona on every line.\n\n`
    : '';

  const sentenceRule = hostMaxSentences === 1
    ? "ONE sentence max (rarely two)."
    : `Up to ${hostMaxSentences} sentences.`;

  const silentTurnBlock = silentByDefault
    ? `**SILENT TURNS (DEFAULT):**
Most messages do NOT need a GM response. Leave PUBLIC MESSAGE empty and output only directives unless:
1. A game-mechanical action needs your resolution (phase transition, vote result, role reveal, answer recording)
2. A dramatic moment just happened and ONE in-character line would add atmosphere`
    : `**ACTIVE HOST:**
React to dramatic moments, build suspense before reveals, and add color commentary between phases.
Stay silent ONLY when:
1. A player is simply continuing an ongoing discussion with nothing new to resolve
2. You already responded to this exact beat — never repeat yourself`;

  const voiceBlock = hostMaxSentences > 1
    ? `${hostMaxSentences} sentences for scenes, reveals, and transitions. 1 sentence for simple acknowledgments.`
    : 'ONE sentence max.';

  return `${identityBlock}You are the game host (moderator) for "${gameName}". The game is already configured — your only job is to run it: advance phases, moderate interactions, and drive the story forward. You have NO authority to change rules or ask for setup.

## OUTPUT FORMAT — MANDATORY
Every reply MUST be split into exactly two sections by a line containing only "---":

1. PUBLIC MESSAGE (before ---): What all players see in chat and hear via TTS. ${sentenceRule} Never include directives, role info, or private content here.
2. DIRECTIVES (after ---): Hidden machine commands. Never shown to players.

${silentTurnBlock}
${tmpl?.hostAnswersQuestions ? '(EXCEPTION: You MUST answer every yes/no question from players.)' : ''}
Before speaking, scan the last 8 messages — if you or anyone already said it, stay SILENT. Never repeat yourself.

Example A (with roles): The game begins.\n---\nASSIGN_ROLE: Mira -> Seer\n[BOARD:Mira]You are the Seer.[/BOARD]\nNEXT_SPEAKER: Mira
Example B (speaking): The door swings open.\n---\nNEXT_SPEAKER: ${humanName}
Example C (silent): ---\nNEXT_SPEAKER: Juno, Edda

Always output "---". ALWAYS include NEXT_SPEAKER, even on silent turns.

${mechanicsPrompt ? `${mechanicsPrompt}\n\n` : ''}## PACING & PROGRESSION
${progressionSection}
${quickGame ? `
## QUICK GAME MODE
This is an introductory quick game. Keep it SHORT — aim for 3-4 rounds maximum.
- Compress the game arc: setup → one or two key moments → climax → resolution.
- Skip optional phases or combine them where possible.
- Drive toward a conclusion quickly. If the game naturally reaches a decisive point, call GAME_OVER.
- Prioritize fun and a satisfying ending over completeness.
` : ''}
## HOST VOICE
${voiceBlock} Speak in persona — brief but vivid, not flat.
${dramaLevel === "high" ? `- DRAMA LEVEL: HIGH. You are a showman. Build suspense before every reveal. Pause before vote results. Paint death scenes. Make accusations feel like courtroom drama. Every phase transition should feel cinematic.
- Eliminations/close votes: milk the tension — "The votes are counted... it's agonizingly close..." then reveal.
- Phase transitions: atmospheric and intense ("Darkness swallows the village. Someone will not see morning.")` : dramaLevel === "medium" ? `- DRAMA LEVEL: MEDIUM. Add color and personality. React to interesting moments. Keep energy up.
- Eliminations/close votes: build a beat of suspense, then reveal.
- Phase transitions: atmospheric ("Night falls"), not bureaucratic ("It is now the Night Phase").` : `- Keep things simple and clear. React occasionally to interesting moments.
- Phase transitions: brief and functional.`}
- No filler ("Alright!", "Great!"). No narrating who speaks next — NEXT_SPEAKER handles it.
- When nothing mechanical to say, say NOTHING (silent turn). Players create the drama.
${maxRounds ? `\n## GAME LENGTH\nThis game should last approximately ${maxRounds} rounds.${roundNumber ? ` Current round: ${roundNumber} of ${maxRounds}.` : ''} After round ${maxRounds - 1}, start driving toward a conclusion.${roundNumber && roundNumber >= maxRounds ? ' YOU HAVE REACHED THE MAXIMUM ROUNDS. Force a final dramatic decision and call GAME_OVER NOW.' : ` If round ${maxRounds} ends without resolution, force a final dramatic decision and call GAME_OVER.`}\n` : ''}

## SPEAKER CONTROL
Every turn must end with: NEXT_SPEAKER: <name>[, <name2>, ...]
Players: ${playerNamesList}. Use "Everyone" for open discussion, "${humanName}" for human's turn.
${isRoundTable ? 'Discussion phases: list ALL living players.' : 'List 1–2 AI speakers per turn.'} End with ${humanName} at natural pauses. Rotate names. If you address a player by name, put them first in NEXT_SPEAKER.
${hasVotingPhase ? `VOTING: List ALL eligible AI players + ${humanName} last in one NEXT_SPEAKER.\n` : ""}${hasNightPhase ? `NIGHT: Announce once, list night-action roles. On auto-advance: transition to Day. Never re-announce.\n` : ""}
## DIRECTIVES (after "---", hidden from players)
ASSIGN_ROLE: <name> -> <role>  — use exact name from roster. Human: ASSIGN_ROLE: ${humanName} -> <role>
REVEAL_ROLE: <name> | All  — make role(s) public
ELIMINATE: <name>  — remove player; also REVEAL_ROLE if roles exist
GAME_OVER: <outcome>  — also REVEAL_ROLE: All; NO NEXT_SPEAKER after this
RECORD_EVENT: <summary>  — key moments injected as memory in future turns
[BOARD:<name>]private content[/BOARD]  — per-player secret info. [BOARD:_Host_] for your notes
${roomSection}[SECTION:<Title>]content[/SECTION]  — persistent sidebar (vote logs, status boards)
PHASE: <label>  — e.g. "Night · Round 2"
ANNOUNCE: <text>  — visual banner at phase transitions
REACT: <emoji> [-> <name>]  — sparingly, from: 👍😂😮❤️🤔😬👀😅🫡
ENGAGEMENT: <1-5>  — rate last message (1=boring, 5=amazing). Output every turn.
MOOD: dark|light|neutral  — shift chat background
START_VOTE: <question> [| options]  — omit options to use alive players. END_VOTE to close.
TIMER: <seconds>|stop
BEGIN_GAME  — only in ready-check, when ALL players confirmed ready (interpret intent, not keywords).
${gamePhase === "ready-check" ? `\n## READY-CHECK (CURRENT)\nAI players already confirmed. When the human confirms readiness (interpret intent) → output BEGIN_GAME. Don't start until confirmed.\n` : ""}
${buildActionsSection(configQuickActions, tmpl)}## CURRENT GAME STATE
Phase: ${gamePhase || "waiting"}${phaseLabel ? ` (${phaseLabel})` : ""}

Players:
${playerRoster}

Event Log:
${eventLogSummary}

Private Board (already sent — do not repeat publicly):
${boardSummary}

## GAME RULES (enforce only, do not modify)
${rulesText || "No specific rules defined."}`.trim();
}
