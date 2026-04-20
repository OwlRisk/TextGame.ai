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

  /** Encounter ids the GM has already fired (via `ENCOUNTER_FIRED:` or
   *  reconciler detection). The runtime uses this to flag re-firing of
   *  authored encounters. */
  encountersFired?: string[];
  /** Currently-engaged boss (if any) — tracks HP threshold transitions
   *  so the runtime can prompt the GM to advance phases at the right
   *  moment instead of relying on the GM remembering. */
  activeBoss?: ActiveBossState;
  /** Adventure NPC ids the GM has already introduced into the story.
   *  Detected from narration (NPC display name appearing in the text)
   *  so the GM doesn't have to manually mark introductions. */
  npcsIntroduced?: string[];

  // ── MUD room graph ──
  /** Persistent world room data */
  worldRooms?: WorldRooms;
}

export interface ActiveBossState {
  /** Display name. */
  name: string;
  /** Current HP (mirrors enemy entry — kept here so phase logic stays
   *  available even if the GM rewrites the enemies array). */
  currentHp: number;
  /** Max HP for percentage calculations. */
  maxHp: number;
  /** 1-indexed current phase. */
  currentPhase: number;
  /** HP-percent thresholds for each phase transition (e.g. [0.5, 0.25] for
   *  three phases). When currentHp / maxHp drops past the next threshold,
   *  the runtime emits a phase-transition reminder in the next prompt. */
  phaseThresholds: number[];
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
    if (Array.isArray(raw.encountersFired)) state.encountersFired = raw.encountersFired.filter((x: unknown): x is string => typeof x === "string");
    if (Array.isArray(raw.npcsIntroduced)) state.npcsIntroduced = raw.npcsIntroduced.filter((x: unknown): x is string => typeof x === "string");
    if (raw.activeBoss && typeof raw.activeBoss === "object") {
      const ab = raw.activeBoss as Record<string, unknown>;
      if (typeof ab.name === "string" && typeof ab.currentHp === "number" && typeof ab.maxHp === "number") {
        state.activeBoss = {
          name: ab.name,
          currentHp: ab.currentHp,
          maxHp: ab.maxHp,
          currentPhase: typeof ab.currentPhase === "number" ? ab.currentPhase : 1,
          phaseThresholds: Array.isArray(ab.phaseThresholds) ? ab.phaseThresholds.filter((n: unknown): n is number => typeof n === "number") : [],
        };
      }
    }
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
 * Parse ENCOUNTER_FIRED: <id> lines from directives. Returns the de-duped
 * set of encounter ids fired this turn so the runtime can extend the
 * persistent `encountersFired` ledger.
 */
export function parseEncountersFired(directives: string): string[] {
  const found = new Set<string>();
  const re = /^\s*ENCOUNTER_FIRED:\s*(.+?)\s*$/gim;
  let m: RegExpExecArray | null;
  while ((m = re.exec(directives)) !== null) {
    const id = m[1].trim();
    if (id) found.add(id);
  }
  return [...found];
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

// ─── Movement / ROOM_UPDATE missing detection (RPG mode) ──────────────────

/**
 * Detect whether the GM's narration implies the party moved to a new room
 * but the GM forgot to emit a `ROOM_UPDATE`. Without this, the room panel
 * goes stale and exits in QUICK_ACTIONS reference rooms that don't exist
 * in the persistent graph.
 *
 * Heuristic: scan narration for movement verbs ("you enter", "you go",
 * "step into", "the door opens to", etc.) followed by a noun phrase that
 * suggests a new location. Only fires when ROOM_UPDATE is absent from the
 * directives — never when the GM did emit one.
 *
 * Conservative on purpose: false positives are annoying (extra warning
 * the GM has to ignore), but false negatives are cheap (the next time the
 * party clearly moves, the heuristic will catch it).
 */
const MOVEMENT_PATTERNS: RegExp[] = [
  /\byou (?:enter|step into|walk into|pass through|emerge into|arrive at|reach|come upon|find yourself in)\b/i,
  /\bthe (?:door|gate|passage|stairway|tunnel|archway) (?:opens|leads|reveals)\b/i,
  /\b(?:climbing|descending|crossing) (?:up|down|across|through|into) (?:the|a|an)\b/i,
  /\bthe (?:party|group) (?:enters|moves into|crosses into|descends into|climbs to)\b/i,
];

export function detectMissingRoomUpdate(opts: {
  narration: string;
  directivesContainRoomUpdate: boolean;
}): boolean {
  if (opts.directivesContainRoomUpdate) return false;
  if (!opts.narration.trim()) return false;
  return MOVEMENT_PATTERNS.some((re) => re.test(opts.narration));
}

// ─── Encounter ledger reconciliation (RPG mode) ─────────────────────────────

export interface EncounterReconciliation {
  /** Possibly-revised state with newly-fired encounters merged into the
   *  persistent `encountersFired` ledger. */
  state: GmState;
  /** Encounter ids fired for the first time this turn. */
  newlyFired: string[];
  /** Encounter ids the GM tried to re-fire (already in the ledger). The
   *  caller surfaces these in the next prompt as a "do not re-fire" warning. */
  repeatedEncounters: string[];
}

/**
 * Reconcile ENCOUNTER_FIRED directives against the persistent ledger.
 * Same shape as `reconcileIngredients` — pure function, no I/O.
 */
export function reconcileEncounters(opts: {
  firedThisTurn: string[];
  parsedState: GmState;
}): EncounterReconciliation {
  const { firedThisTurn, parsedState } = opts;
  const ledger = new Set(parsedState.encountersFired ?? []);
  const newlyFired: string[] = [];
  const repeatedEncounters: string[] = [];

  for (const id of firedThisTurn) {
    if (ledger.has(id)) {
      repeatedEncounters.push(id);
    } else {
      ledger.add(id);
      newlyFired.push(id);
    }
  }

  if (newlyFired.length === 0 && repeatedEncounters.length === 0) {
    return { state: parsedState, newlyFired, repeatedEncounters };
  }

  return {
    state: { ...parsedState, encountersFired: [...ledger] },
    newlyFired,
    repeatedEncounters,
  };
}

// ─── NPC introduction tracking (RPG mode) ──────────────────────────────────

export interface NpcIntroductionReconciliation {
  /** Possibly-revised state with newly-introduced NPC ids appended. */
  state: GmState;
  /** NPC ids detected in narration this turn that weren't already
   *  in the ledger. */
  newlyIntroduced: string[];
}

/**
 * Detect adventure NPCs introduced in this turn's narration.
 *
 * Heuristic: for each NPC in the adventure roster, check whether their
 * display name (or a reasonable short form derived from it) appears as a
 * whole word in the narration. The display name "Master Yun (云大师)"
 * matches if either "Master Yun" OR "云大师" appears.
 *
 * Match is case-sensitive for English (so common words like "kai" don't
 * spuriously trip on dialogue), but case-insensitive for the first
 * letter only — so "Mei Ling" matches "mei ling" but a word "the" inside
 * a name is not matched in isolation.
 *
 * Conservative on purpose: only flips a single bit (introduced=true);
 * the reconciler will never flag a *contradiction* about an NPC's
 * personality — that's an LLM-evals problem we don't try to solve here.
 */
export function reconcileNpcIntroductions(opts: {
  narration: string;
  npcRoster: ReadonlyArray<{ id: string; name: string }>;
  parsedState: GmState;
}): NpcIntroductionReconciliation {
  const { narration, npcRoster, parsedState } = opts;
  if (!narration.trim() || npcRoster.length === 0) {
    return { state: parsedState, newlyIntroduced: [] };
  }

  const already = new Set(parsedState.npcsIntroduced ?? []);
  const newlyIntroduced: string[] = [];

  for (const npc of npcRoster) {
    if (already.has(npc.id)) continue;
    if (npcNameMentioned(narration, npc.name)) {
      already.add(npc.id);
      newlyIntroduced.push(npc.id);
    }
  }

  if (newlyIntroduced.length === 0) {
    return { state: parsedState, newlyIntroduced: [] };
  }
  return {
    state: { ...parsedState, npcsIntroduced: [...already] },
    newlyIntroduced,
  };
}

/**
 * Pull the most "name-like" tokens out of a display name and check
 * whether any one of them appears as a whole word in the narration.
 *
 * Display name forms we want to match:
 *   - "Master Yun (云大师)"  → match either "Master Yun" or "云大师"
 *   - "Iron Fist Chen (铁拳陈)" → match either "Iron Fist Chen" or "铁拳陈"
 *   - "Kai the Smuggler" → match "Kai the Smuggler" (the full phrase)
 *
 * We deliberately require the FULL phrase before parens (or the parens
 * content alone) — single-word matches like "Kai" are too prone to
 * collisions with common dialogue.
 */
function npcNameMentioned(narration: string, displayName: string): boolean {
  const cleaned = displayName.trim();
  if (!cleaned) return false;
  // Split into "before parens" + "in parens" forms, both candidates.
  const parenMatch = cleaned.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  const candidates: string[] = parenMatch
    ? [parenMatch[1].trim(), parenMatch[2].trim()]
    : [cleaned];

  for (const cand of candidates) {
    if (!cand) continue;
    if (containsAsPhrase(narration, cand)) return true;
  }
  return false;
}

function containsAsPhrase(haystack: string, phrase: string): boolean {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // ASCII names: enforce word boundaries. CJK names have no whitespace
  // word boundaries so we fall back to substring containment.
  const isAscii = /^[\x00-\x7F]+$/.test(phrase);
  const re = isAscii
    ? new RegExp(`\\b${escaped}\\b`, "i")
    : new RegExp(escaped);
  return re.test(haystack);
}

/**
 * NPCs the adventure says should have appeared by the current act but
 * haven't (based on `npcsIntroduced` ledger). The runtime surfaces these
 * to the GM as a "should have introduced X by now" reminder.
 */
export function getOverdueNpcs(opts: {
  currentAct: number;
  npcRoster: ReadonlyArray<{ id: string; name: string; introducedAtStart?: boolean; appearsInAct?: number }>;
  npcsIntroduced: ReadonlyArray<string>;
}): Array<{ id: string; name: string }> {
  const { currentAct, npcRoster, npcsIntroduced } = opts;
  const introduced = new Set(npcsIntroduced);
  return npcRoster
    .filter((n) => !introduced.has(n.id))
    .filter((n) => {
      if (n.introducedAtStart) return true;        // should be on stage from turn 1
      const targetAct = n.appearsInAct ?? Infinity;
      return currentAct >= targetAct;
    })
    .map((n) => ({ id: n.id, name: n.name }));
}

// ─── Boss phase tracking (RPG mode) ─────────────────────────────────────────

export interface BossPhaseTransition {
  /** Possibly-revised state with `activeBoss.currentPhase` advanced. */
  state: GmState;
  /** When non-null, the boss just crossed an HP threshold and the next
   *  prompt should warn the GM to narrate a phase change. */
  transitionedTo: number | null;
}

/**
 * Watch the active boss's HP and auto-advance `currentPhase` when it
 * crosses the next configured threshold. The GM previously declared phase
 * mechanics in the adventure brief but never reliably narrated transitions
 * because nothing tracked HP outside the model's head.
 *
 * `bossEnemy` should be the freshest enemy snapshot (post-PLAYER_UPDATE
 * resolution); the runtime feeds this from `gmState.enemies` looking up
 * the boss by name.
 */
export function reconcileBossPhase(opts: {
  parsedState: GmState;
  bossEnemy?: { name: string; hp: number; maxHp: number } | null;
}): BossPhaseTransition {
  const { parsedState, bossEnemy } = opts;
  const boss = parsedState.activeBoss;
  if (!boss || !bossEnemy || bossEnemy.maxHp <= 0) {
    return { state: parsedState, transitionedTo: null };
  }
  // Sync HP from the enemies array so the GM can't accidentally desync
  // by editing one but not the other.
  const synced: ActiveBossState = {
    ...boss,
    currentHp: bossEnemy.hp,
    maxHp: bossEnemy.maxHp,
  };
  const hpRatio = synced.currentHp / synced.maxHp;
  // phaseThresholds is descending fractions (e.g. [0.5, 0.25]). Phase 1
  // before any threshold crossed; Phase 2 after first; Phase 3 after second.
  const expectedPhase = synced.phaseThresholds.reduce(
    (acc, threshold) => (hpRatio < threshold ? acc + 1 : acc),
    1,
  );
  if (expectedPhase > synced.currentPhase) {
    synced.currentPhase = expectedPhase;
    return {
      state: { ...parsedState, activeBoss: synced },
      transitionedTo: expectedPhase,
    };
  }
  // No transition, but still write back the synced HP.
  return {
    state: { ...parsedState, activeBoss: synced },
    transitionedTo: null,
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
  result = result.replace(/^\s*ENCOUNTER_FIRED:\s*[^\n]+\n?/gim, "");
  return result.trim();
}
