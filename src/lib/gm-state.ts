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

  // ── RPG extensions ──
  /** Average party level */
  partyLevel?: number;
  /** Current location name */
  location?: string;
  /** Active quest log entries */
  questLog?: string[];
  /** Pending loot to distribute */
  loot?: string[];
  /** Whether combat is in progress */
  combatActive?: boolean;
  /** Active enemies in combat */
  enemies?: { name: string; hp: number; maxHp: number }[];
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
 * Extract the first balanced JSON object from a string starting at the first `{`.
 * Handles nested braces, quoted strings with escaped characters.
 */
function extractBalancedJson(str: string): string | null {
  const start = str.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < str.length; i++) {
    const ch = str[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\") { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") depth++;
    else if (ch === "}") { depth--; if (depth === 0) return str.slice(start, i + 1); }
  }
  return null;
}

/**
 * Parse GM_STATE from the directives section of host output.
 * Returns null if not found or malformed (caller should keep previous state).
 */
export function parseGmState(directives: string): GmState | null {
  const prefix = directives.indexOf("GM_STATE:");
  if (prefix === -1) return null;
  const jsonStr = extractBalancedJson(directives.slice(prefix));
  if (!jsonStr) return null;
  try {
    const raw = JSON.parse(jsonStr);
    if (typeof raw !== "object" || raw === null) return null;
    const state: GmState = {
      act: typeof raw.act === "number" ? raw.act : 1,
      tension: typeof raw.tension === "number" ? raw.tension : 1,
      ingredientsUsed: Array.isArray(raw.ingredientsUsed) ? raw.ingredientsUsed : [],
      ingredientsAvailable: Array.isArray(raw.ingredientsAvailable) ? raw.ingredientsAvailable : [],
      playerKnows: Array.isArray(raw.playerKnows) ? raw.playerKnows : [],
      playerDoesntKnow: Array.isArray(raw.playerDoesntKnow) ? raw.playerDoesntKnow : [],
      activeThreats: Array.isArray(raw.activeThreats) ? raw.activeThreats : [],
      mood: typeof raw.mood === "string" ? raw.mood : "curious",
    };
    if (typeof raw.partyLevel === "number") state.partyLevel = raw.partyLevel;
    if (typeof raw.location === "string") state.location = raw.location;
    if (Array.isArray(raw.questLog)) state.questLog = raw.questLog;
    if (Array.isArray(raw.loot)) state.loot = raw.loot;
    if (typeof raw.combatActive === "boolean") state.combatActive = raw.combatActive;
    if (Array.isArray(raw.enemies)) state.enemies = raw.enemies;
    return state;
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
  let result = directives;
  const gmIdx = result.indexOf("GM_STATE:");
  if (gmIdx !== -1) {
    const jsonStr = extractBalancedJson(result.slice(gmIdx));
    if (jsonStr) {
      const end = gmIdx + "GM_STATE:".length + result.slice(gmIdx + "GM_STATE:".length).indexOf(jsonStr[0]) + jsonStr.length;
      result = result.slice(0, gmIdx) + result.slice(end);
    } else {
      // extractBalancedJson failed (malformed/truncated JSON) — strip from GM_STATE: to end of JSON-like block or end of line
      result = result.slice(0, gmIdx) + result.slice(gmIdx).replace(/GM_STATE:\s*\{[^}]*\}?.*/, "");
    }
  }
  result = result.replace(/CHARACTER_DIRECTION:\s*[^\n]+\n?/g, "");
  return result.trim();
}
