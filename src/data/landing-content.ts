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

export const GAME_SCENARIOS: Record<string, GameScenario> = {
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

export const FEATURES: Feature[] = [
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

export const FEATURED_GAMES: FeaturedGame[] = [
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
  { name: "Alex",   role: "Villager",  personality: "Outspoken and analytical",             game: "🐺 Werewolf" },
  { name: "Casey",  role: "Doctor",    personality: "Calm, protective instincts",            game: "🐺 Werewolf" },
  { name: "Lucia",  role: "Detective", personality: "Sharp, suspicious of everyone",         game: "🎭 Mafia"    },
  { name: "Marco",  role: "Civilian",  personality: "Nervous, eager to prove innocence",     game: "🎭 Mafia"    },
  { name: "Jordan", role: "Civilian",  personality: "Clever, deliberately vague",            game: "🕵️ Who's the Spy" },
  { name: "Riley",  role: "Spy",       personality: "Paranoid, accuses to deflect",          game: "🕵️ Who's the Spy" },
  { name: "Morgan", role: "Witness",   personality: "Nervous, detail-oriented",              game: "🔍 Mystery"  },
  { name: "Taylor", role: "Suspect",   personality: "Confrontational, quick to contradict",  game: "🔍 Mystery" },
  { name: "Drew",   role: "Villager",  personality: "Quiet, watchful observer",              game: "🐺 Werewolf" },
];

/** Duplicated for seamless infinite marquee loop */
export const MARQUEE_CHARACTERS: MarqueeCharacter[] = [
  ...BASE_MARQUEE_CHARACTERS,
  ...BASE_MARQUEE_CHARACTERS,
];
