"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  MessageCircle,
  Users,
  Crown,
  Zap,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Gamepad2,
  Compass,
} from "lucide-react";
import NextImage from "next/image";
import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import { BRAND_CONFIG } from "@/app/config/brand-config";
import { GAME_MASTER_AVATAR } from "@/lib/game-master-avatar";

/** Next.js Image with onError fallback via state */
function SafeAvatar({
  src,
  fallback,
  alt,
  width,
  height,
  className,
  loading,
  priority,
}: {
  src: string;
  fallback: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  loading?: "lazy" | "eager";
  priority?: boolean;
}) {
  const [imgSrc, setImgSrc] = useState(src);
  return (
    <NextImage
      src={imgSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading={priority ? undefined : loading}
      priority={priority}
      onError={() => setImgSrc(fallback)}
    />
  );
}

interface LandingPageProps {
  onSignIn: () => void;
  onCreateGame?: (presetId?: string) => void;
}


/** Static pre-generated avatar map for landing page characters */
const LANDING_AVATAR_MAP: Record<string, string> = {
  // Players
  Alex:            "/avatars/preview/landing-avatar-alex.webp",
  Casey:           "/avatars/preview/landing-avatar-casey.webp",
  Drew:            "/avatars/preview/landing-avatar-drew.webp",
  Lucia:           "/avatars/preview/landing-avatar-lucia.webp",
  Marco:           "/avatars/preview/landing-avatar-marco.webp",
  Jordan:          "/avatars/preview/landing-avatar-jordan.webp",
  Riley:           "/avatars/preview/landing-avatar-riley.webp",
  Morgan:          "/avatars/preview/landing-avatar-morgan.webp",
  Taylor:          "/avatars/preview/landing-avatar-taylor.webp",
  // Inside a Game steps – AI players
  "Dr. Chen":       "/avatars/preview/landing-avatar-dr-chen.webp",
  "Captain Rex":    "/avatars/preview/landing-avatar-captain-rex.webp",
  "Engineer Nova":  "/avatars/preview/landing-avatar-engineer-nova.webp",
  Gideon:           "/avatars/preview/landing-avatar-gideon.webp",
  // In-game hosts (each game has its own named host character)
  "Warden Lunaris":  "/avatars/preview/landing-avatar-warden-lunaris.webp",
  "Don Ferrante":    "/avatars/preview/landing-avatar-don-ferrante.webp",
  "Detective Kate":  "/avatars/preview/landing-avatar-detective-kate.webp",
};

/** Shared avatar renderer for landing page preview messages */
function PreviewAvatar({ name, isHost }: {
  name: string;
  isHost?: boolean;
  role?: string;
  personality?: string;
  gender?: string;
}) {
  const src = LANDING_AVATAR_MAP[name];

  // Named in-game hosts (Warden Lunaris, Don Ferrante, etc.) have their own avatar.
  // Only fall back to the generic GAME_MASTER_AVATAR for "Game Master".
  if (isHost) {
    const avatarSrc = src || GAME_MASTER_AVATAR;
    return (
      <SafeAvatar
        src={avatarSrc}
        fallback={GAME_MASTER_AVATAR}
        alt={name}
        width={36}
        height={36}
        className="w-9 h-9 rounded-full flex-shrink-0 ring-1 ring-zinc-600/50 object-cover"
      />
    );
  }

  const initials = name.substring(0, 2).toUpperCase();
  return (
    <div className="w-9 h-9 rounded-full flex-shrink-0 ring-1 ring-zinc-600/50 overflow-hidden bg-zinc-700">
      {src ? (
        <SafeAvatar
          src={src}
          fallback={GAME_MASTER_AVATAR}
          alt={name}
          width={36}
          height={36}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-white">
          {initials}
        </div>
      )}
    </div>
  );
}

// ─── Streaming text component ─────────────────────────────────────────────────
function StreamingText({
  text,
  speed = 30,
  onComplete,
}: {
  text: string;
  speed?: number;
  onComplete?: () => void;
}) {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setDisplayedText("");
    setCurrentIndex(0);
  }, [text]);

  useEffect(() => {
    if (currentIndex >= text.length) {
      if (onComplete) {
        setTimeout(() => onComplete(), 800);
      }
      return;
    }
    const timeout = setTimeout(() => {
      setDisplayedText(text.slice(0, currentIndex + 1));
      setCurrentIndex(currentIndex + 1);
    }, speed);
    return () => clearTimeout(timeout);
  }, [currentIndex, text, speed, onComplete]);

  return (
    <span className="text-sm text-zinc-300 leading-relaxed">
      {displayedText}
      {currentIndex < text.length && (
        <span aria-hidden="true" className="inline-block w-[2px] h-4 bg-violet-400 animate-pulse ml-0.5" />
      )}
    </span>
  );
}

// ─── Sequential message list with streaming ───────────────────────────────────
function MessageList({
  messages,
  gameKey,
}: {
  messages: Array<{
    isHost?: boolean;
    name: string;
    role?: string;
    personality?: string;
    gender?: string;
    time: string;
    text: string;
  }>;
  gameKey: string;
}) {
  const [visibleCount, setVisibleCount] = useState(1);

  useEffect(() => {
    setVisibleCount(1);
  }, [gameKey]);

  const handleMessageComplete = () => {
    setVisibleCount((prev) => Math.min(prev + 1, messages.length));
  };

  return (
    <>
      {messages.slice(0, visibleCount).map((msg, index) => (
        <div key={`${gameKey}-${index}`} className="flex gap-3 animate-fadeIn">
          <PreviewAvatar name={msg.name} isHost={msg.isHost} role={msg.role} personality={msg.personality} gender={msg.gender} />
          <div className="flex-1">
            <div className="flex items-baseline gap-2 mb-0.5">
              <span className="font-semibold text-white text-sm">{msg.name}</span>
              <span className="text-xs text-zinc-500">{msg.time}</span>
            </div>
            <StreamingText
              text={msg.text}
              speed={40}
              onComplete={index === visibleCount - 1 ? handleMessageComplete : undefined}
            />
          </div>
        </div>
      ))}
    </>
  );
}

// ─── Message list with badges (Inside a Game section) ─────────────────────────
function InsideGameMessageList({
  messages,
  gameKey,
}: {
  messages: Array<{
    isHost?: boolean;
    name: string;
    role?: string;
    personality?: string;
    gender?: string;
    badge: string | null;
    time: string;
    text: string;
  }>;
  gameKey: string;
}) {
  const [visibleCount, setVisibleCount] = useState(1);

  useEffect(() => {
    setVisibleCount(1);
  }, [gameKey]);

  const handleMessageComplete = () => {
    setVisibleCount((prev) => Math.min(prev + 1, messages.length));
  };

  return (
    <>
      {messages.slice(0, visibleCount).map((msg, index) => (
        <div key={`${gameKey}-${index}`} className="flex gap-3 animate-fadeIn">
          <PreviewAvatar name={msg.name} isHost={msg.isHost} role={msg.role} personality={msg.personality} gender={msg.gender} />
          <div className="flex-1">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="font-bold text-white text-sm">{msg.name}</span>
              {msg.badge && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    msg.badge === "YOU"
                      ? "bg-blue-500/20 text-blue-400"
                      : msg.badge === "GM"
                      ? "bg-fuchsia-500/20 text-fuchsia-400"
                      : "bg-violet-500/20 text-violet-400"
                  }`}
                >
                  {msg.badge}
                </span>
              )}
              <span className="text-xs text-zinc-600">{msg.time}</span>
            </div>
            <StreamingText
              text={msg.text}
              speed={40}
              onComplete={index === visibleCount - 1 ? handleMessageComplete : undefined}
            />
          </div>
        </div>
      ))}
    </>
  );
}

// ─── Inside a Game step data ──────────────────────────────────────────────────
const INSIDE_GAME_STEPS = [
  {
    id: "design",
    step: "01",
    total: "04",
    icon: "💬",
    title: "Design with GM",
    heading: "Tell the GM your game idea",
    description:
      "Just chat with the Game Master in plain English. Describe what you want — whether it's classic Werewolf or your wildest custom idea. The GM helps you design rules, roles, and victory conditions.",
    messages: [
      { name: "You", badge: "YOU", time: "2:30 PM", text: "I want to create a sci-fi mystery game set on a space station. Someone sabotaged the oxygen system!", role: "Player", personality: "Curious and strategic", gender: "other" },
      { isHost: true, name: "Game Master", badge: null, time: "2:30 PM", text: "Great idea! Let's set up a 'Traitor on Mars Station' game. How many crew members? Should there be 1 or 2 traitors? And what special roles do you want — Engineer, Security Chief, Scientist?" },
      { name: "You", badge: "YOU", time: "2:31 PM", text: "6 crew members total, 1 traitor. Add an Engineer who can inspect systems, and a Security Chief who can lock rooms.", role: "Player", personality: "Curious and strategic", gender: "other" },
      { isHost: true, name: "Game Master", badge: null, time: "2:31 PM", text: "Perfect! I've set up your game. Ready to start? I'll assign roles secretly and begin the first round." },
    ],
  },
  {
    id: "host",
    step: "02",
    total: "04",
    icon: "🔥",
    title: "The Host",
    heading: "AI Host runs the show",
    description:
      "The Host AI manages everything — assigns secret roles, announces game phases, tracks votes, reveals information at the right time, and keeps the story flowing. You just focus on playing.",
    messages: [
      { isHost: true, name: "Warden Lunaris", badge: "GM", time: "3:15 PM", text: "🌙 Night falls on Mars Station. Everyone close your eyes... Traitor, you may choose your sabotage target now." },
      { isHost: true, name: "Warden Lunaris", badge: "GM", time: "3:16 PM", text: "☀️ Morning arrives. The crew discovers the communication array is damaged! Engineer Nova, you may inspect one system." },
      { isHost: true, name: "Warden Lunaris", badge: "GM", time: "3:17 PM", text: "⚠️ It's time to vote! Discuss who you think is the traitor. You have 3 minutes to decide, then vote to eliminate." },
    ],
  },
  {
    id: "ai-players",
    step: "03",
    total: "04",
    icon: "🤖",
    title: "AI players",
    heading: "AI players think and react",
    description:
      "Each AI player has their own personality, role, and objectives. They observe what happens, form opinions, make strategic decisions, and respond naturally to your actions. They'll lie, defend themselves, or team up — just like real players.",
    messages: [
      { name: "Dr. Chen", badge: "AI", time: "4:20 PM", text: "I was in the medical bay all night. Anyone can confirm? I'm getting suspicious of whoever was near the comm array...", role: "Scientist", personality: "Methodical, defensive under pressure", gender: "female" },
      { name: "Captain Rex", badge: "AI", time: "4:20 PM", text: "Dr. Chen is acting defensive. That's a red flag! I saw them leaving the engineering deck around the time of the sabotage.", role: "Security Chief", personality: "Assertive, blunt, leadership instinct", gender: "male" },
      { name: "Engineer Nova", badge: "AI", time: "4:21 PM", text: "Wait! I used my ability to inspect the comm array. The damage pattern suggests someone with medical knowledge... 👀", role: "Engineer", personality: "Analytical, observant, cautious", gender: "female" },
    ],
  },
  {
    id: "you-play",
    step: "04",
    total: "04",
    icon: "🎮",
    title: "You play",
    heading: "You play your role — the AI reacts",
    description:
      "Type anything as your character. Accuse, defend, vote, or stay silent. The Host and AI players respond to what you say and adapt the game around your choices in real time.",
    messages: [
      { name: "You", badge: "YOU", time: "5:10 PM", text: "I used my Seer ability last night. Gideon is a Werewolf — I'm certain.", role: "Seer", personality: "Careful, observant", gender: "other" },
      { name: "Gideon", badge: "AI", time: "5:10 PM", text: "Lies! The Seer wouldn't reveal themselves this early — you're panicking.", role: "Werewolf", personality: "Manipulative, aggressive deflection", gender: "male" },
      { isHost: true, name: "Warden Lunaris", badge: "GM", time: "5:11 PM", text: "The village votes. Gideon Hale is eliminated. His role is revealed: Werewolf. 🐺 Villagers win!" },
    ],
  },
];

// ─── Game preview scenarios ───────────────────────────────────────────────────
const GAME_SCENARIOS = {
  werewolf: {
    title: "🐺 Werewolf",
    messages: [
      { isHost: true, name: "Warden Lunaris", time: "Night 1", text: "Night falls. The village sleeps — but the wolves are awake. Werewolves, choose your target." },
      { name: "Alex", time: "Day 2", text: "I think Blake is acting suspicious. They barely said anything last round.", role: "Villager", personality: "Outspoken and analytical", gender: "male" },
      { name: "Casey", time: "Day 2", text: "I was watching Blake during the night phase. It can't be them!", role: "Doctor", personality: "Calm, protective instincts", gender: "female" },
    ],
  },
  mafia: {
    title: "🎭 Mafia",
    messages: [
      { isHost: true, name: "Don Ferrante", time: "Night 1", text: "The city sleeps. Mafia members — open your eyes and choose tonight's target." },
      { name: "Lucia", time: "Day 2", text: "Marco was found outside the bakery at midnight. That's not a coincidence.", role: "Detective", personality: "Sharp, suspicious of everyone", gender: "female" },
      { name: "Marco", time: "Day 2", text: "I was getting bread for my family! Ask anyone!", role: "Civilian", personality: "Nervous, eager to prove innocence", gender: "male" },
    ],
  },
  spy: {
    title: "🕵️ Who's the Spy",
    messages: [
      { isHost: true, name: "Game Master", time: "Round 1", text: "Your secret word has been sent to each of you. Describe it in one sentence — don't make it too obvious!" },
      { name: "Jordan", time: "Round 1", text: "Mine is something warm people reach for on a slow morning...", role: "Civilian", personality: "Clever, deliberately vague", gender: "other" },
      { name: "Riley", time: "Round 1", text: "That's suspiciously vague, Jordan. I'm watching you.", role: "Spy", personality: "Paranoid, accuses to deflect", gender: "female" },
    ],
  },
  mystery: {
    title: "🔍 Murder Mystery",
    messages: [
      { isHost: true, name: "Detective Kate", time: "Scene 1", text: "A priceless diamond has vanished from the museum. Every person in this room is a suspect." },
      { name: "Morgan", time: "Scene 1", text: "I saw someone near the display case around 9 PM...", role: "Witness", personality: "Nervous, detail-oriented", gender: "other" },
      { name: "Taylor", time: "Scene 1", text: "That's impossible — the museum closes at 8!", role: "Suspect", personality: "Confrontational, quick to contradict", gender: "male" },
    ],
  },
};

export function LandingPage({ onSignIn }: LandingPageProps) {
  const [selectedGame, setSelectedGame] = useState<keyof typeof GAME_SCENARIOS>("werewolf");
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const features = [
    {
      icon: MessageCircle,
      title: "Plain English creation",
      description: "Describe your game idea in plain English — the AI builds the rules, roles, and world for you.",
      gradient: "from-violet-500 to-purple-500",
    },
    {
      icon: Crown,
      title: "AI Game Master + players",
      description: "A dedicated GM hosts every session — assigns roles, runs phases, and keeps the story flowing. AI fills every seat.",
      gradient: "from-orange-500 to-pink-500",
    },
    {
      icon: Users,
      title: "Real-time multiplayer",
      description: "Share a link and friends join instantly — no sign-up required. Play with any mix of humans and AI.",
      gradient: "from-green-500 to-emerald-500",
    },
    {
      icon: Sparkles,
      title: "Voice & immersion",
      description: "AI characters speak with unique voices. Every game has its own atmosphere and personality.",
      gradient: "from-blue-500 to-cyan-500",
    },
  ];

  const featuredGames = [
    {
      emoji: "🧛",
      title: "Vampire Court",
      players: "4–8",
      tags: ["Deduction", "Social"],
      description: "One vampire hides among nobles. Vote before the next feeding — or become the next victim.",
      cover: "/games/game-cover-vampire-court.webp",
      accent: "from-rose-500/20 to-purple-500/10",
      border: "hover:border-rose-500/50",
    },
    {
      emoji: "🚀",
      title: "Space Mutiny",
      players: "3–6",
      tags: ["Sci-fi", "Hidden Role"],
      description: "The crew is 3 days from Earth. One engineer has been compromised. Trust no one.",
      cover: "/games/game-cover-space-mutiny.webp",
      accent: "from-blue-500/20 to-cyan-500/10",
      border: "hover:border-blue-500/50",
    },
    {
      emoji: "🏰",
      title: "Kingdom Intrigue",
      players: "5–10",
      tags: ["Strategy", "Roleplay"],
      description: "Nobles scheme for the throne. Forge alliances, spread rumors, and claim the crown.",
      cover: "/games/game-cover-kingdom-intrigue.webp",
      accent: "from-amber-500/20 to-yellow-500/10",
      border: "hover:border-amber-500/50",
    },
  ];

  // Auto-rotate preview every 20 s (gives time for messages to stream)
  useEffect(() => {
    if (!isAutoPlaying) return;
    const games = Object.keys(GAME_SCENARIOS) as Array<keyof typeof GAME_SCENARIOS>;
    let currentIndex = games.indexOf(selectedGame);
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % games.length;
      setSelectedGame(games[currentIndex]);
    }, 20000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, selectedGame]);

  const currentScenario = GAME_SCENARIOS[selectedGame];

  return (
    <div className="flex-1 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 overflow-y-auto">
      {/* Animated background blobs */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.1),transparent_50%)] pointer-events-none animate-pulse"
        style={{ animationDuration: "4s" }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(236,72,153,0.08),transparent_50%)] pointer-events-none animate-pulse"
        style={{ animationDuration: "6s", animationDelay: "1s" }}
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12 md:py-16">

        {/* ── Hero – Two Column ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center mb-16 md:mb-24">

          {/* Left column */}
          <div>
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
              <div>
                <h1 className="text-4xl font-black text-white tracking-tight">
                  {BRAND_CONFIG.name}
                </h1>
                <p className="text-sm text-zinc-500 font-medium">{BRAND_CONFIG.tagline}</p>
              </div>
            </div>

            {/* Headline */}
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 md:mb-6 leading-tight">
              Play multiplayer games with{" "}
              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-violet-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                AI characters
              </span>
            </h2>

            <p className="text-base sm:text-lg md:text-xl text-zinc-400 mb-8 leading-relaxed">
              Create custom game rules or play classic games like Werewolf and Undercover.
              <br className="hidden sm:block" />
              Your AI gaming playground starts here.
            </p>

            {/* Core features – 3 simple rows */}
            <div className="mb-10 space-y-3">
              <div className="flex items-center gap-3 text-zinc-300">
                <div className="flex items-center justify-center w-8 h-8 bg-violet-500/10 rounded-[11px]">
                  <Sparkles className="h-4 w-4 text-violet-400" />
                </div>
                <span className="text-base">Smart AI characters that adapt to your game</span>
              </div>
              <div className="flex items-center gap-3 text-zinc-300">
                <div className="flex items-center justify-center w-8 h-8 bg-fuchsia-500/10 rounded-[11px]">
                  <MessageCircle className="h-4 w-4 text-fuchsia-400" />
                </div>
                <span className="text-base">Fully customizable rules and gameplay</span>
              </div>
              <div className="flex items-center gap-3 text-zinc-300">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-500/10 rounded-[11px]">
                  <Zap className="h-4 w-4 text-blue-400" />
                </div>
                <span className="text-base">Create and start playing in 2 minutes</span>
              </div>
            </div>

            {/* Google Sign-in Button */}
            <div className="mb-4 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl blur-xl opacity-30 animate-pulse" style={{ animationDuration: '3s' }} />
              <Button
                onClick={onSignIn}
                size="lg"
                className="relative w-full bg-white hover:bg-zinc-100 text-zinc-900 font-bold text-lg py-6 !rounded-[11px] shadow-xl transition-all hover:scale-[1.02] hover:shadow-2xl"
              >
                <svg className="h-6 w-6 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Get Started with Google
              </Button>
            </div>

            {/* Browse/Discover Button */}
            <div>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full bg-transparent hover:bg-zinc-800/50 text-zinc-300 hover:text-white border-2 border-zinc-700 hover:border-violet-500/50 font-semibold text-base py-5 !rounded-[11px] transition-all"
              >
                <Link href="/discover">
                  <Compass className="h-5 w-5 mr-2" />
                  Explore Games First
                </Link>
              </Button>
            </div>
          </div>

          {/* Right column – animated chat preview */}
          <div className="relative">
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 rounded-3xl blur-3xl" />
            <div className="relative bg-zinc-900/60 backdrop-blur-xl border border-zinc-700/80 rounded-2xl overflow-hidden shadow-2xl transition-all duration-500">
              {/* Window chrome */}
              <div className="bg-zinc-800/70 px-4 py-3 border-b border-zinc-700/80 flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/90" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400/90" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/90" />
                </div>
                <span className="text-sm font-semibold text-zinc-300"># game-room</span>
                <span className="ml-auto text-xs text-zinc-500 bg-zinc-700/60 rounded-md px-2.5 py-1">
                  {currentScenario.title}
                </span>
              </div>
              {/* Streaming messages */}
              <div className="p-4 space-y-4 h-[340px] overflow-y-auto">
                <MessageList messages={currentScenario.messages} gameKey={selectedGame} />
                {/* Typing indicator */}
                <div className="flex gap-3">
                  <PreviewAvatar
                    name="Drew"
                    role="Villager"
                    personality="Quiet observer"
                    gender="other"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-semibold text-white text-sm">Drew</span>
                    </div>
                    <div className="flex gap-1 items-center" aria-hidden="true">
                      <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-pulse" />
                      <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-pulse delay-75" />
                      <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-pulse delay-150" />
                    </div>
                  </div>
                </div>
              </div>
              {/* Mock input */}
              <div className="bg-zinc-800/70 px-4 py-3 border-t border-zinc-700/80">
                <div className="bg-zinc-800/80 rounded-xl px-4 py-2.5 text-sm text-zinc-500 border border-zinc-600/50">
                  Type your message...
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── AI Character Showcase ─────────────────────────────────── */}
        <div className="mb-32 overflow-hidden">
          <div className="text-center mb-12">
            <div className="inline-block bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 mb-4">
              <span className="text-sm font-bold text-violet-400">AI PLAYERS</span>
            </div>
            <h3 className="text-3xl font-black text-white mb-3">Every seat filled with a unique character</h3>
            <p className="text-zinc-400">Each AI player has their own personality, role, and strategy. No two games feel the same.</p>
          </div>

          {/* Scrolling marquee */}
          <div className="relative" aria-hidden="true">
            {/* Fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-zinc-950 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-zinc-950 to-transparent z-10 pointer-events-none" />

            <div className="flex gap-4 animate-marquee" style={{ width: "max-content" }}>
              {[
                { name: "Alex",   role: "Villager",  personality: "Outspoken and analytical",          game: "🐺 Werewolf" },
                { name: "Casey",  role: "Doctor",    personality: "Calm, protective instincts",        game: "🐺 Werewolf" },
                { name: "Lucia",  role: "Detective", personality: "Sharp, suspicious of everyone",     game: "🎭 Mafia"    },
                { name: "Marco",  role: "Civilian",  personality: "Nervous, eager to prove innocence", game: "🎭 Mafia"    },
                { name: "Jordan", role: "Civilian",  personality: "Clever, deliberately vague",        game: "🕵️ Who's the Spy" },
                { name: "Riley",  role: "Spy",       personality: "Paranoid, accuses to deflect",      game: "🕵️ Who's the Spy" },
                { name: "Morgan", role: "Witness",   personality: "Nervous, detail-oriented",          game: "🔍 Mystery"  },
                { name: "Taylor", role: "Suspect",   personality: "Confrontational, quick to contradict", game: "🔍 Mystery" },
                { name: "Drew",   role: "Villager",  personality: "Quiet, watchful observer",          game: "🐺 Werewolf" },
                // duplicate for seamless loop
                { name: "Alex",   role: "Villager",  personality: "Outspoken and analytical",          game: "🐺 Werewolf" },
                { name: "Casey",  role: "Doctor",    personality: "Calm, protective instincts",        game: "🐺 Werewolf" },
                { name: "Lucia",  role: "Detective", personality: "Sharp, suspicious of everyone",     game: "🎭 Mafia"    },
                { name: "Marco",  role: "Civilian",  personality: "Nervous, eager to prove innocence", game: "🎭 Mafia"    },
                { name: "Jordan", role: "Civilian",  personality: "Clever, deliberately vague",        game: "🕵️ Who's the Spy" },
                { name: "Riley",  role: "Spy",       personality: "Paranoid, accuses to deflect",      game: "🕵️ Who's the Spy" },
                { name: "Morgan", role: "Witness",   personality: "Nervous, detail-oriented",          game: "🔍 Mystery"  },
                { name: "Taylor", role: "Suspect",   personality: "Confrontational, quick to contradict", game: "🔍 Mystery" },
                { name: "Drew",   role: "Villager",  personality: "Quiet, watchful observer",          game: "🐺 Werewolf" },
              ].map((char, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-44 bg-zinc-900/60 border border-zinc-700/60 rounded-2xl p-4 hover:border-violet-500/50 hover:bg-zinc-800/60 transition-all duration-300 group"
                >
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="relative">
                      {LANDING_AVATAR_MAP[char.name] ? (
                        <SafeAvatar
                          src={LANDING_AVATAR_MAP[char.name]}
                          fallback={GAME_MASTER_AVATAR}
                          alt={char.name}
                          width={64}
                          height={64}
                          loading="lazy"
                          className="w-16 h-16 rounded-full object-cover ring-2 ring-zinc-700/80 group-hover:ring-violet-500/50 transition-all"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 ring-2 ring-zinc-700/80 flex items-center justify-center text-white font-bold text-lg">
                          {char.name.charAt(0)}
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 bg-zinc-800 border border-zinc-700 rounded-full px-1.5 py-0.5 text-[9px] font-bold text-violet-400">
                        AI
                      </div>
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">{char.name}</div>
                      <div className="text-[11px] text-violet-400 font-semibold mb-1">{char.role}</div>
                      <div className="text-[10px] text-zinc-500 leading-tight">{char.personality}</div>
                    </div>
                    <div className="text-[9px] text-zinc-600 bg-zinc-800/80 rounded-full px-2 py-0.5 w-full truncate">
                      {char.game}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Inside a Game ─────────────────────────────────────────── */}
        <InsideGameSection />

        {/* ── Features ─────────────────────────────────────────────── */}
        <div className="mb-32">
          <div className="text-center mb-16">
            <div className="inline-block bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 mb-4">
              <span className="text-sm font-bold text-violet-400">FEATURES</span>
            </div>
            <h3 className="text-4xl font-black text-white mb-4">Why You'll Love It</h3>
            <p className="text-lg text-zinc-400">Everything you need to bring any game to life</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 hover:border-violet-500/30 rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02]"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity" />
                  <div className={`relative w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-4 shadow-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="relative text-lg font-bold text-white mb-2">{feature.title}</h4>
                  <p className="relative text-sm text-zinc-400 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Trending Games ────────────────────────────────────────── */}
        <div className="mb-32">
          <div className="text-center mb-12">
            <div className="inline-block bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 mb-4">
              <span className="text-sm font-bold text-violet-400">COMMUNITY</span>
            </div>
            <h3 className="text-3xl font-black text-white mb-3">Featured Templates</h3>
            <p className="text-lg text-zinc-400">One-click start — or use them as inspiration for your own</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {featuredGames.map((game, index) => (
              <button
                key={index}
                type="button"
                onClick={onSignIn}
                aria-label={`Play ${game.title}`}
                className={`group relative bg-zinc-900/60 border border-zinc-800 ${game.border} rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 cursor-pointer overflow-hidden text-left w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500`}
              >
                {/* Cover image */}
                <div className="relative h-40 overflow-hidden">
                  <NextImage
                    src={game.cover}
                    alt={game.title}
                    width={400}
                    height={160}
                    priority
                    sizes="(min-width: 768px) 400px, 100vw"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/20 to-transparent" />
                </div>

                <div className="p-5">
                  <h4 className="font-black text-white text-base mb-2">{game.title}</h4>
                  <p className="text-sm text-zinc-400 leading-relaxed mb-4">{game.description}</p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {game.tags.map((tag) => (
                      <span key={tag} className="text-[11px] font-medium px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded-full">
                        {tag}
                      </span>
                    ))}
                    <span className="text-[11px] font-medium px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded-full flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {game.players} players
                    </span>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                    <span className="text-xs font-semibold text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      Try this template →
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── FAQ ───────────────────────────────────────────────────── */}
        <FAQSection />

        {/* ── Final CTA ─────────────────────────────────────────────── */}
        <div className="mb-24">
          <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-3xl p-12 md:p-16">
            <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
            <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
            <div className="relative text-center">
              <h3 className="text-4xl md:text-5xl font-black text-white mb-4">
                Ready to Create Your Game?
              </h3>
              <p className="text-xl text-violet-100 mb-8 max-w-2xl mx-auto">
                Start creating your AI multiplayer games today
              </p>
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-white/50 to-white/50 rounded-xl blur-xl opacity-40 animate-pulse" style={{ animationDuration: '3s' }} />
                <Button
                  onClick={onSignIn}
                  size="lg"
                  className="relative bg-white hover:bg-zinc-100 text-violet-600 font-bold text-xl px-12 py-8 !rounded-[11px] shadow-2xl transition-all hover:scale-105"
                >
                  <svg className="h-7 w-7 mr-3" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign in with Google
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-zinc-800 pt-8 pb-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-zinc-600">
            <p>© 2026 {BRAND_CONFIG.name} • Any game you describe, playable in minutes</p>
            <div className="flex gap-6">
              <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

// ─── Inside a Game section ────────────────────────────────────────────────────
function InsideGameSection() {
  const [selectedStep, setSelectedStep] = useState(0);
  const currentStep = INSIDE_GAME_STEPS[selectedStep];

  const handlePrevious = () => {
    setSelectedStep((prev) => (prev === 0 ? INSIDE_GAME_STEPS.length - 1 : prev - 1));
  };
  const handleNext = () => {
    setSelectedStep((prev) => (prev === INSIDE_GAME_STEPS.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="mb-32">
      <div className="text-center mb-12">
        <div className="inline-block bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 mb-4">
          <span className="text-sm font-bold text-violet-400">INSIDE A GAME</span>
        </div>
        <h3 className="text-4xl font-black text-white mb-4">What actually happens inside a game</h3>
        <p className="text-lg text-zinc-400">Experience every stage of gameplay</p>
      </div>

      {/* Tab navigation */}
      <div role="tablist" aria-label="Game stages" className="flex flex-wrap justify-center gap-3 mb-12">
        {INSIDE_GAME_STEPS.map((step, index) => (
          <button
            key={step.id}
            type="button"
            role="tab"
            aria-selected={selectedStep === index}
            onClick={() => setSelectedStep(index)}
            className={`group relative px-6 py-3 rounded-full border transition-all duration-300 ${
              selectedStep === index
                ? "border-fuchsia-500 bg-fuchsia-500/10 shadow-lg shadow-fuchsia-500/20"
                : "border-zinc-800 bg-zinc-900/50 hover:border-fuchsia-500/50"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">{step.icon}</span>
              <span className={`text-sm font-bold transition-colors ${selectedStep === index ? "text-white" : "text-zinc-400 group-hover:text-white"}`}>
                {step.title}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="relative bg-zinc-950/50 border border-zinc-800 rounded-3xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[600px]">
          {/* Left – description */}
          <div className="relative p-12 flex flex-col justify-between bg-gradient-to-br from-zinc-900/80 to-zinc-950/80">
            <div>
              <div className="inline-flex items-center gap-2 mb-6">
                <Gamepad2 className="h-5 w-5 text-fuchsia-400" />
                <span className="text-sm font-bold text-fuchsia-400">
                  STEP {currentStep.step} / {currentStep.total}
                </span>
              </div>
              <h4 className="text-4xl font-black text-white mb-6 leading-tight">{currentStep.heading}</h4>
              <p className="text-lg text-zinc-400 leading-relaxed">{currentStep.description}</p>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-12">
              <div className="flex items-center gap-2">
                {INSIDE_GAME_STEPS.map((step, index) => (
                  <button
                    key={index}
                    type="button"
                    aria-label={`Go to step: ${step.title}`}
                    aria-current={selectedStep === index ? "step" : undefined}
                    onClick={() => setSelectedStep(index)}
                    className={`transition-all duration-300 rounded-full ${
                      selectedStep === index
                        ? "w-8 h-2 bg-fuchsia-500"
                        : "w-2 h-2 bg-zinc-700 hover:bg-zinc-600"
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Previous step"
                  onClick={handlePrevious}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-fuchsia-500/50 transition-all"
                >
                  <ChevronLeft className="h-5 w-5 text-zinc-400" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label="Next step"
                  onClick={handleNext}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-fuchsia-500/50 transition-all"
                >
                  <ChevronRight className="h-5 w-5 text-zinc-400" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          {/* Right – streaming chat example */}
          <div className="relative bg-zinc-900/50 border-l border-zinc-800">
            <div className="absolute top-6 right-6 z-10">
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-full px-3 py-1.5">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs font-bold text-red-400">LIVE EXAMPLE</span>
              </div>
            </div>
            <div className="h-full flex flex-col">
              <div className="flex-1 p-8 pt-20 space-y-4 overflow-y-auto">
                <InsideGameMessageList
                  messages={currentStep.messages}
                  gameKey={currentStep.id}
                />
              </div>
              <div className="p-4 border-t border-zinc-800">
                <div className="bg-zinc-950/50 rounded-lg px-4 py-3 text-sm text-zinc-600 flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  <span>Type your message...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── FAQ section ──────────────────────────────────────────────────────────────
function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const faqs = [
    {
      question: "How do I create a game?",
      answer: "Sign in with Google, then go to Create. You can either chat with the Game Master to describe your idea in plain English, or pick a template from Discover (e.g. Werewolf, Who's the Spy, Mafia, Tarot). Set player count and optional rules — no coding or complex setup. Your game is ready in about 2 minutes.",
    },
    {
      question: "What is the Game Master and how does it work?",
      answer: "The Game Master is an AI host that runs your game: it explains rules, runs day/night or discussion phases, and keeps the flow. You can also add AI players so the room is filled even when playing alone. The host and players use natural dialogue so it feels like a real tabletop session.",
    },
    {
      question: "Can I play with friends?",
      answer: "Yes! Share an invite link from your game room — friends can join instantly in their browser without creating an account. They play as guests alongside your AI characters. You can have any mix of human and AI players in the same game.",
    },
    {
      question: "What templates or game types are available?",
      answer: "We include 20+ templates like Werewolf (social deduction), Who's the Spy (word game), Mafia, Murder Mystery, Secret Hitler, and Tarot Reading. Browse them in Discover for one-click start. You can also create a fully custom game by describing your own rules and roles to the Game Master.",
    },
    {
      question: "Do I need to sign in? Is it free?",
      answer: "Sign in with Google to create games — it only takes a few seconds. New accounts get free starting credits so you can try the platform right away. Friends who join your game don't need an account at all.",
    },
    {
      question: "Do AI characters have voices?",
      answer: "Yes. Each AI character speaks with a unique voice powered by text-to-speech. You can toggle voice on or off for any game. It adds a layer of immersion that makes the game feel like a real tabletop session.",
    },
    {
      question: "Can I create any type of game?",
      answer: "Absolutely! While we offer 20+ templates for popular games, you have complete freedom to design custom games with unique rules, roles, and victory conditions. Just describe your idea to the Game Master in plain English.",
    },
    {
      question: "How much does it cost?",
      answer: "New accounts start with free credits. After that, you can purchase additional credits as needed — pricing is transparent and based on actual usage. No subscriptions or hidden fees.",
    },
  ];

  return (
    <div className="mb-24">
      <div className="text-center mb-12">
        <div className="inline-block bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 mb-4">
          <span className="text-sm font-bold text-violet-400">FAQ</span>
        </div>
        <h3 className="text-3xl font-black text-white mb-3">Common Questions</h3>
        <p className="text-lg text-zinc-400">Everything you need to know</p>
      </div>
      <div className="max-w-3xl mx-auto space-y-3">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden transition-all duration-300 hover:border-violet-500/30"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              aria-expanded={openIndex === index}
              aria-controls={`faq-panel-${index}`}
              className="w-full px-6 py-5 flex items-center justify-between gap-4 text-left group"
            >
              <span className="font-bold text-white group-hover:text-violet-400 transition-colors">
                {faq.question}
              </span>
              <ChevronDown
                aria-hidden="true"
                className={`h-5 w-5 text-zinc-400 flex-shrink-0 transition-transform duration-300 ${openIndex === index ? "rotate-180 text-violet-400" : ""}`}
              />
            </button>
            <div
              id={`faq-panel-${index}`}
              role="region"
              aria-labelledby={`faq-btn-${index}`}
              className={`overflow-hidden transition-all duration-300 ${openIndex === index ? "max-h-80" : "max-h-0"}`}
            >
              <div className="px-6 pb-5 text-sm text-zinc-400 leading-relaxed">
                {faq.answer}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
