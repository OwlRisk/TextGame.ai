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

export function isSceneMode(template?: string): boolean {
  return template === "scene";
}
