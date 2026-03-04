import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabase";
import { SITE_DOMAIN } from "@/lib/site";
import JoinClient from "./join-client";

interface Props {
  params: Promise<{ inviteCode: string }>;
}

async function getGameByInvite(inviteCode: string) {
  if (!supabaseAdmin) return null;
  const { data } = await supabaseAdmin
    .from("games")
    .select("id, name, icon")
    .eq("invite_code", inviteCode)
    .single();
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { inviteCode } = await params;
  const game = await getGameByInvite(inviteCode);

  const gameName = game?.name ?? "Game";
  const title = `Join "${gameName}" on textgame.ai`;
  const description = `You've been invited to play ${gameName} — a live AI text game on textgame.ai. No account needed, jump right in!`;
  const url = `${SITE_DOMAIN}/join/${inviteCode}`;

  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      type: "website",
      url,
      siteName: "textgame.ai",
      images: [{ url: "/hero.webp", width: 1200, height: 630, alt: `Join ${gameName}` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/hero.webp"],
    },
  };
}

export default function JoinPage({ params }: Props) {
  return <JoinClient params={params} />;
}
