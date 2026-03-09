import { describe, it, expect } from "vitest";
import { getAvatarPropsForPlayer } from "../avatar-utils";
import type { Player } from "@/app/components/player-panel";

function mkPlayer(overrides: Partial<Player> & { id: string; name: string; isAI: boolean }): Player {
  return { avatar: "#8b5cf6", ...overrides } as Player;
}

describe("getAvatarPropsForPlayer", () => {
  it("undefined player returns all undefined fields with type 'player'", () => {
    const result = getAvatarPropsForPlayer(undefined);
    expect(result).toEqual({
      name: undefined,
      type: "player",
      background: undefined,
      personality: undefined,
      role: undefined,
      gender: undefined,
    });
  });

  it("null player returns all undefined fields with type 'player'", () => {
    const result = getAvatarPropsForPlayer(null);
    expect(result).toEqual({
      name: undefined,
      type: "player",
      background: undefined,
      personality: undefined,
      role: undefined,
      gender: undefined,
    });
  });

  it("non-AI (human) player: name is player.name, type is 'player', background/personality/role/gender all undefined", () => {
    const player = mkPlayer({ id: "1", name: "Evelyn Hart", isAI: false });
    const result = getAvatarPropsForPlayer(player);
    expect(result.name).toBe("Evelyn Hart");
    expect(result.type).toBe("player");
    expect(result.background).toBeUndefined();
    expect(result.personality).toBeUndefined();
    expect(result.role).toBeUndefined();
    expect(result.gender).toBeUndefined();
  });

  it("non-AI player with name 'You': name becomes 'You'", () => {
    const player = mkPlayer({ id: "1", name: "You", isAI: false });
    const result = getAvatarPropsForPlayer(player);
    expect(result.name).toBe("You");
  });

  it("non-AI player with empty name: name becomes 'You'", () => {
    const player = mkPlayer({ id: "1", name: "", isAI: false });
    const result = getAvatarPropsForPlayer(player);
    expect(result.name).toBe("You");
  });

  it("non-AI player with whitespace-only name: name becomes 'You'", () => {
    const player = mkPlayer({ id: "1", name: "   ", isAI: false });
    const result = getAvatarPropsForPlayer(player);
    expect(result.name).toBe("You");
  });

  it("AI non-GM player: type is 'player', background uses role-based default", () => {
    const player = mkPlayer({ id: "2", name: "Alice", isAI: true, isGameMaster: false, role: "Detective" });
    const result = getAvatarPropsForPlayer(player);
    expect(result.type).toBe("player");
    expect(result.background).toBe("Avatar portrait. Role: Detective.");
  });

  it("AI non-GM player with custom background: uses custom background", () => {
    const player = mkPlayer({ id: "2", name: "Bob", isAI: true, isGameMaster: false, background: "Former spy, now retired." });
    const result = getAvatarPropsForPlayer(player);
    expect(result.background).toBe("Former spy, now retired.");
  });

  it("AI GM player: type is 'host', background uses custom or default 'Professional presenter...'", () => {
    const player = mkPlayer({ id: "3", name: "Host", isAI: true, isGameMaster: true });
    const result = getAvatarPropsForPlayer(player);
    expect(result.type).toBe("host");
    expect(result.background).toBe("Professional presenter, charismatic host.");
  });

  it("AI GM with custom background: uses that background", () => {
    const player = mkPlayer({ id: "3", name: "Host", isAI: true, isGameMaster: true, background: "Mysterious narrator style." });
    const result = getAvatarPropsForPlayer(player);
    expect(result.background).toBe("Mysterious narrator style.");
  });

  it("gender normalization: 'Male' → 'male', 'female' → 'female', 'other' → 'other'", () => {
    expect(getAvatarPropsForPlayer(mkPlayer({
      id: "a", name: "A", isAI: true, gender: "Male",
    })).gender).toBe("male");
    expect(getAvatarPropsForPlayer(mkPlayer({
      id: "b", name: "B", isAI: true, gender: "female",
    })).gender).toBe("female");
    expect(getAvatarPropsForPlayer(mkPlayer({
      id: "c", name: "C", isAI: true, gender: "other",
    })).gender).toBe("other");
  });

  it("gender unknown value: returns undefined", () => {
    const result = getAvatarPropsForPlayer(mkPlayer({
      id: "a", name: "A", isAI: true, gender: "unknown",
    }));
    expect(result.gender).toBeUndefined();
  });

  it("gender empty string: returns undefined", () => {
    const result = getAvatarPropsForPlayer(mkPlayer({
      id: "a", name: "A", isAI: true, gender: "",
    }));
    expect(result.gender).toBeUndefined();
  });

  it("role and personality normalization: trims whitespace", () => {
    const result = getAvatarPropsForPlayer(mkPlayer({
      id: "a", name: "A", isAI: true, role: "  Detective  ", personality: "  Curious  ",
    }));
    expect(result.role).toBe("Detective");
    expect(result.personality).toBe("Curious");
  });

  it("role/personality empty string: returns undefined", () => {
    const result = getAvatarPropsForPlayer(mkPlayer({
      id: "a", name: "A", isAI: true, role: "  ", personality: "",
    }));
    expect(result.role).toBeUndefined();
    expect(result.personality).toBeUndefined();
  });

  it("AI non-GM without role: uses 'Player' in default background", () => {
    const result = getAvatarPropsForPlayer(mkPlayer({
      id: "a", name: "A", isAI: true, isGameMaster: false,
    }));
    expect(result.background).toBe("Avatar portrait. Role: Player.");
  });
});
