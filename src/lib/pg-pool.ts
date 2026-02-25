import { Pool } from 'pg';

/**
 * 共享 pg 连接池。
 *
 * SSL 说明：
 * - pg v8.17.2 把连接串里的 sslmode=require 强制视为 verify-full，
 *   而 Supabase pooler 的证书链含有不被 Node.js 内置 CA 信任的中间证书，
 *   会导致 SELF_SIGNED_CERT_IN_CHAIN 错误。
 * - 解决方案：从连接串中剥离 sslmode 参数，改由显式 ssl 选项控制。
 *   使用 rejectUnauthorized: false（连接仍走 TLS 加密，只是不校验证书链）。
 *   这是 Supabase 官方推荐的 Node.js 连接方式。
 */
function buildConnectionString(raw: string): string {
  // 去掉 URL 里的 sslmode 参数，由 ssl 选项全权控制
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
