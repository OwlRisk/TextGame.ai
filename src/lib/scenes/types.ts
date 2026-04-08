export interface SceneCharacter {
  name: string;
  personality: string;
  background: string;
  goal: string;
  fear: string;
  quirk: string;
  speechStyle: string;
  attitudeToUser: string;
  gender?: "male" | "female" | "other";
}

export interface SceneOpeningMessage {
  speaker: string;
  text: string;
  delay?: number;
}

export interface Scene {
  id: string;
  title: string;
  hook: string;
  genre: "adventure" | "mystery" | "survival" | "heist";
  openingNarration: string;
  openingSequence?: SceneOpeningMessage[];
  characters: SceneCharacter[];
  directorNotes: string;
  color: string;
  icon: string;
}
