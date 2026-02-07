"use client";

import { WelcomePage } from "@/app/components/welcome-page";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="h-screen flex bg-zinc-900 text-white">
      <WelcomePage
        onCreateGame={() => {
          router.push("/discover");
        }}
        onExploreGames={() => {
          router.push("/discover");
        }}
      />
    </div>
  );
}
