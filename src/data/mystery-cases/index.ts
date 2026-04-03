import type { MysteryCase } from "@/types/mystery-case";
import { moonlightInn } from "./moonlight-inn";
import { silkGallery } from "./silk-gallery";
import { midnightExpress } from "./midnight-express";

export const MYSTERY_CASES: MysteryCase[] = [
  moonlightInn,
  silkGallery,
  midnightExpress,
];

export function getMysteryCase(id: string): MysteryCase | undefined {
  return MYSTERY_CASES.find((c) => c.id === id);
}

export function getCasesByDifficulty(difficulty: 1 | 2 | 3): MysteryCase[] {
  return MYSTERY_CASES.filter((c) => c.difficulty === difficulty);
}

export { moonlightInn, silkGallery, midnightExpress };
