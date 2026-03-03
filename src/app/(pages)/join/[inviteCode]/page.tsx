"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Users } from "lucide-react";

interface GameInfo {
  name: string;
  icon: string;
}

export default function JoinPage({ params }: { params: Promise<{ inviteCode: string }> }) {
  const { inviteCode } = use(params);
  const router = useRouter();
  const { user, session } = useAuth();

  const [gameInfo, setGameInfo] = useState<GameInfo | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [nickname, setNickname] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Pre-fill nickname from auth profile
  useEffect(() => {
    if (user && !nickname) {
      const displayName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "";
      setNickname(displayName);
    }
  }, [user, nickname]);

  // Look up game by invite code
  useEffect(() => {
    if (!inviteCode) return;
    setLoading(true);
    fetch(`/api/join/${inviteCode}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.gameId) {
          setGameId(data.gameId);
          setGameInfo({ name: data.gameName, icon: data.gameIcon ?? "🎮" });
        } else {
          setError("Invalid or expired invite link.");
        }
      })
      .catch(() => setError("Failed to load game info."))
      .finally(() => setLoading(false));
  }, [inviteCode]);

  const handleJoin = async () => {
    if (!nickname.trim()) { setError("Please enter a nickname."); return; }
    if (!gameId) return;

    setJoining(true);
    setError(null);

    try {
      // Generate or load guest ID from localStorage.
      // C-6: Use a game-scoped key (`guestId_${gameId}`) so different rooms
      //      get different guest identities, preventing cross-room tracking.
      // Migration: if the scoped key is absent but the old global "guestId"
      //      key exists (written by code before C-6), reuse that UUID so the
      //      server can upsert the existing game_members row instead of creating
      //      a duplicate record (the "two Nikki" bug).
      let guestId: string | null = null;
      if (!user && gameId) {
        const guestIdKey = `guestId_${gameId}`;
        guestId = localStorage.getItem(guestIdKey);
        if (!guestId) {
          // One-time migration from old global key
          const legacyGuestId = localStorage.getItem("guestId");
          if (legacyGuestId) {
            guestId = legacyGuestId;
            localStorage.setItem(guestIdKey, legacyGuestId);
            localStorage.removeItem("guestId"); // clean up old key
          } else {
            guestId = crypto.randomUUID();
            localStorage.setItem(guestIdKey, guestId);
          }
        }
      }

      const res = await fetch(`/api/games/${gameId}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ inviteCode, nickname: nickname.trim(), guestId }),
      });

      const data = await res.json() as {
        error?: string;
        memberId?: string;
        gameId?: string;
        guestId?: string;
        isOwner?: boolean;
      };

      if (!res.ok || data.error) {
        setError(data.error ?? "Failed to join game.");
        return;
      }

      // Persist guest session for use in the game room (game-scoped key)
      if (data.guestId && gameId) {
        localStorage.setItem(`guestId_${gameId}`, data.guestId);
      }
      if (data.memberId) {
        localStorage.setItem(`member_${gameId}`, data.memberId);
        localStorage.setItem(`nickname_${gameId}`, nickname.trim());
      }

      // Navigate to game room with guest params
      const url = data.guestId
        ? `/game/${gameId}?guestId=${data.guestId}&memberId=${data.memberId}`
        : `/game/${gameId}`;

      router.push(url);
    } catch (e) {
      console.error("[join]", e);
      setError("Something went wrong. Please try again.");
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !gameId) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <p className="text-2xl mb-4">🔗</p>
          <h1 className="text-xl font-bold text-white mb-2">Link not found</h1>
          <p className="text-zinc-400 text-sm mb-6">{error}</p>
          <Button onClick={() => router.push("/")} variant="outline" className="border-zinc-700 text-zinc-300">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
          {/* Game header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-3">
              {gameInfo?.icon && (gameInfo.icon.startsWith("data:") || gameInfo.icon.startsWith("http") || gameInfo.icon.startsWith("/")) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={gameInfo.icon} alt={gameInfo.name} className="w-16 h-16 rounded-xl object-cover" />
              ) : (
                <span className="text-5xl">{gameInfo?.icon ?? "🎮"}</span>
              )}
            </div>
            <h1 className="text-xl font-black text-white mb-1">{gameInfo?.name ?? "Game"}</h1>
            <p className="text-zinc-400 text-sm">You've been invited to join</p>
          </div>

          {/* Nickname input */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide block mb-2">
                Your nickname in this game
              </label>
              <Input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                placeholder="Enter your name..."
                maxLength={30}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-violet-500"
                autoFocus
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <Button
              onClick={handleJoin}
              disabled={!nickname.trim() || joining}
              className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 font-bold py-5 text-base"
            >
              {joining ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Joining…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Join Game
                </span>
              )}
            </Button>
          </div>

          {/* Auth hint */}
          {!user && (
            <p className="text-center text-xs text-zinc-600 mt-6">
              Joining as guest.{" "}
              <button
                onClick={() => router.push(`/signin?returnUrl=/join/${inviteCode}`)}
                className="text-violet-400 hover:text-violet-300 underline"
              >
                Sign in
              </button>{" "}
              to save progress.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
