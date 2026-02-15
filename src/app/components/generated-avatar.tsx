"use client";

import { useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { useGeneratedAvatar, type UseGeneratedAvatarOptions } from "@/lib/avatar";
import { GAME_MASTER_AVATAR } from "@/lib/game-master-avatar";
import { cn } from "@/app/components/ui/utils";

type AvatarDisplayType = 'gm' | 'host' | 'player';

/** Key format for persisted avatar URLs (must match lib/avatar identityCacheKey). */
export function avatarCacheKey(name: string, type: 'host' | 'player'): string {
  return `${name}|${type}`;
}

interface GeneratedAvatarProps extends Omit<UseGeneratedAvatarOptions, 'type'> {
  name: string | null | undefined;
  /** gm = Game Master (rules design); host = Host (runs game, e.g. Echo/Nova); player = AI Player or User. See docs/ROLES.md. */
  type?: AvatarDisplayType;
  /** Game room ID for caching - same game room will reuse generated avatars */
  gameId?: string;
  /** If set, use this URL and skip API (e.g. from persisted game room state for cross-device). Supports http(s) or data: URLs. */
  initialUrl?: string | null;
  /** When a new avatar URL is loaded (http or data:), call this so the room can persist it. */
  onAvatarLoaded?: (key: string, url: string) => void;
  className?: string;
  fallbackColor?: string;
  fallback?: React.ReactNode;
}

export function GeneratedAvatar({
  name,
  type = "player",
  gameId,
  role,
  background,
  personality,
  gender,
  enabled = true,
  initialUrl,
  onAvatarLoaded,
  className,
  fallbackColor,
  fallback,
}: GeneratedAvatarProps) {
  const isGM = type === "gm";
  const apiType = type === "host" ? "host" : "player";
  const hasInitialUrl = Boolean(initialUrl && (initialUrl.startsWith("http") || initialUrl.startsWith("data:")));
  const { src, loading } = useGeneratedAvatar(name, {
    type: apiType,
    gameId,
    role,
    background,
    personality,
    gender,
    enabled: isGM ? false : !hasInitialUrl && enabled,
  });

  // Use persisted URL when available (e.g. loaded from another device)
  const displaySrc = hasInitialUrl ? initialUrl : src;
  const displayLoading = hasInitialUrl ? false : loading;

  // Persist URL when we get a result from the API (http or data:) so it syncs across components and re-login
  const key = name && apiType ? avatarCacheKey(name, apiType) : "";
  useEffect(() => {
    if (key && onAvatarLoaded && src && (src.startsWith("http") || src.startsWith("data:"))) {
      onAvatarLoaded(key, src);
    }
  }, [key, onAvatarLoaded, src]);

  if (isGM) {
    return (
      <Avatar className={cn("flex-shrink-0 overflow-hidden rounded-full", className)}>
        <AvatarImage src={GAME_MASTER_AVATAR} alt="Game Master" className="object-cover" />
        <AvatarFallback
          className={cn("flex items-center justify-center text-sm font-semibold text-white", fallbackColor && "bg-transparent")}
          style={fallbackColor ? { backgroundColor: fallbackColor } : undefined}
        >
          {fallback ?? "GM"}
        </AvatarFallback>
      </Avatar>
    );
  }

  const initials = name ? name.substring(0, 2).toUpperCase() : "??";
  const showImage = displaySrc && !displayLoading;
  const showFallback = !showImage;
  const isHost = type === "host";

  return (
    <Avatar
      className={cn(
        "flex-shrink-0 overflow-hidden rounded-full",
        isHost && "ring-2 ring-amber-500/50 ring-offset-2 ring-offset-zinc-800",
        className
      )}
    >
      {showImage && <AvatarImage src={displaySrc!} alt={name ?? "Avatar"} className="object-cover" />}
      {showFallback && (
        <AvatarFallback
          className={cn(
            "flex items-center justify-center text-sm font-semibold text-white",
            displayLoading && "bg-zinc-700 animate-pulse",
            fallbackColor && !displayLoading && "bg-transparent"
          )}
          style={!displayLoading && fallbackColor ? { backgroundColor: fallbackColor } : undefined}
        >
          {displayLoading ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          ) : (
            (fallback ?? initials)
          )}
        </AvatarFallback>
      )}
    </Avatar>
  );
}
