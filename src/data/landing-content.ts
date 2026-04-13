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
  dungeon: {
    title: "Dungeon Crawl",
    messages: [
      { isHost: true, name: "Chronicle", time: "Room 3", text: "The heavy stone door groans open. Torchlight reveals a circular chamber — three goblin scouts look up from a stolen supply crate, snarling." },
      { name: "Aldric", time: "Room 3", text: "[ACTION]draws sword[/ACTION] Finally. I was getting bored. Stay behind me!", role: "Knight", personality: "Brave and protective", gender: "male" },
      { name: "Lyra", time: "Room 3", text: "Wait — there's a fourth one hiding in the shadows. I can see it. Let me handle the sneak.", role: "Rogue", personality: "Sharp-eyed and cunning", gender: "female" },
      { name: "Aldric", time: "Room 3", text: "Then go. I'll hold the front three. Just don't miss.", role: "Knight", personality: "Brave and protective", gender: "male" },
    ],
  },
  wuxia: {
    title: "Wuxia Adventure",
    messages: [
      { isHost: true, name: "Chronicle", time: "Act 1", text: "The tournament grounds of Jade Peak are alive with color. Sect banners snap in the mountain wind. A gong sounds — the first round begins." },
      { name: "林剑心", time: "Act 1", text: "[ACTION]unsheathes sword slowly[/ACTION] My master said this tournament would test my resolve. I didn't expect to feel this nervous.", role: "Swordmaster", personality: "Disciplined but self-doubting", gender: "female" },
      { name: "方悟空", time: "Act 1", text: "Nervous? Ha! Look at our first opponent — he's shaking more than you are. This will be quick.", role: "Monk", personality: "Confident and teasing", gender: "male" },
      { name: "林剑心", time: "Act 1", text: "Don't underestimate anyone here. Last year's champion vanished — something is wrong at this tournament.", role: "Swordmaster", personality: "Disciplined but self-doubting", gender: "female" },
    ],
  },
  exploration: {
    title: "Open World",
    messages: [
      { isHost: true, name: "Chronicle", time: "Dawn", text: "The Rusty Flagon tavern is quiet this morning. A notice board by the door is covered in quest postings. The bartender polishes a mug, watching you with one eye." },
      { name: "Mira", time: "Dawn", text: "Check the notice board — there might be something worth our time. I'll ask the bartender if he's heard any rumors.", role: "Ranger", personality: "Practical and resourceful", gender: "female" },
      { name: "Kael", time: "Dawn", text: "[ACTION]reads the notice board[/ACTION] 'Missing merchant caravan — last seen heading north.' This one pays well.", role: "Rogue", personality: "Motivated by gold", gender: "male" },
      { name: "Mira", time: "Dawn", text: "North is the Darkwood. We'll need supplies first. And probably backup.", role: "Ranger", personality: "Practical and resourceful", gender: "female" },
    ],
  },
  boss: {
    title: "Boss Fight",
    messages: [
      { isHost: true, name: "Chronicle", time: "Phase 2", text: "The dragon roars, shaking loose stones from the cavern ceiling. Its scales glow molten red — it's entering its fury phase. The ground trembles." },
      { name: "Sera", time: "Phase 2", text: "[ACTION]raises healing staff[/ACTION] Aldric, your HP is critical! Get behind cover — NOW!", role: "Cleric", personality: "Fierce protector", gender: "female" },
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
    emoji: "⚔️",
    title: "The Tournament of Jade Peak",
    players: "Solo + 3 AI",
    tags: ["Wuxia", "Combat", "New"],
    description: "A martial arts tournament hides a deadly conspiracy. Fight, investigate, and decide the fate of the martial world.",
    cover: "/games/game-cover-script-kill-moonlight.webp",
    accent: "from-red-500/20 to-amber-500/10",
    border: "hover:border-red-500/50",
    presetId: "rpg-jade-peak",
  },
  {
    emoji: "🏰",
    title: "The Starfall Dungeon",
    players: "Solo + 3 AI",
    tags: ["Fantasy", "Dungeon Crawl"],
    description: "A meteorite opened a rift beneath the old castle. Explore the depths, fight monsters, and claim legendary loot.",
    cover: "/games/game-cover-werewolf.webp",
    accent: "from-violet-500/20 to-purple-500/10",
    border: "hover:border-violet-500/50",
    presetId: "rpg-starfall-dungeon",
  },
  {
    emoji: "🗺️",
    title: "The Cursed Crossroads",
    players: "Solo + 3 AI",
    tags: ["Fantasy", "Open World"],
    description: "An ancient curse is spreading across the land. Explore, recruit allies, and uncover the source before it's too late.",
    cover: "/games/game-cover-mafia.webp",
    accent: "from-emerald-500/20 to-teal-500/10",
    border: "hover:border-emerald-500/50",
    presetId: "rpg-cursed-crossroads",
  },
];

export const FAQ_ITEMS: FAQItem[] = [
  {
    question: "How do I start an adventure?",
    answer: "Sign in with Google, then browse RPG adventures on Discover — pick a preset like 'The Tournament of Jade Peak' or 'The Starfall Dungeon'. Click and you're in the game within seconds. AI party members are generated automatically. You can also design your own world from scratch.",
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
    answer: "We offer Western Fantasy and Wuxia (martial arts) worlds with pre-built adventures. You can also design your own custom world — define the setting, lore, magic system, and adventure hooks through conversation with the AI Game Master.",
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
  { name: "Aldric",  role: "Knight",            personality: "Stoic and honorable, rushes to protect others",     game: "Fantasy RPG" },
  { name: "Lyra",    role: "Rogue",             personality: "Sharp-tongued and street-smart, spots traps first", game: "Fantasy RPG" },
  { name: "Sera",    role: "Cleric",            personality: "Compassionate healer, judges silently",             game: "Fantasy RPG" },
  { name: "Kael",    role: "Ranger",            personality: "Quiet and observant, prefers the wilderness",       game: "Fantasy RPG" },
  { name: "林剑心",  role: "Swordmaster",       personality: "Disciplined, seeks harmony between body and blade", game: "Wuxia RPG" },
  { name: "方悟空",  role: "Monk",              personality: "Calm but fierce in combat, speaks in proverbs",     game: "Wuxia RPG" },
  { name: "Mira",    role: "Wandering Doctor",  personality: "Gentle-hearted, refuses to turn away from anyone",  game: "Wuxia RPG" },
  { name: "Dusk",    role: "Assassin",          personality: "Cold and professional, dry humor surfaces",         game: "Fantasy RPG" },
  { name: "Elara",   role: "Mage",              personality: "Intellectually curious, excited by anomalies",      game: "Fantasy RPG" },
];

/** Duplicated for seamless infinite marquee loop */
export const MARQUEE_CHARACTERS: MarqueeCharacter[] = [
  ...BASE_MARQUEE_CHARACTERS,
  ...BASE_MARQUEE_CHARACTERS,
];
