import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getGameSEOData, type ChatPreviewMessage } from "@/lib/game-seo-data";
import { LANDING_AVATAR_MAP } from "@/data/landing-content";
import { GAME_MASTER_AVATAR } from "@/lib/game-master-avatar";
import { VoiceGreetingButton } from "./VoiceGreetingButton";

interface ChatPreviewWidgetProps {
  /** Pull messages + metadata from game-seo-data.ts */
  gameSlug?: string;
  /** Override with custom messages */
  messages?: ChatPreviewMessage[];
  /** Chat window title (defaults to game name or "Game Room") */
  roomTitle?: string;
  /** CTA link — defaults to /discover */
  ctaHref?: string;
  /** CTA label — defaults to "Play free →" */
  ctaLabel?: string;
  /** Optional voice greeting text (uses Web Speech API, zero credits) */
  voiceGreeting?: string;
}

function AvatarCircle({ name, isHost }: { name: string; isHost?: boolean }) {
  const src = isHost ? GAME_MASTER_AVATAR : LANDING_AVATAR_MAP[name];
  const initials = name.replace(/[^A-Za-z\s]/g, "").trim().substring(0, 2).toUpperCase() || "AI";

  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={32}
        height={32}
        className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-1 ring-zinc-700/60"
        loading="lazy"
      />
    );
  }

  const colors = [
    "bg-violet-900/60 text-violet-300",
    "bg-blue-900/60 text-blue-300",
    "bg-emerald-900/60 text-emerald-300",
    "bg-amber-900/60 text-amber-300",
    "bg-rose-900/60 text-rose-300",
    "bg-cyan-900/60 text-cyan-300",
  ];
  const colorClass = colors[(name.charCodeAt(0) || 0) % colors.length];

  return (
    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold ring-1 ring-zinc-700/60 ${colorClass}`}>
      {initials}
    </div>
  );
}

export function ChatPreviewWidget({
  gameSlug,
  messages: customMessages,
  roomTitle,
  ctaHref,
  ctaLabel,
  voiceGreeting,
}: ChatPreviewWidgetProps) {
  const gameData = gameSlug ? getGameSEOData(gameSlug) : undefined;
  const messages = customMessages ?? gameData?.chatPreview;

  if (!messages || messages.length === 0) return null;

  const title = roomTitle ?? (gameData ? `# ${gameData.name.toLowerCase()}-room` : "# game-room");
  const href = ctaHref ?? (gameSlug ? `/create?preset=${gameData?.presetId ?? gameSlug}` : "/discover");
  const label = ctaLabel ?? (gameData ? `Play ${gameData.name} free` : "Play free");

  // Use first host message as voice greeting if not provided
  const speakText = voiceGreeting ?? messages.find((m) => m.isHost)?.text ?? messages[0].text;

  return (
    <div className="my-10 rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      {/* Window chrome */}
      <div className="bg-zinc-800/70 px-4 py-2.5 border-b border-zinc-700/60 flex items-center gap-2.5">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
        </div>
        <span className="text-xs font-semibold text-zinc-400 flex-1">{title}</span>
        <VoiceGreetingButton text={speakText} />
      </div>

      {/* Messages */}
      <div className="p-4 space-y-3.5">
        {messages.map((msg, i) => (
          <div key={i} className="flex gap-3">
            <AvatarCircle name={msg.isHost ? "GM" : msg.name} isHost={msg.isHost} />
            <div className="flex-1 min-w-0 pt-0.5">
              <span className={`text-xs font-semibold mr-2 ${msg.isHost ? "text-violet-400" : "text-zinc-300"}`}>
                {msg.name}
              </span>
              <span className="text-sm text-zinc-400 leading-relaxed">{msg.text}</span>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="px-4 pb-4">
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-violet-900/30"
        >
          {label}
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
