import { describe, it, expect } from 'vitest';

// ─── Invite code format helpers ───────────────────────────────────────────────
// These mirror the generation logic in /api/games/[gameId]/invite/route.ts
// and /api/games/[gameId]/join/route.ts so we can test rules without hitting
// the network.

function generateInviteCode(): string {
  // Same algorithm used in the API route
  return crypto.randomUUID().replace(/-/g, '').slice(0, 8).toLowerCase();
}

function isValidInviteCode(code: unknown): boolean {
  if (typeof code !== 'string') return false;
  return /^[a-f0-9]{8}$/.test(code);
}

function sanitizeNickname(raw: string): string {
  return raw.trim().slice(0, 30);
}

function isValidNickname(nickname: unknown): boolean {
  if (typeof nickname !== 'string') return false;
  return nickname.trim().length > 0 && nickname.trim().length <= 30;
}

// ─── Invite code format ───────────────────────────────────────────────────────

describe('invite code – format', () => {
  it('is exactly 8 characters long', () => {
    for (let i = 0; i < 20; i++) {
      expect(generateInviteCode()).toHaveLength(8);
    }
  });

  it('contains only lowercase hex characters [a-f0-9]', () => {
    for (let i = 0; i < 20; i++) {
      expect(generateInviteCode()).toMatch(/^[a-f0-9]{8}$/);
    }
  });

  it('is unique across multiple calls', () => {
    const codes = new Set(Array.from({ length: 100 }, generateInviteCode));
    expect(codes.size).toBe(100);
  });
});

describe('isValidInviteCode', () => {
  it('accepts a valid 8-char lowercase hex string', () => {
    expect(isValidInviteCode('a1b2c3d4')).toBe(true);
    expect(isValidInviteCode('00000000')).toBe(true);
    expect(isValidInviteCode('ffffffff')).toBe(true);
  });

  it('rejects codes shorter than 8 chars', () => {
    expect(isValidInviteCode('a1b2')).toBe(false);
    expect(isValidInviteCode('')).toBe(false);
  });

  it('rejects codes longer than 8 chars', () => {
    expect(isValidInviteCode('a1b2c3d4e5')).toBe(false);
  });

  it('rejects uppercase characters', () => {
    expect(isValidInviteCode('A1B2C3D4')).toBe(false);
  });

  it('rejects non-hex characters', () => {
    expect(isValidInviteCode('g1h2i3j4')).toBe(false);
    expect(isValidInviteCode('hello123')).toBe(false);
  });

  it('rejects non-string types', () => {
    expect(isValidInviteCode(null)).toBe(false);
    expect(isValidInviteCode(undefined)).toBe(false);
    expect(isValidInviteCode(12345678)).toBe(false);
  });
});

// ─── Nickname validation ──────────────────────────────────────────────────────

describe('isValidNickname', () => {
  it('accepts a normal name', () => {
    expect(isValidNickname('Alice')).toBe(true);
    expect(isValidNickname('Bob Smith')).toBe(true);
    expect(isValidNickname('玩家甲')).toBe(true);
  });

  it('accepts a name that is exactly 30 characters', () => {
    expect(isValidNickname('A'.repeat(30))).toBe(true);
  });

  it('rejects empty string', () => {
    expect(isValidNickname('')).toBe(false);
  });

  it('rejects whitespace-only string', () => {
    expect(isValidNickname('   ')).toBe(false);
    expect(isValidNickname('\t\n')).toBe(false);
  });

  it('rejects names longer than 30 characters', () => {
    expect(isValidNickname('A'.repeat(31))).toBe(false);
  });

  it('rejects non-string types', () => {
    expect(isValidNickname(null)).toBe(false);
    expect(isValidNickname(undefined)).toBe(false);
    expect(isValidNickname(42)).toBe(false);
  });
});

describe('sanitizeNickname', () => {
  it('trims leading and trailing whitespace', () => {
    expect(sanitizeNickname('  Alice  ')).toBe('Alice');
  });

  it('truncates to 30 characters', () => {
    const result = sanitizeNickname('A'.repeat(50));
    expect(result).toHaveLength(30);
  });

  it('preserves inner spaces', () => {
    expect(sanitizeNickname('Bob Smith')).toBe('Bob Smith');
  });

  it('handles already-clean input unchanged', () => {
    expect(sanitizeNickname('Charlie')).toBe('Charlie');
  });
});

// ─── Join request validation ──────────────────────────────────────────────────

describe('join request – body validation', () => {
  function validateJoinBody(body: unknown): { ok: boolean; error?: string } {
    if (!body || typeof body !== 'object') return { ok: false, error: 'invalid body' };
    const { inviteCode, nickname } = body as Record<string, unknown>;
    if (!inviteCode || typeof inviteCode !== 'string') {
      return { ok: false, error: 'inviteCode required' };
    }
    if (!nickname || typeof nickname !== 'string' || !nickname.trim()) {
      return { ok: false, error: 'nickname required' };
    }
    return { ok: true };
  }

  it('accepts a valid join body', () => {
    expect(validateJoinBody({ inviteCode: 'a1b2c3d4', nickname: 'Alice' })).toEqual({ ok: true });
  });

  it('rejects missing inviteCode', () => {
    const result = validateJoinBody({ nickname: 'Alice' });
    expect(result.ok).toBe(false);
    expect(result.error).toContain('inviteCode');
  });

  it('rejects missing nickname', () => {
    const result = validateJoinBody({ inviteCode: 'a1b2c3d4' });
    expect(result.ok).toBe(false);
    expect(result.error).toContain('nickname');
  });

  it('rejects whitespace-only nickname', () => {
    const result = validateJoinBody({ inviteCode: 'a1b2c3d4', nickname: '   ' });
    expect(result.ok).toBe(false);
  });

  it('rejects null body', () => {
    expect(validateJoinBody(null).ok).toBe(false);
  });

  it('accepts optional guestId field', () => {
    const result = validateJoinBody({
      inviteCode: 'a1b2c3d4',
      nickname: 'Guest42',
      guestId: 'uuid-here',
    });
    expect(result.ok).toBe(true);
  });
});

// ─── isOwner determination ────────────────────────────────────────────────────

describe('owner detection', () => {
  /** Mirrors the logic in page.tsx / join/route.ts */
  function resolveIsOwner(gameOwnerId: string, requestUserId: string | null): boolean {
    if (!requestUserId) return false;
    return gameOwnerId === requestUserId;
  }

  it('returns true when authenticated user owns the game', () => {
    expect(resolveIsOwner('user-123', 'user-123')).toBe(true);
  });

  it('returns false when authenticated user is a different person', () => {
    expect(resolveIsOwner('user-123', 'user-456')).toBe(false);
  });

  it('returns false for anonymous (null userId)', () => {
    expect(resolveIsOwner('user-123', null)).toBe(false);
  });
});
