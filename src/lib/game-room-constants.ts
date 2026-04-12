/** Number of AI players to reply right after the host's initial greeting */
export const INITIAL_PLAYER_REPLIES = 3;

/** Maximum autonomous Host→AI advance loops before waiting for human input */
export const MAX_AUTO_ADVANCES = 2;

/** Number of recent messages to include in the Host context window */
export const HOST_CONTEXT_WINDOW = 40;

/** Server-side max token cap for the streaming response */
export const MAX_STREAM_TOKENS = 4096;
/** Base token budget before per-player scaling */
export const BASE_STREAM_TOKENS = 800;
/** Additional tokens per player */
export const TOKENS_PER_PLAYER = 120;
