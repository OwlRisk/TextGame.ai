import { describe, it, expect } from "vitest";
import { SCENES, getScene, getRandomScene, isSceneMode } from "../index";
import type { Scene } from "../types";

describe("SCENES data integrity", () => {
  it("should have at least 1 scene", () => {
    expect(SCENES.length).toBeGreaterThanOrEqual(1);
  });

  it("every scene should have unique id", () => {
    const ids = SCENES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every scene should have required fields", () => {
    const validGenres = ["adventure", "mystery", "survival", "heist"];
    for (const scene of SCENES) {
      expect(scene.id).toBeTruthy();
      expect(scene.title).toBeTruthy();
      expect(scene.hook).toBeTruthy();
      expect(scene.genre).toBeTruthy();
      expect(validGenres).toContain(scene.genre);
      expect(scene.openingNarration).toBeTruthy();
      expect(scene.characters.length).toBeGreaterThanOrEqual(1);
      expect(scene.directorNotes).toBeTruthy();
      expect(scene.color).toBeTruthy();
      expect(scene.icon).toBeTruthy();
    }
  });

  it("every character should have complete personality fields", () => {
    for (const scene of SCENES) {
      for (const char of scene.characters) {
        expect(char.name).toBeTruthy();
        expect(char.personality).toBeTruthy();
        expect(char.background).toBeTruthy();
        expect(char.goal).toBeTruthy();
        expect(char.fear).toBeTruthy();
        expect(char.quirk).toBeTruthy();
        expect(char.speechStyle).toBeTruthy();
        expect(char.attitudeToUser).toBeTruthy();
      }
    }
  });
});

describe("openingSequence", () => {
  it("every scene should have an openingSequence", () => {
    for (const scene of SCENES) {
      expect(scene.openingSequence).toBeDefined();
      expect(scene.openingSequence!.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("first message should be from narrator", () => {
    for (const scene of SCENES) {
      expect(scene.openingSequence![0].speaker).toBe("narrator");
    }
  });

  it("last message should contain {playerName} placeholder", () => {
    for (const scene of SCENES) {
      const seq = scene.openingSequence!;
      const last = seq[seq.length - 1];
      expect(last.text).toContain("{playerName}");
    }
  });

  it("character speakers should match scene character names", () => {
    for (const scene of SCENES) {
      const charNames = new Set(scene.characters.map((c) => c.name));
      for (const msg of scene.openingSequence!) {
        if (msg.speaker !== "narrator") {
          expect(charNames.has(msg.speaker)).toBe(true);
        }
      }
    }
  });

  it("non-first messages should have a delay", () => {
    for (const scene of SCENES) {
      const seq = scene.openingSequence!;
      for (let i = 1; i < seq.length; i++) {
        expect(seq[i].delay).toBeGreaterThan(0);
      }
    }
  });
});

describe("getScene", () => {
  it("should find existing scene by id", () => {
    for (const scene of SCENES) {
      expect(getScene(scene.id)).toBe(scene);
    }
  });

  it("should return undefined for unknown id", () => {
    expect(getScene("nonexistent")).toBeUndefined();
  });
});

describe("getRandomScene", () => {
  it("should return a scene from SCENES", () => {
    const scene = getRandomScene();
    expect(SCENES).toContain(scene);
  });
});

describe("isSceneMode", () => {
  it('should return true for "scene"', () => {
    expect(isSceneMode("scene")).toBe(true);
  });

  it("should return false for other templates", () => {
    expect(isSceneMode("custom")).toBe(false);
    expect(isSceneMode("werewolf")).toBe(false);
    expect(isSceneMode(undefined)).toBe(false);
  });
});
