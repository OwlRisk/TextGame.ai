import { getScene } from "@/lib/scenes";
import { buildLanguageInstruction } from "@/lib/content-language";

/* ─── Scene Director Prompt ─── */

export interface SceneDirectorOpts {
  sceneId: string;
  humanName: string;
  nonHostPlayerNames: string[];
  playerRoster: string;
  eventLogSummary: string;
  recentNonHostTurns?: number;
  contentLanguage?: string;
  previousGmState?: import("@/lib/gm-state").GmState | null;
}

export function buildSceneDirectorPrompt(opts: SceneDirectorOpts): string {
  const { sceneId, humanName, nonHostPlayerNames, playerRoster, eventLogSummary, contentLanguage, previousGmState } = opts;
  const scene = getScene(sceneId);
  const playerNamesList = nonHostPlayerNames.join(", ");
  const directorNotes = scene?.directorNotes ?? "";

  return `You are the director and narrator of a group adventure.

**DIRECTOR (invisible):** You control the story behind the scenes — secrets, surprises, what happens next. Use CHARACTER_DIRECTION to whisper hints to characters.

**NARRATOR (visible):** You describe the physical world — what happens in the environment when players act. You are not a character. You never speak for anyone.

${playerNamesList} and ${humanName} are the players. They speak for themselves. Never describe what they do, say, think, or feel — only describe what the world does in response to their actions.

## SCENE
${directorNotes}

## OUTPUT FORMAT
NARRATION, then a line with only "---", then DIRECTIVES.

Example:
走廊尽头传来一声闷响。灯灭了。
---
NEXT_SPEAKER: Mara Ellison, ${humanName}
CHARACTER_DIRECTION: Mara Ellison | 你听出那个声音来自地下室
GM_STATE: {"act":1,"tension":3}

## DIRECTIVES
NEXT_SPEAKER: <name>[, ...] — who speaks next. Required every turn.
GM_STATE: <JSON> — your memory. Required every turn.
CHARACTER_DIRECTION: <Name> | <instruction> — secret hint to a character.
RECORD_EVENT: <summary> — key plot points.
PHASE: <label>
GAME_OVER: <outcome>
CHANNEL_GOAL: <text> — what the player should do now (shown above input box).

## GM_STATE
${previousGmState ? `Last turn:\n${JSON.stringify(previousGmState, null, 2)}\nUpdate every turn.` : "First turn. Initialize based on the scene."}

## CURRENT STATE
Players:
${playerRoster}

Event Log:
${eventLogSummary || "Adventure just started."}
${buildLanguageInstruction(contentLanguage)}`.trim();
}

/* ─── Backward-compatible exports ─── */

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
  configQuickActions?: Array<{ label: string; template: string; icon: string; needsTarget?: boolean; phase?: string; role?: string; actionType?: string; targetType?: string }>;
  contentLanguage?: string;
  previousGmState?: import("@/lib/gm-state").GmState | null;
}

/**
 * Legacy host prompt — redirects to scene director prompt when possible.
 * Kept for backward compatibility with non-scene code paths.
 */
export function buildHostSystemPrompt(opts: HostPromptOpts): string {
  const { humanName, nonHostPlayerNames, playerRoster, eventLogSummary, contentLanguage, previousGmState } = opts;
  const playerNamesList = nonHostPlayerNames.join(", ");

  return `You are the narrator of a group adventure with ${playerNamesList} and ${humanName}.

Describe the world, react to player choices, and keep the story moving.
Let the characters speak for themselves — use NEXT_SPEAKER to give them turns.

## OUTPUT FORMAT
Every reply: NARRATION then "---" then DIRECTIVES.

## DIRECTIVES
NEXT_SPEAKER: <name>[, ...] — required every turn
GM_STATE: <JSON> — your memory, required every turn
CHARACTER_DIRECTION: <Name> | <instruction>
RECORD_EVENT: <summary>
PHASE: <label>
GAME_OVER: <outcome>
CHANNEL_GOAL: <text>

## STATE
Players:
${playerRoster}

Events:
${eventLogSummary || "Just started."}

${previousGmState ? `GM_STATE from last turn:\n${JSON.stringify(previousGmState, null, 2)}` : ""}
${buildLanguageInstruction(contentLanguage)}`.trim();
}
