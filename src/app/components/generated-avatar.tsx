"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { useGeneratedAvatar, type UseGeneratedAvatarOptions } from "@/lib/avatar";
import { GAME_MASTER_AVATAR } from "@/lib/game-master-avatar";
import { cn } from "@/app/components/ui/utils";

type AvatarDisplayType = 'gm' | 'host' | 'player';

interface GeneratedAvatarProps extends UseGeneratedAvatarOptions {
  name: string | null | undefined;
  /** "gm" = fixed Game Master avatar; "host" = generated per-host (Echo, Nova, etc.); "player" = generated per player */
  type?: AvatarDisplayType;
  className?: string;
  fallbackColor?: string;
  fallback?: React.ReactNode;
}

export function GeneratedAvatar({
  name,
  type = "player",
  role,
  background,
  personality,
  enabled = true,
  className,
  fallbackColor,
  fallback,
}: GeneratedAvatarProps) {
  // GM: fixed anime avatar (Game Master role)
  if (type === "gm") {
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

  // Host & player: generated from background (API uses type 'host' | 'player')
  const apiType = type === "host" ? "host" : "player";
  const { src, loading } = useGeneratedAvatar(name, {
    type: apiType,
    role,
    background,
    personality,
    enabled,
  });
  const initials = name ? name.substring(0, 2).toUpperCase() : "??";

  return (
    <Avatar className={cn("flex-shrink-0 overflow-hidden rounded-full", className)}>
      {src && !loading && <AvatarImage src={src} alt={name ?? "Avatar"} className="object-cover" />}
      <AvatarFallback
        className={cn(
          "flex items-center justify-center text-sm font-semibold text-white",
          fallbackColor && !src && "bg-transparent"
        )}
        style={fallbackColor && !src ? { backgroundColor: fallbackColor } : undefined}
      >
        {fallback ?? initials}
      </AvatarFallback>
    </Avatar>
  );
}
