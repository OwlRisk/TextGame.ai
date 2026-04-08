export type { Scene, SceneCharacter } from "./types";

import { theLighthouse, wrongTurn, theMuseumJob, theLastTrain } from "./adventures";
import type { Scene } from "./types";

export const SCENES: Scene[] = [
  theLighthouse,
  wrongTurn,
  theMuseumJob,
  theLastTrain,
];

export function getScene(id: string): Scene | undefined {
  return SCENES.find((s) => s.id === id);
}

export function getRandomScene(): Scene {
  return SCENES[Math.floor(Math.random() * SCENES.length)];
}

export function isSceneMode(template?: string): boolean {
  return template === "scene";
}
