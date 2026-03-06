"use client";

import { useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function CreateGameError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Create Game Error]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Game creation error</h1>
          <p className="text-zinc-400 text-sm">
            Something went wrong while setting up your game. Please try again.
          </p>
          {error.digest && (
            <p className="text-zinc-600 text-xs mt-2 font-mono">Error ID: {error.digest}</p>
          )}
        </div>
        <div className="flex gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/")}
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            aria-label="Go to home page"
          >
            Go home
          </Button>
          <Button
            onClick={reset}
            className="bg-violet-600 hover:bg-violet-500 text-white"
            aria-label="Try again"
          >
            Try again
          </Button>
        </div>
      </div>
    </div>
  );
}
