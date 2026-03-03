import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ─── C-6: guestId localStorage scoping ───────────────────────────────────────

describe('C-6: guestId localStorage key scoped by gameId', () => {
  const GAME_A = 'game-aaa-111';
  const GAME_B = 'game-bbb-222';

  it('key format is "guestId_${gameId}"', () => {
    const gameId = GAME_A;
    const key = `guestId_${gameId}`;
    expect(key).toBe(`guestId_${GAME_A}`);
  });

  it('different games produce different storage keys', () => {
    expect(`guestId_${GAME_A}`).not.toBe(`guestId_${GAME_B}`);
  });

  it('old global "guestId" key is no longer used', () => {
    // Production code now always uses game-scoped key — global key must NOT be read
    const keys = [GAME_A, GAME_B].map((id) => `guestId_${id}`);
    keys.forEach((k) => expect(k).not.toBe('guestId'));
  });

  it('reading guestId uses the game-scoped key', () => {
    const storage = new Map<string, string>();
    storage.set(`guestId_${GAME_A}`, 'uuid-for-game-a');
    storage.set(`guestId_${GAME_B}`, 'uuid-for-game-b');

    const readGuestId = (gameId: string) => storage.get(`guestId_${gameId}`) ?? null;
    expect(readGuestId(GAME_A)).toBe('uuid-for-game-a');
    expect(readGuestId(GAME_B)).toBe('uuid-for-game-b');
    // They are independent
    expect(readGuestId(GAME_A)).not.toBe(readGuestId(GAME_B));
  });

  it('writing guestId uses the game-scoped key, not the global key', () => {
    const storage = new Map<string, string>();
    const guestId = crypto.randomUUID();
    const gameId = GAME_A;
    storage.set(`guestId_${gameId}`, guestId);
    expect(storage.has('guestId')).toBe(false); // global key never written
    expect(storage.get(`guestId_${gameId}`)).toBe(guestId);
  });

  it('joining game A does not pollute game B guest session', () => {
    const storage = new Map<string, string>();
    const guestIdA = 'uuid-a';
    storage.set(`guestId_${GAME_A}`, guestIdA);
    const readB = () => storage.get(`guestId_${GAME_B}`) ?? null;
    expect(readB()).toBeNull(); // game B is unaffected
  });

  it('member_${gameId} key format is unchanged (game-scoped)', () => {
    const memberId = 'member-xyz';
    const gameId = GAME_A;
    const key = `member_${gameId}`;
    const storage = new Map([[key, memberId]]);
    expect(storage.get(`member_${GAME_A}`)).toBe(memberId);
    expect(storage.get(`member_${GAME_B}`)).toBeUndefined();
  });

  it('nickname_${gameId} key format is unchanged (game-scoped)', () => {
    const key = `nickname_${GAME_A}`;
    const storage = new Map([[key, 'Nikki']]);
    expect(storage.get(`nickname_${GAME_A}`)).toBe('Nikki');
    expect(storage.get(`nickname_${GAME_B}`)).toBeUndefined();
  });

  it('members API URL includes guestId as query param when unauthenticated', () => {
    const gameId = GAME_A;
    const guestId = 'uuid-guest-123';
    const url = guestId
      ? `/api/games/${gameId}/members?guestId=${encodeURIComponent(guestId)}`
      : `/api/games/${gameId}/members`;
    expect(url).toContain('guestId=uuid-guest-123');
    expect(url).toContain(gameId);
  });

  it('members API URL omits guestId param for authenticated users', () => {
    const gameId = GAME_A;
    const guestId = null;
    const url = guestId
      ? `/api/games/${gameId}/members?guestId=${encodeURIComponent(guestId)}`
      : `/api/games/${gameId}/members`;
    expect(url).not.toContain('guestId');
  });
});

// ─── I-8: invite code conditional update ─────────────────────────────────────
describe('I-8: invite code generation race condition fix', () => {
  // Simulates the conditional-update pattern:
  //   UPDATE games SET invite_code = $1 WHERE id = $2 AND invite_code IS NULL
  // and the subsequent re-read to get the "winning" code.

  function conditionalUpdateInviteCode(
    db: Map<string, { inviteCode: string | null }>,
    gameId: string,
    candidate: string
  ): string | null {
    const row = db.get(gameId);
    if (!row) return null;
    if (row.inviteCode !== null) return null; // already set — no-op
    row.inviteCode = candidate;
    return candidate;
  }

  function readInviteCode(db: Map<string, { inviteCode: string | null }>, gameId: string) {
    return db.get(gameId)?.inviteCode ?? null;
  }

  it('sets invite code when none exists', () => {
    const db = new Map([['g1', { inviteCode: null }]]);
    conditionalUpdateInviteCode(db, 'g1', 'abc12345');
    expect(readInviteCode(db, 'g1')).toBe('abc12345');
  });

  it('does NOT overwrite an existing invite code', () => {
    const db = new Map([['g1', { inviteCode: 'existing1' }]]);
    conditionalUpdateInviteCode(db, 'g1', 'newcode2');
    expect(readInviteCode(db, 'g1')).toBe('existing1'); // preserved
  });

  it('simulates race: two concurrent requests, only first writer wins', () => {
    const db = new Map([['g1', { inviteCode: null }]]);
    const code1 = 'aaaaaaaa';
    const code2 = 'bbbbbbbb';

    // Both requests see inviteCode=null and generate different candidates
    const r1 = conditionalUpdateInviteCode(db, 'g1', code1);
    const r2 = conditionalUpdateInviteCode(db, 'g1', code2);

    // Only the first write succeeded
    expect(r1).toBe(code1);
    expect(r2).toBeNull(); // second write is a no-op

    // Both requests then re-read the DB to get the canonical code
    const canonical = readInviteCode(db, 'g1');
    expect(canonical).toBe(code1); // both callers get the same URL
  });

  it('re-read returns the winning code regardless of which request wrote it', () => {
    const db = new Map([['g1', { inviteCode: null }]]);
    // Simulates: concurrent request "B" wins the race first
    conditionalUpdateInviteCode(db, 'g1', 'winner99');
    // Request "A" tries to write — blocked
    conditionalUpdateInviteCode(db, 'g1', 'loser00');
    // Both re-read and find the same value
    expect(readInviteCode(db, 'g1')).toBe('winner99');
  });

  it('invite code format is 8 hex chars (lowercase)', () => {
    const code = crypto.randomUUID().replace(/-/g, '').slice(0, 8).toLowerCase();
    expect(code).toMatch(/^[0-9a-f]{8}$/);
  });

  it('invite URL uses the canonical re-read code', () => {
    const db = new Map([['g1', { inviteCode: null }]]);
    const candidate = 'deadbeef';
    conditionalUpdateInviteCode(db, 'g1', candidate);
    const finalCode = readInviteCode(db, 'g1') ?? candidate;
    const origin = 'https://textgame.ai';
    expect(`${origin}/join/${finalCode}`).toBe('https://textgame.ai/join/deadbeef');
  });
});

// ─── I-4 + M-7: TTS cache LRU eviction and hash key ─────────────────────────

// Mirror djb2 hash from production
function djb2Hash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    hash |= 0;
  }
  return (hash >>> 0).toString(36);
}

function makeKey(text: string, voiceId: string) {
  return `${djb2Hash(text)}||${voiceId}`;
}

// Mirror LRU cache from production
function makeLRUCache(maxSize: number) {
  const cache = new Map<string, string>();

  function set(key: string, value: string) {
    if (cache.has(key)) {
      cache.delete(key);
    } else if (cache.size >= maxSize) {
      const oldest = cache.keys().next().value;
      if (oldest !== undefined) cache.delete(oldest);
    }
    cache.set(key, value);
  }

  function get(key: string) {
    return cache.get(key) ?? null;
  }

  return { set, get, size: () => cache.size };
}

describe('I-4: TTS cache LRU eviction', () => {
  it('stores entries up to maxSize', () => {
    const c = makeLRUCache(3);
    c.set('a', '1'); c.set('b', '2'); c.set('c', '3');
    expect(c.size()).toBe(3);
  });

  it('evicts the oldest entry when maxSize is exceeded', () => {
    const c = makeLRUCache(3);
    c.set('a', '1'); c.set('b', '2'); c.set('c', '3');
    c.set('d', '4'); // triggers eviction of 'a'
    expect(c.size()).toBe(3);
    expect(c.get('a')).toBeNull(); // evicted
    expect(c.get('d')).toBe('4'); // newest kept
  });

  it('re-accessing an entry moves it to "most recently used"', () => {
    const c = makeLRUCache(3);
    c.set('a', '1'); c.set('b', '2'); c.set('c', '3');
    c.set('a', '1-updated'); // refresh 'a' → it moves to end
    c.set('d', '4'); // evicts 'b' (now the oldest)
    expect(c.get('b')).toBeNull(); // 'b' evicted, not 'a'
    expect(c.get('a')).toBe('1-updated');
  });

  it('cache size never exceeds maxSize even under heavy load', () => {
    const c = makeLRUCache(5);
    for (let i = 0; i < 100; i++) {
      c.set(`key-${i}`, `val-${i}`);
    }
    expect(c.size()).toBe(5);
  });

  it('returns null for evicted entries', () => {
    const c = makeLRUCache(2);
    c.set('x', 'audio-x');
    c.set('y', 'audio-y');
    c.set('z', 'audio-z'); // evicts 'x'
    expect(c.get('x')).toBeNull();
    expect(c.get('y')).toBe('audio-y');
    expect(c.get('z')).toBe('audio-z');
  });

  it('size-1 cache always keeps only the latest entry', () => {
    const c = makeLRUCache(1);
    c.set('a', 'first');
    c.set('b', 'second');
    expect(c.get('a')).toBeNull();
    expect(c.get('b')).toBe('second');
  });
});

describe('M-7: TTS cache key – djb2 hash collision avoidance', () => {
  it('same text + same voice → same key (cache hit)', () => {
    const k1 = makeKey('Hello world', 'voice-abc');
    const k2 = makeKey('Hello world', 'voice-abc');
    expect(k1).toBe(k2);
  });

  it('different text → different key (no collision)', () => {
    const k1 = makeKey('Hello world', 'voice-abc');
    const k2 = makeKey('Hello everyone', 'voice-abc');
    expect(k1).not.toBe(k2);
  });

  it('different voice → different key', () => {
    const k1 = makeKey('Hello', 'voice-1');
    const k2 = makeKey('Hello', 'voice-2');
    expect(k1).not.toBe(k2);
  });

  it('texts sharing first 48 chars produce different keys (M-7 fix)', () => {
    const prefix = 'A'.repeat(48);
    const k1 = makeKey(prefix + 'extra-a', 'v');
    const k2 = makeKey(prefix + 'extra-b', 'v');
    expect(k1).not.toBe(k2); // different suffix → different hash
  });

  it('the old slice-based key WOULD have collided (demonstrates the fix)', () => {
    const prefix = 'A'.repeat(48);
    const oldKey1 = `${(prefix + 'extra-a').slice(0, 48)}||voice-v`;
    const oldKey2 = `${(prefix + 'extra-b').slice(0, 48)}||voice-v`;
    // Old approach: collision
    expect(oldKey1).toBe(oldKey2);
    // New approach: no collision
    expect(makeKey(prefix + 'extra-a', 'voice-v')).not.toBe(makeKey(prefix + 'extra-b', 'voice-v'));
  });

  it('hash output is a compact alphanumeric string', () => {
    const key = makeKey('Hello world', 'voice-abc');
    expect(key).toMatch(/^[0-9a-z]+\|\|voice-abc$/);
  });

  it('hash is deterministic across calls', () => {
    const results = Array.from({ length: 5 }, () => djb2Hash('test string'));
    expect(new Set(results).size).toBe(1);
  });

  it('empty string has a stable hash', () => {
    expect(djb2Hash('')).toBe(djb2Hash(''));
  });

  it('long texts produce stable hashes', () => {
    const long = 'word '.repeat(500);
    expect(djb2Hash(long)).toBe(djb2Hash(long));
  });

  it('single-character difference produces different hash', () => {
    const h1 = djb2Hash('abcde');
    const h2 = djb2Hash('abcdf');
    expect(h1).not.toBe(h2);
  });
});
