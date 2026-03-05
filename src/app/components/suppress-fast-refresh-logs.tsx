"use client";

import { useEffect } from "react";

/**
 * Suppress [Fast Refresh] rebuilding / done and other HMR logs in development to reduce console noise.
 * Only active when process.env.NODE_ENV === 'development'.
 */
export function SuppressFastRefreshLogs() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    const isHmrLog = (args: unknown[]): boolean => {
      const first = args[0];
      return (
        typeof first === "string" &&
        (first.startsWith("[Fast Refresh]") || first.startsWith("[HMR]"))
      );
    };

    const originalLog = console.log;
    console.log = function (...args: unknown[]) {
      if (isHmrLog(args)) return;
      originalLog.apply(console, args);
    };

    return () => {
      console.log = originalLog;
    };
  }, []);

  return null;
}
