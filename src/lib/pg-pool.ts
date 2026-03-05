import { Pool } from 'pg';

/**
 * Shared pg connection pool.
 *
 * SSL notes:
 * - pg v8.17.2 treats sslmode=require in the connection string as verify-full,
 *   but the Supabase pooler's certificate chain contains intermediate certs
 *   not trusted by Node.js built-in CAs, causing SELF_SIGNED_CERT_IN_CHAIN errors.
 * - Solution: strip sslmode from the connection string and control SSL via
 *   the explicit ssl option. Using rejectUnauthorized: false (connection is
 *   still TLS-encrypted, just skips certificate chain verification).
 *   This is the Supabase-recommended approach for Node.js connections.
 */
function buildConnectionString(raw: string): string {
  // Strip sslmode parameter from the URL; SSL is fully controlled by the ssl option
  return raw
    .replace(/([?&])sslmode=[^&]*/g, '$1')
    .replace(/[?&]$/, '')
    .replace(/\?&/, '?');
}

const rawUrl = process.env.DATABASE_URL;
const connectionString = rawUrl ? buildConnectionString(rawUrl) : undefined;

export const pool = new Pool({
  connectionString,
  ssl: connectionString ? { rejectUnauthorized: false } : undefined,
  max: 3,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
});

// Prevent unhandled 'error' events from crashing the serverless function.
// Without this listener, idle-client errors cause Node.js to throw an uncaught
// exception which Vercel/AWS Lambda handles as a 503.
pool.on('error', (err) => {
  console.error('[pg-pool] Idle client error (non-fatal):', err.message);
});
