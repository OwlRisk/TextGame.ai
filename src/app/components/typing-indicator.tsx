"use client";

import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
import { GeneratedAvatar, avatarCacheKey } from "@/app/components/generated-avatar";
import { getAvatarPropsForPlayer } from "@/lib/avatar-utils";
import type { Player } from "@/types/player";

export interface TypingUser {
  name: string;
  avatar: string;
}

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
  /** Messages currently streaming (used to filter out typers whose text is already visible) */
  streamingNames: Set<string>;
  players: Player[];
  gameId?: string;
  userId: string;
  humanPlayer?: Player | null;
  useGeneratedAvatarForUser: boolean;
  userAvatarName: string;
  avatarImageUrls?: Record<string, string>;
  onAvatarUrlLoaded?: (key: string, url: string) => void;
}

export function TypingIndicator({
  typingUsers, streamingNames, players, gameId, userId: _userId,
  humanPlayer, useGeneratedAvatarForUser, userAvatarName,
  avatarImageUrls = {}, onAvatarUrlLoaded,
}: TypingIndicatorProps) {
  const visible = typingUsers.filter(u => !streamingNames.has(u.name));
  if (visible.length === 0) return null;

  const displayLimit = Math.min(visible.length, 3);
  const shown = visible.slice(0, displayLimit);
  const extra = visible.length - displayLimit;

  return (
    <div className="flex items-center gap-3 mt-4">
      <div className="flex -space-x-2 flex-shrink-0">
        {shown.map((typingUser) => {
          if (typingUser.name === "You") {
            return useGeneratedAvatarForUser && humanPlayer ? (
              <GeneratedAvatar
                key="you"
                name={userAvatarName}
                type="player"
                gameId={gameId}
                enabled={true}
                initialUrl={avatarImageUrls[avatarCacheKey(userAvatarName, "player")]}
                onAvatarLoaded={onAvatarUrlLoaded}
                className="h-8 w-8 ring-2 ring-zinc-900"
                fallbackColor={typingUser.avatar || humanPlayer.avatar}
              />
            ) : (
              <Avatar key="you" className="h-8 w-8 ring-2 ring-zinc-900">
                <AvatarFallback
                  className="text-xs font-semibold text-white"
                  style={{ backgroundColor: typingUser.avatar }}
                >
                  {typingUser.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            );
          }
          const player = players.find(p => p.name === typingUser.name);
          const avatarColor = player?.avatar || typingUser.avatar;
          const avatarProps = getAvatarPropsForPlayer(player);
          return (
            <GeneratedAvatar
              key={typingUser.name}
              {...avatarProps}
              name={avatarProps.name || typingUser.name}
              gameId={gameId}
              enabled={true}
              initialUrl={avatarImageUrls[avatarCacheKey(avatarProps.name || typingUser.name, avatarProps.type, undefined, avatarProps.gender)]}
              onAvatarLoaded={onAvatarUrlLoaded}
              className="h-8 w-8 ring-2 ring-zinc-900"
              fallbackColor={avatarColor}
            />
          );
        })}
      </div>
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm text-zinc-400 truncate">
          {shown.map(u => u.name).join(", ")}{extra > 0 ? ` +${extra}` : ""}
        </span>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}
