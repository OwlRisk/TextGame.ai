"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DiscoverPage, type DiscoverPreset } from "@/app/components/discover-page";
import { Toaster } from "@/app/components/ui/sonner";
import { useGameContext } from "@/app/contexts/GameContext";
import { useAuth } from "@/app/contexts/AuthContext";
import { toast } from "sonner";

export default function DiscoverView() {
  const router = useRouter();
  const { selectGame } = useGameContext();
  const { user, loading } = useAuth();

  // 进入 Discover 页时同步侧边栏高亮为 "discover"
  useEffect(() => {
    selectGame("discover");
  }, [selectGame]);

  const handleCreateGame = (preset: DiscoverPreset) => {
    if (!user && !loading) {
      const returnUrl = `/create?preset=${preset.id}`;
      router.push(`/signin?returnUrl=${encodeURIComponent(returnUrl)}`);
      toast.info("Sign in to create this game");
      return;
    }
    router.push(`/create?preset=${preset.id}`);
  };

  return (
    <>
      <DiscoverPage onCreateGame={handleCreateGame} />
      <Toaster position="top-right" expand={false} richColors closeButton offset={{ top: "72px", right: "20px" }} gap={12} toastOptions={{ style: { zIndex: 9999 }, duration: 4000 }} />
    </>
  );
}
