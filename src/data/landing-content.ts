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
  image: string;
  imageAlt: string;
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
  image: string;
  alt: string;
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
    image: "/steps/step-design.png",
    imageAlt: "Chat with the AI Game Master to design your custom game",
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
    image: "/steps/step-host.png",
    imageAlt: "AI host orchestrating game phases, day/night cycles and votes",
    messages: [
      { isHost: true, name: "Warden Lunaris", badge: "GM", time: "3:15 PM", text: "Night falls on Mars Station. Everyone close your eyes... Traitor, choose your sabotage target now." },
      { isHost: true, name: "Warden Lunaris", badge: "GM", time: "3:16 PM", text: "Morning. The comm array is down. Engineer Nova, you may inspect one system." },
      { isHost: true, name: "Warden Lunaris", badge: "GM", time: "3:17 PM", text: "Time to vote. Discuss who you think is the traitor — 3 minutes, then eliminate." },
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
    image: "/steps/step-ai-players.png",
    imageAlt: "AI players with unique personalities thinking and strategizing",
    messages: [
      { name: "Dr. Chen", badge: "AI", time: "4:20 PM", text: "I was in the medical bay all night. Anyone can confirm? I'm getting suspicious of whoever was near the comm array...", role: "Scientist", personality: "Methodical, defensive under pressure", gender: "female" },
      { name: "Captain Rex", badge: "AI", time: "4:20 PM", text: "Dr. Chen is acting defensive — that's a red flag! I saw them leaving the engineering deck right around the time of the sabotage.", role: "Security Chief", personality: "Assertive, blunt, leadership instinct", gender: "male" },
      { name: "Engineer Nova", badge: "AI", time: "4:21 PM", text: "Wait — I ran a system check on the comm array. The damage pattern suggests someone with medical knowledge. That narrows it down.", role: "Engineer", personality: "Analytical, observant, cautious", gender: "female" },
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
    image: "/steps/step-you-play.png",
    imageAlt: "Player typing in the game chat with AI characters reacting in real time",
    messages: [
      { name: "You", badge: "YOU", time: "5:10 PM", text: "I used my Seer ability last night. Gideon is a Werewolf — I'm certain.", role: "Seer", personality: "Careful, observant", gender: "other" },
      { name: "Gideon", badge: "AI", time: "5:10 PM", text: "Lies. The Seer would never expose themselves this early. You're desperate and pointing fingers.", role: "Werewolf", personality: "Manipulative, aggressive deflection", gender: "male" },
      { isHost: true, name: "Warden Lunaris", badge: "GM", time: "5:11 PM", text: "The village has voted. Gideon Hale is eliminated — his role is revealed: Werewolf. The village survives." },
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
    title: "AI runs the table",
    description: "Roles, phases, votes, reveals — the host keeps the game moving so nobody has to moderate.",
    gradient: "from-violet-500 to-purple-500",
    image: "/features/feature-ai-host.png",
    alt: "AI game master managing roles, phases, votes and reveals automatically",
  },
  {
    icon: Users,
    title: "Always enough players",
    description: "Play solo, with friends, or with a mix of both. AI characters fill every empty seat automatically.",
    gradient: "from-orange-500 to-pink-500",
    image: "/features/feature-always-players.png",
    alt: "AI characters filling every empty seat at the game table",
  },
  {
    icon: MessageCircle,
    title: "AI characters actually play",
    description: "They bluff, accuse, defend themselves, and react like real players — not silent filler bots.",
    gradient: "from-green-500 to-emerald-500",
    image: "/features/feature-ai-plays.png",
    alt: "AI characters bluffing, accusing and defending like real players",
  },
  {
    icon: Sparkles,
    title: "Easy to start with friends",
    description: "Share a link and start in minutes. No download, no setup, no need to wait for a full group.",
    gradient: "from-blue-500 to-cyan-500",
    image: "/features/feature-easy-start.png",
    alt: "Share a link and friends join instantly in their browser",
  },
];

export const FEATURED_GAMES: FeaturedGame[] = [
  {
    emoji: "🐺",
    title: "Werewolf",
    players: "4+",
    tags: ["Social Deduction", "Classic"],
    description: "Villagers vs. hidden werewolves. Find them before it's too late.",
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
    description: "The mafia hides in plain sight. Trust no one.",
    cover: "/games/game-cover-mafia.webp",
    accent: "from-red-500/20 to-orange-500/10",
    border: "hover:border-red-500/50",
    presetId: "mafia-night",
  },
  {
    emoji: "🕵️",
    title: "Who's the Spy",
    players: "3+",
    tags: ["Word Game", "Party"],
    description: "One spy, one secret word. Can you bluff your way through?",
    cover: "/games/game-cover-undercover.webp",
    accent: "from-emerald-500/20 to-teal-500/10",
    border: "hover:border-emerald-500/50",
    presetId: "undercover-party",
  },
];

export const FAQ_ITEMS: FAQItem[] = [
  {
    question: "How do I create a game?",
    answer: "Sign in with Google, then browse templates on Discover — pick a game like Werewolf, Who's the Spy, or Mafia. Click the template and you're in a game room within seconds. AI players are added automatically. No setup or coding needed.",
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
    answer: "We include 10+ templates like Werewolf (social deduction), Who's the Spy (word game), Mafia, Murder Mystery, Secret Hitler, and Tarot Reading. Browse them in Discover for one-click start. You can also create a fully custom game by describing your own rules and roles to the Game Master.",
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
    answer: "Absolutely! While we offer 10+ templates for popular games, you have complete freedom to design custom games with unique rules, roles, and victory conditions. Just describe your idea to the Game Master in plain English.",
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
