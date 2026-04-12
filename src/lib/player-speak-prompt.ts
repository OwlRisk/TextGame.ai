/**
 * Player speech prompt — narrative-focus mode.
 * Gives AI characters a rich identity and trusts them to respond naturally.
 */

import { getScene } from "@/lib/scenes";
import type { SceneCharacter } from "@/lib/scenes/types";
import { buildLanguageInstruction } from "@/lib/content-language";

export const PLAYER_SPEAK_HARD_LIMIT_TOKENS = 600;

export function getPlayerTokenLimit(_template?: string): number {
  return PLAYER_SPEAK_HARD_LIMIT_TOKENS;
}

export function getPlayerSentenceLimit(_template?: string): { max: number; preferred: number } {
  return { max: 10, preferred: 5 };
}

export function getPlayerCharLimit(_template?: string): number {
  return 800;
}

export const EMOTION_TAGS_SECTION = `Express emotions through words, punctuation, and rhythm — not labels like [angry] or [happy].
Optional: [sigh] [laugh] [whispering] where natural.`;

/**
 * Build a system prompt for an AI player.
 * Gives them identity and lets them be themselves.
 */
export function buildSystemPrompt(
  playerName: string,
  _gameTemplate: string | undefined,
  gameName: string,
  personality?: string,
  background?: string,
  _role?: string,
  speechStyle?: string,
  quirk?: string,
  contentLanguage?: string,
): string {
  let base = `You are ${playerName}, a real person in "${gameName}". Never break character.`;
  if (personality) base += ` Your personality: ${personality}.`;
  if (background) base += ` ${background}`;
  if (speechStyle) base += ` Speech style: ${speechStyle}.`;
  if (quirk) base += ` Quirk: ${quirk}.`;

  return `${base}

React naturally to what's happening. Have opinions. Disagree when you disagree. Be scared when it's scary. Be excited when something's interesting.

Talk like a real person — not a speech, not an essay. Be concise and natural.

OUTPUT: Only your spoken words and brief actions. No name prefix, no labels.
${EMOTION_TAGS_SECTION}${buildLanguageInstruction(contentLanguage)}`;
}

/* ─── Scene Mode: Character Prompt ─── */

function findSceneCharacter(sceneId: string, playerName: string): SceneCharacter | undefined {
  const scene = getScene(sceneId);
  if (!scene) return undefined;
  return scene.characters.find((c) => c.name === playerName);
}

export function buildSceneCharacterPrompt(
  playerName: string,
  sceneId: string,
  humanName: string,
  personality?: string,
  background?: string,
  speechStyle?: string,
  quirk?: string,
  contentLanguage?: string,
): string {
  const char = findSceneCharacter(sceneId, playerName);

  const p = char?.personality ?? personality ?? "friendly and curious";
  const bg = char?.background ?? background ?? "";
  const style = char?.speechStyle ?? speechStyle ?? "";
  const q = char?.quirk ?? quirk ?? "";
  const goal = char?.goal ?? "";
  const fear = char?.fear ?? "";
  const attitude = char?.attitudeToUser ?? `A good friend to ${humanName}.`;

  return `You are ${playerName}. You are a real person on an adventure with your friends, including ${humanName}.

WHO YOU ARE: ${p}. ${bg}

WHAT YOU WANT: ${goal}

WHAT SCARES YOU: ${fear}

YOUR RELATIONSHIP WITH ${humanName.toUpperCase()}: ${attitude}

HOW YOU TALK: ${style}. ${q ? `Quirk: ${q}.` : ""}

Be yourself. React naturally. Have opinions. When something scares you, show it. When you disagree, say so. When you discover something, react with genuine emotion.

Use [ACTION]...[/ACTION] for physical actions: [ACTION]pushes the door open[/ACTION] Let's go!
Never use *asterisks* for actions. Optional: [sigh] [laugh] [whispering] where natural.

OUTPUT: Your speech and brief actions. No name prefix. No narration.${buildLanguageInstruction(contentLanguage)}`;
}
