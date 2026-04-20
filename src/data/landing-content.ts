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

/** Pre-generated anime avatars in Supabase storage. Same pool as the in-game
 *  character generator so the landing page matches what players actually see
 *  during a session. */
const ANIME_POOL = "https://hazjbhhreltgjexxaazn.supabase.co/storage/v1/object/public/avatars/pool/anime";
const anime = (name: string) => `${ANIME_POOL}/${name}.jpg`;

/** Static avatar map for landing page characters. All entries below MUST be
 *  referenced from GAME_SCENARIOS, INSIDE_GAME_STEPS, BASE_MARQUEE_CHARACTERS,
 *  or the hero typing-indicator in landing-page.tsx — anything else is dead
 *  weight and should be pruned (along with its public/ asset). All landing
 *  avatars use the anime pool so the hero/marquee aesthetic stays consistent
 *  with the in-session character generator. */
export const LANDING_AVATAR_MAP: Record<string, string> = {
  // Hero chat preview GM (separate from the in-session GM avatar so the
  // landing page reads "anime" while in-game Chronicle keeps the hooded sage).
  Chronicle:        anime("Arjun"),
  // Hero chat preview — RPG party members cycled through GAME_SCENARIOS
  Aldric:           anime("Sebastian"),  // Knight (male)
  Lyra:             anime("Julia"),      // Rogue (female)
  Sera:             anime("Serena"),     // Cleric (female)
  Mira:             anime("Miranda"),    // Ranger (female)
  Kael:             anime("Levi"),       // Rogue (male)
  // Marquee characters (AI Players section)
  "Isabelle Frost":    anime("Miranda"),
  "Jasper Kane":       anime("Sebastian"),
  "Serena Lovelace":   anime("Serena"),
  "Arjun Nair":        anime("Arjun"),
  "Zhao Mei":          anime("Xiaoyin"),
  "Silas Grey":        anime("Levi"),
  "Lila Archer":       anime("Julia"),
  "Kenji Yamamoto":    anime("Satoshi"),
  "Haruka Tanaka":     anime("Asuka"),
};

export const INSIDE_GAME_STEPS: InsideGameStep[] = [
  {
    id: "design",
    step: "01",
    total: "04",
    icon: "💬",
    title: "Design with GM",
    heading: "Tell the GM what RPG you want to play",
    description:
      "Chat with the Game Master in plain English. Describe a world, a tone, a hook — solo dungeon crawl, sword-and-sorcery heist, anything. The GM designs the world, classes, and opening adventure for you.",
    image: "/steps/step-design.png",
    imageAlt: "Chat with the AI Game Master to design your RPG adventure",
    messages: [
      { name: "You", badge: "YOU", time: "2:30 PM", text: "I want a dark-fantasy dungeon crawl with a small party. Old elven ruins, undead theme.", role: "Player", personality: "Curious and strategic", gender: "other" },
      { isHost: true, name: "Game Master", badge: null, time: "2:30 PM", text: "Got it — undead-haunted elven ruins. I'll set up a 4-character party: knight, rogue, mage, cleric. Want any custom hooks?" },
      { name: "You", badge: "YOU", time: "2:31 PM", text: "Yes — the cleric should secretly be searching for a missing sister in the catacombs.", role: "Player", personality: "Curious and strategic", gender: "other" },
      { isHost: true, name: "Game Master", badge: null, time: "2:31 PM", text: "Perfect. I'll weave that into the cleric's backstory and seed clues in the early rooms. Ready when you are." },
    ],
  },
  {
    id: "host",
    step: "02",
    total: "04",
    icon: "🔥",
    title: "The Host",
    heading: "AI Host narrates the world",
    description:
      "The Game Master describes scenes, runs encounters, manages NPCs and rolls, tracks party state, and adapts the story to your decisions. You focus on roleplay; the GM keeps the world coherent.",
    image: "/steps/step-host.png",
    imageAlt: "AI Game Master narrating an RPG scene with rolls and encounters",
    messages: [
      { isHost: true, name: "Chronicle", badge: "GM", time: "3:15 PM", text: "The heavy stone door groans open. Torchlight reveals a circular chamber — three goblin scouts look up from a stolen supply crate, snarling." },
      { isHost: true, name: "Chronicle", badge: "GM", time: "3:16 PM", text: "Initiative: Lyra spots a fourth attacker in the rafters. Aldric, you act first." },
      { isHost: true, name: "Chronicle", badge: "GM", time: "3:17 PM", text: "Roll a STR check to break the line, or describe how you want to flank." },
    ],
  },
  {
    id: "ai-players",
    step: "03",
    total: "04",
    icon: "🤖",
    title: "AI party",
    heading: "AI party members react in character",
    description:
      "Every AI party member has their own class, personality, and motivations. They take their own turns, banter, argue tactics, and grow with the story — never just stand around waiting for the GM.",
    image: "/steps/step-ai-players.png",
    imageAlt: "AI party members with unique personalities arguing tactics in an RPG fight",
    messages: [
      { name: "Aldric", badge: "AI", time: "4:20 PM", text: "Finally. I was getting bored. Stay behind me — I'll hold the front.", role: "Knight", personality: "Brave and protective", gender: "male" },
      { name: "Lyra", badge: "AI", time: "4:20 PM", text: "I'll take the one in the rafters before they get a clean shot — give me a count of three.", role: "Rogue", personality: "Sharp-eyed and cunning", gender: "female" },
      { name: "Mira", badge: "AI", time: "4:21 PM", text: "I can blind the closest two with a flare cantrip. Aldric, charge them once they're stunned.", role: "Mage", personality: "Tactical, slightly bossy", gender: "female" },
    ],
  },
  {
    id: "you-play",
    step: "04",
    total: "04",
    icon: "🎮",
    title: "You play",
    heading: "You drive the story — the world reacts",
    description:
      "Speak in character with [SAY] or take an action with [ACTION]. The Game Master and your party adapt to whatever you do — even when you go completely off-script.",
    image: "/steps/step-you-play.png",
    imageAlt: "Player typing in the game chat with AI characters reacting in real time",
    messages: [
      { name: "You", badge: "YOU", time: "5:10 PM", text: "[ACTION]I shove the supply crate into the goblins to block the rafter shot.[/ACTION]", role: "Cleric", personality: "Quietly determined", gender: "other" },
      { name: "Lyra", badge: "AI", time: "5:10 PM", text: "Nice — that gives me the angle. Going in!", role: "Rogue", personality: "Sharp-eyed and cunning", gender: "female" },
      { isHost: true, name: "Chronicle", badge: "GM", time: "5:11 PM", text: "The crate slams two scouts against the wall. Lyra darts past and the rafter goblin tumbles down — the chamber falls silent. Roll to search the bodies." },
    ],
  },
];

export const GAME_SCENARIOS: Record<string, GameScenario> = {
  dungeon: {
    title: "Dungeon Crawl",
    messages: [
      { isHost: true, name: "Chronicle", time: "Room 3", text: "The heavy stone door groans open. Torchlight reveals a circular chamber — three goblin scouts look up from a stolen supply crate, snarling." },
      { name: "Aldric", time: "Room 3", text: "Finally. I was getting bored. Stay behind me — I'll hold the front.", role: "Knight", personality: "Brave and protective", gender: "male" },
      { name: "Lyra", time: "Room 3", text: "Wait — there's a fourth one hiding in the shadows. I can see it. Let me handle the sneak.", role: "Rogue", personality: "Sharp-eyed and cunning", gender: "female" },
      { name: "Aldric", time: "Room 3", text: "Then go. I'll hold the front three. Just don't miss.", role: "Knight", personality: "Brave and protective", gender: "male" },
    ],
  },
  exploration: {
    title: "Open World",
    messages: [
      { isHost: true, name: "Chronicle", time: "Dawn", text: "The Rusty Flagon tavern is quiet this morning. A notice board by the door is covered in quest postings. The bartender polishes a mug, watching you with one eye." },
      { name: "Mira", time: "Dawn", text: "Check the notice board — there might be something worth our time. I'll ask the bartender if he's heard any rumors.", role: "Ranger", personality: "Practical and resourceful", gender: "female" },
      { name: "Kael", time: "Dawn", text: "Here's one — 'Missing merchant caravan, last seen heading north.' Bounty's solid. We could use the coin.", role: "Rogue", personality: "Motivated by gold", gender: "male" },
      { name: "Mira", time: "Dawn", text: "North is the Darkwood. We'll need supplies first. And probably backup.", role: "Ranger", personality: "Practical and resourceful", gender: "female" },
    ],
  },
  boss: {
    title: "Boss Fight",
    messages: [
      { isHost: true, name: "Chronicle", time: "Phase 2", text: "The dragon roars, shaking loose stones from the cavern ceiling. Its scales glow molten red — it's entering its fury phase. The ground trembles." },
      { name: "Sera", time: "Phase 2", text: "Aldric, your HP is critical! Get behind cover — NOW! I can heal you, but you need to live the next two seconds.", role: "Cleric", personality: "Fierce protector", gender: "female" },
      { name: "Aldric", time: "Phase 2", text: "One more hit and I'll stagger it. Just keep me alive for ten more seconds!", role: "Knight", personality: "Recklessly brave", gender: "male" },
      { name: "Sera", time: "Phase 2", text: "Ten seconds?! Fine — but if you die, I'm NOT carrying your armor back to town.", role: "Cleric", personality: "Fierce protector", gender: "female" },
    ],
  },
};

export const FEATURES: Feature[] = [
  {
    icon: Crown,
    title: "AI Game Master",
    description: "A dedicated AI Game Master narrates your world, controls NPCs, and adapts the story to your choices in real time.",
    gradient: "from-violet-500 to-purple-500",
    image: "/features/feature-ai-host.png",
    alt: "AI Game Master narrating an RPG adventure with dynamic storytelling",
  },
  {
    icon: Users,
    title: "AI party companions",
    description: "Your party members have real personalities, goals, and fears. They argue, joke, protect you, and make every adventure unique.",
    gradient: "from-orange-500 to-pink-500",
    image: "/features/feature-always-players.png",
    alt: "AI party companions with distinct personalities adventuring together",
  },
  {
    icon: MessageCircle,
    title: "Persistent open world",
    description: "Your adventure never ends. Explore an infinite MUD-style world of interconnected rooms, NPCs, quests, and secrets.",
    gradient: "from-green-500 to-emerald-500",
    image: "/features/feature-ai-plays.png",
    alt: "Persistent open world with interconnected rooms and ongoing quests",
  },
  {
    icon: Sparkles,
    title: "Design your own world",
    description: "Co-create your RPG world with the AI — define lore, factions, magic systems, and adventure hooks through natural conversation.",
    gradient: "from-blue-500 to-cyan-500",
    image: "/features/feature-easy-start.png",
    alt: "Designing a custom RPG world through conversation with the AI Game Master",
  },
];

export const FEATURED_GAMES: FeaturedGame[] = [
  {
    emoji: "🏰",
    title: "The Starfall Dungeon",
    players: "Solo + 3 AI",
    tags: ["Fantasy", "Dungeon Crawl", "New"],
    description: "A meteorite opened a rift beneath the old castle. Explore the depths, fight monsters, and claim legendary loot.",
    cover: "/games/game-cover-rpg-starfall-dungeon.webp",
    accent: "from-violet-500/20 to-purple-500/10",
    border: "hover:border-violet-500/50",
    presetId: "rpg-starfall-dungeon",
  },
  {
    emoji: "🪙",
    title: "The Beggar's Coin",
    players: "Solo + 3 AI",
    tags: ["Fantasy", "Urban Mystery", "Short Session"],
    description: "A pickpocket lifted the prince's signet ring. One copper coin is your only lead. Recover it before dawn court convenes.",
    cover: "/games/game-cover-rpg-starfall-dungeon.webp",
    accent: "from-amber-500/20 to-stone-500/10",
    border: "hover:border-amber-500/50",
    presetId: "rpg-beggars-coin",
  },
];

export const FAQ_ITEMS: FAQItem[] = [
  {
    question: "How do I start an adventure?",
    answer: "Sign in with Google, then browse RPG adventures on Discover — pick a preset like 'The Starfall Dungeon' or 'The Beggar's Coin'. Click and you're in the game within seconds. AI party members are generated automatically. You can also design your own world from scratch.",
  },
  {
    question: "What is the AI Game Master?",
    answer: "The AI Game Master (called Chronicle) narrates your adventure, controls the world and NPCs, runs combat encounters, and adapts the story to your choices. Your AI party companions have real personalities — they argue, joke, get scared, and fight alongside you like real players.",
  },
  {
    question: "Can I save my progress and come back?",
    answer: "Yes! Your adventure is automatically saved. You can close the browser and return anytime — your party, inventory, quest progress, and the entire world state persist. The story picks up right where you left off.",
  },
  {
    question: "What RPG worlds are available?",
    answer: "We offer Western Fantasy with pre-built adventures — dungeon crawls, urban mysteries, and more. You can also design your own custom world — define the setting, lore, magic system, and adventure hooks through conversation with the AI Game Master.",
  },
  {
    question: "Do I need to sign in? Is it free?",
    answer: "Sign in with Google to create adventures — it only takes a few seconds. New accounts get free starting credits so you can try the platform right away.",
  },
  {
    question: "Can I design my own RPG world?",
    answer: "Absolutely! Use the Create page to co-design your world with the AI Game Master. Describe the setting, tone, factions, and story hooks — the GM helps build the rules and lore. Your custom world is saved and can be played anytime.",
  },
  {
    question: "How much does it cost?",
    answer: "New accounts start with free credits. After that, you can purchase additional credits as needed — pricing is transparent and based on actual AI usage. No subscriptions or hidden fees.",
  },
];

const BASE_MARQUEE_CHARACTERS: MarqueeCharacter[] = [
  { name: "Isabelle Frost",  role: "Deceiver",    personality: "Cold and calculating, thrives in deception",       game: "AI Player" },
  { name: "Jasper Kane",     role: "Commander",    personality: "Dominant and intimidating, directs with precision", game: "AI Player" },
  { name: "Serena Lovelace", role: "Healer",       personality: "Gentle and nurturing, creates a peaceful atmosphere", game: "AI Player" },
  { name: "Arjun Nair",      role: "Diplomat",     personality: "Composed and insightful, provides balanced perspectives", game: "AI Player" },
  { name: "Zhao Mei",        role: "Enchantress",  personality: "Charming and persuasive, sways others with ease", game: "AI Player" },
  { name: "Silas Grey",      role: "Shadow",       personality: "Measured and ominous, adds suspense to every scene", game: "AI Player" },
  { name: "Lila Archer",     role: "Trickster",    personality: "Playful and mischievous, uses charm to sway others", game: "AI Player" },
  { name: "Kenji Yamamoto",  role: "Champion",     personality: "Dramatic and expressive, makes bold decisions",    game: "AI Player" },
  { name: "Haruka Tanaka",   role: "Bard",         personality: "Friendly and optimistic, brings joy to the group", game: "AI Player" },
];

/** Duplicated for seamless infinite marquee loop */
export const MARQUEE_CHARACTERS: MarqueeCharacter[] = [
  ...BASE_MARQUEE_CHARACTERS,
  ...BASE_MARQUEE_CHARACTERS,
];
