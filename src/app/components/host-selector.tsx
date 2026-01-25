import { HOST_PERSONALITIES } from "@/app/config/host-config";
import { Check } from "lucide-react";
import { GeneratedAvatar } from "@/app/components/generated-avatar";

interface HostSelectorProps {
  selectedHostId: string | null;
  onSelectHost: (hostId: string) => void;
  /** Compact layout for narrow panels (e.g. Game Preview sidebar) */
  compact?: boolean;
}

export function HostSelector({ selectedHostId, onSelectHost, compact }: HostSelectorProps) {
  if (compact) {
    return (
      <div className="space-y-2">
        <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2">Select Host</div>
        <div className="grid grid-cols-1 gap-2">
          {HOST_PERSONALITIES.map((host) => (
            <button
              key={host.id}
              onClick={() => onSelectHost(host.id)}
              className={`flex items-center gap-3 w-full text-left p-3 rounded-xl border-2 transition-all ${
                selectedHostId === host.id
                  ? "border-indigo-500 bg-indigo-500/10"
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
                <div className="text-sm font-semibold text-white">{host.name}</div>
                <div className="text-xs text-zinc-400 truncate">{host.tagline}</div>
              </div>
              {selectedHostId === host.id && (
                <Check className="h-4 w-4 text-indigo-400 flex-shrink-0" />
              )}
            </button>
          ))}
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
        {HOST_PERSONALITIES.map((host) => (
          <button
            key={host.id}
            onClick={() => onSelectHost(host.id)}
            className={`relative text-left p-5 rounded-xl border-2 transition-all ${
              selectedHostId === host.id
                ? "border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/20"
                : "border-zinc-700 bg-zinc-800 hover:border-zinc-600 hover:bg-zinc-750"
            }`}
          >
            {selectedHostId === host.id && (
              <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center">
                <Check className="h-4 w-4 text-white" />
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
        ))}
      </div>
    </div>
  );
}
