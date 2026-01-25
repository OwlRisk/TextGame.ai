import { HOST_PERSONALITIES, isHostRecommendedForTemplate } from "@/app/config/host-config";
import { Check, Star } from "lucide-react";
import { GeneratedAvatar } from "@/app/components/generated-avatar";
import { Badge } from "@/app/components/ui/badge";

interface HostSelectorProps {
  selectedHostId: string | null;
  onSelectHost: (hostId: string) => void;
  /** Compact layout for narrow panels (e.g. Game Preview sidebar) */
  compact?: boolean;
  /** Template ID to show recommended hosts */
  templateId?: string | null;
}

export function HostSelector({ selectedHostId, onSelectHost, compact, templateId }: HostSelectorProps) {
  // Sort hosts: recommended first, then others
  const sortedHosts = [...HOST_PERSONALITIES].sort((a, b) => {
    const aRecommended = templateId ? isHostRecommendedForTemplate(a.id, templateId) : false;
    const bRecommended = templateId ? isHostRecommendedForTemplate(b.id, templateId) : false;
    if (aRecommended && !bRecommended) return -1;
    if (!aRecommended && bRecommended) return 1;
    return 0; // Keep original order for same recommendation status
  });
  if (compact) {
    return (
      <div className="space-y-2">
        <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2">Select Host</div>
        <div className="grid grid-cols-1 gap-2">
          {sortedHosts.map((host) => {
            const isRecommended = templateId ? isHostRecommendedForTemplate(host.id, templateId) : false;
            return (
              <button
                key={host.id}
                onClick={() => onSelectHost(host.id)}
                className={`flex items-center gap-3 w-full text-left p-3 rounded-xl border-2 transition-all ${
                  selectedHostId === host.id
                    ? "border-indigo-500 bg-indigo-500/10"
                    : isRecommended
                    ? "border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50 hover:bg-amber-500/10"
                    : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                }`}
              >
                <GeneratedAvatar
                  name={host.name}
                  type="host"
                  background={host.description}
                  className="h-9 w-9"
                  fallbackColor={host.color + "30"}
                  fallback={<span className="text-base">{host.icon}</span>}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold text-white">{host.name}</div>
                    {isRecommended && (
                      <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px] px-1.5 py-0 h-4 flex items-center gap-0.5">
                        <Star className="h-2.5 w-2.5 fill-amber-300" />
                        Recommended
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-zinc-400 truncate">{host.tagline}</div>
                </div>
                {selectedHostId === host.id && (
                  <Check className="h-4 w-4 text-indigo-400 flex-shrink-0" />
                )}
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

      <div className="grid grid-cols-2 gap-4">
        {sortedHosts.map((host) => {
          const isRecommended = templateId ? isHostRecommendedForTemplate(host.id, templateId) : false;
          return (
            <button
              key={host.id}
              onClick={() => onSelectHost(host.id)}
              className={`relative text-left p-5 rounded-xl border-2 transition-all ${
                selectedHostId === host.id
                  ? "border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/20"
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
              {isRecommended && !selectedHostId && (
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 border border-amber-500/30">
                  <Star className="h-3 w-3 text-amber-300 fill-amber-300" />
                  <span className="text-[10px] font-semibold text-amber-300">Recommended</span>
                </div>
              )}

            <div className="flex items-start gap-4 mb-3">
              <GeneratedAvatar
                name={host.name}
                type="host"
                background={host.description}
                className="h-14 w-14 flex-shrink-0"
                fallbackColor={host.color + "20"}
                fallback={<span className="text-2xl">{host.icon}</span>}
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-lg font-semibold text-white mb-0.5">{host.name}</h4>
                <p className="text-xs font-medium text-zinc-400">{host.tagline}</p>
              </div>
            </div>

            <p className="text-sm text-zinc-300 mb-3 leading-relaxed">
              {host.description}
            </p>

            <div className="mb-3">
              <span className="text-xs font-semibold text-zinc-400 uppercase">Voice Style:</span>
              <p className="text-sm text-zinc-300 mt-0.5">{host.voiceStyle}</p>
            </div>

            <div>
              <span className="text-xs font-semibold text-zinc-400 uppercase">Best For:</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {host.suitableFor.map((game) => (
                  <span
                    key={game}
                    className="text-xs px-2 py-0.5 rounded-full bg-zinc-700 text-zinc-300"
                  >
                    {game}
                  </span>
                ))}
              </div>
            </div>
          </button>
          );
        })}
      </div>
    </div>
  );
}
