import { describe, it, expect } from "vitest";
import { resolveOnlineBadge, OnlineBadge, type RoomMember } from "../player-badges";

const owner: RoomMember = { id: "m1", nickname: "Alice", is_owner: true, player_id: "p1" };
const guest: RoomMember = { id: "m2", nickname: "Bob", is_owner: false, player_id: "p2" };
const guestNoPlayer: RoomMember = { id: "m3", nickname: "Charlie", is_owner: false, player_id: null };

describe("resolveOnlineBadge", () => {
  describe("with viewerMemberId", () => {
    it("returns You when member ID matches viewer", () => {
      expect(resolveOnlineBadge(owner, "m1")).toBe(OnlineBadge.You);
      expect(resolveOnlineBadge(guest, "m2")).toBe(OnlineBadge.You);
    });

    it("returns Host when member is owner but not viewer", () => {
      expect(resolveOnlineBadge(owner, "m2")).toBe(OnlineBadge.Host);
    });

    it("returns Guest when member is neither viewer nor owner", () => {
      expect(resolveOnlineBadge(guest, "m1")).toBe(OnlineBadge.Guest);
      expect(resolveOnlineBadge(guestNoPlayer, "m1")).toBe(OnlineBadge.Guest);
    });
  });

  describe("without viewerMemberId (undefined)", () => {
    it("returns You for the owner (fallback to is_owner)", () => {
      expect(resolveOnlineBadge(owner, undefined)).toBe(OnlineBadge.You);
    });

    it("returns Guest for non-owners when viewer is unknown", () => {
      expect(resolveOnlineBadge(guest, undefined)).toBe(OnlineBadge.Guest);
      expect(resolveOnlineBadge(guestNoPlayer, undefined)).toBe(OnlineBadge.Guest);
    });
  });

  describe("edge cases", () => {
    it("viewer sees themselves as You even if they are the owner", () => {
      expect(resolveOnlineBadge(owner, "m1")).toBe(OnlineBadge.You);
    });

    it("empty string viewerMemberId falls back to is_owner check", () => {
      // Empty string is falsy → falls through to is_owner
      expect(resolveOnlineBadge(owner, "")).toBe(OnlineBadge.You);
      expect(resolveOnlineBadge(guest, "")).toBe(OnlineBadge.Guest);
    });

    it("works with arbitrary ID formats", () => {
      const m: RoomMember = { id: "uuid-abc-123", nickname: "D", is_owner: false, player_id: null };
      expect(resolveOnlineBadge(m, "uuid-abc-123")).toBe(OnlineBadge.You);
      expect(resolveOnlineBadge(m, "other")).toBe(OnlineBadge.Guest);
    });
  });
});
