import type { ChannelRoomType } from "@/types/game-master";
import { addContentToSection, replaceContentInSection, toRoomType } from "@/lib/game-master-utils";

export interface ParsedQuickAction {
  label: string;
  template: string;
  icon: string;
  needsTarget?: boolean;
  phase?: string;
  role?: string;
  actionType?: string;
  targetType?: string;
}

export interface ParsedGMTags {
  editRules: string | null;
  addToRules: Array<{ section: string; content: string }>;
  replaceInRules: Array<{ section: string; oldContent: string; newContent: string }>;
  updateRules: string | null;
  setPlayerCount: number | null;
  setGameName: string | null;
  updateGeneral: string | null;
  configChannels: Array<{ id: string; name: string; roomType?: ChannelRoomType }> | null;
  configPlayers: Array<{ name: string; gender?: string; personality?: string; background?: string }> | null;
  configActions: ParsedQuickAction[] | null;
  cleanedResponse: string;
}

/**
 * Parse all GM control tags from a complete AI response.
 * Returns structured data for each tag type + a cleaned response with all tags stripped.
 */
export function parseGMResponseTags(response: string): ParsedGMTags {
  let cleanedResponse = response;

  // 1. EDIT_RULES — complete replacement (highest priority)
  let editRules: string | null = null;
  const editRulesMatch = response.match(/<EDIT_RULES>([\s\S]*?)<\/EDIT_RULES>/i);
  if (editRulesMatch?.[1]?.trim()) {
    editRules = editRulesMatch[1].trim();
    cleanedResponse = cleanedResponse.replace(/<EDIT_RULES>[\s\S]*?<\/EDIT_RULES>/gi, '').trim();
  } else {
    // Incomplete EDIT_RULES (streaming interrupted — no closing tag)
    const incompleteMatch = response.match(/<EDIT_RULES>([\s\S]+)$/i);
    if (incompleteMatch?.[1]?.trim() && incompleteMatch[1].trim().length > 50) {
      editRules = incompleteMatch[1].trim();
      cleanedResponse = cleanedResponse.replace(/<EDIT_RULES>[\s\S]*$/i, '').trim();
    }
  }

  // 2. ADD_TO_RULES — append content to a named section
  const addToRules: ParsedGMTags["addToRules"] = [];
  const addMatches = Array.from(
    response.matchAll(/<ADD_TO_RULES\s+section="([^"]+)"[^>]*>([\s\S]*?)<\/ADD_TO_RULES>/gi),
  );
  for (const match of addMatches) {
    const section = match[1]?.trim();
    const content = match[2]?.trim();
    if (section && content) addToRules.push({ section, content });
    cleanedResponse = cleanedResponse.replace(match[0], '').trim();
  }

  // 3. REPLACE_IN_RULES — find-and-replace inside a named section
  const replaceInRules: ParsedGMTags["replaceInRules"] = [];
  const replaceMatches = Array.from(
    response.matchAll(
      /<REPLACE_IN_RULES\s+section="([^"]+)"\s+old="([^"]+)"\s+new="([^"]+)"[^>]*>\s*<\/REPLACE_IN_RULES>/gi,
    ),
  );
  for (const match of replaceMatches) {
    const section = match[1]?.trim();
    const oldContent = match[2]?.trim();
    const newContent = match[3]?.trim();
    if (section && oldContent && newContent) {
      replaceInRules.push({ section, oldContent, newContent });
    }
    cleanedResponse = cleanedResponse.replace(match[0], '').trim();
  }

  // 4. UPDATE_RULES (legacy format, only when no EDIT_RULES)
  let updateRules: string | null = null;
  if (!editRules) {
    const updateMatch = response.match(/<UPDATE_RULES>([\s\S]*?)<\/UPDATE_RULES>/i);
    if (updateMatch?.[1]?.trim()) {
      updateRules = updateMatch[1].trim();
      cleanedResponse = cleanedResponse.replace(/<UPDATE_RULES>[\s\S]*?<\/UPDATE_RULES>/gi, '').trim();
    }
  }

  // 5. SET_PLAYER_COUNT
  let setPlayerCount: number | null = null;
  const playerCountMatch = response.match(/<SET_PLAYER_COUNT>\s*(\d+)\s*<\/SET_PLAYER_COUNT>/i);
  if (playerCountMatch?.[1]) {
    const n = parseInt(playerCountMatch[1], 10);
    if (!Number.isNaN(n)) setPlayerCount = n;
  }
  cleanedResponse = cleanedResponse.replace(/<SET_PLAYER_COUNT>\s*\d+\s*<\/SET_PLAYER_COUNT>/gi, '').trim();

  // 5b. SET_GAME_NAME
  let setGameName: string | null = null;
  const gameNameMatch = response.match(/<SET_GAME_NAME>([\s\S]*?)<\/SET_GAME_NAME>/i);
  if (gameNameMatch?.[1]?.trim()) {
    setGameName = gameNameMatch[1].trim().slice(0, 100);
  }
  cleanedResponse = cleanedResponse.replace(/<SET_GAME_NAME>[\s\S]*?<\/SET_GAME_NAME>/gi, '').trim();

  // 6. UPDATE_GENERAL (background/story prepended to rules)
  let updateGeneral: string | null = null;
  const generalMatch = response.match(/<UPDATE_GENERAL>([\s\S]*?)<\/UPDATE_GENERAL>/i);
  if (generalMatch?.[1]?.trim()) {
    updateGeneral = generalMatch[1].trim();
  }
  cleanedResponse = cleanedResponse.replace(/<UPDATE_GENERAL>[\s\S]*?<\/UPDATE_GENERAL>/gi, '').trim();

  // 7. CONFIG_CHANNELS
  let configChannels: ParsedGMTags["configChannels"] = null;
  const channelsMatch = response.match(/<CONFIG_CHANNELS>([\s\S]*?)<\/CONFIG_CHANNELS>/i);
  if (channelsMatch?.[1]) {
    try {
      const arr = JSON.parse(channelsMatch[1].trim()) as Array<{ id: string; name: string; roomType?: unknown }>;
      if (Array.isArray(arr) && arr.length > 0) {
        const valid = arr
          .filter((c) => c && typeof c === 'object' && typeof c.id === 'string' && typeof c.name === 'string')
          .map((c) => ({ id: c.id, name: c.name, roomType: toRoomType(c.roomType) }));
        if (valid.length > 0) configChannels = valid;
      }
    } catch { /* ignore parse errors */ }
  }
  cleanedResponse = cleanedResponse.replace(/<CONFIG_CHANNELS>[\s\S]*?<\/CONFIG_CHANNELS>/gi, '').trim();
  cleanedResponse = cleanedResponse.replace(/<CONFIG_CHANNELS>[\s\S]*$/i, '').trim();

  // 8. CONFIG_PLAYERS
  let configPlayers: ParsedGMTags["configPlayers"] = null;
  const playersMatch = response.match(/<CONFIG_PLAYERS>([\s\S]*?)<\/CONFIG_PLAYERS>/i);
  if (playersMatch?.[1]) {
    try {
      const arr = JSON.parse(playersMatch[1].trim()) as Array<{
        name: string; gender?: string; personality?: string; background?: string;
      }>;
      if (Array.isArray(arr) && arr.length > 0) {
        const valid = arr.filter(
          (p): p is { name: string; gender?: string; personality?: string; background?: string } =>
            p && typeof p === 'object' && typeof p.name === 'string',
        );
        if (valid.length > 0) configPlayers = valid;
      }
    } catch { /* ignore parse errors */ }
  }
  cleanedResponse = cleanedResponse.replace(/<CONFIG_PLAYERS>[\s\S]*?<\/CONFIG_PLAYERS>/gi, '').trim();
  cleanedResponse = cleanedResponse.replace(/<CONFIG_PLAYERS>[\s\S]*$/i, '').trim();

  // 9. CONFIG_ACTIONS
  let configActions: ParsedGMTags["configActions"] = null;
  const actionsMatch = response.match(/<CONFIG_ACTIONS>([\s\S]*?)<\/CONFIG_ACTIONS>/i);
  if (actionsMatch?.[1]) {
    try {
      const arr = JSON.parse(actionsMatch[1].trim()) as ParsedQuickAction[];
      if (Array.isArray(arr) && arr.length > 0) {
        const valid = arr.filter(
          (a): a is ParsedQuickAction =>
            a && typeof a === 'object' && typeof a.label === 'string' && typeof a.template === 'string' && typeof a.icon === 'string',
        );
        if (valid.length > 0) configActions = valid;
      }
    } catch { /* ignore parse errors */ }
  }
  cleanedResponse = cleanedResponse.replace(/<CONFIG_ACTIONS>[\s\S]*?<\/CONFIG_ACTIONS>/gi, '').trim();
  cleanedResponse = cleanedResponse.replace(/<CONFIG_ACTIONS>[\s\S]*$/i, '').trim();

  return {
    editRules,
    addToRules,
    replaceInRules,
    updateRules,
    setPlayerCount,
    setGameName,
    updateGeneral,
    configChannels,
    configPlayers,
    configActions,
    cleanedResponse,
  };
}

/**
 * Compute new rules string by applying parsed tag instructions to current rules.
 * Handles EDIT_RULES (full replace, highest priority), ADD_TO_RULES, REPLACE_IN_RULES,
 * and UPDATE_RULES (legacy full replace).
 */
export function applyRulesUpdates(
  currentRules: string,
  parsed: Pick<ParsedGMTags, "editRules" | "addToRules" | "replaceInRules" | "updateRules">,
  defaultRules?: string,
): string {
  if (parsed.editRules) return parsed.editRules;

  let result = currentRules || defaultRules || "";

  for (const { section, content } of parsed.addToRules) {
    result = addContentToSection(result, section, content);
  }

  for (const { section, oldContent, newContent } of parsed.replaceInRules) {
    result = replaceContentInSection(result, section, oldContent, newContent);
  }

  if (parsed.updateRules) {
    result = parsed.updateRules;
  }

  return result;
}

/**
 * Prepend or replace background/story content at the top of rules.
 * Matches UPDATE_GENERAL semantics.
 */
export function applyBackgroundToRules(
  currentRules: string,
  background: string,
  defaultRules?: string,
): string {
  const existing = currentRules || defaultRules || "";
  const hasBackground = existing.match(/^(BACKGROUND|STORY|WORLD)[\s\S]{0,200}/i);
  if (hasBackground) {
    return background + "\n\n" + existing.replace(/^(BACKGROUND|STORY|WORLD)[\s\S]{0,200}\n\n/i, '');
  }
  return background + (existing ? "\n\n" + existing : "");
}

/**
 * Clamp a player count to the valid range for a given template.
 * Without a template, defaults to [1, 19].
 */
export function clampPlayerCount(
  n: number,
  template: { minPlayers: number; maxPlayers: number } | null,
): number {
  const min = template ? template.minPlayers - 1 : 1;
  const max = template ? template.maxPlayers - 1 : 19;
  return Math.min(max, Math.max(min, n));
}
