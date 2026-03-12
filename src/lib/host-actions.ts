/**
 * Host action format and parser: extensible blocks the AI Host can output.
 * Blocks are stripped from the public message and turned into structured actions
 * (e.g. update a player's private "My Board", write a sidebar Section). New action
 * types can be added by extending HostAction and the BLOCK_PARSERS list.
 */

/** Player reference: "You" for the human, or exact display name for AI players. */
export type PlayerRef = string;

/** Supported host action types. Extend this union when adding new block types. */
export type HostAction =
  | { type: "my_board"; playerRef: PlayerRef; content: string }
  /**
   * ACCESS: grant/revoke room visibility for a list of players.
   * playerRefs = ["*"] means public (everyone), [] means locked (no one).
   */
  | { type: "access"; channelRef: string; playerRefs: PlayerRef[] }
  | { type: "section"; title: string; content: string }
  /** GAME_OVER: AI Host signals the game has ended. summary = optional winner/result text. */
  | { type: "game_over"; summary: string }
  /**
   * PLAYER_NOTES: written by the AI player itself (not the Host) to persist private thoughts
   * across turns. Stripped from the public message and stored per-player.
   * content replaces the player's previous notes each turn.
   */
  | { type: "player_notes"; content: string }
  /** GM-driven phase label (e.g. "Night · Round 2") */
  | { type: "phase"; label: string }
  /** Announcement banner injected into chat as a visual divider */
  | { type: "announce"; text: string }
  /** Background mood shift for the chat area */
  | { type: "mood"; value: "dark" | "light" | "neutral" }
  /** Start a structured vote */
  | { type: "start_vote"; question: string; options: string[] | "players" }
  /** End the current active vote */
  | { type: "end_vote" }
  /** Start or stop a countdown timer */
  | { type: "timer"; seconds: number | "stop" }
  /** Emoji reaction to a recent message */
  | { type: "react"; emoji: string; targetSender?: string }
  /** Engagement score for the last message (1-5), controls passive AI reactions */
  | { type: "engagement"; score: number }
  /** Move the party to a new scene/location in exploration RPG */
  | { type: "scene_change"; sceneId: string; sceneName?: string }
  /** Change a player's HP (positive = heal, negative = damage) */
  | { type: "hp_change"; playerRef: PlayerRef; delta: number; maxHp?: number }
  /** Add or remove an item from a player's inventory */
  | { type: "item_change"; playerRef: PlayerRef; item: string; action: "add" | "remove" }
  /** Skill check: player, skill name, difficulty class, and result */
  | { type: "skill_check"; playerRef: PlayerRef; skill: string; dc: number; roll?: number }
  /** Start or end a combat encounter */
  | { type: "combat"; action: "start" | "end"; enemy?: string }
  /** Update quest progress */
  | { type: "quest_update"; questId: string; status: "start" | "progress" | "complete" | "fail"; description?: string }
  ;

/** Result of parsing host content: public text + list of actions to apply. */
export interface ParseHostActionsResult {
  /** Content to show in chat (blocks removed). */
  cleanContent: string;
  /** Actions to dispatch (e.g. update My Board, write sidebar Section). */
  actions: HostAction[];
}

/** One block parser: tag name, first-capture meaning, and regex. */
interface BlockParser {
  tag: string;
  actionType: HostAction["type"];
  /** Regex with two capture groups: (1) label/playerRef/title/channelRef, (2) content. Case-insensitive. */
  regex: RegExp;
}

const BLOCK_PARSERS: BlockParser[] = [
  {
    tag: "BOARD",
    actionType: "my_board",
    // [BOARD:PlayerName or You] ... content ... [/BOARD]
    regex: /\[BOARD:\s*([^\]\r\n]+?)\s*\]\s*([\s\S]*?)\s*\[\/BOARD\]/gi,
  },
  {
    tag: "ACCESS",
    actionType: "access",
    // [ACCESS:ChannelName] Player1, Player2 [/ACCESS]  — content may be empty (lock) or "*" (public)
    regex: /\[ACCESS:\s*([^\]\r\n]+?)\s*\]\s*([\s\S]*?)\s*\[\/ACCESS\]/gi,
  },
  {
    tag: "SECTION",
    actionType: "section",
    // [SECTION:Title] ... content (markdown) ... [/SECTION]
    regex: /\[SECTION:\s*([^\]\r\n]+?)\s*\]\s*([\s\S]*?)\s*\[\/SECTION\]/gi,
  },
  {
    tag: "GAME_OVER",
    actionType: "game_over",
    // [GAME_OVER] optional summary text [/GAME_OVER]
    // label group is unused (empty string); content is the winner/result summary.
    regex: /\[GAME_OVER\]\s*([\s\S]*?)\s*\[\/GAME_OVER\]/gi,
  },
  {
    tag: "MY_NOTES",
    actionType: "player_notes",
    // [MY_NOTES] player's private thoughts [/MY_NOTES]
    // label group is unused; content is the player's notes.
    regex: /\[MY_NOTES\]\s*([\s\S]*?)\s*\[\/MY_NOTES\]/gi,
  },
];

/**
 * Parses host reply for special blocks, removes them from the message, and returns
 * clean content plus a list of actions. Order of actions matches order of blocks in the text.
 *
 * Defensive stripping also handles the leaked format where the AI omits the [MY_NOTES]
 * opening tag (due to token pressure) but still outputs note content + [/MY_NOTES]:
 *   "(message) - note1\n• note2\n[/MY_NOTES]"
 */
export function parseHostActions(rawContent: string): ParseHostActionsResult {
  let cleanContent = rawContent;
  const actions: HostAction[] = [];

  for (const parser of BLOCK_PARSERS) {
    const re = new RegExp(parser.regex.source, "gi");
    let match: RegExpExecArray | null;
    const replacements: { full: string; replacement: string }[] = [];

    while ((match = re.exec(cleanContent)) !== null) {
      const label = (match[1] ?? "").trim();
      const content = (match[2] ?? "").trim();
      if (parser.actionType === "my_board") {
        actions.push({ type: "my_board", playerRef: label, content });
      } else if (parser.actionType === "access") {
        // Parse comma-separated player list; empty content = lock, "*" = public
        const playerRefs = content
          ? content.split(",").map((s) => s.trim()).filter(Boolean)
          : [];
        actions.push({ type: "access", channelRef: label, playerRefs });
      } else if (parser.actionType === "section") {
        actions.push({ type: "section", title: label, content });
      } else if (parser.actionType === "game_over") {
        // For [GAME_OVER], label is empty; content (match[1]) is the summary
        actions.push({ type: "game_over", summary: label || content });
      } else if (parser.actionType === "player_notes") {
        // For [MY_NOTES], label is empty; content (match[1]) is the player's private notes
        actions.push({ type: "player_notes", content: label || content });
      }
      replacements.push({ full: match[0], replacement: "" });
    }

    for (const { full, replacement } of replacements) {
      cleanContent = cleanContent.replace(full, replacement);
    }
  }

  // ─── Defensive: strip leaked [MY_NOTES] where opening tag was omitted ──
  // The AI sometimes skips [MY_NOTES] to save tokens, outputting:
  //   "(message) - note1\n• note2\n[/MY_NOTES]"
  // We strip from the first note-separator (" - " or newline-"• ") that leads
  // to a [/MY_NOTES] closing tag, then clean up any bare tags.
  if (/\[\/MY_NOTES\]/i.test(cleanContent)) {
    // Inline note on same line as message: "text - note...[/MY_NOTES]"
    cleanContent = cleanContent.replace(/ - [\s\S]*?\[\/MY_NOTES\]/i, '');
    // Newline-prefixed note blocks: "\n- note\n• note\n[/MY_NOTES]"
    cleanContent = cleanContent.replace(/\n[-•][\s\S]*?\[\/MY_NOTES\]/i, '');
    // Fallback: strip any remaining closing tag
    cleanContent = cleanContent.replace(/\[\/MY_NOTES\]/gi, '');
  }
  // Strip orphaned opening tags (e.g. model output got cut off before content)
  cleanContent = cleanContent.replace(/\[MY_NOTES\]/gi, '');

  // ─── Inline single-line directives (GM-driven UI) ──────────────────────
  const INLINE_DIRECTIVES: Array<{
    regex: RegExp;
    parse: (match: RegExpExecArray) => HostAction;
  }> = [
    {
      regex: /^PHASE:\s*(.+)$/gim,
      parse: (m) => ({ type: "phase", label: m[1].trim() }),
    },
    {
      regex: /^ANNOUNCE:\s*(.+)$/gim,
      parse: (m) => ({ type: "announce", text: m[1].trim() }),
    },
    {
      regex: /^MOOD:\s*(dark|light|neutral)$/gim,
      parse: (m) => ({ type: "mood", value: m[1].trim().toLowerCase() as "dark" | "light" | "neutral" }),
    },
    {
      regex: /^START_VOTE:\s*(.+)$/gim,
      parse: (m) => {
        const raw = m[1].trim();
        const pipeIdx = raw.indexOf("|");
        if (pipeIdx === -1) return { type: "start_vote", question: raw, options: "players" };
        const question = raw.slice(0, pipeIdx).trim();
        const options = raw.slice(pipeIdx + 1).split(",").map(s => s.trim()).filter(Boolean);
        return { type: "start_vote", question, options: options.length ? options : "players" };
      },
    },
    {
      regex: /^END_VOTE\s*$/gim,
      parse: () => ({ type: "end_vote" }),
    },
    {
      regex: /^TIMER:\s*(\d+|stop)$/gim,
      parse: (m) => {
        const val = m[1].trim().toLowerCase();
        return { type: "timer", seconds: val === "stop" ? "stop" : parseInt(val, 10) };
      },
    },
    {
      // REACT: 😂               ← react to the last message
      // REACT: 👍 -> Noah Reyes  ← react to the last message from that player
      regex: /^REACT:\s*(\S+)(?:\s*->\s*(.+?))?$/gim,
      parse: (m) => ({
        type: "react",
        emoji: m[1].trim(),
        targetSender: m[2]?.trim() || undefined,
      }),
    },
    {
      regex: /^ENGAGEMENT:\s*(\d)$/gim,
      parse: (m) => ({
        type: "engagement",
        score: Math.max(1, Math.min(5, parseInt(m[1], 10))),
      }),
    },
    {
      regex: /^SCENE:\s*(.+?)(?:\s*\|\s*(.+?))?$/gim,
      parse: (m) => ({
        type: "scene_change",
        sceneId: m[1].trim().toLowerCase().replace(/\s+/g, "_"),
        sceneName: m[2]?.trim() || m[1].trim(),
      }),
    },
    {
      regex: /^HP:\s*(.+?)\s*\|\s*([+-]?\d+)(?:\s*\/\s*(\d+))?$/gim,
      parse: (m) => ({
        type: "hp_change",
        playerRef: m[1].trim(),
        delta: parseInt(m[2], 10),
        maxHp: m[3] ? parseInt(m[3], 10) : undefined,
      }),
    },
    {
      regex: /^ITEM:\s*(.+?)\s*\|\s*([+-])\s*(.+)$/gim,
      parse: (m) => ({
        type: "item_change",
        playerRef: m[1].trim(),
        item: m[3].trim(),
        action: m[2] === "+" ? "add" as const : "remove" as const,
      }),
    },
    {
      regex: /^SKILL_CHECK:\s*(.+?)\s*\|\s*(.+?)\s*\|\s*DC:?\s*(\d+)(?:\s*\|\s*(\d+))?$/gim,
      parse: (m) => ({
        type: "skill_check",
        playerRef: m[1].trim(),
        skill: m[2].trim(),
        dc: parseInt(m[3], 10),
        roll: m[4] ? parseInt(m[4], 10) : undefined,
      }),
    },
    {
      regex: /^COMBAT:\s*(start|end)(?:\s*\|\s*(.+?))?$/gim,
      parse: (m) => ({
        type: "combat",
        action: m[1].trim().toLowerCase() as "start" | "end",
        enemy: m[2]?.trim(),
      }),
    },
    {
      regex: /^QUEST:\s*(.+?)\s*\|\s*(start|progress|complete|fail)(?:\s*\|\s*(.+?))?$/gim,
      parse: (m) => ({
        type: "quest_update",
        questId: m[1].trim(),
        status: m[2].trim().toLowerCase() as "start" | "progress" | "complete" | "fail",
        description: m[3]?.trim(),
      }),
    },
  ];

  for (const dir of INLINE_DIRECTIVES) {
    const re = new RegExp(dir.regex.source, dir.regex.flags);
    let match: RegExpExecArray | null;
    const toRemove: string[] = [];
    while ((match = re.exec(cleanContent)) !== null) {
      actions.push(dir.parse(match));
      toRemove.push(match[0]);
    }
    for (const full of toRemove) {
      cleanContent = cleanContent.replace(full, "");
    }
  }

  cleanContent = cleanContent
    .replace(/\[\/?MY_NOTES\]/gi, "")
    .replace(/\[\/?BOARD(?::[^\]]*)?\]/gi, "")
    .replace(/\[\/?ACCESS(?::[^\]]*)?\]/gi, "")
    .replace(/\[\/?SECTION(?::[^\]]*)?\]/gi, "")
    .replace(/\[\/?GAME_OVER\]/gi, "")
    .replace(/\n{2,}/g, "\n\n")
    .trim();
  return { cleanContent, actions };
}

/**
 * Resolves a player ref ("You" or player name) to a player id.
 * Returns null if not found (e.g. typo in name).
 */
export function resolvePlayerRefToId(
  playerRef: PlayerRef,
  players: Array<{ id: string; name: string }>,
  userId: string,
  humanDisplayName?: string | null
): string | null {
  const ref = playerRef.trim();
  if (!ref) return null;
  if (ref.toLowerCase() === "you") return userId;
  const byName = players.find((p) => p.name === ref || p.name.trim() === ref);
  if (byName) return byName.id;
  if (humanDisplayName && (humanDisplayName === ref || humanDisplayName.trim() === ref)) return userId;
  return null;
}
