"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/app/components/ui/button";

export default function WorldHubPage({ params }: { params: Promise<{ worldId: string }> }) {
  const { worldId } = use(params);
  const router = useRouter();
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/worlds/${worldId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.world?.party_state?.currentRoomId) {
          router.replace(`/game/${data.world.party_state.currentRoomId}`);
        } else if (data?.rooms?.length > 0) {
          router.replace(`/game/${data.rooms[0].id}`);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true));
  }, [worldId, router]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-zinc-950 gap-4">
        <p className="text-zinc-400">World not found</p>
        <Link href="/discover"><Button variant="outline">Back to Discover</Button></Link>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full bg-zinc-950">
      <div className="animate-pulse text-zinc-400">Entering world...</div>
    </div>
  );
}
