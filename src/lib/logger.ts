/**
 * Thin logger that suppresses debug/info output in production.
 * Use these instead of raw console.* in application code.
 */

const isDev = process.env.NODE_ENV !== 'production';

export const logger = {
  /** Development-only debug output */
  debug(...args: unknown[]) {
    if (isDev) console.debug(...args);
  },
  /** General info — suppressed in production */
  log(...args: unknown[]) {
    if (isDev) console.log(...args);
  },
  /** Always shown (warnings) */
  warn(...args: unknown[]) {
    console.warn(...args);
  },
  /** Always shown (errors) */
  error(...args: unknown[]) {
    console.error(...args);
  },
};
