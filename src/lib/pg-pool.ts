import { Pool } from 'pg';

/**
 * 共享 pg 连接池。
 * TLS：仅在 .env 中显式设置 DATABASE_SSL_REJECT_UNAUTHORIZED=0 时关闭证书校验（用于自签名/开发）。
 * 生产环境请勿设置该变量，保持默认 true。
 * max: 避免 URL 里 connection_limit=1 导致请求串行排队，保证并发请求可复用多连接。
 */
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL
    ? { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== '0' }
    : undefined,
  max: 10,
  idleTimeoutMillis: 30000,
});
