"use client";

import React from "react";

export interface InlineFormattingOptions {
  boldClassName?: string;
  italicClassName?: string;
  codeClassName?: string;
  strikethroughClassName?: string;
  mentionClassName?: string;
  emotionClassName?: string;
}

/** Inworld / 语气 tag → emoji，用于聊天中把 [angry] 等显示为 emoji */
export const EMOTION_EMOJI: Record<string, string> = {
  angry: "😠",
  happy: "😊",
  sad: "😢",
  surprised: "😲",
  fearful: "😨",
  disgusted: "🤢",
  laughing: "😂",
  whispering: "🤫",
  cough: "🤧",
  sigh: "😮‍💨",
  laugh: "😄",
  breathe: "💨",
  clear_throat: "😤",
  yawn: "🥱",
};

const DEFAULT_OPTIONS: InlineFormattingOptions = {
  boldClassName: "font-bold text-white",
  italicClassName: "italic text-zinc-200",
  codeClassName: "bg-zinc-800/50 px-1.5 py-0.5 rounded text-[13px] font-mono text-violet-300 border border-zinc-700/50",
  strikethroughClassName: "line-through text-zinc-400",
  mentionClassName: "inline-flex items-center bg-violet-500/20 text-violet-300 px-1 rounded font-medium",
  emotionClassName: "inline-block align-middle",
};

/**
 * Parse **bold**, *italic*, `code`, ~~strikethrough~~ in text and return React elements.
 * Used by chat-area, game-master-chat, intro-rules-chat for consistent message formatting.
 */
export function parseInlineFormatting(
  text: string,
  options: InlineFormattingOptions = {}
): React.ReactNode[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const parts: (string | React.ReactElement)[] = [];
  let currentIndex = 0;

  const patterns = [
    { regex: /\*\*(.*?)\*\*/g, type: "bold" as const },
    { regex: /\*(.*?)\*/g, type: "italic" as const },
    { regex: /`(.*?)`/g, type: "code" as const },
    { regex: /~~(.*?)~~/g, type: "strikethrough" as const },
    { regex: /@([\w\u4e00-\u9fff\- ]+?)(?=[\s,.!?;:"')\]]|$)/g, type: "mention" as const },
    { regex: /\[([a-z_]+)\]/gi, type: "emotion" as const },
  ];

  const matches: Array<{ start: number; end: number; type: string; content: string }> = [];
  patterns.forEach(({ regex, type }) => {
    let match;
    regex.lastIndex = 0;
    while ((match = regex.exec(text)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        type,
        content: match[1],
      });
    }
  });

  matches.sort((a, b) => a.start - b.start);

  const filteredMatches: typeof matches = [];
  matches.forEach((match) => {
    const overlaps = filteredMatches.some(
      (m) =>
        (match.start >= m.start && match.start < m.end) ||
        (match.end > m.start && match.end <= m.end) ||
        (match.start <= m.start && match.end >= m.end)
    );
    if (!overlaps) filteredMatches.push(match);
  });

  filteredMatches.forEach((match, i) => {
    if (match.start > currentIndex) {
      parts.push(text.substring(currentIndex, match.start));
    }
    if (match.type === "bold") {
      parts.push(
        <strong key={`b-${i}`} className={opts.boldClassName}>
          {match.content}
        </strong>
      );
    } else if (match.type === "italic") {
      parts.push(
        <em key={`i-${i}`} className={opts.italicClassName}>
          {match.content}
        </em>
      );
    } else if (match.type === "code") {
      parts.push(
        <code key={`c-${i}`} className={opts.codeClassName}>
          {match.content}
        </code>
      );
    } else if (match.type === "strikethrough") {
      parts.push(
        <span key={`s-${i}`} className={opts.strikethroughClassName}>
          {match.content}
        </span>
      );
    } else if (match.type === "mention") {
      parts.push(
        <span key={`m-${i}`} className={opts.mentionClassName}>
          @{match.content}
        </span>
      );
    } else if (match.type === "emotion") {
      const emoji = EMOTION_EMOJI[match.content.toLowerCase()];
      parts.push(
        emoji != null ? (
          <span key={`e-${i}`} className={opts.emotionClassName} aria-label={match.content}>
            {emoji}
          </span>
        ) : (
          <span key={`e-${i}`}>[{match.content}]</span>
        )
      );
    }
    currentIndex = match.end;
  });

  if (currentIndex < text.length) {
    parts.push(text.substring(currentIndex));
  }

  if (parts.length === 0) {
    return [<span key="text">{text}</span>];
  }

  return parts.map((part, i) =>
    typeof part === "string" ? <span key={`t-${i}`}>{part}</span> : part
  );
}
