/**
 * Static metadata for game room pages.
 * Dynamic per-game titles would require server DB access; for now we use a
 * descriptive fallback. The layout is a client component so metadata lives here
 * and is re-exported from a server component wrapper if needed in future.
 */
import type { Metadata } from "next";

export const gameRoomMetadata: Metadata = {
  title: "Game Room",
  description:
    "Play an AI-hosted text game with friends. The AI game master runs the story, assigns roles, and keeps the game moving.",
  robots: { index: false, follow: false },
};
