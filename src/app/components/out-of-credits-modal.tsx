"use client";

import { useRouter } from "next/navigation";
import { Zap, X, Coins, ArrowRight } from "lucide-react";
import { Button } from "@/app/components/ui/button";

interface OutOfCreditsModalProps {
  open: boolean;
  onClose: () => void;
}

export function OutOfCreditsModal({ open, onClose }: OutOfCreditsModalProps) {
  const router = useRouter();

  if (!open) return null;

  const handleBuyCredits = () => {
    onClose();
    router.push("/recharge");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="px-6 pt-6 pb-5 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/15 border border-amber-500/30 mb-4">
            <Zap className="h-6 w-6 text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">You&apos;ve run out of credits</h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Buy credits to keep playing. Choose a package that fits your style — credits never expire.
          </p>
        </div>

        {/* CTA */}
        <div className="px-6 pb-6 flex flex-col gap-3">
          <Button
            onClick={handleBuyCredits}
            className="w-full h-12 rounded-xl text-sm font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg border-0"
          >
            <Coins className="h-4 w-4 mr-2" />
            Buy Credits
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          <p className="text-[10px] text-zinc-600 text-center">
            Starting from $5 · Secured by Stripe
          </p>
        </div>
      </div>
    </div>
  );
}
