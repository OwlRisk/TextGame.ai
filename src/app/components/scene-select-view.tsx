"use client";

import { SCENES } from "@/lib/scenes";
import type { Scene } from "@/lib/scenes/types";

const GENRE_LABELS: Record<string, string> = {
  adventure: "Adventure",
  mystery: "Mystery",
  survival: "Survival",
  heist: "Heist",
};

function SceneCard({ scene, onClick, disabled }: { scene: Scene; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group relative w-full text-left rounded-2xl overflow-hidden border border-white/10 
        bg-gradient-to-br ${scene.color} p-6 min-h-[200px] flex flex-col justify-between
        transition-all duration-300 hover:scale-[1.02] hover:border-white/25 hover:shadow-2xl hover:shadow-purple-500/10
        disabled:opacity-60 disabled:pointer-events-none`}
    >
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">{scene.icon}</span>
          <span className="text-xs font-semibold uppercase tracking-wider text-white/60">
            {GENRE_LABELS[scene.genre] || scene.genre}
          </span>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{scene.title}</h3>
        <p className="text-sm text-white/80 leading-relaxed">{scene.hook}</p>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="flex -space-x-2">
          {scene.characters.map((c) => (
            <div
              key={c.name}
              className="w-7 h-7 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-[10px] font-bold text-white"
              title={c.name}
            >
              {c.name[0]}
            </div>
          ))}
          <div className="w-7 h-7 rounded-full bg-white/30 border-2 border-white/40 flex items-center justify-center text-[10px] font-bold text-white">
            You
          </div>
        </div>
        <span className="text-xs text-white/50 group-hover:text-white/80 transition-colors">
          Tap to start &rarr;
        </span>
      </div>
    </button>
  );
}

interface SceneSelectViewProps {
  onSelectScene: (sceneId: string) => void;
  onGoToCreate?: () => void;
  isCreating?: boolean;
}

export function SceneSelectView({ onSelectScene, onGoToCreate, isCreating }: SceneSelectViewProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-start overflow-y-auto px-4 py-8 md:py-12">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Pick an adventure
          </h1>
          <p className="text-zinc-400 text-base md:text-lg">
            Your crew is ready. Where are you going tonight?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">
          {SCENES.map((scene) => (
            <SceneCard
              key={scene.id}
              scene={scene}
              onClick={() => onSelectScene(scene.id)}
              disabled={isCreating}
            />
          ))}
        </div>

        {onGoToCreate && (
          <div className="text-center">
            <button
              onClick={onGoToCreate}
              className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors underline underline-offset-4"
            >
              Or design your own game from scratch
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
