"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { useGameContext } from "@/app/contexts/GameContext";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Swords, Shield, Heart, Compass, ChevronRight, MapPin, Skull, ShoppingBag, HelpCircle, Crown, ArrowLeft, Map } from "lucide-react";
import { WorldMap } from "@/app/components/world-map";
import Link from "next/link";

interface WorldRoom {
  id: string;
  name: string;
  icon: string;
  color: string;
  room_type: string;
  room_description: string;
  room_connections: Array<{ roomId: string; name: string }> | null;
  is_active: boolean;
}

interface WorldData {
  id: string;
  name: string;
  theme: string;
  icon: string;
  color: string;
  config: Record<string, unknown>;
  party_state: {
    party?: Array<{ id: string; name: string; hp: number; maxHp: number; role?: string }>;
    currentRoomId?: string;
    visitedRoomIds?: string[];
    quests?: Array<{ id: string; name: string; status: string }>;
    gold?: number;
  };
  is_active: boolean;
}

const ROOM_TYPE_ICONS: Record<string, typeof Swords> = {
  hub: Shield,
  combat: Swords,
  quest: Compass,
  shop: ShoppingBag,
  boss: Skull,
  mystery: HelpCircle,
};

const ROOM_TYPE_COLORS: Record<string, string> = {
  hub: "text-green-400 bg-green-950/40 border-green-800/30",
  combat: "text-red-400 bg-red-950/40 border-red-800/30",
  quest: "text-blue-400 bg-blue-950/40 border-blue-800/30",
  shop: "text-amber-400 bg-amber-950/40 border-amber-800/30",
  boss: "text-purple-400 bg-purple-950/40 border-purple-800/30",
  mystery: "text-cyan-400 bg-cyan-950/40 border-cyan-800/30",
};

export default function WorldHubPage({ params }: { params: Promise<{ worldId: string }> }) {
  const { worldId } = use(params);
  const router = useRouter();
  const { session } = useAuth();
  const { addGame } = useGameContext();
  const [world, setWorld] = useState<WorldData | null>(null);
  const [rooms, setRooms] = useState<WorldRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [entering, setEntering] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/worlds/${worldId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) {
          setWorld(data.world);
          setRooms(data.rooms || []);
        }
      })
      .finally(() => setLoading(false));
  }, [worldId]);

  const currentRoomId = world?.party_state?.currentRoomId;
  const visitedRoomIds = new Set(world?.party_state?.visitedRoomIds || []);

  const handleEnterRoom = useCallback(async (roomId: string) => {
    setEntering(roomId);
    try {
      await fetch(`/api/worlds/${worldId}/navigate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetRoomId: roomId, partyState: world?.party_state }),
      });
      router.push(`/game/${roomId}`);
    } catch {
      setEntering(null);
    }
  }, [worldId, world?.party_state, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-zinc-950">
        <div className="animate-pulse text-zinc-400">Loading world...</div>
      </div>
    );
  }

  if (!world) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-zinc-950 gap-4">
        <p className="text-zinc-400">World not found</p>
        <Link href="/discover"><Button variant="outline">Back to Discover</Button></Link>
      </div>
    );
  }

  const party = world.party_state?.party || [];
  const quests = world.party_state?.quests || [];
  const activeQuests = quests.filter((q) => q.status === "active");

  return (
    <div className="h-full overflow-y-auto bg-zinc-950 text-white">
      {/* Header */}
      <div className={`bg-gradient-to-r ${world.color ? `from-[${world.color}]/20` : "from-amber-900/20"} to-zinc-950 border-b border-zinc-800`}>
        <div className="max-w-5xl mx-auto px-6 py-8">
          <Link href="/discover" className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-5xl">{world.icon}</span>
            <div>
              <h1 className="text-3xl font-bold">{world.name}</h1>
              <p className="text-zinc-400 mt-1">{(world.config as { setting?: string })?.setting?.slice(0, 120) || world.theme}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 pb-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main: Room Map */}
        <div className="lg:col-span-2">
          {/* World Map Visualization */}
          <div className="mb-8 bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Map className="h-4 w-4 text-amber-400" />
              World Map
            </h2>
            <WorldMap
              rooms={rooms.map((r) => ({
                id: r.id,
                name: r.name,
                icon: r.icon || "📍",
                roomType: r.room_type,
                connections: (r.room_connections || []).map((c) => c.roomId),
              }))}
              currentRoomId={currentRoomId || undefined}
              visitedRoomIds={visitedRoomIds}
              onRoomClick={handleEnterRoom}
            />
          </div>

          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-amber-400" />
            Locations
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {rooms.map((room) => {
              const isVisited = visitedRoomIds.has(room.id);
              const isCurrent = currentRoomId === room.id;
              const RoomIcon = ROOM_TYPE_ICONS[room.room_type] || Compass;
              const colorClass = ROOM_TYPE_COLORS[room.room_type] || ROOM_TYPE_COLORS.hub;

              return (
                <button
                  key={room.id}
                  onClick={() => handleEnterRoom(room.id)}
                  disabled={entering !== null}
                  className={`group relative p-4 rounded-xl border text-left transition-all duration-200 ${
                    isCurrent
                      ? "border-amber-500/50 bg-amber-950/20 ring-1 ring-amber-500/30"
                      : isVisited
                      ? "border-zinc-700/50 bg-zinc-900/50 hover:bg-zinc-800/50 hover:border-zinc-600"
                      : "border-zinc-800/50 bg-zinc-900/30 hover:bg-zinc-800/40 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">{room.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm truncate">{room.name}</span>
                        {isCurrent && (
                          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] px-1.5 py-0">
                            HERE
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 line-clamp-2">{room.room_description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${colorClass}`}>
                          <RoomIcon className="h-3 w-3" />
                          {room.room_type}
                        </span>
                        {isVisited && !isCurrent && (
                          <span className="text-[10px] text-zinc-500">Visited</span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400 transition-colors flex-shrink-0 mt-1" />
                  </div>
                  {entering === room.id && (
                    <div className="absolute inset-0 bg-zinc-900/80 rounded-xl flex items-center justify-center">
                      <span className="text-sm text-amber-400 animate-pulse">Entering...</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar: Party + Quests */}
        <div className="space-y-6">
          {/* Party */}
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-400" />
              Party
            </h3>
            {party.length === 0 ? (
              <p className="text-xs text-zinc-500">No party assembled yet. Enter a room to start.</p>
            ) : (
              <div className="space-y-2">
                {party.map((member) => (
                  <div key={member.id} className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-white truncate">{member.name}</span>
                        {member.role && (
                          <span className="text-[10px] text-violet-400">{member.role}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Heart className="h-3 w-3 text-red-400" />
                        <div className="flex-1 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              member.hp / member.maxHp > 0.5 ? "bg-green-500" :
                              member.hp / member.maxHp > 0.25 ? "bg-yellow-500" : "bg-red-500"
                            }`}
                            style={{ width: `${(member.hp / member.maxHp) * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-zinc-400 font-mono">{member.hp}/{member.maxHp}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Quests */}
          {activeQuests.length > 0 && (
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide mb-3">
                Active Quests
              </h3>
              <div className="space-y-2">
                {activeQuests.map((q) => (
                  <div key={q.id} className="text-xs p-2 rounded bg-emerald-950/30 border border-emerald-800/20">
                    <div className="font-medium text-emerald-300">{q.name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          {world.party_state?.gold !== undefined && (
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Gold</span>
                <span className="text-amber-400 font-bold">{world.party_state.gold}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-zinc-400">Rooms Explored</span>
                <span className="text-white font-bold">{visitedRoomIds.size} / {rooms.length}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
