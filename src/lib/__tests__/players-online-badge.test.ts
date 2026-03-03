import { describe, it, expect } from 'vitest';
import { OnlineBadge, resolveOnlineBadge, type RoomMember } from '../player-badges';

// ─── Players Online badge logic ───────────────────────────────────────────────
// Tests for the badge-assignment rules in channel-list.tsx and the member-list
// visibility logic in game/[gameId]/page.tsx.

// Local alias keeps test code concise while using the shared enum + helper.
type Badge = OnlineBadge;
type Member = RoomMember;
const resolveBadge = resolveOnlineBadge;

describe('resolveBadge — owner is viewing (no viewerMemberId)', () => {
  const owner: Member = { id: 'owner-1', nickname: 'Alice', is_owner: true, player_id: null };
  const guest1: Member = { id: 'g1', nickname: 'Bob', is_owner: false, player_id: null };
  const guest2: Member = { id: 'g2', nickname: 'Carol', is_owner: false, player_id: null };

  it('owner row shows You', () => {
    expect(resolveBadge(owner, undefined)).toBe(OnlineBadge.You);
  });

  it('first guest row shows Guest', () => {
    expect(resolveBadge(guest1, undefined)).toBe(OnlineBadge.Guest);
  });

  it('second guest row shows Guest', () => {
    expect(resolveBadge(guest2, undefined)).toBe(OnlineBadge.Guest);
  });

  it('there is exactly one You in a 3-member list', () => {
    const members = [owner, guest1, guest2];
    const badges = members.map((m) => resolveBadge(m, undefined));
    expect(badges.filter((b) => b === OnlineBadge.You)).toHaveLength(1);
  });

  it('all non-owners are Guest when owner views', () => {
    const members = [owner, guest1, guest2];
    const badges = members.map((m) => resolveBadge(m, undefined));
    expect(badges.filter((b) => b === OnlineBadge.Guest)).toHaveLength(2);
  });

  it('no Host badge appears when owner is the viewer (they see You instead)', () => {
    const members = [owner, guest1, guest2];
    const badges = members.map((m) => resolveBadge(m, undefined));
    expect(badges).not.toContain(OnlineBadge.Host);
  });
});

describe('resolveBadge — guest is viewing (viewerMemberId set)', () => {
  const owner: Member = { id: 'owner-1', nickname: 'Alice', is_owner: true, player_id: null };
  const viewingGuest: Member = { id: 'g1', nickname: 'Bob', is_owner: false, player_id: null };
  const otherGuest: Member = { id: 'g2', nickname: 'Carol', is_owner: false, player_id: null };

  it('viewing guest row shows You', () => {
    expect(resolveBadge(viewingGuest, 'g1')).toBe(OnlineBadge.You);
  });

  it('owner row shows Host from guest perspective', () => {
    expect(resolveBadge(owner, 'g1')).toBe(OnlineBadge.Host);
  });

  it('other guest row shows Guest', () => {
    expect(resolveBadge(otherGuest, 'g1')).toBe(OnlineBadge.Guest);
  });

  it('no duplicate You badges in a 3-member list', () => {
    const members = [owner, viewingGuest, otherGuest];
    const badges = members.map((m) => resolveBadge(m, 'g1'));
    expect(badges.filter((b) => b === OnlineBadge.You)).toHaveLength(1);
  });

  it('owner IS is_owner:true so Host badge appears exactly once', () => {
    const badges = [owner, viewingGuest, otherGuest].map((m) => resolveBadge(m, 'g1'));
    expect(badges).toContain(OnlineBadge.Host);
    expect(badges.filter((b) => b === OnlineBadge.Host)).toHaveLength(1);
  });

  it('unrecognised viewerMemberId → no You badge, owner shows Host, all others Guest', () => {
    const members = [owner, viewingGuest, otherGuest];
    const badges = members.map((m) => resolveBadge(m, 'unknown-id'));
    expect(badges.filter((b) => b === OnlineBadge.You)).toHaveLength(0);
    expect(badges.filter((b) => b === OnlineBadge.Host)).toHaveLength(1);
    expect(badges.filter((b) => b === OnlineBadge.Guest)).toHaveLength(2);
  });
});

describe('resolveBadge — solo room (only owner)', () => {
  const owner: Member = { id: 'owner-1', nickname: 'Alice', is_owner: true, player_id: null };

  it('owner shows You when alone', () => {
    expect(resolveBadge(owner, undefined)).toBe(OnlineBadge.You);
  });

  it('owner shows You with explicit viewerMemberId', () => {
    expect(resolveBadge(owner, 'owner-1')).toBe(OnlineBadge.You);
  });
});

// ── Members visibility: when to render the section ───────────────────────────

/**
 * Mirrors the channel-list condition: roomMembers && roomMembers.length > 0
 * (changed from > 1 — now shows even for solo rooms).
 */
function shouldShowPlayersOnline(members: Member[] | undefined): boolean {
  return !!members && members.length > 0;
}

describe('shouldShowPlayersOnline', () => {
  it('shows section for a single member (solo owner)', () => {
    expect(shouldShowPlayersOnline([{ id: 'o', nickname: 'A', is_owner: true, player_id: null }])).toBe(true);
  });

  it('shows section for two members (owner + guest)', () => {
    const two: Member[] = [
      { id: 'o', nickname: 'A', is_owner: true, player_id: null },
      { id: 'g', nickname: 'B', is_owner: false, player_id: null },
    ];
    expect(shouldShowPlayersOnline(two)).toBe(true);
  });

  it('hides section for empty list', () => {
    expect(shouldShowPlayersOnline([])).toBe(false);
  });

  it('hides section when roomMembers is undefined (auth user without an active room)', () => {
    expect(shouldShowPlayersOnline(undefined)).toBe(false);
  });
});

// ── Top banner: "N players in room" ──────────────────────────────────────────

/**
 * Mirrors the banner condition in page.tsx: roomMembers.length > 1
 * (visible to both owner and guests once the room has 2+ participants).
 */
function shouldShowRoomBanner(members: Member[]): boolean {
  return members.length > 1;
}

function buildRoomBannerText(members: Member[]): string {
  return `${members.length} players in room: ${members.map((m) => m.nickname).join(', ')}`;
}

describe('room presence banner', () => {
  const owner: Member = { id: 'o', nickname: 'Alice', is_owner: true, player_id: null };
  const guest1: Member = { id: 'g1', nickname: 'Bob', is_owner: false, player_id: null };
  const guest2: Member = { id: 'g2', nickname: 'Carol', is_owner: false, player_id: null };

  it('does not show banner for solo room', () => {
    expect(shouldShowRoomBanner([owner])).toBe(false);
  });

  it('shows banner once a guest joins', () => {
    expect(shouldShowRoomBanner([owner, guest1])).toBe(true);
  });

  it('shows banner for three participants', () => {
    expect(shouldShowRoomBanner([owner, guest1, guest2])).toBe(true);
  });

  it('banner text lists all nicknames', () => {
    const text = buildRoomBannerText([owner, guest1, guest2]);
    expect(text).toContain('Alice');
    expect(text).toContain('Bob');
    expect(text).toContain('Carol');
  });

  it('banner text starts with member count', () => {
    const text = buildRoomBannerText([owner, guest1]);
    expect(text).toMatch(/^2 players in room/);
  });

  it('banner nicknames are comma-separated', () => {
    const text = buildRoomBannerText([owner, guest1, guest2]);
    const names = text.split(': ')[1].split(', ');
    expect(names).toHaveLength(3);
  });

  it('banner is visible to guests (condition has no isOwner guard)', () => {
    // Guests and owners share the same roomMembers.length > 1 check.
    // Simulate both perspectives with the same member list.
    const members = [owner, guest1];
    expect(shouldShowRoomBanner(members)).toBe(true);
    // Verified regardless of who is "viewing" — logic is purely count-based
  });
});

// ── Member polling: applies to all participants ───────────────────────────────

/**
 * Mirrors the condition change in page.tsx:
 * Old: if (!gameId || !isOwner) return;
 * New: if (!gameId) return;  — guests also poll
 */
function shouldStartMemberPoll(gameId: string | undefined, isOwner: boolean): boolean {
  // After the change: poll for everyone who has a gameId
  void isOwner; // isOwner is no longer a gate
  return !!gameId;
}

describe('member poll gate', () => {
  it('polls for owner', () => {
    expect(shouldStartMemberPoll('game-1', true)).toBe(true);
  });

  it('polls for guest (isOwner = false)', () => {
    expect(shouldStartMemberPoll('game-1', false)).toBe(true);
  });

  it('does not poll without gameId', () => {
    expect(shouldStartMemberPoll(undefined, true)).toBe(false);
    expect(shouldStartMemberPoll(undefined, false)).toBe(false);
  });

  it('does not poll for empty string gameId', () => {
    expect(shouldStartMemberPoll('', false)).toBe(false);
  });
});

// ── viewerMemberId derivation ─────────────────────────────────────────────────

/**
 * Mirrors the prop derivation in page.tsx channelListCommon:
 *   viewerMemberId: isGuestPlayer ? (guestMemberId ?? undefined) : undefined
 *
 * Owners are identified via is_owner=true in the list (no explicit memberId needed).
 * Guests must pass their memberId so their own row shows "You".
 */
function deriveViewerMemberId(
  isGuestPlayer: boolean,
  guestMemberId: string | null | undefined
): string | undefined {
  return isGuestPlayer ? (guestMemberId ?? undefined) : undefined;
}

describe('deriveViewerMemberId', () => {
  it('returns undefined for the owner', () => {
    expect(deriveViewerMemberId(false, 'ignored')).toBeUndefined();
  });

  it('returns the guest memberId for a guest', () => {
    expect(deriveViewerMemberId(true, 'm-abc')).toBe('m-abc');
  });

  it('returns undefined for a guest with no memberId yet', () => {
    expect(deriveViewerMemberId(true, null)).toBeUndefined();
  });

  it('returns undefined for a guest with undefined memberId', () => {
    expect(deriveViewerMemberId(true, undefined)).toBeUndefined();
  });
});

// ── Full badge list for common room configurations ────────────────────────────

describe('full badge list — standard room scenarios', () => {
  const owner: Member = { id: 'owner-1', nickname: 'Host', is_owner: true, player_id: null };
  const g1: Member = { id: 'guest-1', nickname: 'G1', is_owner: false, player_id: null };
  const g2: Member = { id: 'guest-2', nickname: 'G2', is_owner: false, player_id: null };

  it('owner view: [You, Guest, Guest]', () => {
    const vId = deriveViewerMemberId(false, null);
    const badges = [owner, g1, g2].map((m) => resolveBadge(m, vId));
    expect(badges).toEqual([OnlineBadge.You, OnlineBadge.Guest, OnlineBadge.Guest]);
  });

  it('guest-1 view: [Host, You, Guest]', () => {
    const vId = deriveViewerMemberId(true, 'guest-1');
    const badges = [owner, g1, g2].map((m) => resolveBadge(m, vId));
    expect(badges).toEqual([OnlineBadge.Host, OnlineBadge.You, OnlineBadge.Guest]);
  });

  it('guest-2 view: [Host, Guest, You]', () => {
    const vId = deriveViewerMemberId(true, 'guest-2');
    const badges = [owner, g1, g2].map((m) => resolveBadge(m, vId));
    expect(badges).toEqual([OnlineBadge.Host, OnlineBadge.Guest, OnlineBadge.You]);
  });

  it('exactly one You in every view', () => {
    const views = [
      deriveViewerMemberId(false, null),
      deriveViewerMemberId(true, 'guest-1'),
      deriveViewerMemberId(true, 'guest-2'),
    ];
    for (const vId of views) {
      const badges = [owner, g1, g2].map((m) => resolveBadge(m, vId));
      expect(badges.filter((b) => b === OnlineBadge.You)).toHaveLength(1);
    }
  });

  it('no Host badge is ever shown to the owner (they see You)', () => {
    const vId = deriveViewerMemberId(false, null);
    const badges = [owner, g1, g2].map((m) => resolveBadge(m, vId));
    expect(badges).not.toContain(OnlineBadge.Host);
  });
});
