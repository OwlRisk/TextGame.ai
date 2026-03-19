/** Base delay (ms) between Host/AI messages so the pace feels human, not instant AI. */
export const HOST_PACE_BASE_MS = 1000;
/** Extra delay per 50 characters of message content */
export const HOST_PACE_PER_50_CHARS_MS = 800;
/** Maximum gap between messages */
export const HOST_PACE_MAX_MS = 4000;

// ─── Conversation mode: structured (turn-based) vs freeform (narrative/social) ──
export type ConversationMode = "structured" | "freeform";
const STRUCTURED_TEMPLATES = ["werewolf", "mafia", "codenames", "undercover", "secret_hitler", "avalon", "resistance", "spyfall"];

export function getConversationMode(template?: string): ConversationMode {
  if (template && STRUCTURED_TEMPLATES.includes(template)) return "structured";
  return "freeform";
}

/** Derive a pace multiplier from personality keywords. */
export function getPersonalityPaceFactor(personality?: string): number {
  if (!personality) return 1.0;
  const lower = personality.toLowerCase();
  if (/anxious|nervous|eager|impulsive|excitable|energetic|hasty/.test(lower)) return 0.7;
  if (/calm|thoughtful|careful|wise|analytical|stoic|patient/.test(lower)) return 1.3;
  if (/bold|confident|aggressive|brash|loud/.test(lower)) return 0.8;
  return 1.0;
}

/** Derive typewriter chars-per-tick from personality. */
export function getTypewriterSpeed(personality?: string): number {
  const factor = getPersonalityPaceFactor(personality);
  if (factor <= 0.75) return 5;   // fast typist
  if (factor >= 1.25) return 2;   // slow typist
  return 3;                       // default
}

export function dynamicPace(textLength: number, personality?: string, mode: ConversationMode = "structured"): Promise<void> {
  const base = Math.min(
    HOST_PACE_BASE_MS + Math.floor(textLength / 50) * HOST_PACE_PER_50_CHARS_MS,
    HOST_PACE_MAX_MS,
  );
  const factor = getPersonalityPaceFactor(personality);
  const jitterRange = mode === "freeform" ? 0.6 : 0.4;
  const jitter = (1 - jitterRange / 2) + Math.random() * jitterRange;
  const ms = Math.round(base * factor * jitter);
  return new Promise<void>((r) => setTimeout(r, ms));
}
export const hostPace = () => dynamicPace(0);

/** Pre-thinking delay before typing indicator appears, simulating "reading & thinking". */
export function thinkingDelay(queueIndex: number, mode: ConversationMode): Promise<void> {
  const base = mode === "freeform"
    ? 500 + Math.random() * 1500
    : 300 + Math.random() * 500;
  const positionalFactor = queueIndex === 0 ? 1.0 : Math.max(0.5, 1.0 - queueIndex * 0.15);
  return new Promise<void>((r) => setTimeout(r, Math.round(base * positionalFactor)));
}

/** Typewriter speed: characters revealed per frame tick (~16ms each) */
const TYPEWRITER_CHARS_PER_TICK = 3;

export type StreamMsgMeta = { senderId: string; senderName: string; senderAvatar: string; isAI: boolean };

/**
 * Display text immediately via addStreamingMessage + updateStreamingMessage.
 * Returns a promise that resolves with the message ID when the full text is shown.
 */
export function typewriterReveal(
  text: string,
  addStreamFn: (msg: StreamMsgMeta, channelId?: string, initialContent?: string) => string,
  updateStreamFn: (messageId: string, content: string, isComplete?: boolean) => void,
  msgMeta: StreamMsgMeta,
  channelId?: string,
  _charsPerTick?: number,
  _cancelled?: () => boolean,
): Promise<string> {
  const messageId = addStreamFn(msgMeta, channelId, text);
  if (!messageId) return Promise.resolve("");
  updateStreamFn(messageId, text, true);
  return Promise.resolve(messageId);
}
