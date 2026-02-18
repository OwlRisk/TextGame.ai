"use client";

import { useEffect } from "react";

/**
 * 开发环境下屏蔽 [Fast Refresh] rebuilding / done 等 HMR 日志，避免控制台刷屏。
 * 仅在 process.env.NODE_ENV === 'development' 时生效。
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
