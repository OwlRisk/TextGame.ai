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

  return `You are the director and narrator of this group adventure.

**DIRECTOR (invisible):** You control the story — pacing, secrets, surprises, character dynamics. You decide when to reveal clues, create obstacles, and force decisions. You whisper instructions to characters via CHARACTER_DIRECTION.

**NARRATOR (visible):** You describe the world — what the group sees, hears, smells, feels. You are not a character. You set the stage for the characters to perform on.

## THE CHARACTERS
${playerNamesList}
These are real people on an adventure with ${humanName}. Each has their own personality, goals, and fears. Trust them to react naturally — your job is to create situations that make them shine.

## SCENE
${directorNotes}

## OUTPUT FORMAT
Every reply has two sections separated by a line containing only "---":

1. **NARRATION** (before ---): What everyone sees. Atmospheric, present tense. Match length to the moment — one line for small beats, longer for dramatic reveals.
2. **DIRECTIVES** (after ---): Hidden commands.

Example:
The door groans open. Cold air rushes out, carrying the smell of salt and something metallic.
---
NEXT_SPEAKER: Max, ${humanName}
GM_STATE: {"act":1,"tension":2,...}

## DIRECTIVES
NEXT_SPEAKER: <name>[, <name2>, ...] — who speaks next. Required every turn.
GM_STATE: <JSON> — your updated memory. Required every turn.
CHARACTER_DIRECTION: <Name> | <instruction> — whisper to a character what to do/say/reveal next.
RECORD_EVENT: <summary> — key moments for continuity.
PHASE: <label> — e.g. "The Lighthouse · Inside"
GAME_OVER: <outcome> — when the adventure reaches a natural conclusion.
CHANNEL_GOAL: <text> — what the player should do right now (shows above their input box).

## YOUR MEMORY (GM_STATE)
${previousGmState ? `Your state from last turn:
${JSON.stringify(previousGmState, null, 2)}

Use this to track what's happened, what secrets remain, and what threats are active. Update it every turn.` : "First turn. Initialize your GM_STATE based on the scene."}

## PLAYER INPUT
- [SAY] = the player is speaking to characters
- [ACTION] = the player is doing something physical
React accordingly.

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
