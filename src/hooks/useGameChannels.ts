import { useMemo, useState, useEffect } from "react";
import { t, getBrowserLanguage } from "@/lib/i18n";

interface ChannelConfig {
  id: string;
  name: string;
}

interface Section {
  id: string;
  name: string;
  content: string;
}

interface GameRoomEntry {
  id: string;
  name: string;
  type: "game" | "text";
}

interface UseGameChannelsParams<
  M extends { id: string; channelId?: string; senderId: string },
  P extends { id: string; isGameMaster?: boolean },
> {
  channelConfigs: ChannelConfig[] | undefined;
  sections: Section[];
  channelPermissions: Record<string, string[]>;
  userId: string;
  messages: M[];
  selectedChannelId: string | null;
  players: P[];
  /** Current PHASE label — scene name after "—" overrides the default channel display name. */
  phaseLabel?: string;
}

/**
 * Extract a scene/location name from a PHASE label like "Combat — The Goblin Den".
 * Returns the part after "—" / "–" / "-" if present, otherwise null.
 */
function extractSceneName(phaseLabel: string | undefined): string | null {
  if (!phaseLabel) return null;
  const sep = phaseLabel.match(/\s[—–-]\s/);
  if (!sep) return null;
  const after = phaseLabel.slice(sep.index! + sep[0].length).trim();
  return after.length > 0 ? after : null;
}

export function useGameChannels<
  M extends { id: string; channelId?: string; senderId: string },
  P extends { id: string; isGameMaster?: boolean },
>({
  channelConfigs,
  sections,
  channelPermissions,
  userId,
  messages,
  selectedChannelId,
  players,
  phaseLabel,
}: UseGameChannelsParams<M, P>) {
  const channelsCacheKey = channelConfigs?.map((c) => c.id).join(",") ?? "";
  const sceneName = extractSceneName(phaseLabel);
  const gameRoomEntries: GameRoomEntry[] = useMemo(() => {
    const entries = channelConfigs?.length
      ? channelConfigs.map((c) => ({ id: c.id, name: c.name, type: "game" as const }))
      : [{ id: "game-room", name: t("channel.default_room", getBrowserLanguage()), type: "game" as const }];
    if (sceneName && entries.length > 0) {
      entries[0] = { ...entries[0], name: sceneName };
    }
    return entries;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelsCacheKey, sceneName]);

  const defaultGameChannelId = gameRoomEntries[0].id;

  const visibleGameRoomEntries = useMemo(
    () =>
      gameRoomEntries.filter((ch) => {
        const perms = channelPermissions[ch.id];
        if (!perms) return true;
        if (perms.includes("*")) return true;
        return perms.includes(userId);
      }),
    [gameRoomEntries, channelPermissions, userId],
  );

  const gameChannels: GameRoomEntry[] = useMemo(
    () => [
      ...sections.map((s) => ({ id: s.id, name: s.name, type: "text" as const })),
      ...visibleGameRoomEntries,
    ],
    [sections, visibleGameRoomEntries],
  );

  const gameRoomIds = useMemo(
    () => new Set(gameRoomEntries.map((c) => c.id)),
    [gameRoomEntries],
  );

  const isGameChannel = useMemo(
    () => selectedChannelId != null && gameRoomIds.has(selectedChannelId),
    [selectedChannelId, gameRoomIds],
  );

  const messagesForChannel = useMemo(
    () =>
      isGameChannel
        ? messages.filter(
            (m) => (m.channelId ?? defaultGameChannelId) === selectedChannelId,
          )
        : messages,
    [isGameChannel, messages, selectedChannelId, defaultGameChannelId],
  );

  const [seenMessageCounts, setSeenMessageCounts] = useState<
    Record<string, number>
  >({});
  useEffect(() => {
    if (!selectedChannelId) return;
    const currentCount = messages.filter(
      (m) => (m.channelId ?? defaultGameChannelId) === selectedChannelId,
    ).length;
    setSeenMessageCounts((prev) => ({
      ...prev,
      [selectedChannelId]: currentCount,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChannelId]);

  const unreadCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const channelId of gameRoomIds) {
      if (channelId === selectedChannelId) continue;
      const total = messages.filter(
        (m) => (m.channelId ?? defaultGameChannelId) === channelId,
      ).length;
      const seen = seenMessageCounts[channelId] ?? 0;
      const delta = total - seen;
      if (delta > 0) counts[channelId] = delta;
    }
    return counts;
  }, [
    messages,
    seenMessageCounts,
    gameRoomIds,
    defaultGameChannelId,
    selectedChannelId,
  ]);

  const playersForChannel = useMemo(() => {
    const perms = selectedChannelId
      ? channelPermissions[selectedChannelId]
      : undefined;
    if (!perms || perms.includes("*")) return players;
    return players.filter((p) => p.isGameMaster || perms.includes(p.id));
  }, [players, selectedChannelId, channelPermissions]);

  return {
    gameRoomEntries,
    defaultGameChannelId,
    visibleGameRoomEntries,
    gameChannels,
    gameRoomIds,
    isGameChannel,
    messagesForChannel,
    unreadCounts,
    playersForChannel,
  };
}
