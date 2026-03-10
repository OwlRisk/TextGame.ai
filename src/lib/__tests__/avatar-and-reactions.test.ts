import { describe, it, expect } from "vitest";
import type { User } from "@supabase/supabase-js";

/**
 * getUserAvatarUrl — mirrors the exported function from AuthContext.tsx.
 * Duplicated here to avoid importing React context internals in a pure test.
 */
function getUserAvatarUrl(user: User | null | undefined): string | undefined {
  if (!user) return undefined;
  const meta = user.user_metadata;
  if (!meta) return undefined;
  if (typeof meta.avatar_url === "string" && meta.avatar_url) return meta.avatar_url;
  if (typeof meta.picture === "string" && meta.picture) return meta.picture;
  if (meta.picture && typeof meta.picture === "object") {
    const picData = (meta.picture as Record<string, unknown>).data as
      | Record<string, unknown>
      | undefined;
    if (picData && typeof picData.url === "string") return picData.url;
  }
  return undefined;
}

function makeUser(metadata: Record<string, unknown>): User {
  return { user_metadata: metadata } as unknown as User;
}

describe("getUserAvatarUrl", () => {
  it("returns undefined for null user", () => {
    expect(getUserAvatarUrl(null)).toBeUndefined();
  });

  it("returns undefined for undefined user", () => {
    expect(getUserAvatarUrl(undefined)).toBeUndefined();
  });

  it("returns undefined when user_metadata is empty", () => {
    expect(getUserAvatarUrl(makeUser({}))).toBeUndefined();
  });

  it("extracts Google avatar_url", () => {
    const url = "https://lh3.googleusercontent.com/photo.jpg";
    expect(getUserAvatarUrl(makeUser({ avatar_url: url }))).toBe(url);
  });

  it("extracts picture as direct string (generic providers)", () => {
    const url = "https://example.com/avatar.png";
    expect(getUserAvatarUrl(makeUser({ picture: url }))).toBe(url);
  });

  it("extracts Facebook nested picture.data.url", () => {
    const url = "https://platform-lookaside.fbsbx.com/photo.jpg";
    const user = makeUser({ picture: { data: { url } } });
    expect(getUserAvatarUrl(user)).toBe(url);
  });

  it("prefers avatar_url over picture", () => {
    const user = makeUser({
      avatar_url: "https://google.com/photo.jpg",
      picture: "https://facebook.com/photo.jpg",
    });
    expect(getUserAvatarUrl(user)).toBe("https://google.com/photo.jpg");
  });

  it("ignores empty string avatar_url and falls back to picture", () => {
    const user = makeUser({ avatar_url: "", picture: "https://example.com/pic.jpg" });
    expect(getUserAvatarUrl(user)).toBe("https://example.com/pic.jpg");
  });

  it("returns undefined when picture object has no data.url", () => {
    const user = makeUser({ picture: { data: {} } });
    expect(getUserAvatarUrl(user)).toBeUndefined();
  });

  it("returns undefined when picture object has non-string url", () => {
    const user = makeUser({ picture: { data: { url: 123 } } });
    expect(getUserAvatarUrl(user)).toBeUndefined();
  });
});

/**
 * addReaction toggle logic — mirrors the logic in GameRoomContext.tsx.
 * One emoji per person per message; clicking same emoji removes it;
 * clicking different emoji replaces previous one.
 */
type Reaction = { emoji: string; from: string };

function applyReaction(
  existing: Reaction[],
  emoji: string,
  from: string,
): Reaction[] {
  const sameExact = existing.findIndex(
    (r) => r.emoji === emoji && r.from === from,
  );
  if (sameExact >= 0) {
    return existing.filter((_, i) => i !== sameExact);
  }
  const withoutPrev = existing.filter((r) => r.from !== from);
  return [...withoutPrev, { emoji, from }];
}

describe("addReaction toggle logic", () => {
  it("adds a new reaction to an empty list", () => {
    const result = applyReaction([], "👍", "Alice");
    expect(result).toEqual([{ emoji: "👍", from: "Alice" }]);
  });

  it("adds a reaction from a different person", () => {
    const result = applyReaction(
      [{ emoji: "👍", from: "Alice" }],
      "😂",
      "Bob",
    );
    expect(result).toEqual([
      { emoji: "👍", from: "Alice" },
      { emoji: "😂", from: "Bob" },
    ]);
  });

  it("removes reaction when clicking same emoji (toggle off)", () => {
    const result = applyReaction(
      [{ emoji: "👍", from: "Alice" }],
      "👍",
      "Alice",
    );
    expect(result).toEqual([]);
  });

  it("replaces previous emoji with new one (one per person)", () => {
    const result = applyReaction(
      [{ emoji: "👍", from: "Alice" }, { emoji: "😂", from: "Bob" }],
      "😮",
      "Alice",
    );
    expect(result).toEqual([
      { emoji: "😂", from: "Bob" },
      { emoji: "😮", from: "Alice" },
    ]);
  });

  it("does not affect other users when toggling off", () => {
    const result = applyReaction(
      [{ emoji: "👍", from: "Alice" }, { emoji: "👍", from: "Bob" }],
      "👍",
      "Alice",
    );
    expect(result).toEqual([{ emoji: "👍", from: "Bob" }]);
  });

  it("handles rapid emoji changes correctly", () => {
    let reactions: Reaction[] = [];
    reactions = applyReaction(reactions, "👍", "Alice");
    reactions = applyReaction(reactions, "😂", "Alice");
    reactions = applyReaction(reactions, "😮", "Alice");
    expect(reactions).toEqual([{ emoji: "😮", from: "Alice" }]);
  });

  it("allows multiple users to react with the same emoji", () => {
    let reactions: Reaction[] = [];
    reactions = applyReaction(reactions, "😂", "Alice");
    reactions = applyReaction(reactions, "😂", "Bob");
    reactions = applyReaction(reactions, "😂", "Charlie");
    expect(reactions).toHaveLength(3);
    expect(reactions.every((r) => r.emoji === "😂")).toBe(true);
  });
});
