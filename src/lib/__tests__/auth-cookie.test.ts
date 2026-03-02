import { describe, it, expect, beforeEach } from 'vitest';
import { setAuthCookie, AUTH_COOKIE_NAME } from '../auth-cookie';

/**
 * auth-cookie.ts uses document.cookie which is browser-only.
 * We simulate it here with a minimal cookie jar running in the vitest node environment.
 */

let cookieJar: string[] = [];

const mockDocument = {
  get cookie(): string {
    return cookieJar.join('; ');
  },
  set cookie(value: string) {
    cookieJar.push(value);
  },
};

beforeEach(() => {
  cookieJar = [];
  // Inject mock document into global scope for the module
  (globalThis as Record<string, unknown>).document = mockDocument;
});

// ─── AUTH_COOKIE_NAME ─────────────────────────────────────────────────────

describe('AUTH_COOKIE_NAME', () => {
  it('is the expected string', () => {
    expect(AUTH_COOKIE_NAME).toBe('sb-access-token');
  });
});

// ─── setAuthCookie ────────────────────────────────────────────────────────

describe('setAuthCookie', () => {
  it('writes the access token to document.cookie', () => {
    setAuthCookie('my-token-123');
    const written = cookieJar.join('\n');
    expect(written).toContain(AUTH_COOKIE_NAME);
    expect(written).toContain(encodeURIComponent('my-token-123'));
  });

  it('sets path=/ in the cookie string', () => {
    setAuthCookie('tok');
    expect(cookieJar.join('\n')).toContain('path=/');
  });

  it('sets max-age to 7 days (604800 seconds)', () => {
    setAuthCookie('tok');
    expect(cookieJar.join('\n')).toContain('max-age=604800');
  });

  it('sets SameSite=Lax', () => {
    setAuthCookie('tok');
    expect(cookieJar.join('\n')).toMatch(/SameSite=Lax/i);
  });

  it('clears the cookie when called with null', () => {
    setAuthCookie(null);
    const written = cookieJar.join('\n');
    expect(written).toContain(`${AUTH_COOKIE_NAME}=`);
    expect(written).toContain('max-age=0');
  });

  it('URL-encodes the token value', () => {
    const token = 'header.payload+special=chars/abc';
    setAuthCookie(token);
    expect(cookieJar.join('\n')).toContain(encodeURIComponent(token));
  });

  it('does nothing when document is not available (SSR guard)', () => {
    // Remove document from global
    const original = (globalThis as Record<string, unknown>).document;
    delete (globalThis as Record<string, unknown>).document;

    expect(() => setAuthCookie('tok')).not.toThrow();
    expect(cookieJar).toHaveLength(0);

    // Restore for other tests
    (globalThis as Record<string, unknown>).document = original;
  });
});
