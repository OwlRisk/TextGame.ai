const LS_KEY = "tg_sound_enabled";

type SoundId =
  | "message-receive"
  | "message-send"
  | "vote-cast"
  | "phase-night"
  | "phase-day"
  | "game-over";

const SOUND_FILES: Record<SoundId, string> = {
  "message-receive": "/sounds/message-receive.mp3",
  "message-send": "/sounds/message-send.mp3",
  "vote-cast": "/sounds/vote-cast.mp3",
  "phase-night": "/sounds/phase-night.mp3",
  "phase-day": "/sounds/phase-day.mp3",
  "game-over": "/sounds/game-over.mp3",
};

class SoundManager {
  private cache = new Map<SoundId, HTMLAudioElement>();
  private _enabled: boolean | null = null;

  get enabled(): boolean {
    if (this._enabled === null) {
      try { this._enabled = localStorage.getItem(LS_KEY) !== "false"; } catch { this._enabled = true; }
    }
    return this._enabled;
  }

  set enabled(v: boolean) {
    this._enabled = v;
    try { localStorage.setItem(LS_KEY, String(v)); } catch {}
  }

  private getAudio(id: SoundId): HTMLAudioElement {
    let audio = this.cache.get(id);
    if (!audio) {
      audio = new Audio(SOUND_FILES[id]);
      audio.preload = "auto";
      audio.volume = 0.5;
      this.cache.set(id, audio);
    }
    return audio;
  }

  play(id: SoundId) {
    if (typeof window === "undefined" || !this.enabled) return;
    try {
      const audio = this.getAudio(id);
      audio.currentTime = 0;
      audio.play().catch(() => {});
    } catch {}
  }

  preloadAll() {
    if (typeof window === "undefined") return;
    for (const id of Object.keys(SOUND_FILES) as SoundId[]) {
      this.getAudio(id);
    }
  }
}

export const soundManager = new SoundManager();
export type { SoundId };
