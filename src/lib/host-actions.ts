/**
 * Host action format and parser: extensible blocks the AI Host can output.
 * Blocks are stripped from the public message and turned into structured actions
 * (e.g. update a player's private "My Board"). New action types can be added
 * by extending HostAction and the BLOCK_PARSERS list.
 */

/** Player reference: "You" for the human, or exact display name for AI players. */
export type PlayerRef = string;

/** Supported host action types. Extend this union when adding new block types. */
export type HostAction =
  | { type: "my_board"; playerRef: PlayerRef; content: string }
  // Future: | { type: "private_msg"; playerRef: PlayerRef; content: string }
  ;

/** Result of parsing host content: public text + list of actions to apply. */
export interface ParseHostActionsResult {
  /** Content to show in chat (blocks removed). */
  cleanContent: string;
  /** Actions to dispatch (e.g. update My Board, send private message). */
  actions: HostAction[];
}

/** One block parser: tag name and regex to extract (playerRef, content). */
interface BlockParser {
  tag: string;
  actionType: HostAction["type"];
  /** Regex with two capture groups: (1) player ref, (2) content. Case-insensitive. */
  regex: RegExp;
}

const BLOCK_PARSERS: BlockParser[] = [
  {
    tag: "BOARD",
    actionType: "my_board",
    // [BOARD:PlayerName or You] ... content ... [/BOARD]
    regex: /\[BOARD:\s*([^\]\r\n]+?)\s*\]\s*([\s\S]*?)\s*\[\/BOARD\]/gi,
  },
  // Future: { tag: "PRIVATE", actionType: "private_msg", regex: /.../gi },
];

/**
 * Parses host reply for special blocks, removes them from the message, and returns
 * clean content plus a list of actions. Order of actions matches order of blocks in the text.
 */
export function parseHostActions(rawContent: string): ParseHostActionsResult {
  let cleanContent = rawContent;
  const actions: HostAction[] = [];

  for (const parser of BLOCK_PARSERS) {
    const re = new RegExp(parser.regex.source, "gi");
    let match: RegExpExecArray | null;
    const replacements: { full: string; replacement: string }[] = [];

    while ((match = re.exec(cleanContent)) !== null) {
      const playerRef = (match[1] ?? "").trim();
      const content = (match[2] ?? "").trim();
      if (parser.actionType === "my_board") {
        actions.push({ type: "my_board", playerRef, content });
      }
      replacements.push({ full: match[0], replacement: "" });
    }

    for (const { full, replacement } of replacements) {
      cleanContent = cleanContent.replace(full, replacement);
    }
  }

  cleanContent = cleanContent.replace(/\n{2,}/g, "\n\n").trim();
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
