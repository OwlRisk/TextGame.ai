/**
 * SEO-enriched game data for /games/[slug] landing pages.
 * Kept separate from discover-page.tsx (client component) so Server Components can import it.
 */

export interface GameSEOData {
  slug: string;
  /** templateId used in /create?preset= */
  presetId: string;
  name: string;
  tagline: string;
  description: string;
  /** For <meta name="description"> */
  metaDescription: string;
  keywords: string[];
  icon: string;
  coverImage?: string;
  players: string;
  duration: string;
  difficulty: "Easy" | "Medium" | "Hard";
  category: string;
  /** Detailed how-to-play steps */
  howToPlay: string[];
  /** Roles with name + description */
  roles?: { name: string; description: string }[];
  /** Feature highlights shown on the landing page */
  features: string[];
  /** Related game slugs */
  related: string[];
}

export const GAME_SEO_DATA: GameSEOData[] = [
  {
    slug: "werewolf",
    presetId: "werewolf-classic",
    name: "Werewolf",
    tagline: "A classic social deduction game powered by AI",
    description:
      "Step into a village haunted by werewolves. By day, debate and vote to eliminate suspects. By night, the wolves hunt. With an AI game master running every phase, you can play Werewolf online anytime — no moderator needed.",
    metaDescription:
      "Play Werewolf online with an AI game master. No moderator needed — the AI runs night/day phases, assigns roles, and keeps the game moving. Free to play.",
    keywords: [
      "werewolf game online",
      "AI werewolf",
      "play werewolf online",
      "werewolf social deduction",
      "online werewolf game free",
      "AI game master werewolf",
    ],
    icon: "🐺",
    coverImage: "/games/game-cover-werewolf.webp",
    players: "6–12",
    duration: "30–45 min",
    difficulty: "Medium",
    category: "Social Deduction",
    howToPlay: [
      "The AI host secretly assigns roles: Villagers, Werewolves, Seer, and Doctor.",
      "Night phase — Werewolves choose a victim; Seer investigates one player; Doctor protects one player.",
      "Day phase — All living players discuss who they suspect, then vote to eliminate one.",
      "The eliminated player's role is revealed.",
      "Repeat until all Werewolves are eliminated (Villagers win) or Werewolves equal the Villagers (Werewolves win).",
    ],
    roles: [
      { name: "Villager", description: "Innocent townsfolk with no special power. Your weapon is deduction and persuasion." },
      { name: "Werewolf", description: "Secretly eliminate one Villager each night. Blend in during the day to avoid suspicion." },
      { name: "Seer", description: "Each night, learn the true role of one player. Guide the village with your knowledge." },
      { name: "Doctor", description: "Each night, protect one player from the Werewolves. You can save yourself once." },
    ],
    features: [
      "AI host runs every phase automatically",
      "Supports 6–12 players",
      "No signup required to play",
      "Fully voiced AI characters",
      "Day/Night cycle with real discussion",
    ],
    related: ["mafia", "avalon", "undercover"],
  },
  {
    slug: "mafia",
    presetId: "mafia-night",
    name: "Mafia",
    tagline: "Lies, deception, and survival in the city of shadows",
    description:
      "The Mafia has infiltrated your town. By day, townsfolk debate and vote. By night, the Mafia strikes. Play the classic Mafia party game online with an AI host that manages all the roles, phases, and drama — no human moderator required.",
    metaDescription:
      "Play Mafia online with friends — AI-powered game master handles all phases. Assign roles, run night actions, and host dramatic day votes automatically.",
    keywords: [
      "mafia game online",
      "play mafia online",
      "AI mafia game",
      "mafia party game",
      "online mafia game free",
      "mafia social deduction",
    ],
    icon: "🎭",
    coverImage: "/games/game-cover-mafia.webp",
    players: "6–15",
    duration: "45–60 min",
    difficulty: "Hard",
    category: "Social Deduction",
    howToPlay: [
      "The AI host assigns roles: Town Members, Mafia, Detective, and Doctor.",
      "Night phase — Mafia choose a victim; Detective investigates; Doctor protects.",
      "Day phase — Everyone discusses suspicions openly, then votes to eliminate one player.",
      "The eliminated player's true role is revealed to everyone.",
      "Town wins when all Mafia are gone. Mafia wins when they equal the remaining Town.",
    ],
    roles: [
      { name: "Town Member", description: "An ordinary citizen. Use logic and observation to root out the Mafia." },
      { name: "Mafia", description: "Coordinate at night to eliminate a Town Member. Lie convincingly during the day." },
      { name: "Detective", description: "Investigate one player each night and learn their true alignment." },
      { name: "Doctor", description: "Protect one player from the Mafia's nightly attack." },
    ],
    features: [
      "Supports up to 15 players",
      "AI moderates night actions secretly",
      "Dramatic day discussion phases",
      "Multiple faction roles",
      "Fully hosted — no moderator needed",
    ],
    related: ["werewolf", "avalon", "resistance"],
  },
  {
    slug: "undercover",
    presetId: "undercover-party",
    name: "Undercover (Who's the Spy)",
    tagline: "Find the spy — or be the spy",
    description:
      "Everyone gets a secret word — almost. One player (the Undercover) has a subtly different word. Describe yours without giving it away, then vote out the spy before they fool everyone. A fast, fun word-guessing game perfect for any group.",
    metaDescription:
      "Play Undercover (Who's the Spy) online free. Describe your secret word, find the spy among your group. AI game master runs the whole game — no setup needed.",
    keywords: [
      "undercover game online",
      "who is the spy game",
      "spy word game online",
      "undercover party game",
      "word guessing game online",
      "find the spy game",
    ],
    icon: "🕵️",
    coverImage: "/games/game-cover-undercover.webp",
    players: "4–10",
    duration: "15–20 min",
    difficulty: "Easy",
    category: "Party",
    howToPlay: [
      "The AI host secretly assigns words: most players get the same word (Civilians); one player gets a similar but different word (Undercover); optionally one player gets no word (Mr. White).",
      "Starting with a random player, each person gives a one-sentence description of their word — without saying the word itself.",
      "After everyone has described, players vote to eliminate the most suspicious player.",
      "The eliminated player reveals their role and word.",
      "Repeat until the Undercover is found or wins by surviving to the final 3.",
    ],
    roles: [
      { name: "Civilian", description: "You have the common word. Describe it clearly enough to convince others you're not the spy — without making it obvious." },
      { name: "Undercover", description: "Your word is close but different. Listen, blend in, and survive. Win by reaching the final 3." },
      { name: "Mr. White", description: "You have no word at all. Bluff your way through — and win by guessing the Civilians' word when eliminated." },
    ],
    features: [
      "Quick 15–20 minute sessions",
      "Perfect for 4–10 players",
      "No prep needed — AI generates words",
      "Beginner friendly",
      "Works great on video calls",
    ],
    related: ["werewolf", "spyfall", "two-truths-lie"],
  },
  {
    slug: "avalon",
    presetId: "avalon",
    name: "Avalon: Quest for Honor",
    tagline: "Knights of the Round Table — trust no one",
    description:
      "The forces of Good must complete three quests to save Camelot, but the forces of Evil lurk among the Knights. Merlin knows who the traitors are — but if he's identified by the Assassin, all is lost. Play this Arthurian social deduction game online with a full AI host.",
    metaDescription:
      "Play Avalon online with an AI game master. Knights vs traitors — complete quests, protect Merlin, and root out evil. No moderator needed.",
    keywords: [
      "avalon game online",
      "play avalon online",
      "avalon resistance game",
      "AI avalon game",
      "social deduction game online",
      "knights hidden role game",
    ],
    icon: "⚔️",
    coverImage: "/games/game-cover-avalon.webp",
    players: "5–10",
    duration: "30–40 min",
    difficulty: "Medium",
    category: "Social Deduction",
    howToPlay: [
      "The AI host assigns roles: Merlin, Percival, Servants of Arthur (Good) vs Assassin, Mordred, Minions of Mordred (Evil).",
      "The Leader nominates a team for the current quest. Everyone votes to approve or reject.",
      "If approved, team members secretly vote Success or Fail. Evil players can choose to Fail.",
      "Three successful quests wins for Good; three failed quests wins for Evil.",
      "If Good wins three quests, the Assassin gets one chance to identify Merlin. If correct, Evil wins.",
    ],
    roles: [
      { name: "Merlin", description: "Knows all Evil players. Must guide Good subtly without revealing yourself to the Assassin." },
      { name: "Assassin", description: "Knows fellow Evil players. If Good wins, you get one shot to identify and eliminate Merlin." },
      { name: "Percival", description: "Knows who Merlin is. Protect his identity while guiding the team." },
      { name: "Servants of Arthur", description: "Loyal knights with no special knowledge. Trust your instincts." },
      { name: "Minions of Mordred", description: "Sabotage quests from within and protect your identity." },
    ],
    features: [
      "Complex multi-faction gameplay",
      "AI manages secret roles and voting",
      "5–10 players supported",
      "Arthurian roleplay atmosphere",
      "Strategic depth with every play",
    ],
    related: ["werewolf", "resistance", "mafia"],
  },
  {
    slug: "detective-mystery",
    presetId: "detective-mystery",
    name: "Detective Mystery",
    tagline: "Solve the case before the culprit escapes",
    description:
      "A murder has been committed. Suspects are hiding secrets. As a detective, you must gather clues, interrogate witnesses, and accuse the right culprit — with the right motive and the right method. The AI host generates the case and plays every suspect.",
    metaDescription:
      "Play a detective mystery game online. AI creates unique murder cases, plays suspects, and judges your accusation. Can you solve the crime?",
    keywords: [
      "detective game online",
      "murder mystery game online",
      "AI detective mystery",
      "solve a mystery online game",
      "online murder mystery",
      "whodunit game",
    ],
    icon: "🔎",
    coverImage: "/games/game-cover-detective.webp",
    players: "3–8",
    duration: "30–40 min",
    difficulty: "Medium",
    category: "Mystery",
    howToPlay: [
      "The AI host generates a unique murder case: a victim, suspects, locations, and clues.",
      "Players receive their roles — Detectives or Suspects.",
      "During investigation rounds, ask questions and gather evidence from witnesses and suspects.",
      "In the reveal round, players share evidence and form theories.",
      "Make your accusation: name the culprit, motive, and method. All three must be correct to win.",
    ],
    roles: [
      { name: "Detective", description: "Gather clues and interrogate suspects. Name the culprit, motive, and method to win." },
      { name: "Suspect", description: "You might be innocent — or you might be the killer. Answer questions carefully." },
      { name: "Witness", description: "You've seen something. Share what you know, but be careful about what you reveal." },
    ],
    features: [
      "AI generates a unique case every game",
      "Fully voiced suspects and witnesses",
      "3–8 players or solo investigation",
      "Rich story-driven gameplay",
      "Multiple mystery genres",
    ],
    related: ["clue", "spyfall", "escape-room"],
  },
  {
    slug: "escape-room",
    presetId: "escape-room",
    name: "Escape Room: The Time Vault",
    tagline: "Solve puzzles together before time runs out",
    description:
      "You're locked in a room filled with interconnected puzzles. Work as a team to decode clues, unlock hidden mechanisms, and escape before the clock hits zero. The AI host acts as the room's narrator — setting the scene, responding to your actions, and revealing new puzzles as you progress.",
    metaDescription:
      "Play an AI-hosted escape room online free. Solve puzzles, find clues, and escape together. The AI game master narrates and responds to every action in real time.",
    keywords: [
      "online escape room",
      "AI escape room game",
      "virtual escape room free",
      "escape room online multiplayer",
      "text escape room",
      "AI puzzle game online",
    ],
    icon: "🚪",
    coverImage: "/games/game-cover-escape-room.webp",
    players: "2–6",
    duration: "40–60 min",
    difficulty: "Hard",
    category: "Puzzle",
    howToPlay: [
      "The AI host sets the scene and describes the room, objects, and your starting clues.",
      "Explore the room by asking about objects, combining clues, and proposing solutions.",
      "Solve 3–5 interconnected puzzles to unlock codes, items, and hidden doors.",
      "Players may share clues and work together across the chat.",
      "Complete the final lock before the timer runs out to escape.",
    ],
    features: [
      "AI generates unique room layouts",
      "Real-time narrative responses",
      "2–6 player co-op",
      "Hints available from the AI host",
      "Multiple difficulty settings",
    ],
    related: ["detective-mystery", "trivia", "avalon"],
  },
  {
    slug: "trivia",
    presetId: "trivia",
    name: "Trivia Championship",
    tagline: "Test your knowledge across every topic",
    description:
      "Go head-to-head on history, science, pop culture, sports, and more. The AI host generates questions on any topic you choose, keeps score in real time, and adjusts difficulty to keep every round exciting.",
    metaDescription:
      "Play AI-powered trivia online free. Choose any topic, any difficulty. The AI game master asks questions, judges answers, and keeps score automatically.",
    keywords: [
      "trivia game online",
      "AI trivia game",
      "online quiz game",
      "trivia night online",
      "multiplayer trivia",
      "free trivia game",
    ],
    icon: "💡",
    coverImage: "/games/game-cover-trivia.webp",
    players: "2–10",
    duration: "20–30 min",
    difficulty: "Easy",
    category: "Knowledge",
    howToPlay: [
      "Choose your topics (history, science, movies, sports, etc.) and the number of rounds.",
      "The AI host asks one question per round to all players.",
      "Players answer in the chat — first correct answer scores a point.",
      "The AI host tracks scores and announces the leaderboard after each round.",
      "After all rounds, the highest scorer wins the championship.",
    ],
    features: [
      "Any topic — AI generates questions on demand",
      "2–10 players",
      "Instant answer checking",
      "Customizable difficulty",
      "Multiple rounds and categories",
    ],
    related: ["debate", "two-truths-lie", "20-questions"],
  },
  {
    slug: "tarot",
    presetId: "tarot-reading",
    name: "Tarot Reading",
    tagline: "A mystical card reading, guided by AI",
    description:
      "Ask a question, draw your cards, and let the AI reader interpret their meaning. Whether you want a single daily card or a full Celtic Cross spread, the AI host adapts to your question and guides you through each card's symbolism and guidance.",
    metaDescription:
      "Get an AI-powered Tarot reading online free. Ask any question, draw cards, and receive a personalized interpretation — Celtic Cross, three-card, or single draw.",
    keywords: [
      "tarot reading online free",
      "AI tarot reading",
      "tarot card reader online",
      "online tarot reading",
      "free tarot card reading",
      "celtic cross tarot online",
    ],
    icon: "🃏",
    coverImage: "/games/game-cover-tarot.webp",
    players: "1",
    duration: "10–20 min",
    difficulty: "Easy",
    category: "Solo / Reflective",
    howToPlay: [
      "Share your question or intention with the AI reader — or ask for a general reading.",
      "The AI draws cards from a full 78-card deck (Major and Minor Arcana).",
      "Each card is revealed with its position (upright or reversed) and interpreted in relation to your question.",
      "The AI reader weaves the cards into a cohesive narrative and offers a closing summary.",
      "Ask follow-up questions or request a new spread any time.",
    ],
    features: [
      "Full 78-card Tarot deck",
      "Single card, three-card, and Celtic Cross spreads",
      "Personalized interpretation for your question",
      "Thoughtful, reflective tone",
      "Solo or shared session",
    ],
    related: ["detective-mystery", "storyteller"],
  },
  {
    slug: "codenames",
    presetId: "codenames",
    name: "Codenames",
    tagline: "One clue. Many words. Two teams.",
    description:
      "Two teams compete to contact all their secret agents using one-word clues. The Spymaster knows which words belong to their team — and must give clever clues without accidentally guiding opponents to the Assassin. The AI host manages the board and keeps score.",
    metaDescription:
      "Play Codenames online with an AI game master. Two teams, one-word clues, and the risk of the Assassin. No board or cards needed — just play.",
    keywords: [
      "codenames game online",
      "play codenames online",
      "codenames online free",
      "word association game online",
      "AI codenames",
      "team word game online",
    ],
    icon: "🔍",
    coverImage: "/games/game-cover-codenames.webp",
    players: "4–12",
    duration: "15–25 min",
    difficulty: "Easy",
    category: "Party",
    howToPlay: [
      "The AI host sets up a 5×5 grid of 25 word cards.",
      "Each team's Spymaster secretly knows which words belong to their team (8–9 each) and which is the Assassin.",
      "The Spymaster gives a one-word clue and a number — the number of their words that relate to the clue.",
      "The team guesses words; a wrong guess ends their turn. Hitting the Assassin loses instantly.",
      "The first team to contact all their agents wins.",
    ],
    roles: [
      { name: "Spymaster", description: "You see the secret grid. Give one-word clues that connect multiple of your team's words — without leading them to opponents' cards or the Assassin." },
      { name: "Field Operative", description: "Discuss with your team and guess which cards match the Spymaster's clue. Wrong guesses give the enemy an advantage." },
    ],
    features: [
      "AI generates unique word grids",
      "4–12 players in two teams",
      "Fast 15–25 minute rounds",
      "Beginner-friendly rules",
      "Great for remote teams",
    ],
    related: ["undercover", "two-truths-lie", "trivia"],
  },
];

/** Look up SEO data by slug. */
export function getGameSEOData(slug: string): GameSEOData | undefined {
  return GAME_SEO_DATA.find((g) => g.slug === slug);
}

/** All slugs — used for generateStaticParams. */
export const ALL_GAME_SLUGS = GAME_SEO_DATA.map((g) => g.slug);
