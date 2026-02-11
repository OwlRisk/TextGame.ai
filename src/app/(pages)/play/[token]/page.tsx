"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { Gamepad2, ArrowRight, Home } from "lucide-react";

type GamePreview = {
  id: string;
  name: string;
  icon: string;
  color: string;
  config: { rules?: string };
};

export default function PlayTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const [game, setGame] = useState<GamePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError("Invalid link");
      return;
    }
    fetch(`/api/share/${encodeURIComponent(token)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Game not found or link expired");
        return res.json();
      })
      .then((data) => {
        setGame(data);
        setError(null);
      })
      .catch((e) => {
        setError(e.message || "Failed to load game");
        setGame(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-2 border-violet-500 border-t-transparent mb-4" />
          <p className="text-zinc-400">Loading game…</p>
        </div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="rounded-full bg-zinc-800 p-4 inline-flex mb-4">
            <Gamepad2 className="h-10 w-10 text-zinc-500" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Game not found</h1>
          <p className="text-zinc-400 text-sm mb-6">
            This share link may be invalid or the game was removed.
          </p>
          <Link href="/">
            <Button className="bg-violet-600 hover:bg-violet-500 text-white">
              <Home className="h-4 w-4 mr-2" />
              Go to textgame.ai
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const rulesPreview = game.config?.rules?.trim().slice(0, 400) ?? "";
  const hasMoreRules = (game.config?.rules?.length ?? 0) > 400;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-lg mx-auto px-6 py-12">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-zinc-400 hover:text-white mb-8"
        >
          <Home className="h-4 w-4 mr-2" />
          textgame.ai
        </Link>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 overflow-hidden">
          <div
            className="h-24 flex items-center gap-4 px-6"
            style={{ backgroundColor: game.color ? `${game.color}22` : "rgba(139, 92, 246, 0.15)" }}
          >
            <div
              className="h-14 w-14 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden border border-white/10"
              style={{ backgroundColor: game.color || "#6366f1" }}
            >
              {game.icon?.startsWith("data:image") ? (
                <img src={game.icon} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl">{game.icon || "🎮"}</span>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-white truncate">{game.name}</h1>
              <p className="text-zinc-400 text-sm">Shared game</p>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {rulesPreview ? (
              <div>
                <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Rules
                </h2>
                <pre className="text-sm text-zinc-300 whitespace-pre-wrap font-sans bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50 max-h-48 overflow-y-auto">
                  {rulesPreview}
                  {hasMoreRules ? "…" : ""}
                </pre>
              </div>
            ) : null}

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => router.push(`/game/${game.id}`)}
                className="flex-1 bg-violet-600 hover:bg-violet-500 text-white h-11"
              >
                在 textgame.ai 中打开
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Link href="/" className="flex-1 sm:flex-none">
                <Button variant="outline" className="w-full h-11 border-zinc-600 text-zinc-300 hover:bg-zinc-800">
                  Go Home
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <p className="text-center text-zinc-500 text-xs mt-6">
          You’ll need to sign in or create an account to play.
        </p>
      </div>
    </div>
  );
}
