/**
 * Shared prompt fragments — eliminate duplication across the three GM prompt
 * builders (`buildHostSystemPrompt`, `buildSceneDirectorPrompt`,
 * `buildRpgDirectorPrompt`). Keeping these in one place prevents drift when
 * the directive set or output format evolves.
 *
 * Token-budget note: every helper here is designed to keep the prompt LEAN.
 * GM_STATE is serialized without indentation (saves ~25-30%), and large
 * structures like the visited-room graph are summarised down to one line per
 * room rather than dumped wholesale.
 */

import type { GmState, MudRoom } from "@/lib/gm-state";

// ─── Output format ─────────────────────────────────────────────────────────

/**
 * The mandatory NARRATION ↔ DIRECTIVES split that all three GM prompts use.
 * Examples are intentionally minimal — the per-prompt section above this can
 * supply richer flavour examples without repeating the format rule.
 */
export const OUTPUT_FORMAT_FRAGMENT = `## OUTPUT FORMAT — MANDATORY
Every reply MUST be split into exactly two sections by a line containing only "---":

1. NARRATION (before ---): What players see in chat. Atmospheric, present tense. Match length to the moment.
2. DIRECTIVES (after ---): Hidden machine commands — NEXT_SPEAKER, GM_STATE, CHARACTER_DIRECTION, etc.

ALWAYS output "---". ALWAYS include NEXT_SPEAKER (except after GAME_OVER).`;

// ─── Player input format ────────────────────────────────────────────────────

export const PLAYER_INPUT_FORMAT_FRAGMENT = `## PLAYER INPUT FORMAT
The human player's messages are tagged:
- [SAY] = the player is speaking in-character (dialogue). Other characters should respond conversationally.
- [ACTION] = the player is performing a physical action. You MUST narrate the outcome/consequence.
When you receive an [ACTION], always respond with narration (never stay silent). Resolve per game rules.`;

// ─── Narrating AI character physical actions ────────────────────────────────

export const NARRATE_AI_ACTIONS_FRAGMENT = `## NARRATING AI CHARACTER ACTIONS
AI characters only produce dialogue — they do NOT describe their own actions. YOU narrate their physical actions.
- When an AI character's dialogue implies a physical action ("I'll check the door"), narrate what they do.
- Use third-person narration: "Mira slams her hand on the table." Keep it brief and vivid.`;

// ─── Character direction ──────────────────────────────────────────────────

/**
 * Single canonical CHARACTER_DIRECTION block. The previous prompts repeated
 * "MANDATORY / CRITICAL / NOT optional" 3–4 times each, which led the model to
 * tunnel-vision on whispering at the expense of actually advancing the scene.
 * We keep ONE clear instruction here; per-prompt sections may reference it but
 * should not repeat the emphasis.
 */
export const CHARACTER_DIRECTION_FRAGMENT = `## CHARACTER DIRECTIONS
You can secretly steer individual characters. They will follow your direction naturally without knowing it came from you.
Format: CHARACTER_DIRECTION: <Name> | <specific instruction about what to do/say/feel>

When useful (not every turn — pick what serves the moment):
- The party needs to make a decision → have characters disagree before the human decides.
- A character's fear, goal, or background is relevant → trigger it.
- The human has been silent too long → have a character turn to them.
- A discovery just happened → react through a character, not a narration line.

Output 0–2 per turn. A turn with one well-aimed CHARACTER_DIRECTION beats three generic ones.`;

// ─── GM_STATE serialization ─────────────────────────────────────────────────

/**
 * Serialize GM state for inclusion in a prompt. We deliberately:
 *   1. Omit `worldRooms.rooms` (room graph) — it can balloon to 1k+ tokens
 *      after a long session. The per-prompt `KNOWN ROOMS` section gives the
 *      one-line summary the GM actually needs.
 *   2. Skip indentation (no `null, 2`). 25–30% smaller payload, no model
 *      comprehension loss.
 */
export function serializeGmStateForPrompt(state: GmState | null | undefined): string {
  if (!state) return "{}";
  const compact: Partial<GmState> & { worldRoomsCurrent?: string } = { ...state };
  if (compact.worldRooms) {
    compact.worldRoomsCurrent = compact.worldRooms.currentRoomId;
    delete compact.worldRooms;
  }
  return JSON.stringify(compact);
}

// ─── World room summary (slim) ──────────────────────────────────────────────

/**
 * Produce a SLIM "known rooms" summary for the prompt: only the current room
 * gets full detail; one-hop neighbours are listed by id+name; everything else
 * collapses to an id list.
 *
 * Without this slimming, RPG director prompts grew unboundedly (~1.5k tokens
 * after ~15 visited rooms) because the entire room graph was dumped each turn.
 */
export function buildKnownRoomsBlock(state: GmState | null | undefined): string {
  const wr = state?.worldRooms;
  if (!wr || !wr.rooms) return "";
  const current = wr.rooms[wr.currentRoomId];
  if (!current) return "";

  const neighbourIds = new Set<string>();
  for (const exit of current.exits ?? []) {
    if (exit.roomId) neighbourIds.add(exit.roomId);
  }
  neighbourIds.delete(current.id);

  const formatRoomFull = (r: MudRoom): string => {
    const exitList = r.exits?.length
      ? r.exits.map((e) => `${e.direction}→${e.roomId}${e.label ? ` (${e.label})` : ""}${e.locked ? " [locked]" : ""}${e.hidden ? " [hidden]" : ""}`).join(", ")
      : "none";
    const npcs = r.npcs?.length ? r.npcs.map((n) => n.name).join(", ") : "none";
    const items = r.items?.length ? r.items.map((i) => i.name).join(", ") : "none";
    return [
      `Current room: ${r.name} (id: ${r.id})`,
      r.description ? `  ${r.description}` : null,
      `  Exits: ${exitList}`,
      `  NPCs: ${npcs}`,
      `  Items: ${items}`,
    ].filter(Boolean).join("\n");
  };

  const formatNeighbour = (id: string): string => {
    const r = wr.rooms[id];
    return r ? `  - ${id}: "${r.name}"` : `  - ${id}: (not yet generated)`;
  };

  const otherIds = Object.keys(wr.rooms).filter((id) => id !== current.id && !neighbourIds.has(id));

  const sections = [
    "## CURRENT ROOM",
    formatRoomFull(current),
  ];
  if (neighbourIds.size > 0) {
    sections.push("\n## NEIGHBOURING ROOMS (one hop)");
    for (const id of neighbourIds) sections.push(formatNeighbour(id));
  }
  if (otherIds.length > 0) {
    sections.push(`\n## OTHER VISITED ROOMS (${otherIds.length})`);
    sections.push(otherIds.map((id) => `  - ${id}`).join(", "));
  }
  sections.push("\nMaintain consistency: if the party revisits a room, keep its core description but update NPCs/items based on what happened.");
  return sections.join("\n");
}

// ─── Drama / silent toggles ────────────────────────────────────────────────

/**
 * Emit ONE behavioural block matching the host's mode. The previous prompts
 * stacked silent + active + dramatization rules together, which contradicted
 * each other for `silentByDefault` games. Now they're mutually exclusive.
 */
export function buildVoiceBlock(opts: {
  silentByDefault: boolean;
  drama: "low" | "medium" | "high";
  hostAnswersQuestions?: boolean;
}): string {
  const { silentByDefault, drama, hostAnswersQuestions } = opts;

  if (silentByDefault) {
    return `## NARRATIVE VOICE
Most turns do NOT need narration. Leave NARRATION empty and output only directives unless:
1. A game-mechanical action needs resolution (phase transition, vote result, role reveal, answer recording).
2. A dramatic moment just happened and ONE atmospheric line would add immersion.
${hostAnswersQuestions ? "EXCEPTION: You MUST answer every yes/no question from players, narrated as environmental response.\n" : ""}- No filler ("Alright!", "Great!"). No announcing who speaks next — NEXT_SPEAKER handles it.
- Before narrating, scan the last 8 messages — if you already said the same thing, stay SILENT.`;
  }

  const dramaLine = drama === "high"
    ? `- DRAMA: HIGH. Build suspense before reveals. Pause before vote results. Paint elimination scenes vividly.
- Phase transitions: cinematic ("Darkness swallows the village. Someone will not see morning.").
- Eliminations / close votes: milk the tension, then reveal.`
    : drama === "medium"
    ? `- DRAMA: MEDIUM. Set atmosphere. React to interesting moments. Keep energy up.
- Phase transitions: atmospheric ("Night falls over the village."), not bureaucratic ("It is now the Night Phase").
- Eliminations / close votes: build a beat of suspense, then reveal.`
    : `- DRAMA: LOW. Keep narration clean and evocative. React occasionally to interesting moments.
- Phase transitions: brief and atmospheric.`;

  return `## NARRATIVE VOICE
React to dramatic moments, build suspense before reveals, set atmosphere between phases.
Match length to the moment — one punchy line for simple beats, a few sentences for dramatic reveals. Never pad, never ramble.
${hostAnswersQuestions ? "EXCEPTION: You MUST answer every yes/no question from players, narrated as environmental response.\n" : ""}${dramaLine}
- No filler ("Alright!", "Great!"). No announcing who speaks next — NEXT_SPEAKER handles it.
- Before narrating, scan the last 8 messages — if you already said the same thing, stay SILENT. Don't repeat yourself.`;
}
