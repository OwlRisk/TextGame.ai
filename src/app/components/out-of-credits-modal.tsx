"use client";

import { useRouter } from "next/navigation";
import { Zap, X, Sparkles, Star, Crown } from "lucide-react";
import { Button } from "@/app/components/ui/button";

interface OutOfCreditsModalProps {
  open: boolean;
  onClose: () => void;
}

const PLANS = [
  {
    tier: "pro",
    name: "Pro",
    price: "$20",
    credits: "2,000 credits / mo",
    icon: Sparkles,
    gradient: "from-violet-500 to-violet-600",
    border: "border-violet-500/50",
    glow: "shadow-violet-900/40",
    badge: "Best value",
  },
  {
    tier: "plus",
    name: "Plus",
    price: "$60",
    credits: "6,000 credits / mo",
    icon: Star,
    gradient: "from-fuchsia-500 to-purple-600",
    border: "border-fuchsia-500/60",
    glow: "shadow-fuchsia-900/40",
    badge: "Popular",
  },
  {
    tier: "ultra",
    name: "Ultra",
    price: "$200",
    credits: "40,000 credits / mo",
    icon: Crown,
    gradient: "from-amber-500 to-orange-500",
    border: "border-amber-500/40",
    glow: "shadow-amber-900/30",
    badge: null,
  },
] as const;

export function OutOfCreditsModal({ open, onClose }: OutOfCreditsModalProps) {
  const router = useRouter();

  if (!open) return null;

  const handleUpgrade = (tier: string) => {
    onClose();
    router.push(`/subscription?plan=${tier}`);
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
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden">
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
          <h2 className="text-xl font-bold text-white mb-2">You've run out of credits</h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Subscribe to get monthly credits and keep the game going — or buy more credits anytime.
          </p>
        </div>

        {/* Plan cards */}
        <div className="px-6 pb-4 space-y-2.5">
          {PLANS.map(({ tier, name, price, credits, icon: Icon, gradient, border, glow, badge }) => (
            <button
              key={tier}
              onClick={() => handleUpgrade(tier)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl bg-zinc-800/60 border ${border} hover:bg-zinc-800 transition-all group`}
            >
              <div className={`flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg ${glow}`}>
                <Icon className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">{name}</span>
                  {badge && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gradient-to-r ${gradient} text-white`}>
                      {badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500">{credits}</p>
              </div>
              <span className="flex-shrink-0 text-sm font-bold text-white">{price}<span className="text-xs text-zinc-500 font-normal">/mo</span></span>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-1 flex flex-col gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-zinc-500 hover:text-zinc-300 text-xs"
            onClick={() => { onClose(); router.push("/subscription"); }}
          >
            View all plans & compare
          </Button>
        </div>
      </div>
    </div>
  );
}
