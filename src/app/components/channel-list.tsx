import { Hash, Settings, Share2, Users, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Separator } from "@/app/components/ui/separator";

interface Channel {
  id: string;
  name: string;
  type: "text" | "game";
}

interface ChannelListProps {
  gameName: string;
  channels: Channel[];
  selectedChannelId: string | null;
  onSelectChannel: (channelId: string) => void;
  onShare: () => void;
  onSettings: () => void;
  onBackToArena?: () => void;
}

export function ChannelList({ 
  gameName, 
  channels, 
  selectedChannelId, 
  onSelectChannel,
  onShare,
  onSettings,
  onBackToArena
}: ChannelListProps) {
  return (
    <div className="w-64 bg-zinc-800 flex flex-col">
      {/* Game Header */}
      <div className="h-14 px-5 flex items-center justify-between border-b border-zinc-900/50 shadow-sm">
        <h2 className="font-semibold text-base text-white truncate">{gameName}</h2>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onShare}>
          <Share2 className="h-4 w-4 text-zinc-400 hover:text-white" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3">
          {/* Back to Arena Button */}
          {onBackToArena && (
            <div className="mb-4">
              <Button
                variant="ghost"
                className="w-full justify-start px-3 h-10 text-zinc-300 hover:bg-violet-600/20 hover:text-violet-300 border border-zinc-700/50 hover:border-violet-500/50 transition-all group rounded-lg"
                onClick={onBackToArena}
              >
                <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-0.5 transition-transform" />
                <span className="text-sm font-semibold">Back to Arena</span>
              </Button>
            </div>
          )}
          
          {/* Text Channels */}
          <div className="mb-5">
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Channels</span>
            </div>
            {channels.filter(c => c.type === "text").map((channel) => (
              <Button
                key={channel.id}
                variant="ghost"
                className={`w-full justify-start px-3 h-9 mb-1 rounded-lg ${
                  selectedChannelId === channel.id
                    ? "bg-zinc-700/50 text-white"
                    : "text-zinc-400 hover:bg-zinc-700/30 hover:text-zinc-300"
                }`}
                onClick={() => onSelectChannel(channel.id)}
              >
                <Hash className="h-4 w-4 mr-2" />
                <span className="text-sm">{channel.name}</span>
              </Button>
            ))}
          </div>

          <Separator className="my-3 bg-zinc-700/50" />

          {/* Game Rooms */}
          <div>
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Game Rooms</span>
            </div>
            {channels.filter(c => c.type === "game").map((channel) => (
              <Button
                key={channel.id}
                variant="ghost"
                className={`w-full justify-start px-3 h-9 mb-1 rounded-lg ${
                  selectedChannelId === channel.id
                    ? "bg-zinc-700/50 text-white"
                    : "text-zinc-400 hover:bg-zinc-700/30 hover:text-zinc-300"
                }`}
                onClick={() => onSelectChannel(channel.id)}
              >
                <Users className="h-4 w-4 mr-2" />
                <span className="text-sm">{channel.name}</span>
              </Button>
            ))}
          </div>
        </div>
      </ScrollArea>

      {/* User Section */}
      <div className="h-16 bg-zinc-900/50 px-3 flex items-center justify-between border-t border-zinc-900/50">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-white">YOU</span>
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white truncate">Player</div>
            <div className="text-xs text-zinc-400">#0001</div>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0" onClick={onSettings}>
          <Settings className="h-4 w-4 text-zinc-400" />
        </Button>
      </div>
    </div>
  );
}