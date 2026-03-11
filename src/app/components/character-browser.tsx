"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Plus, Sparkles, Trash2, User, Loader2, Volume2, Square } from "lucide-react";
import { useAuth } from "@/app/contexts/AuthContext";
import { cn } from "@/app/components/ui/utils";
import { pickVoiceForSpeaker } from "@/lib/inworld-voices";

export interface AiCharacter {
  id: string;
  name: string;
  gender: string;
  personality: string | null;
  background: string | null;
  avatar_color: string;
  source_game_id: string | null;
  created_at: string;
  voice_sample_url?: string | null;
}

interface CharacterBrowserProps {
  open: boolean;
  onClose: () => void;
  onSelectCharacter: (character: { name: string; gender: string; personality: string; background: string; voice_sample_url?: string | null }) => void;
  gameId?: string;
}

export function CharacterBrowser({ open, onClose, onSelectCharacter, gameId }: CharacterBrowserProps) {
  const { session } = useAuth();
  const [tab, setTab] = useState<string>("my");
  const [characters, setCharacters] = useState<AiCharacter[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<Array<{ name: string; gender: string; personality: string; background: string }>>([]);
  const [theme, setTheme] = useState("");

  const fetchCharacters = useCallback(async () => {
    if (!session?.access_token) return;
    setLoading(true);
    try {
      const res = await fetch("/api/characters", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        // Deduplicate by name (keep the most recent — API returns newest first)
        const seen = new Set<string>();
        const unique = (data.characters || []).filter((c: AiCharacter) => {
          const key = c.name.toLowerCase().trim();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setCharacters(unique);
      }
    } catch (e) {
      console.warn("[character-browser] fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    if (open) {
      fetchCharacters();
      setGenerated([]);
    }
  }, [open, fetchCharacters]);

  const handleGenerate = useCallback(async () => {
    if (!session?.access_token || generating) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/characters/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ count: 4, theme: theme || undefined }),
      });
      if (res.ok) {
        const data = await res.json();
        setGenerated(data.characters || []);
      }
    } catch (e) {
      console.warn("[character-browser] generate error:", e);
    } finally {
      setGenerating(false);
    }
  }, [session?.access_token, generating, theme]);

  const handleSelectAndClose = useCallback(
    (char: { name: string; gender: string; personality: string; background: string; voice_sample_url?: string | null }) => {
      onSelectCharacter(char);
      onClose();
    },
    [onSelectCharacter, onClose]
  );

  const handleSaveToCollection = useCallback(
    async (char: { name: string; gender: string; personality: string; background: string }) => {
      if (!session?.access_token) return;
      try {
        const res = await fetch("/api/characters", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            name: char.name,
            gender: char.gender,
            personality: char.personality,
            background: char.background,
            source_game_id: gameId || null,
          }),
        });
        if (res.ok) {
          fetchCharacters();
        }
      } catch (e) {
        console.warn("[character-browser] save error:", e);
      }
    },
    [session?.access_token, gameId, fetchCharacters]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (!session?.access_token) return;
      try {
        await fetch(`/api/characters/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        setCharacters((prev) => prev.filter((c) => c.id !== id));
      } catch (e) {
        console.warn("[character-browser] delete error:", e);
      }
    },
    [session?.access_token]
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg bg-zinc-900 border-zinc-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Add AI Character</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="mt-2">
          <TabsList className="w-full bg-zinc-800/60">
            <TabsTrigger value="my" className="flex-1 text-sm">My Characters</TabsTrigger>
            <TabsTrigger value="generate" className="flex-1 text-sm">Generate New</TabsTrigger>
          </TabsList>

          <TabsContent value="my" className="mt-3">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-zinc-500">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Loading…
              </div>
            ) : characters.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-500">
                <User className="h-10 w-10 mb-3 text-zinc-600" />
                <p className="text-sm font-medium">No saved characters yet</p>
                <p className="text-xs mt-1">Generate new characters or save them from games</p>
              </div>
            ) : (
              <ScrollArea className="max-h-[320px]">
                <div className="space-y-2 pr-2">
                  {characters.map((char) => (
                    <CharacterCard
                      key={char.id}
                      name={char.name}
                      gender={char.gender}
                      personality={char.personality || ""}
                      background={char.background || ""}
                      voiceSampleUrl={char.voice_sample_url}
                      onSelect={() =>
                        handleSelectAndClose({
                          name: char.name,
                          gender: char.gender,
                          personality: char.personality || "",
                          background: char.background || "",
                          voice_sample_url: char.voice_sample_url,
                        })
                      }
                      onDelete={() => handleDelete(char.id)}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="generate" className="mt-3 space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Theme (optional): fantasy, sci-fi, mystery…"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="flex-1 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              />
              <Button
                onClick={handleGenerate}
                disabled={generating}
                className="bg-violet-600 hover:bg-violet-500 text-white"
              >
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              </Button>
            </div>

            {generating && (
              <div className="flex items-center justify-center py-10 text-zinc-500">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Generating characters…
              </div>
            )}

            {!generating && generated.length > 0 && (
              <ScrollArea className="max-h-[280px]">
                <div className="space-y-2 pr-2">
                  {generated.map((char, i) => (
                    <CharacterCard
                      key={`gen-${i}`}
                      name={char.name}
                      gender={char.gender}
                      personality={char.personality}
                      background={char.background}
                      onSelect={() => handleSelectAndClose(char)}
                      onSave={() => handleSaveToCollection(char)}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}

            {!generating && generated.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center text-zinc-500">
                <Sparkles className="h-10 w-10 mb-3 text-zinc-600" />
                <p className="text-sm font-medium">Generate AI characters</p>
                <p className="text-xs mt-1">Enter a theme and click generate, or just click to get random characters</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function CharacterCard({
  name,
  gender,
  personality,
  background,
  voiceSampleUrl,
  onSelect,
  onDelete,
  onSave,
}: {
  name: string;
  gender: string;
  personality: string;
  background: string;
  voiceSampleUrl?: string | null;
  onSelect: () => void;
  onDelete?: () => void;
  onSave?: () => void;
}) {
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [voicePlaying, setVoicePlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleVoicePreview = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (voicePlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setVoicePlaying(false);
      return;
    }

    setVoiceLoading(true);
    try {
      // Fast path: play pre-generated sample from CDN
      if (voiceSampleUrl) {
        const audio = new Audio(voiceSampleUrl);
        audioRef.current = audio;
        setVoicePlaying(true);
        audio.onended = () => { audioRef.current = null; setVoicePlaying(false); };
        audio.onerror = () => { audioRef.current = null; setVoicePlaying(false); };
        await audio.play();
        return;
      }

      // Slow path: generate on the fly
      const voiceId = pickVoiceForSpeaker(gender, personality);
      const sampleText = `Hi, I'm ${name}. ${personality ? personality.split(",")[0] + "." : "Ready to play."}`;
      const modelId = (typeof window !== "undefined" ? localStorage.getItem("tts_model") : null) ?? "inworld-tts-1.5-max";

      const res = await fetch("/api/inworld-tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: sampleText, voiceId, modelId }),
      });
      if (!res.ok) return;

      const data = await res.json() as { audioBase64?: string };
      if (!data.audioBase64) return;

      const bytes = Uint8Array.from(atob(data.audioBase64), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: "audio/mpeg" });
      const blobUrl = URL.createObjectURL(blob);
      const audio = new Audio(blobUrl);
      audioRef.current = audio;
      setVoicePlaying(true);
      audio.onended = () => {
        URL.revokeObjectURL(blobUrl);
        audioRef.current = null;
        setVoicePlaying(false);
      };
      audio.onerror = () => {
        URL.revokeObjectURL(blobUrl);
        audioRef.current = null;
        setVoicePlaying(false);
      };
      await audio.play();
    } catch (e) {
      console.warn("[character-browser] voice preview error:", e);
    } finally {
      setVoiceLoading(false);
    }
  }, [gender, personality, name, voicePlaying, voiceSampleUrl]);

  return (
    <div className="group flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 hover:border-zinc-600 transition-colors">
      <div className="h-9 w-9 rounded-full bg-violet-900/40 flex items-center justify-center flex-shrink-0">
        <User className="h-4 w-4 text-violet-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-white truncate">{name}</span>
          <span className="text-[10px] px-1 py-0.5 rounded bg-zinc-800 text-zinc-500 capitalize">{gender}</span>
        </div>
        {personality && <p className="text-xs text-zinc-400 truncate mt-0.5">{personality}</p>}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* Voice preview */}
        <button
          onClick={handleVoicePreview}
          disabled={voiceLoading}
          className={cn(
            "p-1.5 rounded-md transition-colors",
            voicePlaying
              ? "text-violet-400 hover:text-red-400 hover:bg-zinc-700/50"
              : "text-zinc-500 hover:text-violet-400 hover:bg-zinc-700/50 opacity-0 group-hover:opacity-100"
          )}
          title={voicePlaying ? "Stop preview" : "Preview voice"}
        >
          {voiceLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : voicePlaying ? (
            <Square className="h-3.5 w-3.5 fill-current" />
          ) : (
            <Volume2 className="h-3.5 w-3.5" />
          )}
        </button>
        {onSave && (
          <button
            onClick={(e) => { e.stopPropagation(); onSave(); }}
            className="p-1.5 rounded-md hover:bg-zinc-700/50 text-zinc-500 hover:text-violet-400 transition-colors"
            title="Save to collection"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 rounded-md hover:bg-zinc-700/50 text-zinc-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={onSelect}
          className="text-xs text-violet-400 hover:text-violet-300 hover:bg-violet-900/30"
        >
          Add
        </Button>
      </div>
    </div>
  );
}
