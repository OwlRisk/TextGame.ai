/**
 * Deployment environment check: whether the database is configured and available.
 * Used by APIs to return an actionable 503 hint before falling through to 500.
 */

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL || process.env.DIRECT_URL);
}

/** Determine if the error originates from a database connection/query failure (including missing table, migration not run, SSL, permissions, etc.) */
export function isDatabaseError(e: unknown): boolean {
  if (!e || typeof e !== 'object') return false;
  const msg = (e as Error).message?.toLowerCase() ?? '';
  const code = (e as { code?: string }).code ?? '';
  return (
    code === 'ECONNREFUSED' ||
    code === 'ENOTFOUND' ||
    code === 'ETIMEDOUT' ||
    code === '28P01' || // invalid password
    code === '3D000' || // database does not exist
    code === '42P01' || // undefined_table
    code === '57P03' || // cannot connect now
    msg.includes('connect') ||
    msg.includes('connection') ||
    msg.includes('connection string') ||
    msg.includes('database') ||
    msg.includes('pool') ||
    msg.includes('relation') ||
    msg.includes('does not exist') ||
    msg.includes('user_profiles') ||
    msg.includes('token_transactions') ||
    msg.includes('ssl') ||
    msg.includes('certificate') ||
    msg.includes('tls') ||
    msg.includes('timeout') ||
    msg.includes('too many clients') ||
    msg.includes('permission denied') ||
    msg.includes('row-level security')
  );
}
