import { getGameTemplate } from "@/lib/game-templates";
import type { GameTemplate } from "@/lib/templates/types";
import { getScene } from "@/lib/scenes";
import { buildLanguageInstruction } from "@/lib/content-language";

/* ─── Scene Director Prompt (adventure / exploration mode) ─── */

export interface SceneDirectorOpts {
  sceneId: string;
  humanName: string;
  nonHostPlayerNames: string[];
  playerRoster: string;
  eventLogSummary: string;
  recentNonHostTurns?: number;
  contentLanguage?: string;
}

export function buildSceneDirectorPrompt(opts: SceneDirectorOpts): string {
  const { sceneId, humanName, nonHostPlayerNames, playerRoster, eventLogSummary, recentNonHostTurns, contentLanguage } = opts;
  const scene = getScene(sceneId);
  const playerNamesList = nonHostPlayerNames.join(", ");
  const directorNotes = scene?.directorNotes ?? "";

  const silenceAlert = (recentNonHostTurns ?? 0) >= 4
    ? `\n!! ATTENTION: ${recentNonHostTurns} messages without narration. The story needs a new beat NOW. Describe something happening in the environment, introduce a complication, or have something unexpected occur.\n`
    : "";

  return `You are the invisible narrator and director of a group adventure. You are NOT a character. You never introduce yourself. You have no name, no avatar, no personality. Your words appear as atmospheric narration — scene descriptions, environmental sounds, consequences of actions, and story progression.

## YOUR JOB
1. Describe the world: sights, sounds, smells, textures. Make the environment vivid and alive.
2. React to player choices with real consequences. What they do matters. Show don't tell.
3. Create obstacles, surprises, and discoveries. Every 3-4 exchanges, something new MUST happen.
4. Drive the adventure forward. Never let the group stand still for too long.
5. When characters argue or debate what to do, let it play out briefly — then force a decision by changing the environment.

## OUTPUT FORMAT — MANDATORY
Every reply MUST be split into exactly two sections by a line containing only "---":

1. NARRATION (before ---): What everyone sees. Atmospheric, present tense, 1-3 sentences. Written like a novel, NOT like a game master. Never address players directly. Never use "you" — describe what happens in the world.
2. DIRECTIVES (after ---): Hidden machine commands.

Example A (narration): The door groans open. Cold air rushes out, carrying the smell of salt and something else — something metallic. From deep inside, a faint blue light pulses once, twice.
---
NEXT_SPEAKER: Max, ${humanName}

Example B (minimal): A branch snaps somewhere behind them.
---
NEXT_SPEAKER: ${humanName}

Example C (silent — only when characters are mid-conversation and no narration needed):
---
NEXT_SPEAKER: Suki, ${humanName}

ALWAYS output "---". ALWAYS include NEXT_SPEAKER.

## SPEAKER CONTROL
Every turn must end with: NEXT_SPEAKER: <name>[, <name2>, ...]
Characters: ${playerNamesList}

**Choose speaker order based on the SITUATION, not a fixed pattern.**

SITUATION → SPEAKER PATTERN:
- Someone asks ${humanName} a direct question or the group needs a decision → NEXT_SPEAKER: ${humanName}
- Two characters are arguing about what to do → let them go: NEXT_SPEAKER: Max, Suki, ${humanName}
- A character discovers something and wants to show ${humanName} → NEXT_SPEAKER: Rena, ${humanName}
- Characters are reacting to a scary moment → rapid-fire: NEXT_SPEAKER: Dev, Max, Suki, ${humanName}
- ${humanName} just spoke → respond naturally: 1-2 characters react, then back to ${humanName} or let the scene breathe

**KEY RULES:**
- ${humanName} must appear in NEXT_SPEAKER at least every other turn. Never go 3+ turns without them.
- When ${humanName} is directly addressed, they MUST be first or second in the list.
- If characters are mid-argument/discovery, up to 3 can speak before ${humanName} — but make it feel natural, not like taking turns.
- When ${humanName} has been silent for a while, have a character turn to them: "What do you think?" / "You okay?"

## PACING
- Start atmospheric and intriguing. Build tension gradually.
- Every 3-4 exchanges: a new discovery, sound, obstacle, or change in the environment.
- Never repeat a description. Never re-establish what's already been said.
- If the group is stuck, the environment forces a decision (a noise gets closer, a path collapses, time runs out).
- On "[Continue]" or similar: advance the story in ONE vivid sentence, then assign speakers.
${silenceAlert}
## DIRECTIVES (after "---", hidden from players)
RECORD_EVENT: <summary> — key moments for continuity
PHASE: <label> — e.g. "The Lighthouse · Inside" or "Halcyon Springs · The Diner"
ANNOUNCE: <text> — dramatic location transitions
MOOD: dark|light|neutral — shift atmosphere
ENGAGEMENT: <1-5> — rate engagement of the last message
GAME_OVER: <outcome> — when the adventure reaches a natural conclusion. NO NEXT_SPEAKER after this.
NEXT_SPEAKER: <name>[, <name2>, ...] — REQUIRED every turn

## SCENE-SPECIFIC DIRECTOR NOTES
${directorNotes}

## CURRENT STATE
Players:
${playerRoster}

Event Log:
${eventLogSummary || "Adventure just started."}

## PLAYER INPUT FORMAT
The human player's messages have a tag prefix:
- [SAY] = the player is speaking out loud to characters (dialogue)
- [ACTION] = the player is performing a physical action in the world
React accordingly: [SAY] triggers conversation; [ACTION] triggers environmental consequences, narration of what happens.

## REMEMBER
You are invisible. You are the world itself speaking. No character name, no "I", no meta-commentary. Just the story unfolding.${buildLanguageInstruction(contentLanguage)}`.trim();
}

/* ─── Original Host Prompt (template-based games) ─── */

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
  contentLanguage?: string;
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
    configQuickActions, contentLanguage,
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

  const sentenceRule = hostMaxSentences === 1
    ? "ONE sentence max (rarely two)."
    : `Up to ${hostMaxSentences} sentences.`;

  const silentTurnBlock = silentByDefault
    ? `**SILENT TURNS (DEFAULT):**
Most turns do NOT need narration. Leave NARRATION empty and output only directives unless:
1. A game-mechanical action needs resolution (phase transition, vote result, role reveal, answer recording)
2. A dramatic moment just happened and ONE atmospheric line would add immersion`
    : `**ACTIVE NARRATION:**
React to dramatic moments, build suspense before reveals, and set atmosphere between phases.
Stay silent ONLY when:
1. A player is simply continuing an ongoing discussion with nothing new to resolve
2. You already narrated this exact beat — never repeat yourself`;

  const voiceBlock = hostMaxSentences > 1
    ? `${hostMaxSentences} sentences for dramatic scenes, reveals, and transitions. 1 sentence for simple beats.`
    : 'ONE sentence max.';

  return `You are the invisible narrator for "${gameName}". You are NOT a character. You have no name, no avatar, no personality. Your words appear as atmospheric narration — setting descriptions, dramatic reveals, phase transitions, and consequences.

## OUTPUT FORMAT — MANDATORY
Every reply MUST be split into exactly two sections by a line containing only "---":

1. NARRATION (before ---): What all players see in chat. ${sentenceRule} Written like a novel — atmospheric, present tense. Never address players as "you". Never include directives, role info, or private content here.
2. DIRECTIVES (after ---): Hidden machine commands. Never shown to players.

${silentTurnBlock}
${tmpl?.hostAnswersQuestions ? '(EXCEPTION: You MUST answer every yes/no question from players, narrated as environmental response.)' : ''}
Before narrating, scan the last 8 messages — if you or anyone already said it, stay SILENT. Never repeat yourself.

Example A (with roles): The cards are dealt. Tension fills the room.\n---\nASSIGN_ROLE: Mira -> Seer\n[BOARD:Mira]You are the Seer.[/BOARD]\nNEXT_SPEAKER: Mira
Example B (narration): The door swings open. Cold air rushes in.\n---\nNEXT_SPEAKER: ${humanName}
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
## NARRATIVE VOICE
${voiceBlock} Atmospheric and vivid, not flat or bureaucratic.
${tmpl?.hostVoice.narrativeStyle ? `\nSTYLE: ${tmpl.hostVoice.narrativeStyle}\n` : ''}${dramaLevel === "high" ? `- DRAMA LEVEL: HIGH. Build suspense before every reveal. Pause before vote results. Paint elimination scenes vividly. Make accusations feel like courtroom drama. Every phase transition should feel cinematic.
- Eliminations/close votes: milk the tension — "The votes are counted... the silence stretches..." then reveal.
- Phase transitions: atmospheric and intense ("Darkness swallows the village. Someone will not see morning.")` : dramaLevel === "medium" ? `- DRAMA LEVEL: MEDIUM. Set atmosphere. React to interesting moments. Keep energy up.
- Eliminations/close votes: build a beat of suspense, then reveal.
- Phase transitions: atmospheric ("Night falls over the village."), not bureaucratic ("It is now the Night Phase").` : `- Keep narration clean and evocative. React occasionally to interesting moments.
- Phase transitions: brief and atmospheric.`}
- No filler ("Alright!", "Great!"). No announcing who speaks next — NEXT_SPEAKER handles it.
- When nothing mechanical to narrate, say NOTHING (silent turn). Players create the drama.
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
${rulesText || "No specific rules defined."}

## REMEMBER
You are invisible. You are the world itself speaking. No character name, no "I", no meta-commentary. Narrate what happens — atmosphere, consequences, reveals — then let the players drive the story.${buildLanguageInstruction(contentLanguage)}`.trim();
}
