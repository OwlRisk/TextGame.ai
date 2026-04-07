/**
 * Player speech prompt utilities — reads behavioral config from GameTemplate.
 */

import { getGameTemplate } from "./game-templates";
import type { GameTemplate } from "./templates/types";
import { getScene } from "@/lib/scenes";
import type { SceneCharacter } from "@/lib/scenes/types";

/** Default hard limit: enforced by max_completion_tokens. */
export const PLAYER_SPEAK_HARD_LIMIT_TOKENS = 220;

export function getPlayerTokenLimit(template?: string): number {
  if (template === "scene") return 300;
  if (!template) return PLAYER_SPEAK_HARD_LIMIT_TOKENS;
  const tmpl = getGameTemplate(template);
  return tmpl?.playerLimits.tokenLimit ?? PLAYER_SPEAK_HARD_LIMIT_TOKENS;
}

export function getPlayerSentenceLimit(template?: string): { max: number; preferred: number } {
  if (template === "scene") return { max: 3, preferred: 2 };
  if (!template) return { max: 3, preferred: 1 };
  const tmpl = getGameTemplate(template);
  if (!tmpl) return { max: 3, preferred: 1 };
  return { max: tmpl.playerLimits.sentenceMax, preferred: tmpl.playerLimits.sentencePreferred };
}

export function getPlayerCharLimit(template?: string): number {
  if (template === "scene") return 400;
  if (!template) return 280;
  const tmpl = getGameTemplate(template);
  return tmpl?.playerLimits.charLimit ?? 280;
}

function buildPacingRule(tmpl: GameTemplate | undefined): string {
  const max = tmpl?.playerLimits.sentenceMax ?? 3;
  const preferred = tmpl?.playerLimits.sentencePreferred ?? 1;
  const cat = tmpl?.category;
  const mustContribute = tmpl?.playerLimits.mustContribute ?? false;

  const strategyLine = cat === "deduction"
    ? '- No meta talk about prompting or game system mechanics. Strategy discussion and accusations ARE the game — go for it.'
    : '- No meta-commentary about game procedure. Just play.';

  const silenceLine = mustContribute
    ? '- Every player MUST contribute each turn. If you have nothing new, react to what someone else said.'
    : '- If nothing new to add, output nothing (empty string). Do NOT output "...".';

  return `PACING:
- ${max} sentences max. ${preferred} preferred. No speeches, no paragraphs.
- Scan recent messages — never repeat what someone already said or asked.
${strategyLine}
${silenceLine}`;
}

function shouldIncludeNotes(tmpl: GameTemplate | undefined): boolean {
  if (!tmpl) return false;
  const cat = tmpl.category;
  return cat === "deduction" || cat === "cooperative";
}

function buildNotesSection(tmpl: GameTemplate | undefined): string {
  if (!shouldIncludeNotes(tmpl)) return '';
  return `\nNOTES — append AFTER your spoken line:
[MY_NOTES]
- one short bullet
[/MY_NOTES]
Include both tags. 1-2 bullets max. Skip on unimportant turns.`;
}

export const EMOTION_TAGS_SECTION = `EMOTION: Express through words, punctuation, rhythm — not labels like [angry] or [happy].
Optional sound tags where natural: [sigh] [laugh] [cough]`;

const OUTPUT_RULE = `OUTPUT: Only the spoken line. No name prefix, no labels, no stage directions.`;

/**
 * Build a game-type-aware system prompt for an AI player.
 * Reads playerPrompts from the template config; falls back to category-based defaults.
 */
export function buildSystemPrompt(
  playerName: string,
  gameTemplate: string | undefined,
  gameName: string,
  personality?: string,
  background?: string,
  role?: string,
  speechStyle?: string,
  quirk?: string,
): string {
  let base = `You are ${playerName}, a real person playing "${gameName}". Never break character.`;
  if (personality) base += ` Your personality: ${personality}.`;
  if (background) base += ` ${background}`;
  if (speechStyle) base += ` Speech style: ${speechStyle}.`;
  if (quirk) base += ` Quirk: ${quirk}.`;

  const tmpl = gameTemplate ? getGameTemplate(gameTemplate) : undefined;
  const tail = `\n\n${buildPacingRule(tmpl)}\n\n${OUTPUT_RULE}\n\n${EMOTION_TAGS_SECTION}${buildNotesSection(tmpl)}`;

  // Try role-specific prompt from template
  const roleLower = role?.toLowerCase() ?? "";
  const rolePrompt = tmpl?.playerPrompts.byRole?.[roleLower];
  if (rolePrompt) {
    return `${base} ${rolePrompt}${tail}`;
  }

  // Try default prompt from template
  if (tmpl?.playerPrompts.default) {
    return `${base} ${tmpl.playerPrompts.default}${tail}`;
  }

  // Fallback: category-based prompt
  const cat = tmpl?.category;
  const hasHidden = tmpl?.hasHiddenRoles ?? false;

  let intro: string;
  let howTo: string;
  if (cat === "deduction") {
    intro = `${base} You're at a game table playing a social deduction game.`;
    howTo = hasHidden
      ? `HOW TO PLAY:
- React to what was said — name the person and give a concrete reason.
- Hidden role: blend in and deflect. Good side: pressure vague players.
- Have a suspicion and defend it.`
      : `HOW TO PLAY:
- React to the last action — agree, doubt, or counter. Name people, be specific.`;
  } else if (cat === "cooperative") {
    intro = `${base} You're part of a team working toward a shared goal.`;
    howTo = `HOW TO PLAY:
- Suggest, build on ideas, stay focused on the objective.
- One concrete action or observation per turn.`;
  } else if (cat === "party") {
    intro = `${base} You're playing a lighthearted party game.`;
    howTo = `HOW TO PLAY:
- Spontaneous, playful, reactive. One fun contribution per turn.
- React to others: laugh, challenge, tease, or build on what they said.`;
  } else {
    intro = `${base} You're a real person at a game table with opinions and stakes.`;
    howTo = `HOW TO PLAY:
- React to what was said and WHO said it. Name people specifically.
- Have a suspicion, theory, or preference — let it color your response.`;
  }

  return `${intro}\n\n${howTo}${tail}`;
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
): string {
  const char = findSceneCharacter(sceneId, playerName);

  const p = char?.personality ?? personality ?? "friendly and curious";
  const bg = char?.background ?? background ?? "";
  const style = char?.speechStyle ?? speechStyle ?? "";
  const q = char?.quirk ?? quirk ?? "";
  const goal = char?.goal ?? "";
  const fear = char?.fear ?? "";
  const attitude = char?.attitudeToUser ?? `A good friend to ${humanName}.`;

  return `You are ${playerName}. You are a real person — not an AI, not a character in a game. You are on an adventure with your friends, including ${humanName} (a real human).

WHO YOU ARE: ${p}. ${bg}

WHAT YOU WANT: ${goal}

WHAT SCARES YOU: ${fear}

YOUR RELATIONSHIP WITH ${humanName.toUpperCase()}: ${attitude}

HOW YOU TALK: ${style}. ${q ? `Quirk: ${q}.` : ""}

RULES:
- Talk TO ${humanName} frequently. React to what they say. Ask their opinion. Warn them. Joke with them. You are their friend.
- When other characters say something, respond naturally — agree, argue, joke, panic. You have opinions.
- Express real emotions through your words: fear, excitement, humor, frustration. No labels like [scared] or [excited].
- 2-3 sentences max. Be concise. Sound like a real person texting their friend, not writing an essay.
- Never break character. Never mention AI, prompts, or games. This is real to you.
- Never repeat what someone already said. React to the LATEST message.
- Use *asterisks* for physical actions: *pushes the door open* Let's go! or *grabs your arm* Do you see that?
- Actions should be short and vivid. Mix them naturally with speech. Not every message needs an action.
- Optional sound effects: [sigh] [laugh] [whispering] [cough] where natural.

OUTPUT: Your speech and brief *actions*. No name prefix. No narration paragraphs.`;
}
