/**
 * 部署环境检查：数据库是否已配置且可用。
 * 用于 API 在返回 500 前给出可操作的 503 提示。
 */

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL || process.env.DIRECT_URL);
}

/** 判断错误是否来自数据库连接/查询失败 */
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
    msg.includes('connect') ||
    msg.includes('connection') ||
    msg.includes('database') ||
    msg.includes('pool')
  );
}
