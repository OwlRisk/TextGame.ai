"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Loader2, Volume2, Square, Search, X } from "lucide-react";
import { cn } from "@/app/components/ui/utils";

interface PoolCharacter {
  id: string;
  name: string;
  gender: string;
  personality: string | null;
  background: string | null;
  avatar_url: string | null;
  voice_id: string;
  voice_sample_url: string | null;
}

interface CharacterBrowserProps {
  open: boolean;
  onClose: () => void;
  onSelectCharacter: (character: {
    name: string;
    gender: string;
    personality: string;
    background: string;
    voice_sample_url?: string | null;
    avatar_url?: string | null;
  }) => void;
  gameId?: string;
}

export function CharacterBrowser({
  open,
  onClose,
  onSelectCharacter,
}: CharacterBrowserProps) {
  const [characters, setCharacters] = useState<PoolCharacter[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchPool = useCallback(async () => {
    setLoading(true);
    try {
      const style =
        typeof window !== "undefined"
          ? localStorage.getItem("avatar_style_pack") ?? "semi-realistic"
          : "semi-realistic";
      const res = await fetch(
        `/api/characters/pool?count=200&sort=name&style=${encodeURIComponent(style)}`
      );
      if (res.ok) {
        const data = await res.json();
        setCharacters(data.characters ?? []);
      }
    } catch (e) {
      console.warn("[character-browser] fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchPool();
      setSearch("");
      setSelectedId(null);
    }
  }, [open, fetchPool]);

  const filtered = search.trim()
    ? characters.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.personality?.toLowerCase().includes(search.toLowerCase()) ||
          c.gender.toLowerCase().includes(search.toLowerCase())
      )
    : characters;

  const selected = selectedId
    ? characters.find((c) => c.id === selectedId)
    : null;

  const handleAdd = useCallback(
    (char: PoolCharacter) => {
      onSelectCharacter({
        name: char.name,
        gender: char.gender,
        personality: char.personality || "",
        background: char.background || "",
        voice_sample_url: char.voice_sample_url,
        avatar_url: char.avatar_url,
      });
      onClose();
    },
    [onSelectCharacter, onClose]
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl bg-zinc-900 border-zinc-700 text-white p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="text-lg font-semibold">
            Add AI Character
          </DialogTitle>
          <p className="text-xs text-zinc-500 mt-0.5">
            {characters.length} characters available
          </p>
        </DialogHeader>

        {/* Search */}
        <div className="px-5 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by name, personality, gender..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 pl-9 pr-8 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/50"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Character grid + detail panel */}
        <div className="flex min-h-0" style={{ height: "min(480px, 60vh)" }}>
          {/* Grid */}
          <ScrollArea className="flex-1 px-5 pb-4">
            {loading ? (
              <div className="flex items-center justify-center py-20 text-zinc-500">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Loading…
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                <p className="text-sm">No characters found</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
                {filtered.map((char) => (
                  <CharacterTile
                    key={char.id}
                    char={char}
                    isSelected={selectedId === char.id}
                    onSelect={() =>
                      setSelectedId(
                        selectedId === char.id ? null : char.id
                      )
                    }
                    onAdd={() => handleAdd(char)}
                  />
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Detail panel */}
          {selected && (
            <div className="w-56 border-l border-zinc-800 bg-zinc-900/80 flex flex-col shrink-0">
              <div className="p-4 flex flex-col items-center">
                <div className="h-24 w-24 rounded-full overflow-hidden ring-2 ring-violet-500/40 mb-3">
                  {selected.avatar_url ? (
                    <img
                      src={selected.avatar_url}
                      alt={selected.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-zinc-800 flex items-center justify-center text-2xl font-bold text-zinc-500">
                      {selected.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-white text-center">
                  {selected.name}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 capitalize mt-1">
                  {selected.gender}
                </span>
              </div>

              <div className="px-4 flex-1 overflow-y-auto space-y-3 text-xs">
                {selected.personality && (
                  <div>
                    <p className="text-zinc-500 font-medium mb-0.5">
                      Personality
                    </p>
                    <p className="text-zinc-300 leading-relaxed">
                      {selected.personality}
                    </p>
                  </div>
                )}
                {selected.background && (
                  <div>
                    <p className="text-zinc-500 font-medium mb-0.5">
                      Background
                    </p>
                    <p className="text-zinc-300 leading-relaxed">
                      {selected.background}
                    </p>
                  </div>
                )}
              </div>

              <div className="p-4 space-y-2">
                <VoicePreviewButton char={selected} />
                <button
                  onClick={() => handleAdd(selected)}
                  className="w-full py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
                >
                  Add to Game
                </button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CharacterTile({
  char,
  isSelected,
  onSelect,
  onAdd,
}: {
  char: PoolCharacter;
  isSelected: boolean;
  onSelect: () => void;
  onAdd: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      onDoubleClick={onAdd}
      className={cn(
        "group relative flex flex-col items-center p-2 rounded-xl cursor-pointer transition-all",
        isSelected
          ? "bg-violet-600/20 ring-1 ring-violet-500/60"
          : "hover:bg-zinc-800/80"
      )}
    >
      <div
        className={cn(
          "h-14 w-14 rounded-full overflow-hidden ring-1 transition-all",
          isSelected ? "ring-violet-400" : "ring-zinc-700 group-hover:ring-zinc-500"
        )}
      >
        {char.avatar_url ? (
          <img
            src={char.avatar_url}
            alt={char.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full bg-zinc-800 flex items-center justify-center text-lg font-bold text-zinc-500">
            {char.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <p className="text-[11px] text-zinc-300 mt-1.5 text-center truncate w-full leading-tight">
        {char.name.split(" ")[0]}
      </p>
      <p className="text-[9px] text-zinc-500 truncate w-full text-center capitalize">
        {char.gender}
      </p>
    </div>
  );
}

function VoicePreviewButton({ char }: { char: PoolCharacter }) {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggle = useCallback(async () => {
    if (playing && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setPlaying(false);
      return;
    }

    if (!char.voice_sample_url) return;
    setLoading(true);
    try {
      const audio = new Audio(char.voice_sample_url);
      audioRef.current = audio;
      setPlaying(true);
      audio.onended = () => {
        audioRef.current = null;
        setPlaying(false);
      };
      audio.onerror = () => {
        audioRef.current = null;
        setPlaying(false);
      };
      await audio.play();
    } catch {
      setPlaying(false);
    } finally {
      setLoading(false);
    }
  }, [char.voice_sample_url, playing]);

  if (!char.voice_sample_url) return null;

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={cn(
        "w-full py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2",
        playing
          ? "bg-red-600/20 text-red-400 hover:bg-red-600/30"
          : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
      )}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : playing ? (
        <>
          <Square className="h-3.5 w-3.5 fill-current" />
          Stop
        </>
      ) : (
        <>
          <Volume2 className="h-3.5 w-3.5" />
          Preview Voice
        </>
      )}
    </button>
  );
}
