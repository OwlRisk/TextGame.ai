"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Player } from "@/app/components/player-panel";
import { GeneratedAvatar } from "@/app/components/generated-avatar";
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
import { User, Sparkles, BookOpen } from "lucide-react";
import { getAvatarPropsForPlayer } from "@/lib/avatar-utils";

interface PlayerProfileDialogProps {
  player: Player | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gameId?: string;
}

export function PlayerProfileDialog({ player, open, onOpenChange, gameId }: PlayerProfileDialogProps) {
  if (!player) return null;

  const isUser = !player.isAI;

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
                YOU
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className="sr-only">
          {isUser ? "Your profile" : `${player.name}'s character profile and background`}
        </DialogDescription>

        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-4">
            {isUser ? (
              <Avatar className="h-16 w-16 rounded-xl ring-2 ring-zinc-600">
                <AvatarFallback className="text-white text-lg" style={{ backgroundColor: player.avatar }}>
                  {player.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ) : (
              <GeneratedAvatar
                {...getAvatarPropsForPlayer(player)}
                gameId={gameId}
                enabled={true}
                className="h-16 w-16 rounded-xl ring-2 ring-zinc-600"
                fallbackColor={player.avatar}
              />
            )}
            <div className="flex-1 min-w-0">
              {player.role && (
                <p className="text-sm font-medium text-zinc-300">{player.role}</p>
              )}
              {player.status && (
                <p className="text-xs text-emerald-400/90 mt-0.5">Status: {player.status}</p>
              )}
            </div>
          </div>

          {!isUser && (player.personality || player.background) && (
            <div className="space-y-3 border-t border-zinc-700/80 pt-4">
              {player.personality && (
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-violet-400 uppercase tracking-wider mb-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    Personality
                  </div>
                  <p className="text-sm text-zinc-200 leading-relaxed">{player.personality}</p>
                </div>
              )}
              {player.background && (
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-400/90 uppercase tracking-wider mb-1.5">
                    <BookOpen className="h-3.5 w-3.5" />
                    Background
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed">{player.background}</p>
                </div>
              )}
            </div>
          )}

          {isUser && (
            <p className="text-sm text-zinc-500 italic">Your profile is managed in settings.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
