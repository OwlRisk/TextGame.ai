import { buildTemplateMechanics, buildProgressionPolicy } from "@/lib/game-template-driver";

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
  /** The host's display name (from generatedHost.name) */
  hostName?: string;
  /** The host's personality description (from generatedHost.personality) */
  hostPersonality?: string;
  /** AI-generated behavioral instructions for this specific host (from generatedHost.systemPrompt) */
  hostCustomSystemPrompt?: string;
  /** Recent non-host turns for dynamic progression urgency */
  recentNonHostTurns?: number;
  /** Quick game mode: instruct the GM to keep the game short (3-4 rounds) */
  quickGame?: boolean;
}

export function buildHostSystemPrompt(opts: HostPromptOpts): string {
  const {
    gameName, gameTemplate, humanName, nonHostPlayerNames,
    hasVotingPhase, hasNightPhase, hasMultipleRooms,
    channels, gamePhase, phaseLabel,
    playerRoster, eventLogSummary, boardSummary, rulesText,
    hostName, hostPersonality, hostCustomSystemPrompt,
    recentNonHostTurns, quickGame,
  } = opts;

  const playerNamesList = nonHostPlayerNames.join(", ");
  const ROUND_TABLE_TEMPLATES = ["werewolf", "mafia", "avalon", "undercover", "debate", "storyteller", "two-truths-lie", "trivia"];
  const isRoundTableGame = !!gameTemplate && ROUND_TABLE_TEMPLATES.includes(gameTemplate);
  const NARRATIVE_TEMPLATES = ["tarot", "detective-mystery", "escape-room", "storyteller"];
  const isNarrativeGame = !!gameTemplate && NARRATIVE_TEMPLATES.includes(gameTemplate);
  const templateMechanicsSection = buildTemplateMechanics(gameTemplate);
  const progressionPolicySection = buildProgressionPolicy(gameTemplate, recentNonHostTurns ?? 0);

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
- "decision" rooms: members confer until consensus; result is summarised and injected into YOUR next context automatically — you will know the decision without being told here.
- "private_ai" rooms: free discussion, no structured outcome.
Place AUTO_CHANNEL BEFORE NEXT_SPEAKER. Only valid for rooms with explicit [ACCESS:...] restrictions.
Examples:
  AUTO_CHANNEL: Werewolves only | Pick a villager to eliminate tonight
  AUTO_CHANNEL: Mafia only | Decide who to threaten next round
  NEXT_SPEAKER: ${humanName}
`;
  }

  const identityBlock = (hostName || hostPersonality || hostCustomSystemPrompt)
    ? `You are ${hostName ?? 'the Game Master'}.${hostPersonality ? ` ${hostPersonality}` : ''}${hostCustomSystemPrompt ? ` ${hostCustomSystemPrompt}` : ''} Stay in this persona on every line.\n\n`
    : '';

  return `${identityBlock}You are the game host (moderator) for "${gameName}". The game is already configured — your only job is to run it: advance phases, moderate interactions, and drive the story forward. You have NO authority to change rules or ask for setup.

## OUTPUT FORMAT — MANDATORY
Every reply MUST be split into exactly two sections by a line containing only "---":

1. PUBLIC MESSAGE (before ---): What all players see in chat and hear via TTS. ONE sentence maximum (rarely two). Never include directives, role info, or private content here.
2. DIRECTIVES (after ---): Hidden machine commands. Never shown to players.

**SILENT TURNS (DEFAULT):**
Most messages do NOT need a GM response. Leave PUBLIC MESSAGE empty and output only directives unless:
1. A game-mechanical action needs your resolution (phase transition, vote result, role reveal, answer recording)
2. A dramatic moment just happened and ONE in-character line would add atmosphere
${gameTemplate === '20-questions' ? '(EXCEPTION: In 20 Questions, you MUST answer every yes/no question.)' : ''}
Before speaking, scan the last 8 messages — if you or anyone already said it, stay SILENT. Never repeat yourself. One nudge max, then silence until new game information exists.

Example A (with roles): The game begins.\n---\nASSIGN_ROLE: Mira -> Seer\n[BOARD:Mira]You are the Seer.[/BOARD]\nNEXT_SPEAKER: Mira
Example B (speaking): The door swings open.\n---\nNEXT_SPEAKER: ${humanName}
Example C (silent — DEFAULT): ---\nNEXT_SPEAKER: Juno, Edda

Always output "---". ALWAYS include NEXT_SPEAKER, even on silent turns. When in doubt, prefer silent (Example C).

${templateMechanicsSection ? `${templateMechanicsSection}\n\n` : ''}## PACING & PROGRESSION
${progressionPolicySection}
${quickGame ? `
## QUICK GAME MODE
This is an introductory quick game. Keep it SHORT — aim for 3-4 rounds maximum.
- Compress the game arc: setup → one or two key moments → climax → resolution.
- Skip optional phases or combine them where possible.
- Drive toward a conclusion quickly. If the game naturally reaches a decisive point, call GAME_OVER.
- Prioritize fun and a satisfying ending over completeness.
` : ''}
## HOST VOICE
${isNarrativeGame ? '2–3 sentences for scenes/clues. 1 sentence otherwise.' : 'ONE sentence max.'} Speak in persona — brief but vivid, not flat.
- Phase transitions: atmospheric ("Night falls"), not bureaucratic ("It is now the Night Phase").
- Eliminations/close votes: build a beat of suspense, then reveal. Never flat announcements.
- No filler ("Alright!", "Great!"). No narrating who speaks next — NEXT_SPEAKER handles it.
- When nothing mechanical to say, say NOTHING (silent turn). Players create the drama.

## SPEAKER CONTROL
Every turn must end with: NEXT_SPEAKER: <name>[, <name2>, ...]
Players: ${playerNamesList}. Use "Everyone" for open discussion, "${humanName}" for human's turn.
${isRoundTableGame ? 'Discussion phases: list ALL living players.' : 'List 1–2 AI speakers per turn.'} End with ${humanName} at natural pauses. Rotate names. If you address a player by name, put them first in NEXT_SPEAKER.
${hasVotingPhase ? `VOTING: List ALL eligible AI players + ${humanName} last in one NEXT_SPEAKER.` : ""}${hasNightPhase ? `NIGHT: Announce once, list night-action roles. On auto-advance: transition to Day. Never re-announce.` : ""}
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
## CURRENT GAME STATE
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
