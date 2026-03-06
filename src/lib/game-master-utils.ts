import type { GameTemplate } from "@/lib/game-templates";
import type { ChannelRoomType } from "@/types/game-master";

export function formatMessageTime(date: Date): string {
  const now = new Date();
  const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (isToday) return timeStr;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();
  if (isYesterday) return `Yesterday ${timeStr}`;
  return `${date.toLocaleDateString([], { month: "short", day: "numeric" })} ${timeStr}`;
}

// Notion-style: on Enter, turn current line starting with # / - into heading/list, then newline (works without space)
export function handleGameDocEnter(editor: unknown): boolean {
  const ed = editor as { state: { selection: { $from: { depth: number; before: (d: number) => number; node: (d: number) => { type: { name: string }; textContent: string; nodeSize: number } } } }; commands: { insertContentAt: (pos: unknown, content: unknown, opts?: unknown) => boolean } } | null;
  if (!ed) return false;
  const { state, commands } = ed;
  const $from = state.selection.$from;
  const depth = $from.depth;
  const node = $from.node(depth);
  if (node.type.name !== "paragraph") return false;
  const text = node.textContent;
  const from = $from.before(depth);
  const to = from + node.nodeSize;

  let insert: { type: string; attrs?: Record<string, number>; content: unknown[] }[] | null = null;

  const hMatch = text.match(/^(#{1,6})\s*(.*)$/);
  if (hMatch) {
    const level = Math.min(hMatch[1].length, 3);
    const rest = (hMatch[2] ?? "").trim();
    insert = [
      { type: "heading", attrs: { level }, content: rest ? [{ type: "text", text: rest }] : [] },
      { type: "paragraph", content: [] },
    ];
  } else if (/^[-*]\s*(.*)$/.test(text)) {
    const rest = text.replace(/^[-*]\s*/, "").trim();
    insert = [
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [{ type: "paragraph", content: rest ? [{ type: "text", text: rest }] : [] }],
          },
        ],
      },
      { type: "paragraph", content: [] },
    ];
  } else if (/^\d+\.\s*(.*)$/.test(text)) {
    const rest = text.replace(/^\d+\.\s*/, "").trim();
    insert = [
      {
        type: "orderedList",
        content: [
          {
            type: "listItem",
            content: [{ type: "paragraph", content: rest ? [{ type: "text", text: rest }] : [] }],
          },
        ],
      },
      { type: "paragraph", content: [] },
    ];
  }

  if (!insert) return false;
  commands.insertContentAt({ from, to }, insert, { updateSelection: true });
  return true;
}

/** Strip GM control tags so they are never shown in the chat bubble. */
export function cleanGMMessageContentForDisplay(content: string): string {
  if (!content?.trim()) return content;
  return content
    .replace(/<EDIT_RULES>[\s\S]*?<\/EDIT_RULES>/gi, '')
    .replace(/<ADD_TO_RULES[^>]*>[\s\S]*?<\/ADD_TO_RULES>/gi, '')
    .replace(/<REPLACE_IN_RULES[^>]*>[\s\S]*?<\/REPLACE_IN_RULES>/gi, '')
    .replace(/<UPDATE_RULES>[\s\S]*?<\/UPDATE_RULES>/gi, '')
    .replace(/<CONFIG_PLAYERS>[\s\S]*?<\/CONFIG_PLAYERS>/gi, '')
    .replace(/<CONFIG_CHANNELS>[\s\S]*?<\/CONFIG_CHANNELS>/gi, '')
    .replace(/<SET_PLAYER_COUNT>\s*\d+\s*<\/SET_PLAYER_COUNT>/gi, '')
    .replace(/<UPDATE_GENERAL>[\s\S]*?<\/UPDATE_GENERAL>/gi, '')
    .replace(/<EDIT_RULES>[\s\S]*$/i, '')
    .replace(/<ADD_TO_RULES[^>]*>[\s\S]*$/i, '')
    .replace(/<REPLACE_IN_RULES[^>]*>[\s\S]*$/i, '')
    .replace(/<CONFIG_PLAYERS>[\s\S]*$/i, '')
    .replace(/<CONFIG_CHANNELS>[\s\S]*$/i, '')
    .replace(/<SET_PLAYER_COUNT>\s*\d*\s*$/i, '')
    .replace(/<UPDATE_GENERAL>[\s\S]*$/i, '')
    .trim();
}

export function generateSessionTitle(template: GameTemplate | null, playerCount: number, gameName?: string): string {
  const trimmedName = gameName?.trim();
  const countStr = playerCount === 0 ? "GM decides" : `${playerCount + 1} Players`;
  if (trimmedName) return `${trimmedName} - ${countStr}`;
  if (!template) return "New Game Setup";
  if (template.id === "custom") return "Custom Game Setup";
  return `${template.name} - ${countStr}`;
}

/** Strip markdown from quick-reply labels so "**Mini Werewolf**" shows as "Mini Werewolf" */
export function stripChipLabel(raw: string): string {
  return (raw || "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`(.*?)`/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export function htmlToMarkdown(html: string): string {
  let md = html;
  // h1-h3
  md = md.replace(/<h1>([\s\S]*?)<\/h1>/g, "# $1\n");
  md = md.replace(/<h2>([\s\S]*?)<\/h2>/g, "## $1\n");
  md = md.replace(/<h3>([\s\S]*?)<\/h3>/g, "### $1\n");
  // Lists
  md = md.replace(/<ul>([\s\S]*?)<\/ul>/g, (_match: string, content: string) => {
    return content.replace(/<li>(.*?)<\/li>/g, "- $1\n");
  });
  md = md.replace(/<ol>([\s\S]*?)<\/ol>/g, (_match: string, content: string) => {
    let i = 1;
    return content.replace(/<li>(.*?)<\/li>/g, (_: string, item: string) => `${i++}. ${item}\n`);
  });
  // Bold, italic, code
  md = md.replace(/<strong>(.*?)<\/strong>/g, "**$1**");
  md = md.replace(/<em>(.*?)<\/em>/g, "*$1*");
  md = md.replace(/<code>(.*?)<\/code>/g, "`$1`");
  // Paragraphs
  md = md.replace(/<p>(.*?)<\/p>/g, "$1\n\n");
  // Trim extra blank lines and tags
  md = md.replace(/<[^>]+>/g, "").trim();
  return md;
}

export function addContentToSection(rules: string, section: string, content: string): string {
  if (!rules) {
    return content;
  }
  
  const exactSectionRegex = new RegExp(`(${section}[\\s:]*)([\\s\\S]*?)(?=\\n[A-Z][A-Z\\s]+:|$)`, 'i');
  const match = rules.match(exactSectionRegex);
  
  if (match) {
    const sectionContent = match[2].trim();
    const newSectionContent = sectionContent 
      ? `${sectionContent}\n${content}`
      : content;
    return rules.replace(exactSectionRegex, `$1${newSectionContent}`);
  }
  
  return `${rules}\n\n${content}`;
}

export function replaceContentInSection(rules: string, section: string, oldContent: string, newContent: string): string {
  if (!rules) return rules;
  
  const escapedOld = oldContent.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  const sectionRegex = new RegExp(`(${section}[\\s:]*)([\\s\\S]*?)(?=\\n[A-Z][A-Z\\s]+:|$)`, 'i');
  const match = rules.match(sectionRegex);
  
  if (match) {
    let sectionContent = match[2];
    
    if (sectionContent.includes(oldContent)) {
      sectionContent = sectionContent.replace(new RegExp(escapedOld, 'g'), newContent);
      return rules.replace(sectionRegex, `$1${sectionContent}`);
    }
  }
  
  if (rules.includes(oldContent)) {
    return rules.replace(new RegExp(escapedOld, 'g'), newContent);
  }
  
  return rules;
}

export const VALID_ROOM_TYPES = new Set<string>(["public", "private_ai", "decision", "broadcast"]);

export function toRoomType(v: unknown): ChannelRoomType | undefined {
  return typeof v === "string" && VALID_ROOM_TYPES.has(v) ? (v as ChannelRoomType) : undefined;
}
