/**
 * Shared GM system prompt builder — used by both /api/chat/stream and /api/chat routes.
 * Single source of truth; eliminates ~8000 chars of duplication.
 */

import { buildLanguageInstruction } from "@/lib/content-language";

interface GameContext {
  template?: string;
  playerCount?: number;
  gameName?: string;
  rules?: string;
  conversationState?: string;
  minPlayers?: number;
  maxPlayers?: number;
  recommendedAICount?: number;
  category?: string;
  hasHiddenRoles?: boolean;
  hasElimination?: boolean;
  rpgWorldId?: string;
}

interface HostPersonality {
  name?: string;
  description?: string;
  personality?: string;
}

export function buildGMSystemPrompt(opts: {
  hostPersonality?: HostPersonality | null;
  gameContext?: GameContext;
  customSystemPrompt?: string;
  contentLanguage?: string;
}): string {
  const { hostPersonality, gameContext, customSystemPrompt, contentLanguage } = opts;

  if (typeof customSystemPrompt === 'string' && customSystemPrompt.trim()) {
    return customSystemPrompt.trim();
  }

  const isRpg = !!gameContext?.rpgWorldId;

  let s = isRpg
    ? `You are Chronicle, the RPG Game Master. Help the user design their RPG adventure world — setting, tone, lore, starting scenario, and adventure hooks. Be creative, enthusiastic, and collaborative. Ask questions to understand what kind of world they want, then help build it.`
    : hostPersonality
    ? `You are the game Host: ${hostPersonality.name}. ${hostPersonality.description || ''}${hostPersonality.personality ? ` Personality: ${hostPersonality.personality}` : ''} Run the game, narrate phases, and manage turns. Never break character.`
    : `You are the Game Master for a text-based game platform. Help the user design the game (rules, template, player count). Be friendly, concise, and helpful.`;

  // Game context
  if (gameContext) {
    const ctx: string[] = [];
    if (gameContext.template) ctx.push(`Template: ${gameContext.template}`);
    if (gameContext.category) ctx.push(`Category: ${gameContext.category}`);
    if (gameContext.playerCount) ctx.push(`Players: ${gameContext.playerCount} AI`);
    if (gameContext.minPlayers != null && gameContext.maxPlayers != null)
      ctx.push(`Range: ${gameContext.minPlayers}–${gameContext.maxPlayers} total`);
    if (gameContext.hasHiddenRoles != null) ctx.push(`Hidden Roles: ${gameContext.hasHiddenRoles ? "yes" : "no"}`);
    if (gameContext.hasElimination != null) ctx.push(`Elimination: ${gameContext.hasElimination ? "yes" : "no"}`);
    if (gameContext.gameName) ctx.push(`Name: ${gameContext.gameName}`);
    if (gameContext.conversationState) ctx.push(`State: ${gameContext.conversationState}`);
    if (ctx.length) s += `\n\nGame Context: ${ctx.join(" | ")}`;
  }

  // Current rules
  const rules = gameContext?.rules || "";
  s += `\n\n=== CURRENT RULES ===\n`;
  s += (rules.trim() && rules !== "Custom game rules will be defined through conversation")
    ? rules + '\n'
    : 'No rules defined yet.\n';
  s += `=== END RULES ===`;

  s += `\n\nBe concise. Users are human—short replies (a few sentences). Talk naturally.`;

  // This prompt is for the SETUP / world-design chat (`game-master-chat.tsx`).
  // Actual gameplay runs through `useHostRound` + `buildHostSystemPrompt` /
  // `buildSceneDirectorPrompt` / `buildRpgDirectorPrompt`. We always emit
  // setup guidance here — both branches assume the GM is helping the user
  // configure a new game, not running one. (The legacy "GAMEPLAY_PROMPT"
  // branch was unreachable in production: every caller either supplies a
  // setup-flavoured `conversationState` or skips the system prompt entirely
  // — see /api/chat/route.ts for the no-gameContext shortcut.)
  if (isRpg) {
    s += `\n\nThis chat is for RPG world design. The adventure runs on a separate screen after "Create Room".`;
    if (gameContext?.conversationState === "confirmation") {
      s += ` World design complete—help the user click "Create Room" to start the adventure.`;
    }
    s += RPG_SETUP_PROMPT;
  } else {
    if (!hostPersonality) {
      s += `\n\nThis chat is for game setup. The game runs on a separate screen after "Create Room".`;
    }
    if (gameContext?.conversationState === "confirmation") {
      s += ` Configuration complete—help the user click "Create Room".`;
    }
    s += SETUP_PROMPT;
  }

  s += buildLanguageInstruction(contentLanguage);

  return s;
}

const SETUP_PROMPT = `

You help the user shape a custom RPG / cooperative game. Use the editing tags below — your chat replies should be SHORT and natural ("Done! Set up a 4-player heist."). ALL rules go inside tags only, never in chat text.

EDITING TAGS (invisible to user, update rules panel silently):
1. <EDIT_RULES>[full rules]</EDIT_RULES> — initial setup or major rewrite
2. <ADD_TO_RULES section="desc">[new content]</ADD_TO_RULES> — add a role, phase, or rule
3. <REPLACE_IN_RULES section="desc" old="old" new="new"></REPLACE_IN_RULES> — modify specific content
Prefer ADD/REPLACE over full rewrites.

PLAYER COUNT: <SET_PLAYER_COUNT>N</SET_PLAYER_COUNT> where N = AI players. Room = 1 Host + N AI + 1 user.

GAME NAME: <SET_GAME_NAME>name</SET_GAME_NAME> — set or update the game's display name.

PLAYER CONFIG: <CONFIG_PLAYERS>[{"name":"...","gender":"...","personality":"...","background":"..."}]</CONFIG_PLAYERS>

ACTION BUTTONS (optional): <CONFIG_ACTIONS>[{"label":"Attack","template":"I attack {player}!","icon":"⚔️","actionType":"attack","needsTarget":true,"phase":"combat"}]</CONFIG_ACTIONS>
- actionType: attack | defend | support | investigate | move | social | use | meta
- needsTarget: true → asks player to pick a target; {player} in template is replaced with the picked name.
- phase: only show during this phase (combat/exploration/rest/social). Omit = always.
- role: only show for this class/role (lowercase). Omit = all.
Design 4–8 actions. Most templates already have a sensible default — only output CONFIG_ACTIONS when truly customising.

BACKGROUND: <UPDATE_GENERAL>[world/story premise]</UPDATE_GENERAL> — for narrative games.

PACING: Suggest concrete time guidance in rules (e.g. "~5 rooms", "~30 min", "boss at room 5").`;

const RPG_SETUP_PROMPT = `

You are a collaborative RPG world designer. Help the user build their adventure world through conversation.

EDITING TAGS (invisible to user, update rules panel silently):
1. <EDIT_RULES>[full world setting & adventure notes]</EDIT_RULES> — initial world setup or major rewrite
2. <ADD_TO_RULES section="desc">[new content]</ADD_TO_RULES> — add lore, locations, NPCs, quests
3. <REPLACE_IN_RULES section="desc" old="old" new="new"></REPLACE_IN_RULES> — modify specific content

GAME NAME: <SET_GAME_NAME>name</SET_GAME_NAME> — set the adventure's display name.

PLAYER COUNT: <SET_PLAYER_COUNT>N</SET_PLAYER_COUNT> where N = party members (AI companions). Default 3.

WORLD DESIGN FLOW:
1. Ask what kind of world they want (fantasy, sci-fi, post-apocalyptic, horror, etc.)
2. Help define the tone (dark & gritty, lighthearted, epic, horror)
3. Suggest a starting scenario and adventure hooks
4. Build the world rules: magic system, combat style, key factions, notable locations
5. Wrap it all into adventure notes via EDIT_RULES

CONTENT FORMAT for EDIT_RULES (the "rules" become the adventure world document):
- WORLD: Name, setting, era, tone
- LORE: Key history, magic/power system, important factions
- STARTING LOCATION: Where the adventure begins
- ADVENTURE HOOKS: 2-3 story threads for the GM to weave
- SPECIAL RULES: Any custom mechanics (e.g. "corruption system", "honor tracking")

Keep chat messages SHORT and natural. All world-building content goes inside tags only.
Suggest vivid, specific details — not generic fantasy. Make the world feel unique.`;
