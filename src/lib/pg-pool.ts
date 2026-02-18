import { Pool } from 'pg';

// 开发环境下允许自签名证书，避免连接 Supabase 时报 SELF_SIGNED_CERT_IN_CHAIN
if (process.env.NODE_ENV !== 'production' && process.env.DATABASE_URL) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

/**
 * 共享 pg 连接池。Supabase / 云数据库常用自签名或中间证书，需关闭 TLS 证书校验。
 * max: 避免 URL 里 connection_limit=1 导致请求串行排队，保证并发请求可复用多连接。
 */
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
});
