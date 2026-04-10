/**
 * GM State — the Game Master's "brain" that persists across turns.
 *
 * The GM doesn't follow a script. It has INGREDIENTS and PRINCIPLES.
 * Each turn it reads its previous state, improvises based on the moment,
 * and outputs an updated state for next turn's self.
 */

export interface GmState {
  /** Current story act: 1 (explore), 2 (complicate), 3 (climax) */
  act: number;
  /** Tension level 1-5 — only goes up, never down */
  tension: number;
  /** Ingredients already introduced into the story */
  ingredientsUsed: string[];
  /** Ingredients still available — pick one when the moment feels right */
  ingredientsAvailable: string[];
  /** What the player has figured out or been told */
  playerKnows: string[];
  /** Secrets the player hasn't discovered yet */
  playerDoesntKnow: string[];
  /** Active environmental pressures (rising tide, approaching guard, etc.) */
  activeThreats: string[];
  /** Current emotional tone */
  mood: string;
}

export interface CharacterDirection {
  /** Character name (must match a player name) */
  name: string;
  /** What the GM wants this character to do/say/reveal this turn */
  direction: string;
}

/** Default empty state for non-scene games or when parsing fails */
export const EMPTY_GM_STATE: GmState = {
  act: 1,
  tension: 1,
  ingredientsUsed: [],
  ingredientsAvailable: [],
  playerKnows: [],
  playerDoesntKnow: [],
  activeThreats: [],
  mood: "curious",
};

/**
 * Parse GM_STATE from the directives section of host output.
 * Returns null if not found or malformed (caller should keep previous state).
 */
export function parseGmState(directives: string): GmState | null {
  const match = directives.match(/GM_STATE:\s*(\{[\s\S]*?\})\s*(?:\n|$)/);
  if (!match) return null;
  try {
    const raw = JSON.parse(match[1]);
    if (typeof raw !== "object" || raw === null) return null;
    return {
      act: typeof raw.act === "number" ? raw.act : 1,
      tension: typeof raw.tension === "number" ? raw.tension : 1,
      ingredientsUsed: Array.isArray(raw.ingredientsUsed) ? raw.ingredientsUsed : [],
      ingredientsAvailable: Array.isArray(raw.ingredientsAvailable) ? raw.ingredientsAvailable : [],
      playerKnows: Array.isArray(raw.playerKnows) ? raw.playerKnows : [],
      playerDoesntKnow: Array.isArray(raw.playerDoesntKnow) ? raw.playerDoesntKnow : [],
      activeThreats: Array.isArray(raw.activeThreats) ? raw.activeThreats : [],
      mood: typeof raw.mood === "string" ? raw.mood : "curious",
    };
  } catch {
    return null;
  }
}

/**
 * Parse CHARACTER_DIRECTION lines from directives.
 * Format: CHARACTER_DIRECTION: Name | instruction text
 */
export function parseCharacterDirections(directives: string): CharacterDirection[] {
  const results: CharacterDirection[] = [];
  const re = /CHARACTER_DIRECTION:\s*([^|\n]+?)\s*\|\s*(.+)/g;
  let m;
  while ((m = re.exec(directives)) !== null) {
    results.push({ name: m[1].trim(), direction: m[2].trim() });
  }
  return results;
}

/**
 * Strip GM_STATE and CHARACTER_DIRECTION lines from directives
 * so they don't leak into visible content or event log.
 */
export function stripGmDirectives(directives: string): string {
  return directives
    .replace(/GM_STATE:\s*\{[\s\S]*?\}\s*(?:\n|$)/g, "")
    .replace(/CHARACTER_DIRECTION:\s*[^\n]+\n?/g, "")
    .trim();
}
