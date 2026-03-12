"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Globe, Loader2, ArrowLeft, Play, Trash2, Clock, MapPin } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { Badge } from "@/app/components/ui/badge";
import { WORLD_THEMES } from "@/data/world-themes";
import { toast } from "sonner";
import Link from "next/link";

interface SavedWorld {
  id: string;
  name: string;
  theme: string;
  icon: string;
  color: string;
  party_state: {
    characters?: Array<{ name: string; level?: number; class?: string }>;
    currentRoomId?: string;
    visitedRoomIds?: string[];
    activeQuests?: Array<{ id: string; name: string }>;
    lastPlayedAt?: string;
  };
  rooms?: Array<{ id: string; name: string }>;
}

export default function WorldsPage() {
  const router = useRouter();
  const [creatingWorldId, setCreatingWorldId] = useState<string | null>(null);
  const [savedWorlds, setSavedWorlds] = useState<SavedWorld[]>([]);
  const [loadingWorlds, setLoadingWorlds] = useState(true);
  const [deletingWorldId, setDeletingWorldId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/worlds")
      .then((r) => r.ok ? r.json() : { worlds: [] })
      .then((data) => setSavedWorlds(data.worlds || []))
      .catch(() => {})
      .finally(() => setLoadingWorlds(false));
  }, []);

  const handleCreateWorld = useCallback(async (themeId: string) => {
    setCreatingWorldId(themeId);
    try {
      const res = await fetch("/api/worlds/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ themeId }),
      });
      if (!res.ok) throw new Error("Failed to create world");
      const data = await res.json();
      trackEvent("world_created", { theme: themeId });
      router.push(`/game/${data.startRoomId}`);
    } catch {
      toast.error("Failed to create world. Please try again.");
    } finally {
      setCreatingWorldId(null);
    }
  }, [router]);

  const handleResumeWorld = useCallback((world: SavedWorld) => {
    const roomId = world.party_state?.currentRoomId;
    if (roomId) {
      router.push(`/game/${roomId}`);
    } else if (world.rooms && world.rooms.length > 0) {
      router.push(`/game/${world.rooms[0].id}`);
    } else {
      router.push(`/world/${world.id}`);
    }
  }, [router]);

  const handleDeleteWorld = useCallback(async (worldId: string) => {
    if (!confirm("Delete this world? All progress will be lost.")) return;
    setDeletingWorldId(worldId);
    try {
      const res = await fetch(`/api/worlds/${worldId}`, { method: "DELETE" });
      if (res.ok) {
        setSavedWorlds((prev) => prev.filter((w) => w.id !== worldId));
        toast.success("World deleted");
      } else {
        toast.error("Failed to delete world");
      }
    } catch {
      toast.error("Failed to delete world");
    } finally {
      setDeletingWorldId(null);
    }
  }, []);

  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return "Never played";
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return `${Math.floor(days / 7)}w ago`;
  };

  return (
    <div className="flex-1 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Link href="/discover" className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Discover
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <Globe className="h-6 w-6 text-amber-400" />
          <h1 className="text-2xl font-black text-white">Open World RPG</h1>
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] px-2 py-0.5 font-bold">BETA</Badge>
        </div>
        <p className="text-sm text-zinc-400 mb-8">
          Explore multi-room worlds with AI companions. Each location is a living room with NPCs, quests, and encounters.
        </p>

        {/* Active Worlds Section */}
        {!loadingWorlds && savedWorlds.length > 0 && (
          <div className="mb-10">
            <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide mb-3">Your Adventures</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {savedWorlds.map((world) => {
                const theme = WORLD_THEMES.find((t) => t.id === world.theme);
                const totalRooms = theme?.rooms.length || 0;
                const visitedRooms = world.party_state?.visitedRoomIds?.length || 0;
                const progressPercent = totalRooms > 0 ? Math.round((visitedRooms / totalRooms) * 100) : 0;
                const characters = world.party_state?.characters || [];
                const activeQuests = world.party_state?.activeQuests || [];

                return (
                  <div
                    key={world.id}
                    className="group relative bg-zinc-900/60 border border-zinc-800 hover:border-amber-500/40 rounded-xl overflow-hidden transition-all duration-300"
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xl">{world.icon}</span>
                          <div className="min-w-0">
                            <h3 className="font-bold text-white text-sm truncate">{world.name}</h3>
                            <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                              <Clock className="h-3 w-3" />
                              <span>{formatTimeAgo(world.party_state?.lastPlayedAt)}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteWorld(world.id); }}
                          disabled={deletingWorldId === world.id}
                          className="text-zinc-600 hover:text-red-400 transition-colors p-1"
                        >
                          {deletingWorldId === world.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </button>
                      </div>

                      {/* Progress bar */}
                      <div className="mb-2">
                        <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-0.5">
                          <span><MapPin className="h-3 w-3 inline mr-0.5" />{visitedRooms}/{totalRooms} locations</span>
                          <span>{progressPercent}%</span>
                        </div>
                        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-amber-500 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                        </div>
                      </div>

                      {/* Party info */}
                      {characters.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {characters.slice(0, 4).map((c, i) => (
                            <span key={i} className="text-[9px] px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded">
                              {c.name} {c.level ? `Lv.${c.level}` : ""} {c.class || ""}
                            </span>
                          ))}
                        </div>
                      )}

                      {activeQuests.length > 0 && (
                        <div className="text-[10px] text-amber-400/80 mb-2 truncate">
                          📜 {activeQuests.length} active quest{activeQuests.length !== 1 ? "s" : ""}
                        </div>
                      )}

                      <button
                        onClick={() => handleResumeWorld(world)}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg hover:bg-amber-500/30 transition-colors text-xs font-medium"
                      >
                        <Play className="h-3 w-3" /> Continue Adventure
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {loadingWorlds && (
          <div className="flex items-center justify-center py-8 mb-8">
            <Loader2 className="h-5 w-5 text-zinc-500 animate-spin mr-2" />
            <span className="text-sm text-zinc-500">Loading your worlds...</span>
          </div>
        )}

        {/* Create New World */}
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide mb-3">
          {savedWorlds.length > 0 ? "Start a New World" : "Choose Your World"}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {WORLD_THEMES.map((theme) => (
            <button
              key={theme.id}
              disabled={creatingWorldId !== null}
              onClick={() => handleCreateWorld(theme.id)}
              className="group relative text-left bg-zinc-900/60 border border-zinc-800 hover:border-amber-500/40 rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] cursor-pointer"
            >
              <div className="relative h-36 overflow-hidden">
                <Image
                  src={theme.cover}
                  alt={theme.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4">
                  <h3 className="font-bold text-white text-lg drop-shadow-lg">{theme.name}</h3>
                  <span className="text-[11px] text-zinc-300/80">{theme.rooms.length} locations</span>
                </div>
              </div>
              <div className="p-4">
                <p className="text-xs text-zinc-400 line-clamp-2 mb-3">{theme.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {theme.partyRoles.map((role) => (
                    <span key={role} className="text-[10px] px-2 py-0.5 bg-violet-500/10 text-violet-300 border border-violet-500/20 rounded-full">{role}</span>
                  ))}
                </div>
              </div>
              {creatingWorldId === theme.id && (
                <div className="absolute inset-0 bg-zinc-900/80 rounded-xl flex items-center justify-center">
                  <Loader2 className="h-5 w-5 text-amber-400 animate-spin" />
                  <span className="text-sm text-amber-400 ml-2">Creating world...</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
