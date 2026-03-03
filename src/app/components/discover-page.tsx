"use client";

import { useState } from "react";
import Image from "next/image";
import { Users, Clock, Play, Lightbulb, Crown, Flame, Swords, Drama, MessageCircle, Search } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";

export interface DiscoverPreset {
  id: string;
  name: string;
  rules: string;
  templateId?: "werewolf" | "undercover" | "mafia" | "tarot" | "custom";
  playerCount?: number;
}

interface DiscoverPageProps {
  onCreateGame: (preset: DiscoverPreset) => void;
  onJoinGame?: (gameId: string) => void;
}

interface GameTemplate {
  id: string;
  name: string;
  description: string;
  longDescription?: string;
  icon: string;
  cover?: string;
  category: string;
  tags: string[];
  players: string;
  duration: string;
  style: "Casual" | "Strategic" | "Competitive";
  color: string;
  badge?: string;
  features?: string[];
  rules: string;
  templateId?: DiscoverPreset["templateId"];
  playerCount?: number;
}

const buildFallbackRules = (name: string) =>
  `OBJECTIVE: Play ${name} with clear goals and fair rules.\n\nSETUP:\n- Decide player count and roles\n- Prepare any materials or prompts\n\nGAMEPLAY:\n- Explain turn order\n- Define how players score or progress\n\nWINNING:\n- Decide how a winner is determined`;

const FEATURED_TEMPLATE: GameTemplate = {
  id: "werewolf-classic",
  name: "Werewolf: Blood Moon",
  description: "The ultimate social deduction experience. Villagers must identify and eliminate werewolves hiding among them before it's too late.",
  longDescription:
    "Step into a village plagued by werewolves. Each night, werewolves choose a victim. Each day, villagers vote to eliminate a suspect. Special roles like Seer, Doctor, and Hunter add strategic depth. Can you survive?",
  icon: "🐺",
  cover: "/games/game-cover-werewolf.webp",
  category: "Social Deduction",
  tags: ["Classic", "Strategy", "Deception", "Roleplay"],
  players: "6-12",
  duration: "30-45 min",
  style: "Strategic",
  color: "from-purple-900 to-indigo-900",
  features: [
    "🎭 8+ unique character roles",
    "🌙 Day/Night cycle gameplay",
    "🗳️ Democratic voting system",
    "💬 Group discussion phases",
  ],
  templateId: "werewolf",
  rules: `OBJECTIVE: Villagers must find and eliminate all Werewolves. Werewolves must eliminate all Villagers.

PHASES:
1. Night Phase - Werewolves choose a victim
2. Day Phase - All players discuss and vote to eliminate someone

ROLES:
- Villagers: Innocent townspeople
- Werewolves: Kill one villager each night
- Seer: Can check one player's role each night
- Doctor: Can protect one player each night

RULES:
- Once rules are set, they cannot be changed
- Host controls all phases
- Dead players cannot communicate
- Majority vote eliminates a player`,
};

const CORE_TEMPLATES: GameTemplate[] = [
  {
    id: "codenames",
    name: "Codenames",
    description: "Two teams compete to identify their agents using one-word clues. Creative thinking required!",
    icon: "🔍",
    cover: "/games/game-cover-codenames.webp",
    category: "Party",
    tags: ["Team Game", "Word Association", "Strategic"],
    players: "4-12",
    duration: "15-25 min",
    style: "Casual",
    color: "from-orange-600 to-red-600",
    badge: "🔥 Most Popular",
    rules: `OBJECTIVE: Two teams compete to contact all their agents first using one-word clues.

SETUP:
- 25 word cards in a 5x5 grid
- Spymasters know which words belong to which team
- Each team has 8-9 agents, one assassin

GAMEPLAY:
- Spymaster gives a one-word clue + number
- Team guesses which words match
- Wrong guess ends turn; assassin loses game

WINNING:
- First team to find all agents wins
- Hitting assassin loses immediately`,
  },
  {
    id: "avalon",
    name: "Avalon: Quest for Honor",
    description: "Knights of the Round Table must complete quests, but traitors hide among them.",
    icon: "⚔️",
    cover: "/games/game-cover-avalon.webp",
    category: "Social Deduction",
    tags: ["Strategic", "Team-based", "Hidden Roles"],
    players: "5-10",
    duration: "30-40 min",
    style: "Strategic",
    color: "from-blue-700 to-indigo-800",
    badge: "⭐ Classic",
    rules: `OBJECTIVE: Good players complete 3 quests; Evil players sabotage from within.

SETUP:
- Assign roles: Merlin, Assassin, Servants of Arthur, Minions of Mordred
- 5 quest rounds with varying team sizes

GAMEPLAY:
- Leader nominates a team for each quest
- Team votes; if approved, hidden votes determine success
- Evil players can sabotage quests

WINNING:
- Good wins 3 quests and Merlin survives Assassin's guess
- Evil wins 3 failed quests or Assassin guesses Merlin`,
  },
  {
    id: "undercover-party",
    name: "Undercover Agent",
    description: "Find the spy among you by describing secret words. Fast-paced word association game.",
    icon: "🕵️",
    cover: "/games/game-cover-undercover.webp",
    category: "Party",
    tags: ["Quick Play", "Word Game", "Beginner Friendly"],
    players: "4-10",
    duration: "15-20 min",
    style: "Casual",
    color: "from-blue-600 to-cyan-600",
    badge: "✨ Quick & Fun",
    templateId: "undercover",
    rules: `OBJECTIVE: Civilians find the Undercover. Undercover tries to blend in and survive.

SETUP:
- Most players get the same word (Civilians)
- One player gets a similar but different word (Undercover)
- One player gets a completely different word (Mr. White - optional)

GAMEPLAY:
1. Each player describes their word in one sentence
2. Vote to eliminate the suspected Undercover
3. Eliminated player reveals their role
4. Continue until Undercover is found or wins

WINNING:
- Civilians win if they eliminate the Undercover
- Undercover wins if they survive to final 3 players`,
  },
];

const SOCIAL_DEDUCTION: GameTemplate[] = [
  {
    id: "mafia-night",
    name: "Mafia: City of Shadows",
    description: "Complex game of lies and deception. Multiple factions, hidden agendas, and intense strategy.",
    icon: "🎭",
    cover: "/games/game-cover-mafia.webp",
    category: "Social Deduction",
    tags: ["Advanced", "Roleplay", "Strategic"],
    players: "6-15",
    duration: "45-60 min",
    style: "Competitive",
    color: "from-red-600 to-pink-600",
    templateId: "mafia",
    rules: `OBJECTIVE: Townspeople eliminate all Mafia. Mafia eliminate all Townspeople.

SETUP:
- Roles: Mafia (1-3), Detective (1), Doctor (1), Townspeople
- GM moderates night and day phases

PHASES:
1. Night: Mafia choose a target; Detective investigates; Doctor saves
2. Day: Discussion and voting to eliminate a suspect

WINNING:
- Town wins if all Mafia are eliminated
- Mafia wins when Mafia equal or outnumber Town`,
  },
  {
    id: "secret-hitler",
    name: "Secret Hitler",
    cover: "/games/game-cover-secret-hitler.webp",
    description: "Political intrigue in 1930s Germany. Liberals vs Fascists. Identify Hitler before it's too late.",
    icon: "🎩",
    category: "Social Deduction",
    tags: ["Political", "Deception", "Team-based"],
    players: "5-10",
    duration: "30-45 min",
    style: "Strategic",
    color: "from-gray-700 to-red-800",
    rules: buildFallbackRules("Secret Hitler"),
  },
  {
    id: "spyfall",
    name: "Spyfall",
    cover: "/games/game-cover-spyfall.webp",
    description: "Everyone knows the location except the spy. Ask questions to find who doesn't belong.",
    icon: "🌍",
    category: "Social Deduction",
    tags: ["Quick", "Deduction", "Bluffing"],
    players: "3-8",
    duration: "15-20 min",
    style: "Casual",
    color: "from-green-600 to-teal-600",
    rules: buildFallbackRules("Spyfall"),
  },
  {
    id: "resistance",
    name: "The Resistance",
    cover: "/games/game-cover-resistance.webp",
    description: "Rebels fight against the Empire. Complete missions while spies sabotage from within.",
    icon: "🤐",
    category: "Social Deduction",
    tags: ["Team-based", "Missions", "Fast-paced"],
    players: "5-10",
    duration: "30-40 min",
    style: "Strategic",
    color: "from-indigo-700 to-purple-700",
    rules: buildFallbackRules("The Resistance"),
  },
];

const PARTY_GAMES: GameTemplate[] = [
  {
    id: "who-most-likely",
    name: "Who's Most Likely",
    cover: "/games/game-cover-who-most-likely.webp",
    description: "Vote on who's most likely to do hilarious scenarios. Perfect icebreaker!",
    icon: "🤔",
    category: "Party",
    tags: ["Icebreaker", "Voting", "Funny"],
    players: "3-12",
    duration: "10-20 min",
    style: "Casual",
    color: "from-pink-600 to-rose-600",
    rules: buildFallbackRules("Who's Most Likely"),
  },
  {
    id: "20-questions",
    name: "20 Questions",
    cover: "/games/game-cover-20-questions.webp",
    description: "Think of something, others ask yes/no questions. Can they guess it in 20 tries?",
    icon: "❓",
    category: "Party",
    tags: ["Classic", "Guessing", "Family Friendly"],
    players: "2-10",
    duration: "10-15 min",
    style: "Casual",
    color: "from-blue-500 to-cyan-500",
    rules: buildFallbackRules("20 Questions"),
  },
  {
    id: "two-truths-lie",
    name: "Two Truths and a Lie",
    cover: "/games/game-cover-two-truths.webp",
    description: "Share three statements about yourself. Others guess which one is false!",
    icon: "🤥",
    category: "Party",
    tags: ["Icebreaker", "Social", "Personal"],
    players: "3-12",
    duration: "15-25 min",
    style: "Casual",
    color: "from-green-500 to-emerald-500",
    rules: buildFallbackRules("Two Truths and a Lie"),
  },
  {
    id: "two-rooms",
    name: "Two Rooms and a Boom",
    cover: "/games/game-cover-two-rooms.webp",
    description: "Players split into two rooms. The President must survive, the Bomber must get close.",
    icon: "💣",
    category: "Party",
    tags: ["Chaotic", "Negotiation", "Team-based"],
    players: "6-20",
    duration: "20-30 min",
    style: "Strategic",
    color: "from-red-700 to-orange-700",
    rules: buildFallbackRules("Two Rooms and a Boom"),
  },
];

const MYSTERY_GAMES: GameTemplate[] = [
  {
    id: "detective-mystery",
    name: "Detective Mystery",
    description: "Solve intricate cases by gathering clues, interrogating suspects, and catching culprits.",
    icon: "🔎",
    cover: "/games/game-cover-detective.webp",
    category: "Mystery",
    tags: ["Deduction", "Story-Rich", "Investigation"],
    players: "3-8",
    duration: "30-40 min",
    style: "Strategic",
    color: "from-amber-600 to-orange-600",
    rules: `OBJECTIVE: Identify the culprit, motive, and method before time runs out.

SETUP:
- GM prepares a case with suspects, clues, and locations
- Each player gets a role (Detective, Suspect, Witness)

GAMEPLAY:
1. Briefing by GM
2. Investigation rounds: ask questions, gather clues
3. Reveal round: share evidence and form a theory
4. Accusation: name culprit, motive, and method

WINNING:
- Detectives win if all three are correct
- Culprit wins if time runs out or accusation is wrong`,
  },
  {
    id: "clue",
    name: "Clue: Mansion Murder",
    cover: "/games/game-cover-clue.webp",
    description: "Classic whodunit. Was it Colonel Mustard in the Library with the Candlestick?",
    icon: "🔪",
    category: "Mystery",
    tags: ["Classic", "Deduction", "Investigation"],
    players: "3-6",
    duration: "30-45 min",
    style: "Casual",
    color: "from-purple-700 to-indigo-700",
    rules: buildFallbackRules("Clue"),
  },
];

const ROLEPLAY_GAMES: GameTemplate[] = [
  {
    id: "tarot-reading",
    name: "Tarot Reading",
    description: "A reflective Tarot reading with the Host as reader. Ask a question and receive card-based guidance.",
    icon: "🃏",
    cover: "/games/game-cover-tarot.webp",
    category: "Solo",
    tags: ["Reflection", "Mystical", "Solo"],
    players: "1",
    duration: "10-20 min",
    style: "Casual",
    color: "from-amber-700 to-yellow-600",
    templateId: "tarot",
    playerCount: 0,
    rules: `SETTING: Calm, reflective space. Host acts as Tarot reader; you are the Querent.

OBJECTIVE: Ask a question or request a general reading. Host uses a 78-card deck and interprets each card.

SPREADS: Single card, Three cards (Past/Present/Future), Celtic Cross.
No win/lose—session ends when the reading feels complete.`,
  },
  {
    id: "improv-comedy",
    name: "Improv Comedy",
    cover: "/games/game-cover-improv.webp",
    description: "Take on random scenarios and characters. Make your friends laugh with spontaneous creativity!",
    icon: "🎭",
    category: "Creative",
    tags: ["Comedy", "Roleplay", "Creative"],
    players: "3-10",
    duration: "20-40 min",
    style: "Casual",
    color: "from-fuchsia-600 to-pink-600",
    rules: buildFallbackRules("Improv Comedy"),
  },
  {
    id: "storyteller",
    name: "Epic Storyteller",
    cover: "/games/game-cover-storyteller.webp",
    description: "Collaborative storytelling where each player adds to an evolving narrative adventure.",
    icon: "📖",
    category: "Creative",
    tags: ["Cooperative", "Creative", "Open-ended"],
    players: "3-8",
    duration: "30-50 min",
    style: "Casual",
    color: "from-violet-600 to-purple-600",
    rules: `OBJECTIVE: Create a cohesive story together.

SETUP:
- Choose a theme and starting prompt
- Optional: give each player a keyword to include

GAMEPLAY:
1. Turn order is clockwise
2. Each turn add 1-3 sentences
3. Include your keyword before your next turn ends

WINNING:
- Cooperative by default
- Optional MVP vote for most creative contribution`,
  },
];

const EDUCATIONAL_GAMES: GameTemplate[] = [
  {
    id: "trivia",
    name: "Trivia Championship",
    cover: "/games/game-cover-trivia.webp",
    description: "Test your knowledge across history, science, pop culture and more.",
    icon: "💡",
    category: "Knowledge",
    tags: ["Educational", "Quick", "Competitive"],
    players: "2-10",
    duration: "20-30 min",
    style: "Casual",
    color: "from-yellow-600 to-orange-600",
    rules: `OBJECTIVE: Score the most points by answering questions.

SETUP:
- Choose categories and style
- Decide round count and scoring rules

GAMEPLAY:
- GM asks a question; players answer within time
- Correct answer = 1 point

WINNING:
- Highest score after all rounds wins`,
  },
  {
    id: "debate",
    name: "Debate Arena",
    cover: "/games/game-cover-debate.webp",
    description: "Argue your case on philosophy, ethics, and logic. Best argument wins.",
    icon: "⚖️",
    category: "Educational",
    tags: ["Debate", "Persuasion", "Critical Thinking"],
    players: "2-8",
    duration: "25-35 min",
    style: "Strategic",
    color: "from-indigo-600 to-purple-600",
    rules: buildFallbackRules("Debate Arena"),
  },
  {
    id: "escape-room",
    name: "The Time Vault",
    description: "Work together to solve interconnected puzzles and escape before time runs out.",
    icon: "🚪",
    cover: "/games/game-cover-escape-room.webp",
    category: "Puzzle",
    tags: ["Cooperative", "Logic", "Teamwork"],
    players: "2-6",
    duration: "40-60 min",
    style: "Competitive",
    color: "from-green-600 to-emerald-600",
    rules: `OBJECTIVE: Solve puzzles to escape before the timer ends.

SETUP:
- GM prepares 3-5 puzzles and locked objectives
- Players start with 1-2 clues
- Set a time limit (30-60 minutes)

GAMEPLAY:
- Solve puzzles to unlock codes, items, or new rooms
- Players may combine clues across puzzles
- GM can offer limited hints

WINNING:
- Players win if they complete the final lock in time
- Players lose if time expires`,
  },
];

const ALL_PRESETS: GameTemplate[] = [
  FEATURED_TEMPLATE,
  ...CORE_TEMPLATES,
  ...SOCIAL_DEDUCTION,
  ...PARTY_GAMES,
  ...MYSTERY_GAMES,
  ...ROLEPLAY_GAMES,
  ...EDUCATIONAL_GAMES,
];

export function getPresetById(presetId: string | null): DiscoverPreset | null {
  if (!presetId) return null;
  const t = ALL_PRESETS.find((g) => g.id === presetId);
  if (!t) return null;
  return {
    id: t.id,
    name: t.name,
    rules: t.rules,
    templateId: (t.templateId ?? "custom") as DiscoverPreset["templateId"],
    playerCount: t.playerCount,
  };
}

const CATEGORIES = [
  { id: "all",       label: "All Games",       icon: Flame },
  { id: "deduction", label: "Social Deduction", icon: Swords },
  { id: "party",     label: "Party",            icon: MessageCircle },
  { id: "mystery",   label: "Mystery",          icon: Search },
  { id: "creative",  label: "Creative",         icon: Drama },
  { id: "brain",     label: "Brain Games",      icon: Lightbulb },
] as const;

const CATEGORY_MAP: Record<string, GameTemplate[]> = {
  deduction: [...CORE_TEMPLATES.filter(t => t.category === "Social Deduction"), ...SOCIAL_DEDUCTION],
  party:     PARTY_GAMES,
  mystery:   MYSTERY_GAMES,
  creative:  ROLEPLAY_GAMES,
  brain:     EDUCATIONAL_GAMES,
};

export function DiscoverPage({ onCreateGame }: DiscoverPageProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const getStyleColor = (style: string) => {
    switch (style) {
      case "Casual":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
      case "Strategic":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
      case "Competitive":
        return "bg-red-500/20 text-red-300 border-red-500/30";
      default:
        return "bg-zinc-500/20 text-zinc-300 border-zinc-500/30";
    }
  };

  const toPreset = (t: GameTemplate): DiscoverPreset => ({
    id: t.id,
    name: t.name,
    rules: t.rules,
    templateId: (t.templateId ?? "custom") as DiscoverPreset["templateId"],
    playerCount: t.playerCount,
  });

  const handleSelect = (t: GameTemplate) => {
    const preset = toPreset(t);
    onCreateGame({ ...preset, rules: preset.rules?.trim() || buildFallbackRules(preset.name) });
  };

  const renderGameCard = (template: GameTemplate, size: "small" | "medium" = "small") => {
    if (size === "medium") {
      return (
        <div
          key={template.id}
          className="group relative bg-zinc-900/60 border border-zinc-800 hover:border-violet-500/50 rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 cursor-pointer"
          onClick={() => handleSelect(template)}
        >
          {/* Cover image */}
          <div className="relative h-36 overflow-hidden">
            {template.cover ? (
              <Image
                src={template.cover}
                alt={template.name}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${template.color} flex items-center justify-center text-5xl`}>
                {template.icon}
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/20 to-transparent" />
            {template.badge && (
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-zinc-950/70 backdrop-blur-sm border border-zinc-700 text-xs font-bold text-white">
                {template.badge}
              </div>
            )}
          </div>

          <div className="p-5">
            <h3 className="text-base font-black text-white mb-1.5 group-hover:text-violet-300 transition-colors">
              {template.name}
            </h3>

            <p className="text-sm text-zinc-400 mb-4 leading-relaxed line-clamp-2">{template.description}</p>

            <div className="flex items-center gap-3 text-xs text-zinc-500 mb-4">
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                <span>{template.players}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>{template.duration}</span>
              </div>
              <Badge className={`${getStyleColor(template.style)} border text-xs`}>{template.style}</Badge>
            </div>

            <Button size="sm" className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold">
              <Play className="h-3.5 w-3.5 mr-2" />
              Use Template
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div
        key={template.id}
        className="group relative bg-zinc-900/40 border border-zinc-800 hover:border-violet-500/40 rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 cursor-pointer"
        onClick={() => handleSelect(template)}
      >
        {/* Cover */}
        <div className="relative h-36 overflow-hidden">
          {template.cover ? (
            <Image
              src={template.cover}
              alt={template.name}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 100vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${template.color} flex items-center justify-center text-4xl`}>
              {template.icon}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/20 to-transparent" />
          <div className="absolute top-2.5 right-2.5">
            <Badge className={`${getStyleColor(template.style)} border text-[10px]`}>{template.style}</Badge>
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-sm font-black text-white mb-1 group-hover:text-violet-300 transition-colors leading-tight">
            {template.name}
          </h3>

          <p className="text-xs text-zinc-500 mb-3 line-clamp-2 leading-relaxed">{template.description}</p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-zinc-600">
              <Users className="h-3 w-3" />
              <span>{template.players}</span>
              <span className="text-zinc-700">·</span>
              <Clock className="h-3 w-3" />
              <span>{template.duration}</span>
            </div>
            <span className="text-xs font-semibold text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity">
              Play →
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Filtered game list for non-"all" tabs
  const filteredGames = (() => {
    const pool = activeCategory === "all"
      ? [...CORE_TEMPLATES, ...SOCIAL_DEDUCTION, ...PARTY_GAMES, ...MYSTERY_GAMES, ...ROLEPLAY_GAMES, ...EDUCATIONAL_GAMES]
      : (CATEGORY_MAP[activeCategory] ?? []);
    if (!searchQuery.trim()) return pool;
    const q = searchQuery.toLowerCase();
    return pool.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  })();

  return (
    <div className="flex-1 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 overflow-y-auto">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(139,92,246,0.12),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(236,72,153,0.08),transparent_50%)] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-8 py-10">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black text-white mb-3 tracking-tight">
            Choose Your <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">Adventure</span>
          </h1>
          <p className="text-lg text-zinc-400 max-w-xl mx-auto">
            Conversation-based games powered by AI. Pick a template and start playing in seconds.
          </p>
        </div>

        {/* Featured Template — only show on "all" tab with no search */}
        {activeCategory === "all" && !searchQuery && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Crown className="h-5 w-5 text-yellow-500" />
              <h2 className="text-lg font-black text-white">Featured This Week</h2>
            </div>

            <div
              className="relative group rounded-2xl overflow-hidden border border-zinc-800 hover:border-violet-500/50 transition-all cursor-pointer"
              onClick={() => handleSelect(FEATURED_TEMPLATE)}
            >
              {FEATURED_TEMPLATE.cover && (
                <div className="absolute inset-0">
                  <Image
                    src={FEATURED_TEMPLATE.cover}
                    alt={FEATURED_TEMPLATE.name}
                    fill
                    priority
                    fetchPriority="high"
                    sizes="(min-width: 1024px) 900px, 100vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/85 to-zinc-950/50" />
                </div>
              )}

              <div className="relative p-8 flex gap-8 min-h-[240px] items-center">
                <div className="flex-1 max-w-2xl">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{FEATURED_TEMPLATE.icon}</span>
                    <div className="flex gap-2">
                      {FEATURED_TEMPLATE.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="text-[11px] font-bold px-2 py-0.5 bg-violet-500/20 text-violet-300 border border-violet-500/30 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <h3 className="text-3xl font-black text-white mb-2 group-hover:text-violet-300 transition-colors">
                    {FEATURED_TEMPLATE.name}
                  </h3>
                  <p className="text-zinc-300 mb-4 text-base leading-relaxed">{FEATURED_TEMPLATE.longDescription}</p>
                  {FEATURED_TEMPLATE.features && (
                    <div className="grid grid-cols-2 gap-2 mb-5">
                      {FEATURED_TEMPLATE.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-zinc-400">
                          <div className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-5 text-sm text-zinc-400">
                      <div className="flex items-center gap-1.5"><Users className="h-4 w-4" /><span>{FEATURED_TEMPLATE.players}</span></div>
                      <div className="flex items-center gap-1.5"><Clock className="h-4 w-4" /><span>{FEATURED_TEMPLATE.duration}</span></div>
                      <Badge className={`${getStyleColor(FEATURED_TEMPLATE.style)} border text-xs font-bold`}>{FEATURED_TEMPLATE.style}</Badge>
                    </div>
                    <Button
                      onClick={(e) => { e.stopPropagation(); handleSelect(FEATURED_TEMPLATE); }}
                      className="ml-auto bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold shadow-lg shadow-violet-900/40"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Play Now
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Category Tabs + Search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {CATEGORIES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveCategory(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  activeCategory === id
                    ? "bg-violet-600 text-white shadow-md shadow-violet-900/40"
                    : "bg-zinc-800/60 text-zinc-400 hover:text-white hover:bg-zinc-700"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            <input
              id="discover-search"
              name="discover-search"
              type="text"
              placeholder="Search games..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-800/60 border border-zinc-700 rounded-lg pl-8 pr-3 py-1.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/60 transition-colors"
            />
          </div>
        </div>

        {/* Game Grid */}
        {filteredGames.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredGames.map((template) => renderGameCard(template, "small"))}
          </div>
        ) : (
          <div className="text-center py-20 text-zinc-500">
            <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-semibold">No games found</p>
            <p className="text-sm mt-1">Try a different keyword or category</p>
          </div>
        )}
      </div>
    </div>
  );
}
