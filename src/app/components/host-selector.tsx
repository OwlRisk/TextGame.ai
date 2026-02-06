import { HOST_PERSONALITIES, isHostRecommendedForTemplate, type HostPersonality } from "@/app/config/host-config";
import { Check, Star, Sparkles, Loader2, Trash2 } from "lucide-react";
import { GeneratedAvatar } from "@/app/components/generated-avatar";
import { Badge } from "@/app/components/ui/badge";
import { useState, useEffect } from "react";

// LocalStorage key for persisting generated hosts
const GENERATED_HOSTS_KEY = "gamemaster_generated_hosts";

interface HostSelectorProps {
  selectedHostId: string | null;
  onSelectHost: (hostId: string) => void;
  /** Compact layout for narrow panels (e.g. Game Preview sidebar) */
  compact?: boolean;
  /** Template ID to show recommended hosts */
  templateId?: string | null;
  /** Game rules for AI host generation */
  gameRules?: string;
  /** Game name for AI host generation */
  gameName?: string;
  /** Callback when AI host is generated */
  onHostGenerated?: (host: HostPersonality) => void;
}

// Load generated hosts from localStorage
function loadGeneratedHosts(): HostPersonality[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(GENERATED_HOSTS_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to load generated hosts:", error);
    return [];
  }
}

// Save generated hosts to localStorage
function saveGeneratedHosts(hosts: HostPersonality[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GENERATED_HOSTS_KEY, JSON.stringify(hosts));
  } catch (error) {
    console.error("Failed to save generated hosts:", error);
  }
}

export function HostSelector({ selectedHostId, onSelectHost, compact, templateId, gameRules, gameName, onHostGenerated }: HostSelectorProps) {
  const [generatedHosts, setGeneratedHosts] = useState<HostPersonality[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Load persisted generated hosts on mount
  useEffect(() => {
    const loaded = loadGeneratedHosts();
    if (loaded.length > 0) {
      setGeneratedHosts(loaded);
    }
  }, []);

  // Delete a generated host
  const handleDeleteHost = (hostId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selecting the host when clicking delete
    setGeneratedHosts(prev => {
      const updated = prev.filter(h => h.id !== hostId);
      saveGeneratedHosts(updated);
      return updated;
    });
    // If the deleted host was selected, clear selection
    if (selectedHostId === hostId) {
      onSelectHost("");
    }
  };

  const handleGenerateHost = async () => {
    if (isGenerating) return;
    if (!gameRules) {
      alert('Please fill in the game rules first.');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-host', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameRules,
          gameName: gameName || "Custom Game"
        })
      });

      if (response.ok) {
        const host = await response.json();
        const newHost: HostPersonality = {
          id: `generated-${Date.now()}`,
          name: host.name,
          icon: host.icon,
          color: host.color,
          personality: host.personality,
          voiceStyle: host.voiceStyle,
          systemPrompt: host.systemPrompt,
          isGenerated: true,
          ...(host.gender && { gender: host.gender as 'male' | 'female' | 'other' }),
          ...(host.ttsVoice && { ttsVoice: host.ttsVoice }),
        };
        setGeneratedHosts(prev => {
          const updated = [...prev, newHost];
          saveGeneratedHosts(updated); // Persist to localStorage
          return updated;
        });
        onSelectHost(newHost.id);
        if (onHostGenerated) {
          onHostGenerated(newHost);
        }
      } else {
        alert('Generation failed. Please try again.');
      }
    } catch (error) {
      console.error('Error generating host:', error);
      alert('Generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Sort hosts: generated + recommended first, then others
  const allHosts = [...generatedHosts, ...HOST_PERSONALITIES];
  const sortedHosts = [...allHosts].sort((a, b) => {
    if (a.isGenerated && !b.isGenerated) return -1;
    if (!a.isGenerated && b.isGenerated) return 1;
    const aRecommended = templateId ? isHostRecommendedForTemplate(a.id, templateId) : false;
    const bRecommended = templateId ? isHostRecommendedForTemplate(b.id, templateId) : false;
    if (aRecommended && !bRecommended) return -1;
    if (!aRecommended && bRecommended) return 1;
    return 0;
  });
  if (compact) {
    return (
      <div className="space-y-2">
        <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2">Select Host</div>
        
        {/* AI Generate Button - Compact */}
        {gameRules && (
          <button
            onClick={handleGenerateHost}
            disabled={isGenerating}
            className="flex items-center justify-center gap-2 w-full p-3 rounded-xl border-2 border-dashed border-purple-500/40 bg-purple-500/10 hover:border-purple-500/60 hover:bg-purple-500/15 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-3"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                <span className="text-sm font-medium text-purple-300">AI generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-purple-400" />
                <span className="text-sm font-medium text-purple-300">🎲 Random AI Host</span>
              </>
            )}
          </button>
        )}

        <div className="grid grid-cols-1 gap-2">
          {sortedHosts.map((host) => {
            const isRecommended = !host.isGenerated && templateId ? isHostRecommendedForTemplate(host.id, templateId) : false;
            return (
              <button
                key={host.id}
                onClick={() => onSelectHost(host.id)}
                className={`group flex items-center gap-3 w-full text-left p-3 rounded-xl border-2 transition-all ${
                  selectedHostId === host.id
                    ? "border-indigo-500 bg-indigo-500/10"
                    : host.isGenerated
                    ? "border-purple-500/30 bg-purple-500/5 hover:border-purple-500/50 hover:bg-purple-500/10"
                    : isRecommended
                    ? "border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50 hover:bg-amber-500/10"
                    : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                }`}
              >
                <GeneratedAvatar
                  name={host.name}
                  type="host"
                  gender={host.gender}
                  background={host.description || host.personality}
                  enabled={true}
                  className="h-9 w-9"
                  fallbackColor={host.color + "30"}
                  fallback={<span className="text-base">{host.icon}</span>}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold text-white">{host.name}</div>
                    {host.isGenerated && (
                      <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-[10px] px-1.5 py-0 h-4 flex items-center gap-0.5">
                        <Sparkles className="h-2.5 w-2.5" />
                        AI
                      </Badge>
                    )}
                    {isRecommended && (
                      <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px] px-1.5 py-0 h-4 flex items-center gap-0.5">
                        <Star className="h-2.5 w-2.5 fill-amber-300" />
                        Recommended
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-zinc-400 truncate">{host.tagline || host.personality}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {host.isGenerated && (
                    <button
                      onClick={(e) => handleDeleteHost(host.id, e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded"
                      title="Remove this Host"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-400" />
                    </button>
                  )}
                  {selectedHostId === host.id && (
                    <Check className="h-4 w-4 text-indigo-400" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-white mb-2">Choose Your Host</h3>
        <p className="text-sm text-zinc-400">
          Each host has a unique personality that will shape your game experience
        </p>
      </div>

      {/* AI Generate Button - Full Size */}
      {gameRules && (
        <button
          onClick={handleGenerateHost}
          disabled={isGenerating}
          className="w-full p-4 rounded-xl border-2 border-dashed border-purple-500/40 bg-purple-500/10 hover:border-purple-500/60 hover:bg-purple-500/15 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-4"
        >
          {isGenerating ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
              <span className="text-base font-medium text-purple-300">AI is generating a personalized Host...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-400" />
              <span className="text-base font-medium text-purple-300">🎲 Random AI Host</span>
            </div>
          )}
        </button>
      )}

      <div className="grid grid-cols-2 gap-4">
        {sortedHosts.map((host) => {
          const isRecommended = !host.isGenerated && templateId ? isHostRecommendedForTemplate(host.id, templateId) : false;
          return (
            <button
              key={host.id}
              onClick={() => onSelectHost(host.id)}
              className={`group relative text-left p-5 rounded-xl border-2 transition-all ${
                selectedHostId === host.id
                  ? "border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/20"
                  : host.isGenerated
                  ? "border-purple-500/40 bg-purple-500/10 hover:border-purple-500/60 hover:bg-purple-500/15 shadow-lg shadow-purple-500/10"
                  : isRecommended
                  ? "border-amber-500/40 bg-amber-500/10 hover:border-amber-500/60 hover:bg-amber-500/15 shadow-lg shadow-amber-500/10"
                  : "border-zinc-700 bg-zinc-800 hover:border-zinc-600 hover:bg-zinc-750"
              }`}
            >
              {selectedHostId === host.id && (
                <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center">
                  <Check className="h-4 w-4 text-white" />
                </div>
              )}
              {host.isGenerated && selectedHostId !== host.id && (
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-purple-500/20 border border-purple-500/30">
                  <Sparkles className="h-3 w-3 text-purple-300" />
                  <span className="text-[10px] font-semibold text-purple-300">AI Generated</span>
                </div>
              )}
              {isRecommended && !host.isGenerated && selectedHostId !== host.id && (
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 border border-amber-500/30">
                  <Star className="h-3 w-3 text-amber-300 fill-amber-300" />
                  <span className="text-[10px] font-semibold text-amber-300">Recommended</span>
                </div>
              )}

            <div className="flex items-start gap-4 mb-3">
              <GeneratedAvatar
                name={host.name}
                type="host"
                gender={host.gender}
                background={host.description || host.personality}
                enabled={true}
                className="h-14 w-14 flex-shrink-0"
                fallbackColor={host.color + "20"}
                fallback={<span className="text-2xl">{host.icon}</span>}
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-lg font-semibold text-white mb-0.5">{host.name}</h4>
                <p className="text-xs font-medium text-zinc-400">{host.tagline || host.personality?.slice(0, 40)}</p>
              </div>
            </div>

            <p className="text-sm text-zinc-300 mb-3 leading-relaxed">
              {host.description || host.personality}
            </p>

            <div className="mb-3">
              <span className="text-xs font-semibold text-zinc-400 uppercase">Voice Style:</span>
              <p className="text-sm text-zinc-300 mt-0.5">{host.voiceStyle}</p>
            </div>

            {(host.suitableFor ?? []).length > 0 && (
              <div>
                <span className="text-xs font-semibold text-zinc-400 uppercase">Best For:</span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {host.suitableFor!.map((game) => (
                    <span
                      key={game}
                      className="text-xs px-2 py-0.5 rounded-full bg-zinc-700 text-zinc-300"
                    >
                      {game}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Delete button for generated hosts */}
            {host.isGenerated && (
              <button
                onClick={(e) => handleDeleteHost(host.id, e)}
                className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg border border-red-500/30"
                title="Remove this Host"
              >
                <Trash2 className="h-4 w-4 text-red-400" />
              </button>
            )}
          </button>
          );
        })}
      </div>
    </div>
  );
}
