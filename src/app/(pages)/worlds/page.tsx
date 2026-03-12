"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Globe, Loader2, ArrowLeft } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { Badge } from "@/app/components/ui/badge";
import { WORLD_THEMES } from "@/data/world-themes";
import { toast } from "sonner";
import Link from "next/link";

export default function WorldsPage() {
  const router = useRouter();
  const [creatingWorldId, setCreatingWorldId] = useState<string | null>(null);

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
