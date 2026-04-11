import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * Tests for notification context pure logic.
 *
 * The actual context is a React component; here we test the data
 * management logic (load/save/add/markRead/clear/cap) in isolation.
 */

const LS_KEY = "tg_notifications";
const MAX_NOTIFICATIONS = 20;

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

// ─── Types (mirroring NotificationContext) ──────────────────────────────────

interface AppNotification {
  id: string;
  type: "game_over" | "your_turn" | "system";
  message: string;
  timestamp: number;
  read: boolean;
  gameId?: string;
}

// ─── Extracted logic ────────────────────────────────────────────────────────

function loadNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveNotifications(notifs: AppNotification[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(notifs.slice(0, MAX_NOTIFICATIONS)));
  } catch {}
}

function addNotification(
  prev: AppNotification[],
  notif: Omit<AppNotification, "id" | "timestamp" | "read">
): AppNotification[] {
  const next: AppNotification[] = [
    {
      ...notif,
      id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      read: false,
    },
    ...prev,
  ].slice(0, MAX_NOTIFICATIONS);
  saveNotifications(next);
  return next;
}

function markAllRead(prev: AppNotification[]): AppNotification[] {
  const next = prev.map((n) => ({ ...n, read: true }));
  saveNotifications(next);
  return next;
}

function clearAll(): AppNotification[] {
  saveNotifications([]);
  return [];
}

function unreadCount(notifications: AppNotification[]): number {
  return notifications.filter((n) => !n.read).length;
}

// ─── Helper ─────────────────────────────────────────────────────────────────

function makeNotif(overrides?: Partial<AppNotification>): AppNotification {
  return {
    id: `n-${Date.now()}-test`,
    type: "system",
    message: "Test",
    timestamp: Date.now(),
    read: false,
    ...overrides,
  };
}

beforeEach(() => {
  localStorageMock.clear();
  vi.clearAllMocks();
});

// ═══════════════════════════════════════════════════════════════════════════════

describe("loadNotifications", () => {
  it("returns empty array when localStorage is empty", () => {
    expect(loadNotifications()).toEqual([]);
  });

  it("returns parsed notifications from localStorage", () => {
    const data = [makeNotif({ message: "Hello" })];
    store[LS_KEY] = JSON.stringify(data);
    const loaded = loadNotifications();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].message).toBe("Hello");
  });

  it("returns empty array for corrupted JSON", () => {
    store[LS_KEY] = "not-json{{{";
    expect(loadNotifications()).toEqual([]);
  });
});

describe("saveNotifications", () => {
  it("saves to localStorage", () => {
    const data = [makeNotif()];
    saveNotifications(data);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(LS_KEY, expect.any(String));
    expect(JSON.parse(store[LS_KEY])).toHaveLength(1);
  });

  it("caps at MAX_NOTIFICATIONS", () => {
    const data = Array.from({ length: 30 }, (_, i) => makeNotif({ id: `n-${i}` }));
    saveNotifications(data);
    const saved = JSON.parse(store[LS_KEY]);
    expect(saved).toHaveLength(MAX_NOTIFICATIONS);
  });
});

describe("addNotification", () => {
  it("prepends new notification to the front", () => {
    const existing = [makeNotif({ message: "old" })];
    const result = addNotification(existing, { type: "your_turn", message: "Your turn!" });
    expect(result[0].message).toBe("Your turn!");
    expect(result[1].message).toBe("old");
  });

  it("new notification is unread", () => {
    const result = addNotification([], { type: "game_over", message: "Game over" });
    expect(result[0].read).toBe(false);
  });

  it("generates unique id", () => {
    const r1 = addNotification([], { type: "system", message: "a" });
    const r2 = addNotification(r1, { type: "system", message: "b" });
    expect(r2[0].id).not.toBe(r2[1].id);
  });

  it("caps at MAX_NOTIFICATIONS", () => {
    let state: AppNotification[] = [];
    for (let i = 0; i < 25; i++) {
      state = addNotification(state, { type: "system", message: `msg-${i}` });
    }
    expect(state).toHaveLength(MAX_NOTIFICATIONS);
    expect(state[0].message).toBe("msg-24");
  });

  it("saves to localStorage after adding", () => {
    addNotification([], { type: "system", message: "test" });
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it("preserves gameId when provided", () => {
    const result = addNotification([], {
      type: "your_turn",
      message: "Your turn",
      gameId: "abc-123",
    });
    expect(result[0].gameId).toBe("abc-123");
  });
});

describe("markAllRead", () => {
  it("marks all notifications as read", () => {
    const data = [
      makeNotif({ read: false, message: "a" }),
      makeNotif({ read: false, message: "b" }),
      makeNotif({ read: true, message: "c" }),
    ];
    const result = markAllRead(data);
    expect(result.every((n) => n.read)).toBe(true);
  });

  it("preserves other fields", () => {
    const original = makeNotif({ message: "important", type: "game_over" });
    const result = markAllRead([original]);
    expect(result[0].message).toBe("important");
    expect(result[0].type).toBe("game_over");
    expect(result[0].read).toBe(true);
  });

  it("saves to localStorage after marking", () => {
    markAllRead([makeNotif()]);
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });
});

describe("clearAll", () => {
  it("returns empty array", () => {
    expect(clearAll()).toEqual([]);
  });

  it("saves empty array to localStorage", () => {
    clearAll();
    expect(JSON.parse(store[LS_KEY])).toEqual([]);
  });
});

describe("unreadCount", () => {
  it("returns 0 for empty array", () => {
    expect(unreadCount([])).toBe(0);
  });

  it("counts only unread notifications", () => {
    const data = [
      makeNotif({ read: false }),
      makeNotif({ read: true }),
      makeNotif({ read: false }),
    ];
    expect(unreadCount(data)).toBe(2);
  });

  it("returns 0 when all are read", () => {
    const data = [makeNotif({ read: true }), makeNotif({ read: true })];
    expect(unreadCount(data)).toBe(0);
  });
});

describe("notification types", () => {
  it("supports game_over type", () => {
    const result = addNotification([], { type: "game_over", message: "You won!" });
    expect(result[0].type).toBe("game_over");
  });

  it("supports your_turn type", () => {
    const result = addNotification([], { type: "your_turn", message: "It's your turn" });
    expect(result[0].type).toBe("your_turn");
  });

  it("supports system type", () => {
    const result = addNotification([], { type: "system", message: "Maintenance" });
    expect(result[0].type).toBe("system");
  });
});
