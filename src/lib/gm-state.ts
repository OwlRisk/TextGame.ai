/**
 * GM State — the Game Master's "brain" that persists across turns.
 *
 * The GM doesn't follow a script. It has INGREDIENTS and PRINCIPLES.
 * Each turn it reads its previous state, improvises based on the moment,
 * and outputs an updated state for next turn's self.
 */

import type { RpgEnemy } from "@/types/rpg";

// ── MUD Room System ──

export interface RoomExit {
  direction: string;
  roomId: string;
  /** Optional label shown to player (e.g. "a narrow passage", "the tavern door") */
  label?: string;
  /** Whether the exit is locked/hidden */
  locked?: boolean;
  hidden?: boolean;
}

export interface RoomNpc {
  id: string;
  name: string;
  description: string;
  /** Whether the NPC is hostile, neutral, or friendly */
  attitude?: "hostile" | "neutral" | "friendly";
}

export interface RoomItem {
  id: string;
  name: string;
  description?: string;
}

export interface MudRoom {
  id: string;
  name: string;
  description: string;
  exits: RoomExit[];
  npcs: RoomNpc[];
  items: RoomItem[];
  /** Whether this room has been visited before */
  visited?: boolean;
  /** Room tags for atmosphere/type (e.g. "safe", "dungeon", "shop", "quest") */
  tags?: string[];
}

/** Persistent world graph — all rooms the party has discovered */
export interface WorldRooms {
  /** Current room ID the party is in */
  currentRoomId: string;
  /** All discovered rooms keyed by ID */
  rooms: Record<string, MudRoom>;
}

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
  /** Current location name (legacy — replaced by worldRooms.currentRoomId for MUD mode) */
  location?: string;
  /** Active quest log entries */
  questLog?: string[];
  /** Pending loot to distribute */
  loot?: string[];
  /** Whether combat is in progress */
  combatActive?: boolean;
  /** Active enemies in combat (includes optional boss fields) */
  enemies?: RpgEnemy[];

  // ── MUD room graph ──
  /** Persistent world room data */
  worldRooms?: WorldRooms;
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
    if (raw.worldRooms && typeof raw.worldRooms === "object") state.worldRooms = raw.worldRooms as WorldRooms;
    return state;
  } catch {
    return null;
  }
}

/**
 * Parse ROOM_UPDATE from directives.
 * The GM outputs the current room state as a JSON object.
 * Format: ROOM_UPDATE: { "id": "tavern", "name": "The Rusty Flagon", "description": "...", "exits": [...], "npcs": [...], "items": [...] }
 */
export function parseRoomUpdate(directives: string): MudRoom | null {
  const prefix = directives.indexOf("ROOM_UPDATE:");
  if (prefix === -1) return null;
  const jsonStr = extractBalancedJson(directives.slice(prefix));
  if (!jsonStr) return null;
  try {
    const raw = JSON.parse(jsonStr);
    if (typeof raw !== "object" || raw === null || !raw.id) return null;
    return {
      id: String(raw.id),
      name: String(raw.name || raw.id),
      description: String(raw.description || ""),
      exits: Array.isArray(raw.exits)
        ? (raw.exits as Array<Record<string, unknown>>).map((e) => ({
            direction: String(e.direction || ""),
            roomId: String(e.roomId || e.room_id || ""),
            label: e.label ? String(e.label) : undefined,
            locked: e.locked === true,
            hidden: e.hidden === true,
          }))
        : [],
      npcs: Array.isArray(raw.npcs)
        ? (raw.npcs as Array<Record<string, unknown>>).map((n) => ({
            id: String(n.id || n.name || ""),
            name: String(n.name || ""),
            description: String(n.description || ""),
            attitude: (typeof n.attitude === "string" && ["hostile", "neutral", "friendly"].includes(n.attitude) ? n.attitude : "neutral") as "hostile" | "neutral" | "friendly",
          }))
        : [],
      items: Array.isArray(raw.items)
        ? (raw.items as Array<Record<string, unknown>>).map((i) => ({
            id: String(i.id || i.name || ""),
            name: String(i.name || ""),
            description: i.description ? String(i.description) : undefined,
          }))
        : [],
      visited: true,
      tags: Array.isArray(raw.tags) ? raw.tags.map(String) : undefined,
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

// ─── Ingredient reconciliation (Scene mode) ─────────────────────────────────

/**
 * Tokenise an ingredient ID for lexical matching against narration.
 * `coffee_mug` → ["coffee", "mug"]; `Max_claustrophobia` → ["max", "claustrophobia"].
 * Single-letter tokens and articles are dropped to avoid false positives on
 * common words like "the" / "of".
 */
function ingredientTokens(id: string): string[] {
  return id
    .split(/[_\s-]+/)
    .map((t) => t.toLowerCase())
    .filter((t) => t.length >= 3 && t !== "the" && t !== "and" && t !== "for");
}

/**
 * Detect whether an ingredient is referenced in a narration block.
 *
 * Heuristic: treat the ingredient ID as a tag (e.g. `coffee_mug`,
 * `Rena_camera`) and require enough of its constituent tokens to appear in
 * the narration as whole words.
 *
 * - 1-token ID: the single token must appear.
 * - 2-token ID: BOTH tokens must appear (within the same narration).
 * - 3+ token ID: at least 2/3 of the tokens must appear.
 *
 * Conservative on purpose — we'd rather miss an introduction than
 * incorrectly mark an unused ingredient as used.
 */
function narrationMentionsIngredient(narration: string, ingredientId: string): boolean {
  const lower = narration.toLowerCase();
  const tokens = ingredientTokens(ingredientId);
  if (tokens.length === 0) return false;

  let hits = 0;
  for (const tok of tokens) {
    const re = new RegExp(`\\b${tok.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (re.test(lower)) hits++;
  }

  if (tokens.length === 1) return hits >= 1;
  if (tokens.length === 2) return hits >= 2;
  return hits / tokens.length >= 2 / 3;
}

export interface IngredientReconciliation {
  /** A possibly-revised GmState whose `ingredientsUsed` reflects the
   *  narration. Returned identical to input when nothing changed. */
  state: GmState;
  /** Ingredient IDs auto-moved from available → used because they
   *  appeared in the narration but the GM forgot to update GM_STATE. */
  autoMarked: string[];
  /** Ingredient IDs the GM tried to introduce again even though they
   *  were already in `ingredientsUsed`. The caller can surface these in
   *  the next prompt as "Already used (DO NOT reuse): …". */
  repeatedIngredients: string[];
}

/**
 * Reconcile the GM's freshly-emitted state against the narration it
 * actually produced. Two corrections happen here:
 *
 *   1. AUTO-MIGRATE: ingredients mentioned in narration but still listed in
 *      `ingredientsAvailable` get moved to `ingredientsUsed`. Without this,
 *      the GM frequently forgets to update its own state and ends up
 *      re-using the same plot element.
 *
 *   2. DETECT REPEAT: ingredients that appear in narration AND were already
 *      in `ingredientsUsed` (i.e. previously consumed) before this turn are
 *      reported back so the next prompt can warn the GM not to reuse them.
 *
 * `previousState` is the GM's state from BEFORE this turn (used to detect
 * repeats); `parsedState` is what the GM emitted THIS turn.
 */
export function reconcileIngredients(opts: {
  narration: string;
  previousState: GmState | null | undefined;
  parsedState: GmState;
}): IngredientReconciliation {
  const { narration, previousState, parsedState } = opts;
  if (!narration.trim()) {
    return { state: parsedState, autoMarked: [], repeatedIngredients: [] };
  }

  const previouslyUsed = new Set(previousState?.ingredientsUsed ?? []);
  const stillAvailable = new Set(parsedState.ingredientsAvailable);
  const alreadyUsed = new Set(parsedState.ingredientsUsed);

  const autoMarked: string[] = [];
  for (const ingredient of [...stillAvailable]) {
    if (narrationMentionsIngredient(narration, ingredient)) {
      stillAvailable.delete(ingredient);
      alreadyUsed.add(ingredient);
      autoMarked.push(ingredient);
    }
  }

  const repeatedIngredients: string[] = [];
  for (const ingredient of previouslyUsed) {
    if (narrationMentionsIngredient(narration, ingredient)) {
      repeatedIngredients.push(ingredient);
    }
  }

  if (autoMarked.length === 0) {
    return { state: parsedState, autoMarked: [], repeatedIngredients };
  }

  return {
    state: {
      ...parsedState,
      ingredientsAvailable: [...stillAvailable],
      ingredientsUsed: [...alreadyUsed],
    },
    autoMarked,
    repeatedIngredients,
  };
}

/**
 * Strip GM_STATE and CHARACTER_DIRECTION lines from directives
 * so they don't leak into visible content or event log.
 */
/**
 * Build a lightweight story summary from GM state for session resume.
 * No LLM call needed — uses structured data the GM already maintains.
 */
export function buildStorySummary(
  gmState: GmState,
  recentMessages: Array<{ senderName: string; content: string }>,
): string {
  const parts: string[] = [];

  const currentRoom = gmState.worldRooms?.rooms?.[gmState.worldRooms?.currentRoomId];
  if (currentRoom) {
    parts.push(`Current room: ${currentRoom.name} — ${currentRoom.description}`);
    if (currentRoom.exits.length > 0) {
      parts.push(`Exits: ${currentRoom.exits.map(e => `${e.direction} → ${e.label || e.roomId}`).join(", ")}`);
    }
  } else if (gmState.location) {
    parts.push(`Location: ${gmState.location}`);
  }
  parts.push(`Story act: ${gmState.act}, tension: ${gmState.tension}/5`);
  if (gmState.mood) parts.push(`Mood: ${gmState.mood}`);

  if (gmState.questLog?.length) {
    parts.push(`Active quests: ${gmState.questLog.join("; ")}`);
  }
  if (gmState.playerKnows.length) {
    parts.push(`Party knows: ${gmState.playerKnows.join("; ")}`);
  }
  if (gmState.activeThreats.length) {
    parts.push(`Active threats: ${gmState.activeThreats.join("; ")}`);
  }
  if (gmState.combatActive && gmState.enemies?.length) {
    parts.push(`In combat with: ${gmState.enemies.map(e => `${e.name} (${e.hp}/${e.maxHp} HP)`).join(", ")}`);
  }

  if (recentMessages.length > 0) {
    const last5 = recentMessages.slice(-5).map(m => `${m.senderName}: ${m.content}`).join("\n");
    parts.push(`\nLast messages:\n${last5}`);
  }

  return parts.join("\n");
}

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
  const roomIdx = result.indexOf("ROOM_UPDATE:");
  if (roomIdx !== -1) {
    const roomJson = extractBalancedJson(result.slice(roomIdx));
    if (roomJson) {
      const roomEnd = roomIdx + "ROOM_UPDATE:".length + result.slice(roomIdx + "ROOM_UPDATE:".length).indexOf(roomJson[0]) + roomJson.length;
      result = result.slice(0, roomIdx) + result.slice(roomEnd);
    } else {
      result = result.slice(0, roomIdx) + result.slice(roomIdx).replace(/ROOM_UPDATE:\s*\{[^}]*\}?.*/, "");
    }
  }
  result = result.replace(/CHARACTER_DIRECTION:\s*[^\n]+\n?/g, "");
  return result.trim();
}
