import type { MysteryCase } from "@/types/mystery-case";
import { moonlightInn } from "./moonlight-inn";
import { silkGallery } from "./silk-gallery";
import { midnightExpress } from "./midnight-express";
import { hauntedCampus } from "./haunted-campus";
import { poisonBanquet } from "./poison-banquet";
import { arcticStation } from "./arctic-station";
import { jadeTemple } from "./jade-temple";
import { cyberCorp } from "./cyber-corp";

export const MYSTERY_CASES: MysteryCase[] = [
  moonlightInn,
  hauntedCampus,
  silkGallery,
  poisonBanquet,
  arcticStation,
  midnightExpress,
  jadeTemple,
  cyberCorp,
];

export function getMysteryCase(id: string): MysteryCase | undefined {
  return MYSTERY_CASES.find((c) => c.id === id);
}

export function getCasesByDifficulty(difficulty: 1 | 2 | 3): MysteryCase[] {
  return MYSTERY_CASES.filter((c) => c.difficulty === difficulty);
}

export {
  moonlightInn,
  silkGallery,
  midnightExpress,
  hauntedCampus,
  poisonBanquet,
  arcticStation,
  jadeTemple,
  cyberCorp,
};
