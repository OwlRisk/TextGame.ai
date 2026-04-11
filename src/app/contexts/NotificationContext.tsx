"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";

const LS_KEY = "tg_notifications";
const MAX_NOTIFICATIONS = 20;

export interface AppNotification {
  id: string;
  type: "game_over" | "your_turn" | "system";
  message: string;
  timestamp: number;
  read: boolean;
  gameId?: string;
}

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (notif: Omit<AppNotification, "id" | "timestamp" | "read">) => void;
  markAllRead: () => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextValue>({
  notifications: [],
  unreadCount: 0,
  addNotification: () => {},
  markAllRead: () => {},
  clearAll: () => {},
});

export function useNotifications() {
  return useContext(NotificationContext);
}

function loadNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveNotifications(notifs: AppNotification[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(notifs.slice(0, MAX_NOTIFICATIONS))); } catch {}
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    setNotifications(loadNotifications());
  }, []);

  const addNotification = useCallback((notif: Omit<AppNotification, "id" | "timestamp" | "read">) => {
    setNotifications((prev) => {
      const next: AppNotification[] = [
        { ...notif, id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, timestamp: Date.now(), read: false },
        ...prev,
      ].slice(0, MAX_NOTIFICATIONS);
      saveNotifications(next);

      if (typeof window !== "undefined" && document.hidden && "Notification" in window && Notification.permission === "granted") {
        try { new Notification("TextGame.ai", { body: notif.message, icon: "/icon-192x192.png" }); } catch {}
      }

      return next;
    });
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }));
      saveNotifications(next);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    saveNotifications([]);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markAllRead, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
}
