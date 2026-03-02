import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { isDatabaseConfigured, isDatabaseError } from '../db-ready';

// ─── isDatabaseConfigured ─────────────────────────────────────────────────

describe('isDatabaseConfigured', () => {
  let origDatabaseUrl: string | undefined;
  let origDirectUrl: string | undefined;

  beforeEach(() => {
    origDatabaseUrl = process.env.DATABASE_URL;
    origDirectUrl = process.env.DIRECT_URL;
  });

  afterEach(() => {
    if (origDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = origDatabaseUrl;

    if (origDirectUrl === undefined) delete process.env.DIRECT_URL;
    else process.env.DIRECT_URL = origDirectUrl;
  });

  it('returns true when DATABASE_URL is set', () => {
    process.env.DATABASE_URL = 'postgres://user:pass@localhost/db';
    delete process.env.DIRECT_URL;
    expect(isDatabaseConfigured()).toBe(true);
  });

  it('returns true when DIRECT_URL is set', () => {
    delete process.env.DATABASE_URL;
    process.env.DIRECT_URL = 'postgres://user:pass@localhost/db';
    expect(isDatabaseConfigured()).toBe(true);
  });

  it('returns true when both are set', () => {
    process.env.DATABASE_URL = 'postgres://a';
    process.env.DIRECT_URL = 'postgres://b';
    expect(isDatabaseConfigured()).toBe(true);
  });

  it('returns false when neither is set', () => {
    delete process.env.DATABASE_URL;
    delete process.env.DIRECT_URL;
    expect(isDatabaseConfigured()).toBe(false);
  });

  it('returns false when both are empty strings', () => {
    process.env.DATABASE_URL = '';
    process.env.DIRECT_URL = '';
    expect(isDatabaseConfigured()).toBe(false);
  });
});

// ─── isDatabaseError ──────────────────────────────────────────────────────

describe('isDatabaseError – non-error inputs', () => {
  it('returns false for null', () => {
    expect(isDatabaseError(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isDatabaseError(undefined)).toBe(false);
  });

  it('returns false for a number', () => {
    expect(isDatabaseError(42)).toBe(false);
  });

  it('returns false for a plain string', () => {
    expect(isDatabaseError('some error')).toBe(false);
  });

  it('returns false for a generic Error without DB-related message', () => {
    expect(isDatabaseError(new Error('Something went wrong'))).toBe(false);
  });
});

describe('isDatabaseError – error codes', () => {
  it('ECONNREFUSED → true', () => {
    expect(isDatabaseError({ code: 'ECONNREFUSED', message: '' })).toBe(true);
  });

  it('ENOTFOUND → true', () => {
    expect(isDatabaseError({ code: 'ENOTFOUND', message: '' })).toBe(true);
  });

  it('ETIMEDOUT → true', () => {
    expect(isDatabaseError({ code: 'ETIMEDOUT', message: '' })).toBe(true);
  });

  it('28P01 (invalid password) → true', () => {
    expect(isDatabaseError({ code: '28P01', message: '' })).toBe(true);
  });

  it('3D000 (database does not exist) → true', () => {
    expect(isDatabaseError({ code: '3D000', message: '' })).toBe(true);
  });

  it('42P01 (undefined table) → true', () => {
    expect(isDatabaseError({ code: '42P01', message: '' })).toBe(true);
  });

  it('57P03 (cannot connect now) → true', () => {
    expect(isDatabaseError({ code: '57P03', message: '' })).toBe(true);
  });

  it('unrelated code → false', () => {
    expect(isDatabaseError({ code: '00000', message: '' })).toBe(false);
  });
});

describe('isDatabaseError – error messages', () => {
  const dbMessages = [
    'connect ECONNREFUSED',
    'connection refused',
    'connection string is invalid',
    'database "mydb" does not exist',
    'pool is full',
    'relation "user_profiles" does not exist',
    'relation "token_transactions" does not exist',
    'SSL SYSCALL error',
    'certificate verify failed',
    'TLS handshake failed',
    'timeout exceeded',
    'too many clients',
    'permission denied for table',
    'new row violates row-level security',
  ];

  for (const msg of dbMessages) {
    it(`"${msg.slice(0, 40)}" → true`, () => {
      expect(isDatabaseError(new Error(msg))).toBe(true);
    });
  }

  it('generic app error message → false', () => {
    expect(isDatabaseError(new Error('Invalid input data'))).toBe(false);
    expect(isDatabaseError(new Error('Not authorized'))).toBe(false);
    expect(isDatabaseError(new Error('File not found'))).toBe(false);
  });
});
