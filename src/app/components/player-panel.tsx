import { Crown, Volume2, VolumeX, User, Package } from "lucide-react";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Button } from "@/app/components/ui/button";
import { Separator } from "@/app/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { PlayerBoardData } from "@/app/components/player-board";
import { Badge } from "@/app/components/ui/badge";
import { GeneratedAvatar } from "@/app/components/generated-avatar";
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
import { getAvatarPropsForPlayer } from "@/lib/avatar-utils";

export interface Player {
  id: string;
  name: string;
  avatar: string;
  role?: string;
  status?: string;
  stats?: Record<string, string | number>;
  isMuted?: boolean;
  isGameMaster?: boolean;
  isAI: boolean;
  isOnline?: boolean;
  /** AI-only: short personality tag (e.g. "Skeptical and analytical") */
  personality?: string;
  /** AI-only: backstory / context (e.g. "Former debate champion") */
  background?: string;
  /** Player gender (male, female, other) - can be configured by GM */
  gender?: string;
  /** OpenAI TTS voice id for this player (e.g. alloy, nova) */
  ttsVoice?: string;
}

interface PlayerPanelProps {
  players: Player[];
  currentSpeakerId?: string | null;
  isUserGameMaster?: boolean;
  gameId?: string;
  onToggleMute?: (playerId: string) => void;
  onSelectSpeaker?: (playerId: string) => void;
}

export function PlayerPanel({ 
  players, 
  currentSpeakerId,
  isUserGameMaster,
  gameId,
  onToggleMute,
  onSelectSpeaker 
}: PlayerPanelProps) {
  return (
    <div className="w-60 bg-zinc-850 flex flex-col border-l border-zinc-900/50">
      <div className="h-12 px-4 flex items-center border-b border-zinc-900/50 bg-zinc-900/30">
        <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide">Players — {players.length}</h3>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {/* Game Master Section */}
          {players.filter(p => p.isGameMaster).map((player) => (
            <div key={player.id}>
              <div className="text-xs font-semibold text-zinc-400 uppercase mb-2 flex items-center gap-2">
                <Crown className="h-3 w-3 text-amber-400" />
                <span>{player.name}</span>
                <span className="px-2 py-0.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 rounded text-[10px] font-bold tracking-wider border border-amber-500/30 shadow-sm">
                  HOST
                </span>
              </div>
              <PlayerCard
                player={player}
                isSpeaking={currentSpeakerId === player.id}
                isUserGameMaster={isUserGameMaster}
                gameId={gameId}
                onToggleMute={onToggleMute}
                onSelectSpeaker={onSelectSpeaker}
              />
              <Separator className="mt-3 bg-zinc-700/50" />
            </div>
          ))}

          {/* Regular Players */}
          <div>
            <div className="text-xs font-semibold text-zinc-400 uppercase mb-2 tracking-wide">Players</div>
            <div className="space-y-1.5">
              {players.filter(p => !p.isGameMaster).map((player) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  isSpeaking={currentSpeakerId === player.id}
                  isUserGameMaster={isUserGameMaster}
                  gameId={gameId}
                  onToggleMute={onToggleMute}
                  onSelectSpeaker={onSelectSpeaker}
                />
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

function PlayerCard({ 
  player, 
  isSpeaking,
  isUserGameMaster,
  gameId,
  onToggleMute,
  onSelectSpeaker 
}: { 
  player: Player;
  isSpeaking: boolean;
  isUserGameMaster?: boolean;
  gameId?: string;
  onToggleMute?: (playerId: string) => void;
  onSelectSpeaker?: (playerId: string) => void;
}) {
  return (
    <div className={`group p-2 rounded-lg transition-all duration-200 ${
      isSpeaking 
        ? "bg-green-600/20 ring-1 ring-green-600/50 shadow-sm" 
        : "hover:bg-zinc-700/40 hover:shadow-sm"
    }`}>
      <div className="flex items-start gap-2.5">
        <div className="relative flex-shrink-0">
          {!player.isAI ? (
            <Avatar
              className={`h-9 w-9 shadow-md transition-transform duration-200 ${
                isSpeaking ? "ring-2 ring-green-500/50 scale-105" : "group-hover:scale-105"
              }`}
            >
              <AvatarFallback
                className="text-sm font-semibold text-white"
                style={{ backgroundColor: player.avatar }}
              >
                {player.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ) : (
            <GeneratedAvatar
              {...getAvatarPropsForPlayer(player)}
              gameId={gameId}
              enabled={true}
              className={`h-9 w-9 shadow-md transition-transform duration-200 ${
                isSpeaking ? "ring-2 ring-green-500/50 scale-105" : "group-hover:scale-105"
              }`}
              fallbackColor={player.avatar}
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-sm font-semibold text-white truncate">{player.name}</span>
            {!player.isAI && (
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-[10px] px-1.5 py-0 h-4 font-bold tracking-wide shadow-sm">
                YOU
              </Badge>
            )}
          </div>
          {player.role && (
            <div className="text-xs text-zinc-300 font-medium">{player.role}</div>
          )}
          {player.status && (
            <div className="text-xs text-emerald-400 mt-0.5 font-medium">Status: {player.status}</div>
          )}
        </div>
        {isUserGameMaster && !player.isGameMaster && (
          <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:bg-zinc-600/50"
              onClick={() => onToggleMute?.(player.id)}
            >
              {player.isMuted ? (
                <VolumeX className="h-3 w-3 text-red-400" />
              ) : (
                <Volume2 className="h-3 w-3 text-zinc-400 hover:text-white" />
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}