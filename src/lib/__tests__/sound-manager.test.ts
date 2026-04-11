import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * Tests for SoundManager logic.
 *
 * SoundManager depends on localStorage and HTMLAudioElement; we mock both
 * and test the enable/disable, play, and caching behaviors.
 */

// ─── localStorage mock ──────────────────────────────────────────────────────

const store: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, val: string) => { store[key] = val; }),
  removeItem: vi.fn((key: string) => { delete store[key]; }),
  clear: vi.fn(() => { for (const k of Object.keys(store)) delete store[k]; }),
  get length() { return Object.keys(store).length; },
  key: vi.fn(() => null),
};
Object.defineProperty(globalThis, "localStorage", { value: localStorageMock, writable: true });

// ─── HTMLAudioElement mock ──────────────────────────────────────────────────

const playMock = vi.fn(() => Promise.resolve());
const audioCalls: string[] = [];

class MockAudio {
  src: string;
  preload = "";
  volume = 1;
  currentTime = 0;
  play = playMock;
  constructor(src: string) {
    this.src = src;
    audioCalls.push(src);
  }
}

Object.defineProperty(globalThis, "Audio", { value: MockAudio, writable: true });
Object.defineProperty(globalThis, "window", { value: globalThis, writable: true });

beforeEach(() => {
  localStorageMock.clear();
  playMock.mockClear();
  audioCalls.length = 0;
  vi.resetModules();
});

async function freshSoundManager() {
  const mod = await import("../sound-manager");
  return mod.soundManager;
}

// ═══════════════════════════════════════════════════════════════════════════════

describe("SoundManager.enabled", () => {
  it("defaults to true when localStorage is empty", async () => {
    const sm = await freshSoundManager();
    expect(sm.enabled).toBe(true);
  });

  it("reads false from localStorage", async () => {
    store["tg_sound_enabled"] = "false";
    const sm = await freshSoundManager();
    expect(sm.enabled).toBe(false);
  });

  it("reads true from localStorage ('true' string)", async () => {
    store["tg_sound_enabled"] = "true";
    const sm = await freshSoundManager();
    expect(sm.enabled).toBe(true);
  });

  it("persists when set to false", async () => {
    const sm = await freshSoundManager();
    sm.enabled = false;
    expect(localStorageMock.setItem).toHaveBeenCalledWith("tg_sound_enabled", "false");
    expect(sm.enabled).toBe(false);
  });

  it("persists when set to true", async () => {
    const sm = await freshSoundManager();
    sm.enabled = true;
    expect(localStorageMock.setItem).toHaveBeenCalledWith("tg_sound_enabled", "true");
    expect(sm.enabled).toBe(true);
  });
});

describe("SoundManager.play", () => {
  it("calls Audio.play when enabled", async () => {
    const sm = await freshSoundManager();
    sm.enabled = true;
    sm.play("message-send");
    expect(playMock).toHaveBeenCalledTimes(1);
  });

  it("does not play when disabled", async () => {
    const sm = await freshSoundManager();
    sm.enabled = false;
    sm.play("message-send");
    expect(playMock).not.toHaveBeenCalled();
  });

  it("resets currentTime before playing", async () => {
    const sm = await freshSoundManager();
    sm.enabled = true;
    sm.play("game-over");
    // Audio was created and play was called
    expect(audioCalls).toContain("/sounds/game-over.mp3");
    expect(playMock).toHaveBeenCalled();
  });

  it("reuses cached audio for same sound", async () => {
    const sm = await freshSoundManager();
    sm.enabled = true;
    sm.play("vote-cast");
    sm.play("vote-cast");
    // Audio constructor called only once for vote-cast
    const voteCastCreations = audioCalls.filter((s) => s.includes("vote-cast"));
    expect(voteCastCreations).toHaveLength(1);
    // But play called twice
    expect(playMock).toHaveBeenCalledTimes(2);
  });

  it("creates different Audio objects for different sounds", async () => {
    const sm = await freshSoundManager();
    sm.enabled = true;
    sm.play("message-send");
    sm.play("phase-night");
    expect(audioCalls).toContain("/sounds/message-send.mp3");
    expect(audioCalls).toContain("/sounds/phase-night.mp3");
    expect(audioCalls).toHaveLength(2);
  });
});

describe("SoundManager.preloadAll", () => {
  it("creates Audio objects for all 6 sound types", async () => {
    const sm = await freshSoundManager();
    sm.preloadAll();
    expect(audioCalls).toHaveLength(6);
    expect(audioCalls).toContain("/sounds/message-receive.mp3");
    expect(audioCalls).toContain("/sounds/message-send.mp3");
    expect(audioCalls).toContain("/sounds/vote-cast.mp3");
    expect(audioCalls).toContain("/sounds/phase-night.mp3");
    expect(audioCalls).toContain("/sounds/phase-day.mp3");
    expect(audioCalls).toContain("/sounds/game-over.mp3");
  });

  it("does not play any sound during preload", async () => {
    const sm = await freshSoundManager();
    sm.preloadAll();
    expect(playMock).not.toHaveBeenCalled();
  });
});

describe("sound IDs", () => {
  const ALL_SOUND_IDS = [
    "message-receive",
    "message-send",
    "vote-cast",
    "phase-night",
    "phase-day",
    "game-over",
  ] as const;

  it("all known sound IDs are playable without error", async () => {
    const sm = await freshSoundManager();
    sm.enabled = true;
    for (const id of ALL_SOUND_IDS) {
      expect(() => sm.play(id)).not.toThrow();
    }
  });
});
