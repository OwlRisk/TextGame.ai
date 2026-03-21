/** Number of AI players to reply right after the host's initial greeting */
export const INITIAL_PLAYER_REPLIES = 3;

/** Members polling interval (ms) and max consecutive errors before giving up */
export const MEMBERS_POLL_INTERVAL_MS = 15_000;
export const MEMBERS_MAX_ERRORS = 3;

/** Maximum autonomous Host→AI advance loops before waiting for human input */
export const MAX_AUTO_ADVANCES = 4;

/** Game inactivity timeout (ms). If no message is added for this long, auto-end the game. */
export const GAME_INACTIVITY_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours

/** Number of recent messages to include in the Host context window */
export const HOST_CONTEXT_WINDOW = 35;

/** Server-side max token cap for the streaming response */
export const MAX_STREAM_TOKENS = 4096;
/** Base token budget before per-player scaling */
export const BASE_STREAM_TOKENS = 500;
/** Additional tokens per player */
export const TOKENS_PER_PLAYER = 80;
