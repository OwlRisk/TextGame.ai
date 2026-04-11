"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import type { Player } from "@/types/player";
import { GeneratedAvatar, avatarCacheKey } from "@/app/components/generated-avatar";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { User, Sparkles, BookOpen } from "lucide-react";
import { getAvatarPropsForPlayer } from "@/lib/avatar-utils";
import { useAuth, getUserAvatarUrl } from "@/app/contexts/AuthContext";
import { t, getBrowserLanguage } from "@/lib/i18n";

interface PlayerProfileDialogProps {
  player: Player | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gameId?: string;
  /** Persisted avatar URLs so dialog shows the same avatar as the player list */
  avatarImageUrls?: Record<string, string>;
  onAvatarUrlLoaded?: (key: string, url: string) => void;
  /** When set, human player uses this name for avatar key (match PlayerPanel) */
  humanGameIdentity?: { name: string } | null;
  /** Whether the current user is the game master — GMs can see all roles */
  isUserGameMaster?: boolean;
}

export function PlayerProfileDialog({ player, open, onOpenChange, gameId, avatarImageUrls = {}, onAvatarUrlLoaded, humanGameIdentity, isUserGameMaster }: PlayerProfileDialogProps) {
  const lang = getBrowserLanguage();
  if (!player) return null;

  const isUser = !player.isAI;
  const useGameAvatarForHuman = isUser && !!gameId;
  const humanAvatarName = humanGameIdentity?.name?.trim() && humanGameIdentity.name !== "You" ? humanGameIdentity.name : "Player";
  const { user } = useAuth();
  const userAvatarUrl = getUserAvatarUrl(user);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="bg-zinc-900 border-zinc-700 text-white sm:max-w-md"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle className="text-white text-lg font-semibold flex items-center gap-2">
            <User className="h-5 w-5 text-zinc-400" />
            {player.name}
            {isUser && (
              <span className="text-xs font-normal text-blue-400 px-2 py-0.5 rounded bg-blue-500/20 border border-blue-500/30">
                {t("profile.you", lang)}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className="sr-only">
          {isUser ? t("profile.your_profile", lang) : `${player.name}`}
        </DialogDescription>

        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-4">
            {isUser && !useGameAvatarForHuman ? (
              <Avatar className="h-24 w-24 rounded-xl ring-2 ring-zinc-600">
                {userAvatarUrl ? <AvatarImage src={userAvatarUrl} alt={player.name} className="object-cover" /> : null}
                <AvatarFallback className="text-white text-lg" style={{ backgroundColor: player.avatar }}>
                  {player.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ) : isUser && useGameAvatarForHuman ? (
              <GeneratedAvatar
                name={humanAvatarName}
                type="player"
                gameId={gameId}
                enabled={true}
                initialUrl={avatarImageUrls[avatarCacheKey(humanAvatarName, "player")]}
                onAvatarLoaded={onAvatarUrlLoaded}
                className="h-24 w-24 rounded-xl ring-2 ring-zinc-600"
                fallbackColor={player.avatar}
              />
            ) : (
              (() => {
                const avatarProps = getAvatarPropsForPlayer(player);
                return (
                  <GeneratedAvatar
                    {...avatarProps}
                    gameId={gameId}
                    enabled={true}
                    initialUrl={avatarImageUrls[avatarCacheKey(avatarProps.name ?? player.name, avatarProps.type)]}
                    onAvatarLoaded={onAvatarUrlLoaded}
                    className="h-24 w-24 rounded-xl ring-2 ring-zinc-600"
                    fallbackColor={player.avatar}
                  />
                );
              })()
            )}
            <div className="flex-1 min-w-0">
              {player.role && (isUser || isUserGameMaster || player.roleRevealed) && (
                <p className="text-sm font-medium text-zinc-300">{player.role}</p>
              )}
            </div>
          </div>

          {!isUser && (player.personality || player.background) && (
            <div className="space-y-3 border-t border-zinc-700/80 pt-4">
              <p className="text-[11px] text-zinc-500 leading-snug">{t("profile.ai_content_note", lang)}</p>
              {player.personality && (
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-violet-400 tracking-wide mb-1.5">
                    <Sparkles className="h-3.5 w-3.5 shrink-0" />
                    {t("profile.personality", lang)}
                  </div>
                  <p className="text-sm text-zinc-200 leading-relaxed">{player.personality}</p>
                </div>
              )}
              {player.background && (
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-400/90 tracking-wide mb-1.5">
                    <BookOpen className="h-3.5 w-3.5 shrink-0" />
                    {t("profile.background", lang)}
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed">{player.background}</p>
                </div>
              )}
            </div>
          )}

          {isUser && (
            <p className="text-sm text-zinc-500 italic">{t("profile.managed_in_settings", lang)}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
