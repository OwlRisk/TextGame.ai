"use client";

import { Trophy, RotateCcw, Plus, Heart } from "lucide-react";
import { Button } from "@/app/components/ui/button";

interface GameOverBannerProps {
  gameOverSummary: string;
  onPlayAgain?: () => void;
  onNewGame?: () => void;
  onSaveCharacters?: () => void;
}

export function GameOverBanner({ gameOverSummary, onPlayAgain, onNewGame, onSaveCharacters }: GameOverBannerProps) {
  return (
    <div className="mx-4 mt-3 rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-orange-500/10 px-5 py-4 backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <Trophy className="h-6 w-6 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-amber-200 mb-1">Game Over</h3>
          <p className="text-sm text-amber-100/80 leading-relaxed whitespace-pre-line">{gameOverSummary}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {onPlayAgain && (
              <Button size="sm" variant="outline" className="border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-white gap-1.5" onClick={onPlayAgain}>
                <RotateCcw className="h-3.5 w-3.5" /> Play Again
              </Button>
            )}
            {onNewGame && (
              <Button size="sm" variant="outline" className="border-zinc-600 bg-zinc-800/60 hover:bg-zinc-700 text-zinc-300 hover:text-white gap-1.5" onClick={onNewGame}>
                <Plus className="h-3.5 w-3.5" /> New Game
              </Button>
            )}
            {onSaveCharacters && (
              <Button size="sm" variant="outline" className="border-violet-500/40 bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 hover:text-white gap-1.5" onClick={onSaveCharacters}>
                <Heart className="h-3.5 w-3.5" /> Save Characters
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
