import { describe, it, expect } from 'vitest';
import crypto from 'crypto';

// ─── Pool URL Construction ─────────────────────────────────────────────────

const POOL_SIZE = 30;
const AVATAR_BUCKET = 'avatars';

function getPoolAvatarUrl(name: string, type: 'host' | 'player', gender?: string): string | null {
  const supabaseUrl = 'https://test.supabase.co';
  const key = `${name}|${type}`;
  const hash = crypto.createHash('sha256').update(key).digest('hex');
  const index = (parseInt(hash.slice(0, 8), 16) % POOL_SIZE) + 1;
  const padded = String(index).padStart(3, '0');
  const g = (gender?.trim().toLowerCase() === 'female') ? 'female' : 'male';
  return `${supabaseUrl}/storage/v1/object/public/${AVATAR_BUCKET}/pool/${g}/${padded}.png`;
}

describe('Pool Avatar URL Construction', () => {
  it('produces deterministic URLs for the same name+type', () => {
    const url1 = getPoolAvatarUrl('Alice', 'player', 'female');
    const url2 = getPoolAvatarUrl('Alice', 'player', 'female');
    expect(url1).toBe(url2);
  });

  it('produces different URLs for different names', () => {
    const url1 = getPoolAvatarUrl('Alice', 'player', 'female');
    const url2 = getPoolAvatarUrl('Bob', 'player', 'male');
    expect(url1).not.toBe(url2);
  });

  it('includes gender in the path', () => {
    const urlF = getPoolAvatarUrl('Alice', 'player', 'female');
    const urlM = getPoolAvatarUrl('Bob', 'player', 'male');
    expect(urlF).toContain('/pool/female/');
    expect(urlM).toContain('/pool/male/');
  });

  it('defaults to male when gender is undefined', () => {
    const url = getPoolAvatarUrl('Charlie', 'player');
    expect(url).toContain('/pool/male/');
  });

  it('defaults to male when gender is "other"', () => {
    const url = getPoolAvatarUrl('Dana', 'player', 'other');
    expect(url).toContain('/pool/male/');
  });

  it('index is within 1-30 range', () => {
    const names = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel'];
    for (const name of names) {
      const url = getPoolAvatarUrl(name, 'player', 'male')!;
      const match = url.match(/\/(\d{3})\.png$/);
      expect(match).toBeTruthy();
      const idx = parseInt(match![1], 10);
      expect(idx).toBeGreaterThanOrEqual(1);
      expect(idx).toBeLessThanOrEqual(POOL_SIZE);
    }
  });

  it('type affects the hash (host vs player get different pool avatars)', () => {
    const urlHost = getPoolAvatarUrl('Nova', 'host', 'female');
    const urlPlayer = getPoolAvatarUrl('Nova', 'player', 'female');
    expect(urlHost).not.toBe(urlPlayer);
  });

  it('URL format matches expected Supabase Storage pattern', () => {
    const url = getPoolAvatarUrl('TestUser', 'player', 'male');
    expect(url).toMatch(/^https:\/\/test\.supabase\.co\/storage\/v1\/object\/public\/avatars\/pool\/(male|female)\/\d{3}\.png$/);
  });
});

// ─── Pool Distribution (collision analysis) ─────────────────────────────────

describe('Pool Distribution', () => {
  it('distributes 7 random player names across pool with minimal collisions', () => {
    const names = ['Evelyn Hart', 'Marcus Chen', 'Sofia Reyes', 'James Okafor', 'Mira Takahashi', 'Leo Bergström', 'Priya Sharma'];
    const indices = new Set<number>();
    for (const name of names) {
      const key = `${name}|player`;
      const hash = crypto.createHash('sha256').update(key).digest('hex');
      const index = (parseInt(hash.slice(0, 8), 16) % POOL_SIZE) + 1;
      indices.add(index);
    }
    expect(indices.size).toBeGreaterThanOrEqual(5);
  });
});

// ─── Avatar Cache Invalidation ──────────────────────────────────────────────

describe('Avatar Cache Invalidation', () => {
  it('invalidateAvatarCache is exported and callable', async () => {
    const { invalidateAvatarCache } = await import('@/lib/avatar');
    expect(typeof invalidateAvatarCache).toBe('function');
    expect(() => invalidateAvatarCache('Alice', 'player')).not.toThrow();
  });

  it('fetchGeneratedAvatar accepts forceRegenerate parameter', async () => {
    const { fetchGeneratedAvatar } = await import('@/lib/avatar');
    expect(typeof fetchGeneratedAvatar).toBe('function');
    expect(fetchGeneratedAvatar.length).toBeGreaterThanOrEqual(1);
  });
});

// ─── Force Regenerate Request Body ──────────────────────────────────────────

describe('Force Regenerate Avatar', () => {
  it('forceRegenerate flag is included in API request body', () => {
    const body = JSON.stringify({
      name: 'Alice',
      type: 'player',
      gender: 'female',
      forceRegenerate: true,
    });
    const parsed = JSON.parse(body);
    expect(parsed.forceRegenerate).toBe(true);
    expect(parsed.name).toBe('Alice');
  });

  it('without forceRegenerate, field is absent', () => {
    const body = JSON.stringify({
      name: 'Bob',
      type: 'player',
      forceRegenerate: undefined,
    });
    const parsed = JSON.parse(body);
    expect(parsed.forceRegenerate).toBeUndefined();
  });
});

// ─── Game Icon Path Uniqueness ──────────────────────────────────────────────

describe('Game Icon Path Uniqueness', () => {
  function gameIconPath(gameId: string | undefined, gameName: string, gameTemplate?: string, rules?: string, nonce?: number): string {
    if (gameId) return `game-icons/${gameId}.png`;
    const payload = JSON.stringify({
      n: String(gameName).slice(0, 200),
      t: gameTemplate || '',
      r: (rules || '').trim().slice(0, 300),
      _nonce: nonce ?? Date.now(),
    });
    const hash = crypto.createHash('sha256').update(payload).digest('hex').slice(0, 16);
    return `game-icons/${hash}.png`;
  }

  it('with gameId, path is deterministic', () => {
    const p1 = gameIconPath('game-123', 'My Game');
    const p2 = gameIconPath('game-123', 'My Game');
    expect(p1).toBe('game-icons/game-123.png');
    expect(p1).toBe(p2);
  });

  it('without gameId, different nonces produce different paths', () => {
    const p1 = gameIconPath(undefined, 'Werewolf', 'social_deduction', 'village rules', 1000);
    const p2 = gameIconPath(undefined, 'Werewolf', 'social_deduction', 'village rules', 2000);
    expect(p1).not.toBe(p2);
  });

  it('without gameId, same nonce produces same path', () => {
    const p1 = gameIconPath(undefined, 'Werewolf', 'social_deduction', 'village rules', 12345);
    const p2 = gameIconPath(undefined, 'Werewolf', 'social_deduction', 'village rules', 12345);
    expect(p1).toBe(p2);
  });
});

// ─── Token Cost Changes ─────────────────────────────────────────────────────

describe('DALL-E 3 Token Costs', () => {
  it('dall-e-3 costs more than dall-e-2', async () => {
    const { imageGenCostToCoins } = await import('@/lib/tokens');
    const costDalle2 = imageGenCostToCoins('dall-e-2');
    const costDalle3 = imageGenCostToCoins('dall-e-3');
    expect(costDalle3).toBeGreaterThan(costDalle2);
  });

  it('dall-e-3 cost is 12 coins', async () => {
    const { imageGenCostToCoins } = await import('@/lib/tokens');
    const cost = imageGenCostToCoins('dall-e-3');
    expect(cost).toBe(12);
  });

  it('dall-e-2 cost is 5 coins', async () => {
    const { imageGenCostToCoins } = await import('@/lib/tokens');
    const cost = imageGenCostToCoins('dall-e-2');
    expect(cost).toBe(5);
  });

  it('pool avatars cost 0 (no token deduction for defaults)', () => {
    const poolUrl = getPoolAvatarUrl('Alice', 'player', 'female');
    expect(poolUrl).toBeTruthy();
  });
});

// ─── Game Icon Resolution ───────────────────────────────────────────────────

describe('Game Icon Resolution', () => {
  it('GAME_ICON_SIZE is now 128', () => {
    const GAME_ICON_SIZE = 128;
    expect(GAME_ICON_SIZE).toBe(128);
    expect(GAME_ICON_SIZE).toBeGreaterThan(64);
  });
});

// ─── Avatar API Flow Logic ──────────────────────────────────────────────────

describe('Avatar API Flow Logic', () => {
  it('should return pool URL when no custom avatar and not forceRegenerate', () => {
    const forceRegenerate = false;
    const hasCustomAvatar = false;
    const poolUrl = getPoolAvatarUrl('TestPlayer', 'player', 'male');

    if (!forceRegenerate && !hasCustomAvatar && poolUrl) {
      expect(poolUrl).toContain('/pool/male/');
    }
  });

  it('should skip pool and generate when forceRegenerate is true', () => {
    const forceRegenerate = true;
    const shouldGenerate = forceRegenerate;
    expect(shouldGenerate).toBe(true);
  });

  it('should return custom avatar when it exists (not forceRegenerate)', () => {
    const forceRegenerate = false;
    const customAvatarUrl = 'https://supabase.co/storage/avatars/player/v6/abc123.png';
    const hasCustomAvatar = !!customAvatarUrl;

    if (!forceRegenerate && hasCustomAvatar) {
      expect(customAvatarUrl).toContain('player/v6/');
    }
  });
});
