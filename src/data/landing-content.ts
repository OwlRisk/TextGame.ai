import type { LucideIcon } from "lucide-react";
import { MessageCircle, Crown, Users, Sparkles } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LandingMessage {
  isHost?: boolean;
  name: string;
  role?: string;
  personality?: string;
  gender?: string;
  time: string;
  text: string;
}

export interface InsideGameMessage extends LandingMessage {
  badge: string | null;
}

export interface InsideGameStep {
  id: string;
  step: string;
  total: string;
  icon: string;
  title: string;
  heading: string;
  description: string;
  messages: InsideGameMessage[];
}

export interface GameScenario {
  title: string;
  messages: LandingMessage[];
}

export interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient: string;
}

export interface FeaturedGame {
  emoji: string;
  title: string;
  players: string;
  tags: string[];
  description: string;
  cover: string;
  accent: string;
  border: string;
  presetId: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface MarqueeCharacter {
  name: string;
  role: string;
  personality: string;
  game: string;
}

// ─── Static data ─────────────────────────────────────────────────────────────

/** Static pre-generated avatar map for landing page characters */
export const LANDING_AVATAR_MAP: Record<string, string> = {
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

export const INSIDE_GAME_STEPS: InsideGameStep[] = [
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
      { name: "You", badge: "YOU", time: "2:30 PM", text: "Let's do a Werewolf game but set on a space station. Crew trying to find a saboteur.", role: "Player", personality: "Curious and strategic", gender: "other" },
      { isHost: true, name: "Game Master", badge: null, time: "2:30 PM", text: "Got it — space station traitor game. How many players, and do you want any special roles? Engineer, Security Chief, that kind of thing?" },
      { name: "You", badge: "YOU", time: "2:31 PM", text: "6 total, 1 traitor. Add an Engineer who can scan systems.", role: "Player", personality: "Curious and strategic", gender: "other" },
      { isHost: true, name: "Game Master", badge: null, time: "2:31 PM", text: "Done. I'll assign roles privately and start when you're ready." },
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
      { isHost: true, name: "Warden Lunaris", badge: "GM", time: "3:15 PM", text: "Night falls on Mars Station. Everyone close your eyes... Traitor, you may choose your sabotage target now." },
      { isHost: true, name: "Warden Lunaris", badge: "GM", time: "3:16 PM", text: "Morning arrives. The crew discovers the communication array is damaged — Engineer Nova, you may inspect one system." },
      { isHost: true, name: "Warden Lunaris", badge: "GM", time: "3:17 PM", text: "Time to vote. Discuss who you think is the traitor — you have 3 minutes, then vote to eliminate." },
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
      { name: "Captain Rex", badge: "AI", time: "4:20 PM", text: "Dr. Chen is acting defensive — that's a red flag! I saw them leaving the engineering deck right around the time of the sabotage.", role: "Security Chief", personality: "Assertive, blunt, leadership instinct", gender: "male" },
      { name: "Engineer Nova", badge: "AI", time: "4:21 PM", text: "Wait — I ran a system check on the comm array. The damage pattern suggests someone with medical knowledge... 👀", role: "Engineer", personality: "Analytical, observant, cautious", gender: "female" },
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
      { name: "Gideon", badge: "AI", time: "5:10 PM", text: "Lies! The Seer would never reveal themselves this early. You're panicking and pointing fingers 😡", role: "Werewolf", personality: "Manipulative, aggressive deflection", gender: "male" },
      { isHost: true, name: "Warden Lunaris", badge: "GM", time: "5:11 PM", text: "The village has voted. Gideon Hale is eliminated — his role is revealed: Werewolf. Villagers win!" },
    ],
  },
];

export const GAME_SCENARIOS: Record<string, GameScenario> = {
  werewolf: {
    title: "Werewolf",
    messages: [
      { isHost: true, name: "Warden Lunaris", time: "Night 1", text: "Night falls on the village. The wolves stir... Werewolves, open your eyes and choose your target." },
      { name: "Alex", time: "Day 2", text: "Blake barely said a word all night. That silence is suspicious — I'm calling it out.", role: "Villager", personality: "Outspoken and analytical", gender: "male" },
      { name: "Casey", time: "Day 2", text: "No way it's Blake. I protected them last night — if they were a wolf, we'd already know.", role: "Doctor", personality: "Calm, protective instincts", gender: "female" },
      { name: "Alex", time: "Day 2", text: "Wait... Casey just revealed their ability. Why would the Doctor expose themselves unless they're deflecting?", role: "Villager", personality: "Outspoken and analytical", gender: "male" },
    ],
  },
  mafia: {
    title: "Mafia",
    messages: [
      { isHost: true, name: "Don Ferrante", time: "Night 1", text: "The city falls silent. Mafia — open your eyes. Choose your target before dawn." },
      { name: "Lucia", time: "Day 2", text: "Marco was outside the bakery at midnight. That's not a coincidence — I checked the records.", role: "Detective", personality: "Sharp, suspicious of everyone", gender: "female" },
      { name: "Marco", time: "Day 2", text: "I swear I was just getting bread for my family!! Why would I lie about something like this?", role: "Civilian", personality: "Nervous, eager to prove innocence", gender: "male" },
      { name: "Lucia", time: "Day 2", text: "Because that's exactly what a Mafia member would say. Too convenient, Marco.", role: "Detective", personality: "Sharp, suspicious of everyone", gender: "female" },
    ],
  },
  spy: {
    title: "Who's the Spy",
    messages: [
      { isHost: true, name: "Game Master", time: "Round 1", text: "Secret words sent. Everyone has the same word — except one player. Describe yours without giving it away." },
      { name: "Jordan", time: "Round 1", text: "Mine is something warm people reach for on a slow morning... very comforting.", role: "Civilian", personality: "Clever, deliberately vague", gender: "other" },
      { name: "Riley", time: "Round 1", text: "That's extremely vague, Jordan. You're either the spy or just trying to sound like one.", role: "Spy", personality: "Paranoid, accuses to deflect", gender: "female" },
      { name: "Jordan", time: "Round 1", text: "Or maybe I just don't want to make it too obvious? You're the one deflecting here, Riley.", role: "Civilian", personality: "Clever, deliberately vague", gender: "other" },
    ],
  },
  mystery: {
    title: "Murder Mystery",
    messages: [
      { isHost: true, name: "Detective Kate", time: "Scene 1", text: "A priceless diamond has vanished from the locked museum vault. Every person in this room is a suspect." },
      { name: "Morgan", time: "Scene 1", text: "I... saw someone near the display case around 9 PM. I didn't think much of it at the time.", role: "Witness", personality: "Nervous, detail-oriented", gender: "other" },
      { name: "Taylor", time: "Scene 1", text: "That's impossible — the museum closes at 8. Who let you in after hours, Morgan?", role: "Suspect", personality: "Confrontational, quick to contradict", gender: "male" },
      { name: "Morgan", time: "Scene 1", text: "I had a key. It wasn't me, I promise... I was just doing inventory.", role: "Witness", personality: "Nervous, detail-oriented", gender: "other" },
    ],
  },
};

export const FEATURES: Feature[] = [
  {
    icon: Crown,
    title: "No moderator needed",
    description: "AI runs every phase — assigns roles, announces night results, and keeps the game moving. You just play.",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    icon: Users,
    title: "AI fills empty seats",
    description: "Can't get enough players? AI characters join your game with unique personalities and strategies. Play anytime.",
    gradient: "from-orange-500 to-pink-500",
  },
  {
    icon: MessageCircle,
    title: "Friends join in seconds",
    description: "Share a link — friends join instantly from their browser. No account, no download, no setup.",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    icon: Sparkles,
    title: "Voice & atmosphere",
    description: "Every AI character has their own voice and personality. Each game feels like a real tabletop session.",
    gradient: "from-blue-500 to-cyan-500",
  },
];

export const FEATURED_GAMES: FeaturedGame[] = [
  {
    emoji: "🐺",
    title: "Werewolf",
    players: "4+",
    tags: ["Social Deduction", "Classic"],
    description: "Villagers vs. hidden werewolves. Debate, vote, and eliminate before the wolves take over.",
    cover: "/games/game-cover-werewolf.webp",
    accent: "from-violet-500/20 to-purple-500/10",
    border: "hover:border-violet-500/50",
    presetId: "werewolf-classic",
  },
  {
    emoji: "🔫",
    title: "Mafia",
    players: "4+",
    tags: ["Social Deduction", "Classic"],
    description: "The mafia hides in plain sight. Citizens must find and eliminate them before it's too late.",
    cover: "/games/game-cover-mafia.webp",
    accent: "from-red-500/20 to-orange-500/10",
    border: "hover:border-red-500/50",
    presetId: "mafia-classic",
  },
  {
    emoji: "🕵️",
    title: "Who's the Spy",
    players: "3+",
    tags: ["Word Game", "Party"],
    description: "Everyone shares a secret word — except the spy. Can the spy bluff their way through?",
    cover: "/games/game-cover-undercover.webp",
    accent: "from-emerald-500/20 to-teal-500/10",
    border: "hover:border-emerald-500/50",
    presetId: "undercover",
  },
];

export const FAQ_ITEMS: FAQItem[] = [
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

const BASE_MARQUEE_CHARACTERS: MarqueeCharacter[] = [
  { name: "Alex",   role: "Villager",  personality: "Outspoken and analytical",             game: "Werewolf" },
  { name: "Casey",  role: "Doctor",    personality: "Calm, protective instincts",            game: "Werewolf" },
  { name: "Lucia",  role: "Detective", personality: "Sharp, suspicious of everyone",         game: "Mafia"    },
  { name: "Marco",  role: "Civilian",  personality: "Nervous, eager to prove innocence",     game: "Mafia"    },
  { name: "Jordan", role: "Civilian",  personality: "Clever, deliberately vague",            game: "Who's the Spy" },
  { name: "Riley",  role: "Spy",       personality: "Paranoid, accuses to deflect",          game: "Who's the Spy" },
  { name: "Morgan", role: "Witness",   personality: "Nervous, detail-oriented",              game: "Mystery"  },
  { name: "Taylor", role: "Suspect",   personality: "Confrontational, quick to contradict",  game: "Mystery" },
  { name: "Drew",   role: "Villager",  personality: "Quiet, watchful observer",              game: "Werewolf" },
];

/** Duplicated for seamless infinite marquee loop */
export const MARQUEE_CHARACTERS: MarqueeCharacter[] = [
  ...BASE_MARQUEE_CHARACTERS,
  ...BASE_MARQUEE_CHARACTERS,
];
