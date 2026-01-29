"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { useGeneratedAvatar, type UseGeneratedAvatarOptions } from "@/lib/avatar";
import { GAME_MASTER_AVATAR } from "@/lib/game-master-avatar";
import { cn } from "@/app/components/ui/utils";

type AvatarDisplayType = 'gm' | 'host' | 'player';

interface GeneratedAvatarProps extends Omit<UseGeneratedAvatarOptions, 'type'> {
  name: string | null | undefined;
  /** gm = Game Master (rules design); host = Host (runs game, e.g. Echo/Nova); player = AI Player or User. See docs/ROLES.md. */
  type?: AvatarDisplayType;
  /** Game room ID for caching - same game room will reuse generated avatars */
  gameId?: string;
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
  className,
  fallbackColor,
  fallback,
}: GeneratedAvatarProps) {
  const isGM = type === "gm";
  const apiType = type === "host" ? "host" : "player";
  const { src, loading } = useGeneratedAvatar(name, {
    type: apiType,
    gameId,
    role,
    background,
    personality,
    gender,
    enabled: isGM ? false : enabled,
  });

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
  const showImage = src && !loading;
  const showFallback = !showImage;

  return (
    <Avatar className={cn("flex-shrink-0 overflow-hidden rounded-full", className)}>
      {showImage && <AvatarImage src={src} alt={name ?? "Avatar"} className="object-cover" />}
      {showFallback && (
        <AvatarFallback
          className={cn(
            "flex items-center justify-center text-sm font-semibold text-white",
            fallbackColor && "bg-transparent"
          )}
          style={fallbackColor ? { backgroundColor: fallbackColor } : undefined}
        >
          {loading ? (
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
