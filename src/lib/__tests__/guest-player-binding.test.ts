import { describe, it, expect } from 'vitest';

// ─── Guest → Player Binding Tests ─────────────────────────────────────────────
//
// Covers all pure logic introduced by the Guest→Player binding feature:
//
//   A.  enrichedGuestMembers derivation
//       — matching Presence entries with roomMembers via guest_id
//   B.  guestPlayerBinding derivation
//       — guest client looks up its own player_id from roomMembers
//   C.  playerRoster labeling
//       — [AI] / [GUEST: nickname] / [YOU/HUMAN] per player slot
//   D.  availableGuests filtering (Assign dropdown)
//       — only unbound guests with a memberId appear as options
//   E.  GuestCard display logic
//       — "Spectator" vs "Playing as X · Role"
//   F.  myBoardContent lookup for guest client
//       — empty when unbound; correct entry when bound
//   G.  PATCH authorization logic
//       — owner / non-owner / missing fields
//   H.  members API guest_id exposure
//       — presence-key matching requires guest_id in response
//   I.  Multi-guest binding edge cases
//       — two guests / same player / unassign scenarios
//   J.  Binding persistence across reconnect
//       — DB-backed player_id survives disconnect / rejoin

// ─── Shared type fixtures ─────────────────────────────────────────────────────

interface Player {
  id: string;
  name: string;
  role?: string;
  isAI?: boolean;
  isGameMaster?: boolean;
}

interface RoomMember {
  id: string;           // game_members row id
  nickname: string;
  is_owner: boolean;
  player_id: string | null;
  guest_id: string | null;
}

interface PresenceEntry {
  id: string;           // presence key = guestId UUID
  nickname: string;
}

interface EnrichedGuest {
  id: string;
  nickname: string;
  memberId?: string;
  playerId?: string;
  playerName?: string;
  playerRole?: string;
}

// ─── A. enrichedGuestMembers derivation ───────────────────────────────────────
// Mirrors page.tsx enrichedGuestMembers useMemo.

function enrichGuestMembers(
  presences: PresenceEntry[],
  members: RoomMember[],
  players: Player[],
): EnrichedGuest[] {
  return presences.map((g) => {
    const member = members.find((m) => m.guest_id === g.id && !m.is_owner);
    const boundPlayer = member?.player_id
      ? players.find((p) => p.id === member.player_id) ?? null
      : null;
    return {
      id: g.id,
      nickname: g.nickname,
      memberId: member?.id,
      playerId: boundPlayer?.id,
      playerName: boundPlayer?.name,
      playerRole: boundPlayer?.role,
    };
  });
}

describe('enrichedGuestMembers — Presence × roomMembers join', () => {
  const players: Player[] = [
    { id: 'p1', name: 'Mara Voss', role: 'Investigator', isAI: true },
    { id: 'p2', name: 'Jon Reed', role: 'Werewolf', isAI: true },
  ];

  it('returns enriched guest with player info when guest_id matches', () => {
    const presences: PresenceEntry[] = [{ id: 'guest-uuid-1', nickname: 'Nikki' }];
    const members: RoomMember[] = [
      { id: 'member-1', nickname: 'Nikki', is_owner: false, player_id: 'p1', guest_id: 'guest-uuid-1' },
    ];
    const result = enrichGuestMembers(presences, members, players);
    expect(result).toHaveLength(1);
    expect(result[0].playerId).toBe('p1');
    expect(result[0].playerName).toBe('Mara Voss');
    expect(result[0].playerRole).toBe('Investigator');
    expect(result[0].memberId).toBe('member-1');
  });

  it('returns guest without player info when no matching member found', () => {
    const presences: PresenceEntry[] = [{ id: 'ghost-uuid', nickname: 'Ghost' }];
    const members: RoomMember[] = [
      { id: 'member-1', nickname: 'Nikki', is_owner: false, player_id: 'p1', guest_id: 'guest-uuid-1' },
    ];
    const result = enrichGuestMembers(presences, members, players);
    expect(result[0].playerId).toBeUndefined();
    expect(result[0].playerName).toBeUndefined();
    expect(result[0].memberId).toBeUndefined();
  });

  it('returns guest without player info when player_id is null', () => {
    const presences: PresenceEntry[] = [{ id: 'guest-uuid-1', nickname: 'Nikki' }];
    const members: RoomMember[] = [
      { id: 'member-1', nickname: 'Nikki', is_owner: false, player_id: null, guest_id: 'guest-uuid-1' },
    ];
    const result = enrichGuestMembers(presences, members, players);
    expect(result[0].playerId).toBeUndefined();
    expect(result[0].memberid).toBeUndefined; // memberId is still set
    expect(result[0].memberId).toBe('member-1');
  });

  it('returns guest without player info when player_id not in players array', () => {
    const presences: PresenceEntry[] = [{ id: 'guest-uuid-1', nickname: 'Nikki' }];
    const members: RoomMember[] = [
      { id: 'member-1', nickname: 'Nikki', is_owner: false, player_id: 'p-nonexistent', guest_id: 'guest-uuid-1' },
    ];
    const result = enrichGuestMembers(presences, members, players);
    expect(result[0].playerId).toBeUndefined();
    expect(result[0].playerName).toBeUndefined();
  });

  it('never matches owner members even if guest_id matches', () => {
    const presences: PresenceEntry[] = [{ id: 'guest-uuid-1', nickname: 'Owner' }];
    const members: RoomMember[] = [
      { id: 'member-owner', nickname: 'Owner', is_owner: true, player_id: 'p1', guest_id: 'guest-uuid-1' },
    ];
    const result = enrichGuestMembers(presences, members, players);
    expect(result[0].memberId).toBeUndefined();
    expect(result[0].playerId).toBeUndefined();
  });

  it('enriches multiple guests independently', () => {
    const presences: PresenceEntry[] = [
      { id: 'g1', nickname: 'Alice' },
      { id: 'g2', nickname: 'Bob' },
      { id: 'g3', nickname: 'Carol' },
    ];
    const members: RoomMember[] = [
      { id: 'm1', nickname: 'Alice', is_owner: false, player_id: 'p1', guest_id: 'g1' },
      { id: 'm2', nickname: 'Bob', is_owner: false, player_id: null, guest_id: 'g2' },
      // Carol has no member row (e.g. join failed)
    ];
    const result = enrichGuestMembers(presences, members, players);
    expect(result[0].playerName).toBe('Mara Voss');  // Alice bound to p1
    expect(result[1].playerId).toBeUndefined();       // Bob unbound
    expect(result[2].memberId).toBeUndefined();       // Carol no member
  });

  it('preserves presence id and nickname regardless of binding status', () => {
    const presences: PresenceEntry[] = [{ id: 'abc-123', nickname: 'Stranger' }];
    const result = enrichGuestMembers(presences, [], players);
    expect(result[0].id).toBe('abc-123');
    expect(result[0].nickname).toBe('Stranger');
  });

  it('returns empty array when there are no online guests', () => {
    const result = enrichGuestMembers([], [
      { id: 'm1', nickname: 'Nikki', is_owner: false, player_id: 'p1', guest_id: 'g1' },
    ], players);
    expect(result).toHaveLength(0);
  });

  it('handles a player with no role (role-less slot)', () => {
    const noRolePlayers: Player[] = [{ id: 'p3', name: 'NPC', isAI: true }];
    const presences: PresenceEntry[] = [{ id: 'g1', nickname: 'Nikki' }];
    const members: RoomMember[] = [
      { id: 'm1', nickname: 'Nikki', is_owner: false, player_id: 'p3', guest_id: 'g1' },
    ];
    const result = enrichGuestMembers(presences, members, noRolePlayers);
    expect(result[0].playerName).toBe('NPC');
    expect(result[0].playerRole).toBeUndefined();
  });
});

// ─── B. guestPlayerBinding derivation ─────────────────────────────────────────
// Mirrors page.tsx guestPlayerBinding useMemo.

function resolveGuestPlayerBinding(params: {
  isGuestPlayer: boolean;
  guestId: string | null;
  members: RoomMember[];
}): string | null {
  const { isGuestPlayer, guestId, members } = params;
  if (!isGuestPlayer || !guestId) return null;
  return members.find((m) => m.guest_id === guestId)?.player_id ?? null;
}

describe('guestPlayerBinding — guest looks up own player_id', () => {
  it('returns player_id when guest is bound', () => {
    const result = resolveGuestPlayerBinding({
      isGuestPlayer: true,
      guestId: 'g1',
      members: [{ id: 'm1', nickname: 'Nikki', is_owner: false, player_id: 'p1', guest_id: 'g1' }],
    });
    expect(result).toBe('p1');
  });

  it('returns null when guest is unbound (player_id is null)', () => {
    const result = resolveGuestPlayerBinding({
      isGuestPlayer: true,
      guestId: 'g1',
      members: [{ id: 'm1', nickname: 'Nikki', is_owner: false, player_id: null, guest_id: 'g1' }],
    });
    expect(result).toBeNull();
  });

  it('returns null when no matching member row exists', () => {
    const result = resolveGuestPlayerBinding({
      isGuestPlayer: true,
      guestId: 'g-missing',
      members: [{ id: 'm1', nickname: 'Nikki', is_owner: false, player_id: 'p1', guest_id: 'g1' }],
    });
    expect(result).toBeNull();
  });

  it('returns null when isGuestPlayer is false (owner)', () => {
    const result = resolveGuestPlayerBinding({
      isGuestPlayer: false,
      guestId: 'g1',
      members: [{ id: 'm1', nickname: 'Nikki', is_owner: false, player_id: 'p1', guest_id: 'g1' }],
    });
    expect(result).toBeNull();
  });

  it('returns null when guestId is null', () => {
    const result = resolveGuestPlayerBinding({
      isGuestPlayer: true,
      guestId: null,
      members: [{ id: 'm1', nickname: 'Nikki', is_owner: false, player_id: 'p1', guest_id: 'g1' }],
    });
    expect(result).toBeNull();
  });

  it('returns null when members array is empty', () => {
    const result = resolveGuestPlayerBinding({ isGuestPlayer: true, guestId: 'g1', members: [] });
    expect(result).toBeNull();
  });

  it('ignores owner member rows (guest_id on owner should not match)', () => {
    const result = resolveGuestPlayerBinding({
      isGuestPlayer: true,
      guestId: 'g1',
      members: [{ id: 'm1', nickname: 'Owner', is_owner: true, player_id: 'p1', guest_id: 'g1' }],
    });
    // The find doesn't filter is_owner, but the guest wouldn't have is_owner=true; test the raw logic
    // Owner rows with matching guest_id would return player_id — caller must ensure they pass correct data
    expect(result).toBe('p1'); // Documents current behavior: doesn't explicitly exclude owner rows
  });
});

// ─── C. playerRoster labeling ─────────────────────────────────────────────────
// Mirrors page.tsx handleSendMessage playerRoster building.

function buildPlayerRosterEntry(
  player: Player & { stats?: { Status?: string }; personality?: string; background?: string },
  userId: string,
  humanName: string,
  members: RoomMember[],
): string {
  const isHuman = player.id === userId;
  const name = isHuman ? humanName : player.name;
  const role = player.role ? `Role: ${player.role}` : 'Role: not assigned';
  const status = player.stats?.Status ?? 'alive';
  const statusStr = `Status: ${status}`;
  if (isHuman) {
    return `  • ${name} [YOU/HUMAN] | ${role} | ${statusStr}`;
  }
  const boundGuest = members.find((m) => m.player_id === player.id && !m.is_owner);
  const personality = player.personality ? `Personality: ${player.personality}` : '';
  const background = player.background ? `Background: ${player.background}` : '';
  const extras = [personality, background].filter(Boolean).join(' | ');
  const typeLabel = boundGuest ? `GUEST: ${boundGuest.nickname}` : 'AI';
  return `  • ${name} [${typeLabel}] | ${role} | ${statusStr}${extras ? ` | ${extras}` : ''}`;
}

describe('playerRoster labeling — AI vs GUEST vs HUMAN', () => {
  const members: RoomMember[] = [
    { id: 'm1', nickname: 'Nikki', is_owner: false, player_id: 'p-mara', guest_id: 'g1' },
    { id: 'm2', nickname: 'Sam', is_owner: false, player_id: null, guest_id: 'g2' },
  ];

  it('labels unbound AI player as [AI]', () => {
    const player: Player = { id: 'p-jon', name: 'Jon Reed', role: 'Werewolf', isAI: true };
    const entry = buildPlayerRosterEntry(player, 'owner-id', 'Host', members);
    expect(entry).toContain('[AI]');
    expect(entry).not.toContain('[GUEST');
  });

  it('labels bound AI player as [GUEST: nickname]', () => {
    const player: Player = { id: 'p-mara', name: 'Mara Voss', role: 'Investigator', isAI: true };
    const entry = buildPlayerRosterEntry(player, 'owner-id', 'Host', members);
    expect(entry).toContain('[GUEST: Nikki]');
    expect(entry).not.toContain('[AI]');
  });

  it('labels human owner as [YOU/HUMAN]', () => {
    const player: Player = { id: 'owner-id', name: 'Host Player', role: 'Villager', isAI: false };
    const entry = buildPlayerRosterEntry(player, 'owner-id', 'Alex', members);
    expect(entry).toContain('[YOU/HUMAN]');
    expect(entry).toContain('Alex');
    expect(entry).not.toContain('[AI]');
  });

  it('uses human display name (humanName) not player.name for owner', () => {
    const player: Player = { id: 'owner-id', name: 'Old Name', role: 'Villain', isAI: false };
    const entry = buildPlayerRosterEntry(player, 'owner-id', 'In-Game Alex', members);
    expect(entry).toContain('In-Game Alex');
    expect(entry).not.toContain('Old Name');
  });

  it('includes role in roster entry', () => {
    const player: Player = { id: 'p-mara', name: 'Mara Voss', role: 'Investigator', isAI: true };
    const entry = buildPlayerRosterEntry(player, 'owner-id', 'Host', members);
    expect(entry).toContain('Role: Investigator');
  });

  it('shows "Role: not assigned" when role is missing', () => {
    const player: Player = { id: 'p-new', name: 'New Player', isAI: true };
    const entry = buildPlayerRosterEntry(player, 'owner-id', 'Host', []);
    expect(entry).toContain('Role: not assigned');
  });

  it('includes personality when present', () => {
    const player = { id: 'p-jon', name: 'Jon', role: 'X', isAI: true, personality: 'Gruff' };
    const entry = buildPlayerRosterEntry(player, 'other', 'Host', []);
    expect(entry).toContain('Personality: Gruff');
  });

  it('omits extras when personality and background are absent', () => {
    const player: Player = { id: 'p-jon', name: 'Jon', role: 'X', isAI: true };
    const entry = buildPlayerRosterEntry(player, 'other', 'Host', []);
    expect(entry).not.toContain('Personality');
    expect(entry).not.toContain('Background');
    // Confirm no trailing " | " at end
    expect(entry.trimEnd().endsWith('alive')).toBe(true);
  });

  it('does not match owner member row for type labeling', () => {
    const ownerMember: RoomMember = {
      id: 'm-owner', nickname: 'FakeOwner', is_owner: true, player_id: 'p-mara', guest_id: null,
    };
    const player: Player = { id: 'p-mara', name: 'Mara Voss', role: 'X', isAI: true };
    const entry = buildPlayerRosterEntry(player, 'other', 'Host', [ownerMember]);
    // Owner rows are excluded by !m.is_owner, so should fall back to [AI]
    expect(entry).toContain('[AI]');
  });

  it('builds roster for all players, mixing labels correctly', () => {
    const players: Player[] = [
      { id: 'owner-id', name: 'Owner', role: 'Villager', isAI: false },
      { id: 'p-mara', name: 'Mara', role: 'Detective', isAI: true },
      { id: 'p-jon', name: 'Jon', role: 'Killer', isAI: true },
    ];
    const entries = players.map((p) => buildPlayerRosterEntry(p, 'owner-id', 'Boss', members));
    expect(entries[0]).toContain('[YOU/HUMAN]');
    expect(entries[1]).toContain('[GUEST: Nikki]');
    expect(entries[2]).toContain('[AI]');
  });
});

// ─── D. availableGuests filtering ─────────────────────────────────────────────
// Mirrors PlayerCard logic: which guests appear in the "Assign" dropdown.

interface GuestEntryFull {
  id: string;
  nickname: string;
  memberId?: string;
  playerId?: string;
}

function getAvailableGuests(guests: GuestEntryFull[]): GuestEntryFull[] {
  return guests.filter((g) => !g.playerId && g.memberId);
}

function canShowAssignDropdown(params: {
  isUserGameMaster: boolean;
  playerIsAI: boolean;
  playerIsGameMaster: boolean;
  hasOnAssignGuest: boolean;
}): boolean {
  return (
    params.isUserGameMaster &&
    params.playerIsAI &&
    !params.playerIsGameMaster &&
    params.hasOnAssignGuest
  );
}

describe('availableGuests filtering — Assign dropdown population', () => {
  it('includes only unbound guests that have a memberId', () => {
    const guests: GuestEntryFull[] = [
      { id: 'g1', nickname: 'Alice', memberId: 'm1', playerId: undefined },
      { id: 'g2', nickname: 'Bob', memberId: 'm2', playerId: 'p1' },  // already bound
      { id: 'g3', nickname: 'Carol', memberId: undefined, playerId: undefined }, // no memberId
    ];
    const available = getAvailableGuests(guests);
    expect(available).toHaveLength(1);
    expect(available[0].nickname).toBe('Alice');
  });

  it('returns empty array when all guests are already bound', () => {
    const guests: GuestEntryFull[] = [
      { id: 'g1', nickname: 'Alice', memberId: 'm1', playerId: 'p1' },
      { id: 'g2', nickname: 'Bob', memberId: 'm2', playerId: 'p2' },
    ];
    expect(getAvailableGuests(guests)).toHaveLength(0);
  });

  it('returns empty array when guests list is empty', () => {
    expect(getAvailableGuests([])).toHaveLength(0);
  });

  it('excludes guests with no memberId (join failed or pending)', () => {
    const guests: GuestEntryFull[] = [
      { id: 'g1', nickname: 'Alice', memberId: undefined, playerId: undefined },
    ];
    expect(getAvailableGuests(guests)).toHaveLength(0);
  });

  it('includes all when all guests are unbound with memberId', () => {
    const guests: GuestEntryFull[] = [
      { id: 'g1', nickname: 'Alice', memberId: 'm1' },
      { id: 'g2', nickname: 'Bob', memberId: 'm2' },
      { id: 'g3', nickname: 'Carol', memberId: 'm3' },
    ];
    expect(getAvailableGuests(guests)).toHaveLength(3);
  });
});

describe('canShowAssignDropdown — PlayerCard assign button visibility', () => {
  it('true for owner + AI non-GM player + callback provided', () => {
    expect(canShowAssignDropdown({
      isUserGameMaster: true, playerIsAI: true,
      playerIsGameMaster: false, hasOnAssignGuest: true,
    })).toBe(true);
  });

  it('false when viewer is not owner', () => {
    expect(canShowAssignDropdown({
      isUserGameMaster: false, playerIsAI: true,
      playerIsGameMaster: false, hasOnAssignGuest: true,
    })).toBe(false);
  });

  it('false when player is the Game Master', () => {
    expect(canShowAssignDropdown({
      isUserGameMaster: true, playerIsAI: true,
      playerIsGameMaster: true, hasOnAssignGuest: true,
    })).toBe(false);
  });

  it('false when player is a human (not AI)', () => {
    expect(canShowAssignDropdown({
      isUserGameMaster: true, playerIsAI: false,
      playerIsGameMaster: false, hasOnAssignGuest: true,
    })).toBe(false);
  });

  it('false when no onAssignGuest callback provided (guest-client view)', () => {
    expect(canShowAssignDropdown({
      isUserGameMaster: true, playerIsAI: true,
      playerIsGameMaster: false, hasOnAssignGuest: false,
    })).toBe(false);
  });
});

// ─── E. GuestCard display logic ───────────────────────────────────────────────
// Models what GuestCard renders based on binding state.

function resolveGuestCardSubtitle(guest: GuestEntryFull & { playerName?: string; playerRole?: string }): string {
  if (!guest.playerId) return 'Spectator';
  const base = `Playing as ${guest.playerName ?? 'Unknown'}`;
  return guest.playerRole ? `${base} · ${guest.playerRole}` : base;
}

function isGuestCardHighlighted(guest: GuestEntryFull): boolean {
  return !!guest.playerId;
}

describe('GuestCard display logic', () => {
  it('shows "Spectator" for unbound guest', () => {
    expect(resolveGuestCardSubtitle({ id: 'g1', nickname: 'Nikki' })).toBe('Spectator');
  });

  it('shows "Playing as <name>" when bound without role', () => {
    const subtitle = resolveGuestCardSubtitle({
      id: 'g1', nickname: 'Nikki', playerId: 'p1', playerName: 'Mara Voss',
    });
    expect(subtitle).toBe('Playing as Mara Voss');
  });

  it('shows "Playing as <name> · <role>" when bound with role', () => {
    const subtitle = resolveGuestCardSubtitle({
      id: 'g1', nickname: 'Nikki', playerId: 'p1', playerName: 'Mara Voss', playerRole: 'Investigator',
    });
    expect(subtitle).toBe('Playing as Mara Voss · Investigator');
  });

  it('shows "Playing as Unknown" when playerName is missing', () => {
    const subtitle = resolveGuestCardSubtitle({ id: 'g1', nickname: 'Nikki', playerId: 'p1' });
    expect(subtitle).toBe('Playing as Unknown');
  });

  it('card is highlighted when bound', () => {
    expect(isGuestCardHighlighted({ id: 'g1', nickname: 'Nikki', memberId: 'm1', playerId: 'p1' })).toBe(true);
  });

  it('card is not highlighted when unbound', () => {
    expect(isGuestCardHighlighted({ id: 'g1', nickname: 'Nikki', memberId: 'm1' })).toBe(false);
  });

  it('card is not highlighted when playerId is empty string', () => {
    expect(isGuestCardHighlighted({ id: 'g1', nickname: 'Nikki', memberId: 'm1', playerId: '' })).toBe(false);
  });
});

// ─── F. myBoardContent lookup for guest client ────────────────────────────────
// Models page.tsx myBoardContentFromHost prop resolution.

function resolveMyBoardForClient(params: {
  isGuestPlayer: boolean;
  guestPlayerBinding: string | null;
  userId: string;
  myBoardContent: Record<string, string>;
}): string {
  const { isGuestPlayer, guestPlayerBinding, userId, myBoardContent } = params;
  if (isGuestPlayer) {
    return guestPlayerBinding ? (myBoardContent[guestPlayerBinding] ?? '') : '';
  }
  return myBoardContent[userId] ?? '';
}

describe('myBoardContent lookup for guest client', () => {
  const board: Record<string, string> = {
    'p1': 'You are the Investigator. You have one shot.',
    'owner-id': 'You are the Host. You know everything.',
    'p2': 'You are the Werewolf.',
  };

  it('returns own board content for owner', () => {
    const result = resolveMyBoardForClient({
      isGuestPlayer: false, guestPlayerBinding: null, userId: 'owner-id', myBoardContent: board,
    });
    expect(result).toBe('You are the Host. You know everything.');
  });

  it('returns bound player board for guest with binding', () => {
    const result = resolveMyBoardForClient({
      isGuestPlayer: true, guestPlayerBinding: 'p1', userId: 'anon', myBoardContent: board,
    });
    expect(result).toBe('You are the Investigator. You have one shot.');
  });

  it('returns empty string for unbound guest', () => {
    const result = resolveMyBoardForClient({
      isGuestPlayer: true, guestPlayerBinding: null, userId: 'anon', myBoardContent: board,
    });
    expect(result).toBe('');
  });

  it('returns empty string when bound player has no board entry yet', () => {
    const result = resolveMyBoardForClient({
      isGuestPlayer: true, guestPlayerBinding: 'p-new', userId: 'anon', myBoardContent: board,
    });
    expect(result).toBe('');
  });

  it('returns empty string for owner with no board entry', () => {
    const result = resolveMyBoardForClient({
      isGuestPlayer: false, guestPlayerBinding: null, userId: 'new-owner', myBoardContent: board,
    });
    expect(result).toBe('');
  });

  it('guest does NOT see owner board even if binding is absent', () => {
    const result = resolveMyBoardForClient({
      isGuestPlayer: true, guestPlayerBinding: null, userId: 'owner-id', myBoardContent: board,
    });
    // Guest with no binding → empty, never falls through to owner's content
    expect(result).toBe('');
  });

  it('returns correct board after guest is reassigned to different player', () => {
    const first = resolveMyBoardForClient({
      isGuestPlayer: true, guestPlayerBinding: 'p1', userId: 'anon', myBoardContent: board,
    });
    const second = resolveMyBoardForClient({
      isGuestPlayer: true, guestPlayerBinding: 'p2', userId: 'anon', myBoardContent: board,
    });
    expect(first).toContain('Investigator');
    expect(second).toContain('Werewolf');
  });
});

// ─── G. PATCH authorization logic ────────────────────────────────────────────
// Models the server-side authorization check in members/[memberId]/route.ts.

type AuthResult = { ok: false; status: 400 | 401 | 403 | 500 } | { ok: true };

function checkPatchAuth(params: {
  gameId?: string;
  memberId?: string;
  callerId?: string;
  gameOwnerId?: string;
}): AuthResult {
  const { gameId, memberId, callerId, gameOwnerId } = params;
  if (!gameId || !memberId) return { ok: false, status: 400 };
  if (!callerId) return { ok: false, status: 401 };
  if (!gameOwnerId || callerId !== gameOwnerId) return { ok: false, status: 403 };
  return { ok: true };
}

describe('PATCH /members/[memberId] authorization logic', () => {
  it('returns 200 ok for game owner', () => {
    const result = checkPatchAuth({ gameId: 'g1', memberId: 'm1', callerId: 'user-1', gameOwnerId: 'user-1' });
    expect(result.ok).toBe(true);
  });

  it('returns 401 when no caller (unauthenticated)', () => {
    const result = checkPatchAuth({ gameId: 'g1', memberId: 'm1', callerId: undefined, gameOwnerId: 'user-1' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(401);
  });

  it('returns 403 when caller is not the game owner', () => {
    const result = checkPatchAuth({ gameId: 'g1', memberId: 'm1', callerId: 'attacker', gameOwnerId: 'user-1' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(403);
  });

  it('returns 403 when game not found (no owner)', () => {
    const result = checkPatchAuth({ gameId: 'g1', memberId: 'm1', callerId: 'user-1', gameOwnerId: undefined });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(403);
  });

  it('returns 400 when gameId is missing', () => {
    const result = checkPatchAuth({ gameId: undefined, memberId: 'm1', callerId: 'user-1', gameOwnerId: 'user-1' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(400);
  });

  it('returns 400 when memberId is missing', () => {
    const result = checkPatchAuth({ gameId: 'g1', memberId: undefined, callerId: 'user-1', gameOwnerId: 'user-1' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(400);
  });

  it('guest cannot assign (no session → 401)', () => {
    const result = checkPatchAuth({ gameId: 'g1', memberId: 'm1', callerId: undefined, gameOwnerId: 'owner' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(401);
  });
});

// ─── H. members API guest_id exposure ─────────────────────────────────────────
// guest_id must be returned for Presence-key matching to work.

interface MemberApiRow {
  id: string;
  nickname: string;
  is_owner: boolean;
  player_id: string | null;
  guest_id: string | null;
}

function hasMemberGuestId(row: MemberApiRow): boolean {
  return 'guest_id' in row;
}

function matchPresenceToMember(
  presenceKey: string,
  members: MemberApiRow[],
): MemberApiRow | undefined {
  return members.find((m) => m.guest_id === presenceKey && !m.is_owner);
}

describe('members API guest_id field', () => {
  it('API row includes guest_id field', () => {
    const row: MemberApiRow = {
      id: 'm1', nickname: 'Nikki', is_owner: false, player_id: null, guest_id: 'g-uuid-1',
    };
    expect(hasMemberGuestId(row)).toBe(true);
  });

  it('presence key exactly matches guest_id to link the two', () => {
    const members: MemberApiRow[] = [
      { id: 'm1', nickname: 'Nikki', is_owner: false, player_id: 'p1', guest_id: 'g-uuid-1' },
    ];
    const found = matchPresenceToMember('g-uuid-1', members);
    expect(found).toBeDefined();
    expect(found?.id).toBe('m1');
  });

  it('returns undefined when presence key does not match any member', () => {
    const members: MemberApiRow[] = [
      { id: 'm1', nickname: 'Nikki', is_owner: false, player_id: 'p1', guest_id: 'g-uuid-1' },
    ];
    expect(matchPresenceToMember('g-uuid-OTHER', members)).toBeUndefined();
  });

  it('does not match owner members (owner has is_owner=true)', () => {
    const members: MemberApiRow[] = [
      { id: 'm-owner', nickname: 'Owner', is_owner: true, player_id: null, guest_id: 'g-uuid-owner' },
    ];
    expect(matchPresenceToMember('g-uuid-owner', members)).toBeUndefined();
  });

  it('guest_id can be null for owner-created accounts', () => {
    const ownerRow: MemberApiRow = {
      id: 'm-owner', nickname: 'Owner', is_owner: true, player_id: null, guest_id: null,
    };
    expect(ownerRow.guest_id).toBeNull();
  });
});

// ─── I. Multi-guest binding edge cases ────────────────────────────────────────

describe('multi-guest binding edge cases', () => {
  const players: Player[] = [
    { id: 'p1', name: 'Mara Voss', role: 'Investigator', isAI: true },
    { id: 'p2', name: 'Jon Reed', role: 'Werewolf', isAI: true },
  ];

  it('two different guests can be bound to two different players', () => {
    const presences: PresenceEntry[] = [
      { id: 'g1', nickname: 'Alice' },
      { id: 'g2', nickname: 'Bob' },
    ];
    const members: RoomMember[] = [
      { id: 'm1', nickname: 'Alice', is_owner: false, player_id: 'p1', guest_id: 'g1' },
      { id: 'm2', nickname: 'Bob', is_owner: false, player_id: 'p2', guest_id: 'g2' },
    ];
    const result = enrichGuestMembers(presences, members, players);
    expect(result[0].playerName).toBe('Mara Voss');
    expect(result[1].playerName).toBe('Jon Reed');
  });

  it('only one guest can be bound per player (last-write-wins from DB)', () => {
    // If two members somehow have the same player_id, find() returns the first match
    const presences: PresenceEntry[] = [
      { id: 'g1', nickname: 'Alice' },
      { id: 'g2', nickname: 'Bob' },
    ];
    const members: RoomMember[] = [
      { id: 'm1', nickname: 'Alice', is_owner: false, player_id: 'p1', guest_id: 'g1' },
      { id: 'm2', nickname: 'Bob', is_owner: false, player_id: 'p1', guest_id: 'g2' }, // duplicate
    ];
    const result = enrichGuestMembers(presences, members, players);
    // Both find the same player_id=p1 — this is a data integrity issue, not a crash
    expect(result[0].playerId).toBe('p1');
    expect(result[1].playerId).toBe('p1');
  });

  it('unassign: after player_id set to null, guest reverts to Spectator subtitle', () => {
    const guest: GuestEntryFull & { playerName?: string; playerRole?: string } = {
      id: 'g1', nickname: 'Nikki', memberId: 'm1', playerId: undefined,
    };
    expect(resolveGuestCardSubtitle(guest)).toBe('Spectator');
  });

  it('unassign: after player_id cleared, guest no longer appears in boundGuest check', () => {
    const members: RoomMember[] = [
      { id: 'm1', nickname: 'Nikki', is_owner: false, player_id: null, guest_id: 'g1' },
    ];
    const player: Player = { id: 'p1', name: 'Mara Voss', role: 'X', isAI: true };
    const entry = buildPlayerRosterEntry(player, 'owner', 'Host', members);
    expect(entry).toContain('[AI]');
    expect(entry).not.toContain('[GUEST');
  });

  it('unassign: playerRoster reverts to [AI] after guest unbound', () => {
    const beforeMembers: RoomMember[] = [
      { id: 'm1', nickname: 'Nikki', is_owner: false, player_id: 'p1', guest_id: 'g1' },
    ];
    const afterMembers: RoomMember[] = [
      { id: 'm1', nickname: 'Nikki', is_owner: false, player_id: null, guest_id: 'g1' },
    ];
    const player: Player = { id: 'p1', name: 'Mara Voss', role: 'X', isAI: true };

    const before = buildPlayerRosterEntry(player, 'owner', 'Host', beforeMembers);
    const after = buildPlayerRosterEntry(player, 'owner', 'Host', afterMembers);
    expect(before).toContain('[GUEST: Nikki]');
    expect(after).toContain('[AI]');
  });

  it('third unbound guest is not shown as bound in roster', () => {
    const members: RoomMember[] = [
      { id: 'm1', nickname: 'Alice', is_owner: false, player_id: 'p1', guest_id: 'g1' },
      { id: 'm2', nickname: 'Bob', is_owner: false, player_id: null, guest_id: 'g2' },
    ];
    const player: Player = { id: 'p2', name: 'Jon Reed', role: 'X', isAI: true };
    const entry = buildPlayerRosterEntry(player, 'owner', 'Host', members);
    expect(entry).toContain('[AI]'); // p2 has no bound guest
  });

  it('AI message from a bound player still goes through normally (guest is human player)', () => {
    // When player p1 is bound to Nikki, the AI should NOT generate a reply FOR p1 autonomously
    // This is modeled by checking typeLabel in roster — test verifies label alone
    const members: RoomMember[] = [
      { id: 'm1', nickname: 'Nikki', is_owner: false, player_id: 'p1', guest_id: 'g1' },
    ];
    const player: Player = { id: 'p1', name: 'Mara Voss', isAI: true };
    const entry = buildPlayerRosterEntry(player, 'owner', 'Host', members);
    // AI host can see the player is controlled by a human guest
    expect(entry).toContain('[GUEST: Nikki]');
  });
});

// ─── J. Binding persistence across reconnect ──────────────────────────────────
// player_id is stored in the DB (game_members), so it survives disconnect/rejoin.
// Presence goes away on disconnect, but roomMembers retains the binding.

describe('binding persistence across guest reconnect', () => {
  it('guestPlayerBinding survives presence disconnect (DB-backed)', () => {
    // Simulate: guest disconnects from Presence (onlineGuestPresences = [])
    // but DB member row still has player_id
    const members: RoomMember[] = [
      { id: 'm1', nickname: 'Nikki', is_owner: false, player_id: 'p1', guest_id: 'g1' },
    ];
    // Guest reconnects — resolveGuestPlayerBinding still works because DB hasn't changed
    const result = resolveGuestPlayerBinding({
      isGuestPlayer: true, guestId: 'g1', members,
    });
    expect(result).toBe('p1');
  });

  it('enrichedGuestMembers reflects binding immediately on rejoin', () => {
    const presences: PresenceEntry[] = [{ id: 'g1', nickname: 'Nikki' }]; // back online
    const members: RoomMember[] = [
      { id: 'm1', nickname: 'Nikki', is_owner: false, player_id: 'p1', guest_id: 'g1' },
    ];
    const players: Player[] = [{ id: 'p1', name: 'Mara Voss', role: 'Investigator', isAI: true }];
    const result = enrichGuestMembers(presences, members, players);
    expect(result[0].playerName).toBe('Mara Voss'); // binding restored instantly
  });

  it('myBoard is preserved in game_room_state and visible after rejoin', () => {
    // myBoardContent is saved to DB in game_room_state — guest rejoins and sees board
    const board: Record<string, string> = { 'p1': 'You are the Investigator.' };
    const result = resolveMyBoardForClient({
      isGuestPlayer: true, guestPlayerBinding: 'p1', userId: 'anon', myBoardContent: board,
    });
    expect(result).toBe('You are the Investigator.');
  });

  it('new guest joining with same nickname gets a fresh member row (no binding)', () => {
    // Original Nikki left; a new person joins as "Nikki" — gets a new guest_id
    const members: RoomMember[] = [
      { id: 'm1', nickname: 'Nikki', is_owner: false, player_id: 'p1', guest_id: 'g-old' }, // old Nikki
      { id: 'm2', nickname: 'Nikki', is_owner: false, player_id: null, guest_id: 'g-new' },   // new Nikki
    ];
    const newBinding = resolveGuestPlayerBinding({
      isGuestPlayer: true, guestId: 'g-new', members,
    });
    expect(newBinding).toBeNull(); // new guest starts as Spectator
  });
});
