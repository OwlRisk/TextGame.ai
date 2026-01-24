import { HOST_PERSONALITIES, HostPersonality } from "@/app/config/host-config";
import { Check } from "lucide-react";

interface HostSelectorProps {
  selectedHostId: string | null;
  onSelectHost: (hostId: string) => void;
}

export function HostSelector({ selectedHostId, onSelectHost }: HostSelectorProps) {
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
            {/* Selection Check Mark */}
            {selectedHostId === host.id && (
              <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center">
                <Check className="h-4 w-4 text-white" />
              </div>
            )}

            {/* Host Icon */}
            <div className="flex items-start gap-4 mb-3">
              <div
                className="h-14 w-14 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                style={{ backgroundColor: host.color + "20" }}
              >
                {host.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-lg font-semibold text-white mb-0.5">{host.name}</h4>
                <p className="text-xs font-medium text-zinc-400">{host.tagline}</p>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-zinc-300 mb-3 leading-relaxed">
              {host.description}
            </p>

            {/* Voice Style */}
            <div className="mb-3">
              <span className="text-xs font-semibold text-zinc-400 uppercase">Voice Style:</span>
              <p className="text-sm text-zinc-300 mt-0.5">{host.voiceStyle}</p>
            </div>

            {/* Suitable For */}
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
