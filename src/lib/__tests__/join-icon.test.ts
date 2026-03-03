import { describe, it, expect } from 'vitest';

// ─── Icon rendering logic from /join/[inviteCode]/page.tsx ───────────────────
// The join page needs to decide whether a game icon is an image URL/data-URI
// (render as <img>) or an emoji/text (render as text inside a <span>).

/** Mirrors the condition used in the join page JSX */
function isImageIcon(icon: string | null | undefined): boolean {
  if (!icon) return false;
  return (
    icon.startsWith('data:') ||
    icon.startsWith('http://') ||
    icon.startsWith('https://') ||
    icon.startsWith('/')
  );
}

function resolveIconFallback(icon: string | null | undefined): string {
  return icon ?? '🎮';
}

// ── isImageIcon ───────────────────────────────────────────────────────────────

describe('isImageIcon – data URIs', () => {
  it('recognises PNG data URI', () => {
    expect(isImageIcon('data:image/png;base64,iVBORw0KGgoA...')).toBe(true);
  });

  it('recognises JPEG data URI', () => {
    expect(isImageIcon('data:image/jpeg;base64,/9j/4AAQSkZJ...')).toBe(true);
  });

  it('recognises WebP data URI', () => {
    expect(isImageIcon('data:image/webp;base64,UklGRl...')).toBe(true);
  });

  it('recognises SVG data URI', () => {
    expect(isImageIcon('data:image/svg+xml;base64,...')).toBe(true);
  });
});

describe('isImageIcon – remote URLs', () => {
  it('recognises https:// URL', () => {
    expect(isImageIcon('https://example.com/icon.png')).toBe(true);
  });

  it('recognises http:// URL', () => {
    expect(isImageIcon('http://example.com/icon.png')).toBe(true);
  });

  it('recognises absolute path starting with /', () => {
    expect(isImageIcon('/images/game-icon.png')).toBe(true);
  });

  it('recognises deeply nested absolute path', () => {
    expect(isImageIcon('/assets/icons/rpg/wizard.webp')).toBe(true);
  });

  it('recognises Supabase storage URL', () => {
    expect(isImageIcon('https://xyz.supabase.co/storage/v1/object/public/avatars/icon.png')).toBe(true);
  });
});

describe('isImageIcon – emoji and text (should render as text)', () => {
  it('treats single emoji as text', () => {
    expect(isImageIcon('🎮')).toBe(false);
  });

  it('treats multi-char emoji as text', () => {
    expect(isImageIcon('🐺🔪')).toBe(false);
  });

  it('treats short text label as text', () => {
    expect(isImageIcon('RPG')).toBe(false);
  });

  it('treats plain word as text', () => {
    expect(isImageIcon('game')).toBe(false);
  });

  it('treats partial URL without protocol as text', () => {
    // No leading slash or protocol → ambiguous, treat as text
    expect(isImageIcon('example.com/icon.png')).toBe(false);
  });
});

describe('isImageIcon – null/undefined/empty', () => {
  it('returns false for null', () => {
    expect(isImageIcon(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isImageIcon(undefined)).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isImageIcon('')).toBe(false);
  });
});

// ── Fallback logic ────────────────────────────────────────────────────────────

describe('icon fallback', () => {
  it('returns the icon when provided', () => {
    expect(resolveIconFallback('🗡️')).toBe('🗡️');
  });

  it('falls back to 🎮 when icon is null', () => {
    expect(resolveIconFallback(null)).toBe('🎮');
  });

  it('falls back to 🎮 when icon is undefined', () => {
    expect(resolveIconFallback(undefined)).toBe('🎮');
  });

  it('returns the icon even if it is a data URI (no fallback override)', () => {
    const dataUri = 'data:image/png;base64,abc';
    expect(resolveIconFallback(dataUri)).toBe(dataUri);
  });
});

// ── Combined rendering decision ───────────────────────────────────────────────

type RenderMode = 'image' | 'emoji';

function resolveIconRenderMode(icon: string | null | undefined): {
  mode: RenderMode;
  value: string;
} {
  const resolved = resolveIconFallback(icon);
  return {
    mode: isImageIcon(resolved) ? 'image' : 'emoji',
    value: resolved,
  };
}

describe('combined icon render mode', () => {
  it('renders data URI as image', () => {
    const { mode } = resolveIconRenderMode('data:image/png;base64,abc');
    expect(mode).toBe('image');
  });

  it('renders https URL as image', () => {
    const { mode } = resolveIconRenderMode('https://cdn.example.com/icon.png');
    expect(mode).toBe('image');
  });

  it('renders emoji as emoji', () => {
    const { mode, value } = resolveIconRenderMode('🎲');
    expect(mode).toBe('emoji');
    expect(value).toBe('🎲');
  });

  it('renders null with fallback emoji', () => {
    const { mode, value } = resolveIconRenderMode(null);
    expect(mode).toBe('emoji');
    expect(value).toBe('🎮');
  });

  it('renders undefined with fallback emoji', () => {
    const { mode, value } = resolveIconRenderMode(undefined);
    expect(mode).toBe('emoji');
    expect(value).toBe('🎮');
  });

  it('preserves image URL as the value when rendering as image', () => {
    const url = 'https://cdn.example.com/game.jpg';
    const { mode, value } = resolveIconRenderMode(url);
    expect(mode).toBe('image');
    expect(value).toBe(url);
  });
});
