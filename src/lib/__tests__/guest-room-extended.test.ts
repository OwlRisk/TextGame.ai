import { describe, it, expect } from 'vitest';

// ─── Extended Guest Room Tests ────────────────────────────────────────────────
//
// Covers logic that was identified in the code review but not yet tested:
//   1.  applyGuestState — field stripping
//   2.  mergeAvatarUrls — merge semantics
//   3.  shouldApplyGamePhase — empty-string guard
//   4.  isGuestPlayer — derivation
//   5.  resolveGuestChannelId — 3-tier channelId fallback
//   6.  resolveGuestId — localStorage scoped/legacy migration
//   7.  resolveJoinGuestId — join route auto-UUID generation
//   8.  shouldDeduplicateRow — join dedup filter
//   9.  decideMembersAuth — members route authorization
//  10.  resolvePresenceKey edge cases — empty-string userId

// ─── 1. applyGuestState — field stripping ────────────────────────────────────
// Mirrors GameRoomContext.tsx applyGuestState.
// Guests must NOT inherit the owner's humanGameIdentity (character name) or
// selectedChannelId (which may point to a private channel they can't access).

function stripGuestOnlyFields(raw: Record<string, unknown>): Record<string, unknown> {
  const { humanGameIdentity: _id, selectedChannelId: _ch, ...rest } = raw;
  return rest;
}

describe('applyGuestState — field stripping', () => {
  it('removes humanGameIdentity from the state', () => {
    const result = stripGuestOnlyFields({ humanGameIdentity: { name: 'Alice' }, messages: [] });
    expect(result).not.toHaveProperty('humanGameIdentity');
    expect(result).toHaveProperty('messages');
  });

  it('removes selectedChannelId from the state', () => {
    const result = stripGuestOnlyFields({ selectedChannelId: 'night-room', players: [] });
    expect(result).not.toHaveProperty('selectedChannelId');
    expect(result).toHaveProperty('players');
  });

  it('removes both fields simultaneously', () => {
    const result = stripGuestOnlyFields({
      humanGameIdentity: { name: 'Alice' },
      selectedChannelId: 'night-room',
      gamePhase: 'day',
    });
    expect(result).not.toHaveProperty('humanGameIdentity');
    expect(result).not.toHaveProperty('selectedChannelId');
    expect(result).toEqual({ gamePhase: 'day' });
  });

  it('passes through all other fields unchanged', () => {
    const input = { messages: [], players: [], gamePhase: 'night', avatarImageUrls: {} };
    const result = stripGuestOnlyFields(input);
    expect(result).toEqual(input);
  });

  it('handles empty input without throwing', () => {
    expect(stripGuestOnlyFields({})).toEqual({});
  });

  it('removes undefined-valued humanGameIdentity and selectedChannelId', () => {
    const result = stripGuestOnlyFields({
      humanGameIdentity: undefined,
      selectedChannelId: undefined,
      avatarImageUrls: {},
    });
    expect(result).not.toHaveProperty('humanGameIdentity');
    expect(result).not.toHaveProperty('selectedChannelId');
    expect(result).toHaveProperty('avatarImageUrls');
  });
});

// ─── 2. mergeAvatarUrls — merge, not replace ─────────────────────────────────
// Mirrors the avatarImageUrls merge in GameRoomContext.tsx mergeRemoteState.
// Remote values win on conflict; local keys NOT in remote are preserved.

function mergeAvatarUrls(
  prev: Record<string, string>,
  incoming: Record<string, string>,
): Record<string, string> {
  return { ...prev, ...incoming };
}

describe('mergeAvatarUrls — incremental merge semantics', () => {
  it('adds new keys from incoming', () => {
    const result = mergeAvatarUrls({ 'Alice|color': 'url-a' }, { 'Bob|color': 'url-b' });
    expect(result).toEqual({ 'Alice|color': 'url-a', 'Bob|color': 'url-b' });
  });

  it('remote value overwrites local value for the same key (remote wins)', () => {
    const result = mergeAvatarUrls({ 'Alice|color': 'url-old' }, { 'Alice|color': 'url-new' });
    expect(result['Alice|color']).toBe('url-new');
  });

  it('local keys NOT in incoming are preserved', () => {
    const result = mergeAvatarUrls(
      { 'Alice|color': 'url-a', 'Bob|color': 'url-b' },
      { 'Carol|color': 'url-c' },
    );
    expect(result).toHaveProperty('Alice|color', 'url-a');
    expect(result).toHaveProperty('Bob|color', 'url-b');
    expect(result).toHaveProperty('Carol|color', 'url-c');
  });

  it('handles empty incoming — local unchanged', () => {
    const prev = { 'Alice|color': 'url-a' };
    expect(mergeAvatarUrls(prev, {})).toEqual(prev);
  });

  it('handles empty prev — returns copy of incoming', () => {
    const incoming = { 'Alice|color': 'url-a' };
    expect(mergeAvatarUrls({}, incoming)).toEqual(incoming);
  });

  it('does NOT clear local keys (i.e. this is merge, not replace)', () => {
    // If this were setAvatarImageUrls(incoming) instead of spread, local keys would disappear.
    const result = mergeAvatarUrls({ 'Old|color': 'url-old' }, {});
    expect(result).toHaveProperty('Old|color');
  });
});

// ─── 3. shouldApplyGamePhase — empty-string guard ────────────────────────────
// Mirrors the condition in GameRoomContext.tsx mergeRemoteState.
// An empty string "" must NOT overwrite the current game phase.

function shouldApplyGamePhase(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

describe('shouldApplyGamePhase — empty-string guard', () => {
  it('accepts a normal game phase string', () => {
    expect(shouldApplyGamePhase('night')).toBe(true);
    expect(shouldApplyGamePhase('waiting')).toBe(true);
    expect(shouldApplyGamePhase('intro')).toBe(true);
  });

  it('rejects an empty string (critical guard — prevents phase wipe)', () => {
    expect(shouldApplyGamePhase('')).toBe(false);
  });

  it('rejects null', () => {
    expect(shouldApplyGamePhase(null)).toBe(false);
  });

  it('rejects undefined', () => {
    expect(shouldApplyGamePhase(undefined)).toBe(false);
  });

  it('rejects numbers', () => {
    expect(shouldApplyGamePhase(0)).toBe(false);
    expect(shouldApplyGamePhase(1)).toBe(false);
  });

  it('rejects booleans', () => {
    expect(shouldApplyGamePhase(false)).toBe(false);
    expect(shouldApplyGamePhase(true)).toBe(false);
  });

  it('rejects objects', () => {
    expect(shouldApplyGamePhase({ phase: 'night' })).toBe(false);
  });
});

// ─── 4. isGuestPlayer — derivation ───────────────────────────────────────────
// Mirrors: const isGuestPlayer = !isOwner && !!guestId  (page.tsx line ~146)

function deriveIsGuestPlayer(isOwner: boolean, guestId: string | null): boolean {
  return !isOwner && !!guestId;
}

describe('isGuestPlayer derivation', () => {
  it('is true for a standard guest (not owner, has guestId)', () => {
    expect(deriveIsGuestPlayer(false, 'g-123')).toBe(true);
  });

  it('is false when isOwner is true, even if guestId is set (owner precedence)', () => {
    // Owner may have a residual guestId in localStorage from a prior join attempt.
    expect(deriveIsGuestPlayer(true, 'g-123')).toBe(false);
  });

  it('is false when guestId is null (viewer without an active guest session)', () => {
    expect(deriveIsGuestPlayer(false, null)).toBe(false);
  });

  it('is false when guestId is empty string (!! "" is false)', () => {
    expect(deriveIsGuestPlayer(false, '')).toBe(false);
  });

  it('is false for a clean owner with no guestId', () => {
    expect(deriveIsGuestPlayer(true, null)).toBe(false);
  });
});

// ─── 5. resolveGuestChannelId — 3-tier fallback ───────────────────────────────
// Mirrors the channelId resolution in handleGuestSendMessage (page.tsx ~line 1715).
// Priority: selectedChannelId → configChannels[0].id → "game-room"

function resolveGuestChannelId(
  selectedChannelId: string | null | undefined,
  configChannels: Array<{ id: string }> | undefined,
): string {
  return selectedChannelId ?? configChannels?.[0]?.id ?? 'game-room';
}

describe('resolveGuestChannelId — 3-tier fallback', () => {
  it('uses selectedChannelId when set', () => {
    expect(resolveGuestChannelId('custom-ch', [{ id: 'ch1' }])).toBe('custom-ch');
  });

  it('falls back to first config channel when selectedChannelId is null', () => {
    expect(resolveGuestChannelId(null, [{ id: 'night-room' }, { id: 'day-room' }])).toBe('night-room');
  });

  it('falls back to "game-room" when configChannels is empty array', () => {
    expect(resolveGuestChannelId(null, [])).toBe('game-room');
  });

  it('falls back to "game-room" when configChannels is undefined', () => {
    expect(resolveGuestChannelId(null, undefined)).toBe('game-room');
  });

  it('falls back to "game-room" when selectedChannelId is undefined', () => {
    expect(resolveGuestChannelId(undefined, undefined)).toBe('game-room');
  });

  it('WARNING: empty string selectedChannelId is used as-is by ?? (not treated as falsy)', () => {
    // ?? only skips null/undefined — empty string is "set" from its perspective.
    // This means a "" selectedChannelId produces a message with channelId="".
    expect(resolveGuestChannelId('', [{ id: 'ch1' }])).toBe('');
  });
});

// ─── 6. resolveGuestId — localStorage scoped/legacy migration ─────────────────
// Mirrors the guestId loading effect in page.tsx (~lines 199-221).
// C-6: guestId is now scoped per game (`guestId_${gameId}`) to prevent
// cross-game identity pollution from the old global `guestId` key.

type GuestIdResolution =
  | { source: 'url';    guestId: string; migrateFromLegacy: false }
  | { source: 'scoped'; guestId: string; migrateFromLegacy: false }
  | { source: 'legacy'; guestId: string; migrateFromLegacy: true }
  | { source: 'none';   guestId: null;   migrateFromLegacy: false };

function resolveGuestId(params: {
  urlGuestId: string | null;
  hasSession: boolean;
  scopedStored: string | null;
  legacyStored: string | null;
}): GuestIdResolution {
  if (params.urlGuestId) {
    return { source: 'url', guestId: params.urlGuestId, migrateFromLegacy: false };
  }
  if (params.hasSession) {
    return { source: 'none', guestId: null, migrateFromLegacy: false };
  }
  if (params.scopedStored) {
    return { source: 'scoped', guestId: params.scopedStored, migrateFromLegacy: false };
  }
  if (params.legacyStored) {
    return { source: 'legacy', guestId: params.legacyStored, migrateFromLegacy: true };
  }
  return { source: 'none', guestId: null, migrateFromLegacy: false };
}

describe('resolveGuestId — source priority and legacy migration', () => {
  it('URL param wins over everything', () => {
    const result = resolveGuestId({ urlGuestId: 'g-url', hasSession: false, scopedStored: 'g-s', legacyStored: 'g-l' });
    expect(result.source).toBe('url');
    expect(result.guestId).toBe('g-url');
    expect(result.migrateFromLegacy).toBe(false);
  });

  it('URL param wins even when user has a session', () => {
    const result = resolveGuestId({ urlGuestId: 'g-url', hasSession: true, scopedStored: null, legacyStored: null });
    expect(result.source).toBe('url');
    expect(result.guestId).toBe('g-url');
  });

  it('returns none (no guestId) when authenticated user has no URL param', () => {
    const result = resolveGuestId({ urlGuestId: null, hasSession: true, scopedStored: 'g-s', legacyStored: 'g-l' });
    expect(result.source).toBe('none');
    expect(result.guestId).toBeNull();
  });

  it('uses scoped key when available (no URL param, no session)', () => {
    const result = resolveGuestId({ urlGuestId: null, hasSession: false, scopedStored: 'g-scoped', legacyStored: 'g-l' });
    expect(result.source).toBe('scoped');
    expect(result.guestId).toBe('g-scoped');
    expect(result.migrateFromLegacy).toBe(false);
  });

  it('scoped key takes priority over legacy key', () => {
    const result = resolveGuestId({ urlGuestId: null, hasSession: false, scopedStored: 'g-scoped', legacyStored: 'g-legacy' });
    expect(result.guestId).toBe('g-scoped');
    expect(result.migrateFromLegacy).toBe(false);
  });

  it('migrates from legacy key when scoped key is absent', () => {
    const result = resolveGuestId({ urlGuestId: null, hasSession: false, scopedStored: null, legacyStored: 'g-legacy' });
    expect(result.source).toBe('legacy');
    expect(result.guestId).toBe('g-legacy');
    expect(result.migrateFromLegacy).toBe(true);
  });

  it('returns none when all sources are absent (first-time visitor)', () => {
    const result = resolveGuestId({ urlGuestId: null, hasSession: false, scopedStored: null, legacyStored: null });
    expect(result.source).toBe('none');
    expect(result.guestId).toBeNull();
    expect(result.migrateFromLegacy).toBe(false);
  });

  it('migrateFromLegacy is only true in the legacy case', () => {
    const cases: GuestIdResolution[] = [
      resolveGuestId({ urlGuestId: 'g', hasSession: false, scopedStored: null, legacyStored: null }),
      resolveGuestId({ urlGuestId: null, hasSession: true, scopedStored: null, legacyStored: null }),
      resolveGuestId({ urlGuestId: null, hasSession: false, scopedStored: 'g', legacyStored: null }),
    ];
    cases.forEach((r) => expect(r.migrateFromLegacy).toBe(false));

    const legacyCase = resolveGuestId({ urlGuestId: null, hasSession: false, scopedStored: null, legacyStored: 'g' });
    expect(legacyCase.migrateFromLegacy).toBe(true);
  });
});

// ─── 7. resolveJoinGuestId — join route auto-UUID ─────────────────────────────
// Mirrors join/route.ts line 50:
//   const effectiveGuestId = !user ? (guestId ?? crypto.randomUUID()) : null;
//
// IMPORTANT DIFFERENCE from the message route:
//   - message route: no guestId → returns null → 401
//   - join   route: no guestId → generates a new UUID (never rejects)

function resolveJoinGuestId(
  user: { id: string } | null,
  guestId: string | undefined,
  generateId: () => string,
): string | null {
  return !user ? (guestId ?? generateId()) : null;
}

describe('resolveJoinGuestId — join route auto-UUID generation', () => {
  const fakeUuid = 'fake-uuid-generated';
  const generate = () => fakeUuid;

  it('uses the client-supplied guestId when provided', () => {
    expect(resolveJoinGuestId(null, 'g-client', generate)).toBe('g-client');
  });

  it('auto-generates a UUID when guestId is undefined (join without guestId)', () => {
    expect(resolveJoinGuestId(null, undefined, generate)).toBe(fakeUuid);
  });

  it('returns null for authenticated users (guestId not needed)', () => {
    expect(resolveJoinGuestId({ id: 'u-1' }, undefined, generate)).toBeNull();
  });

  it('returns null for authenticated users even if guestId is provided', () => {
    expect(resolveJoinGuestId({ id: 'u-1' }, 'g-client', generate)).toBeNull();
  });

  it('treats empty string as a provided guestId (not undefined → no auto-generate)', () => {
    // ?? only skips null/undefined; "" is considered "provided"
    expect(resolveJoinGuestId(null, '', generate)).toBe('');
  });
});

// ─── 8. shouldDeduplicateRow — join dedup filter ──────────────────────────────
// Mirrors the WHERE conditions of the DELETE in join/route.ts lines 81-90.
// After upsert, stale ghost rows (same nickname, different guest_id) are removed
// to prevent the same display name from appearing twice in the player list.

interface MemberRow {
  id: string;
  game_id: string;
  nickname: string;
  is_owner: boolean;
  user_id: string | null;
}

function shouldDeduplicateRow(
  row: MemberRow,
  opts: {
    gameId: string;
    normalizedNickname: string;
    newMemberId: string;
    effectiveGuestId: string | null;
  },
): boolean {
  if (!opts.effectiveGuestId) return false; // only clean up for guest joins
  return (
    row.game_id === opts.gameId &&
    row.nickname === opts.normalizedNickname &&
    !row.is_owner &&
    row.id !== opts.newMemberId &&
    row.user_id === null
  );
}

describe('shouldDeduplicateRow — join dedup filter', () => {
  const base: MemberRow = { id: 'm-old', game_id: 'g1', nickname: 'Nikki', is_owner: false, user_id: null };
  const opts = { gameId: 'g1', normalizedNickname: 'Nikki', newMemberId: 'm-new', effectiveGuestId: 'guest-id' };

  it('deletes a ghost row with same nickname, different id, no user_id', () => {
    expect(shouldDeduplicateRow(base, opts)).toBe(true);
  });

  it('protects the newly inserted row itself (id === newMemberId)', () => {
    expect(shouldDeduplicateRow({ ...base, id: 'm-new' }, opts)).toBe(false);
  });

  it('protects owner rows (is_owner = true)', () => {
    expect(shouldDeduplicateRow({ ...base, is_owner: true }, opts)).toBe(false);
  });

  it('protects auth-user rows (user_id is not null)', () => {
    expect(shouldDeduplicateRow({ ...base, user_id: 'u-123' }, opts)).toBe(false);
  });

  it('protects rows from a different game', () => {
    expect(shouldDeduplicateRow({ ...base, game_id: 'g-other' }, opts)).toBe(false);
  });

  it('does not delete rows with a different nickname', () => {
    expect(shouldDeduplicateRow({ ...base, nickname: 'Otto' }, opts)).toBe(false);
  });

  it('does nothing when effectiveGuestId is null (authenticated user join)', () => {
    expect(shouldDeduplicateRow(base, { ...opts, effectiveGuestId: null })).toBe(false);
  });

  it('correctly identifies multiple deletable rows in a list', () => {
    const rows: MemberRow[] = [
      { id: 'm-old-1', game_id: 'g1', nickname: 'Nikki', is_owner: false, user_id: null }, // delete
      { id: 'm-old-2', game_id: 'g1', nickname: 'Nikki', is_owner: false, user_id: null }, // delete
      { id: 'm-new',   game_id: 'g1', nickname: 'Nikki', is_owner: false, user_id: null }, // keep (self)
      { id: 'm-auth',  game_id: 'g1', nickname: 'Nikki', is_owner: false, user_id: 'u1' }, // keep (auth)
      { id: 'm-owner', game_id: 'g1', nickname: 'Nikki', is_owner: true,  user_id: null }, // keep (owner)
    ];
    const toDelete = rows.filter((r) => shouldDeduplicateRow(r, opts));
    expect(toDelete).toHaveLength(2);
    expect(toDelete.map((r) => r.id)).toEqual(['m-old-1', 'm-old-2']);
  });
});

// ─── 9. decideMembersAuth — members route authorization ───────────────────────
// Mirrors the authorization decision in members/route.ts lines 26-60.
// Four outcomes: reject (401), owner fast-path, check by userId, check by guestId.

type AuthDecision = 'reject-401' | 'owner-authorized' | 'check-by-userid' | 'check-by-guestid';

function decideMembersAuth(params: {
  user: { id: string } | null;
  guestId: string | null;
  gameOwnerId: string | null;
}): AuthDecision {
  if (!params.user && !params.guestId) return 'reject-401';
  if (params.user && params.gameOwnerId === params.user.id) return 'owner-authorized';
  if (params.user) return 'check-by-userid';
  return 'check-by-guestid';
}

describe('decideMembersAuth — members route authorization', () => {
  it('rejects when there is no user and no guestId', () => {
    expect(decideMembersAuth({ user: null, guestId: null, gameOwnerId: 'u1' })).toBe('reject-401');
  });

  it('fast-paths the owner (skips membership check)', () => {
    expect(decideMembersAuth({ user: { id: 'u1' }, guestId: null, gameOwnerId: 'u1' })).toBe('owner-authorized');
  });

  it('checks by userId for an authenticated non-owner', () => {
    expect(decideMembersAuth({ user: { id: 'u2' }, guestId: null, gameOwnerId: 'u1' })).toBe('check-by-userid');
  });

  it('checks by userId when the game row is not found (gameOwnerId=null)', () => {
    // Deleted game: game?.user_id is undefined → undefined !== user.id → not owner
    expect(decideMembersAuth({ user: { id: 'u1' }, guestId: null, gameOwnerId: null })).toBe('check-by-userid');
  });

  it('checks by guestId for an anonymous guest', () => {
    expect(decideMembersAuth({ user: null, guestId: 'g-abc', gameOwnerId: 'u1' })).toBe('check-by-guestid');
  });

  it('user identity wins over guestId when both are present', () => {
    // An authenticated user who also has a guestId goes through user check, not guest
    const result = decideMembersAuth({ user: { id: 'u1' }, guestId: 'g-abc', gameOwnerId: 'u1' });
    expect(result).toBe('owner-authorized'); // owner path, not guest path
  });

  it('non-owner authenticated user with a guestId uses userid check (not guestid)', () => {
    const result = decideMembersAuth({ user: { id: 'u2' }, guestId: 'g-abc', gameOwnerId: 'u1' });
    expect(result).toBe('check-by-userid');
  });
});

// ─── 10. resolvePresenceKey edge cases ───────────────────────────────────────
// Mirrors the Presence channel key: session?.user?.id ?? guestId ?? "anon"
// Edge case: empty string userId. Since ?? only skips null/undefined,
// an empty string "" is treated as "set" and will be used directly.

function resolvePresenceKey(userId: string | undefined, guestId: string | null): string {
  return userId ?? guestId ?? 'anon';
}

describe('resolvePresenceKey — edge cases', () => {
  it('uses userId when set', () => {
    expect(resolvePresenceKey('user-abc', 'guest-xyz')).toBe('user-abc');
  });

  it('falls back to guestId when userId is undefined', () => {
    expect(resolvePresenceKey(undefined, 'guest-xyz')).toBe('guest-xyz');
  });

  it('falls back to "anon" when both are absent', () => {
    expect(resolvePresenceKey(undefined, null)).toBe('anon');
  });

  it('empty string userId is used as-is by ?? (NOT treated as absent)', () => {
    // This is the subtle edge case: ?? only skips null/undefined, not "".
    // An empty string userId results in presence key = "", which is valid but
    // might cause multiple unauth users to collide on the same presence key.
    expect(resolvePresenceKey('', 'guest-xyz')).toBe('');
  });

  it('uses userId over guestId even when guestId is set', () => {
    expect(resolvePresenceKey('user-abc', null)).toBe('user-abc');
  });
});

// ─── 11. ownerUserId resolution — message route fallback ─────────────────────
// Mirrors: const ownerUserId = gameRow?.user_id ?? effectiveUserId ?? "unknown"
// The owner's DB user_id is used for the game_room_state upsert.

function resolveOwnerUserId(
  gameRowUserId: string | null | undefined,
  effectiveUserId: string | null,
): string {
  return gameRowUserId ?? effectiveUserId ?? 'unknown';
}

describe('resolveOwnerUserId', () => {
  it('uses the game row user_id when available', () => {
    expect(resolveOwnerUserId('owner-123', 'u-456')).toBe('owner-123');
  });

  it('falls back to effectiveUserId when gameRow is null (game deleted mid-request)', () => {
    expect(resolveOwnerUserId(null, 'u-456')).toBe('u-456');
  });

  it('falls back to "unknown" when both are null/undefined (anonymous guest, deleted game)', () => {
    expect(resolveOwnerUserId(null, null)).toBe('unknown');
    expect(resolveOwnerUserId(undefined, null)).toBe('unknown');
  });

  it('falls back to effectiveUserId when gameRow.user_id is undefined', () => {
    expect(resolveOwnerUserId(undefined, 'u-789')).toBe('u-789');
  });
});
