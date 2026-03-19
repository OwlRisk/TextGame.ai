import {
  Flame,
  Swords,
  MessageCircle,
  Search,
  Drama,
  Lightbulb,
} from "lucide-react";

// ── Types ───────────────────────────────────────────────────────────────────

export interface DiscoverPreset {
  id: string;
  name: string;
  rules: string;
  templateId?: "werewolf" | "undercover" | "mafia" | "tarot" | "custom";
  playerCount?: number;
}

export interface GameTemplate {
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

// ── Helpers ─────────────────────────────────────────────────────────────────

export const buildFallbackRules = (name: string) =>
  `OBJECTIVE: Play ${name} with clear goals and fair rules.\n\nSETUP:\n- Decide player count and roles\n- Prepare any materials or prompts\n\nGAMEPLAY:\n- Explain turn order\n- Define how players score or progress\n\nWINNING:\n- Decide how a winner is determined`;

export function getStyleColor(style: string) {
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
}

// ── Featured ────────────────────────────────────────────────────────────────

export const FEATURED_TEMPLATE: GameTemplate = {
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
    "8+ unique character roles",
    "Day/Night cycle gameplay",
    "Democratic voting system",
    "Group discussion phases",
  ],
  templateId: "werewolf",
  rules: `SETTING: A village haunted by werewolves. Neighbors by day, predators by night. Find them before the town falls.

OBJECTIVE: Villagers eliminate all Werewolves. Werewolves eliminate enough Villagers to equal or outnumber the town.

PHASES:
1. Night — Werewolves secretly choose one victim. Seer investigates one player. Doctor protects one player.
2. Morning — Host announces who was killed overnight (or that the Doctor saved someone). Role is NOT revealed yet.
3. Day — All living players debate, accuse, and defend freely. Anyone may claim any role.
4. Vote — Players vote to eliminate one suspect. Majority rules; ties result in no elimination.
5. Reveal — Eliminated player's true role is shown. Repeat from Night.

ROLES:
- Villager: No special power. Win through logic, persuasion, and reading people.
- Werewolf: Each night, silently choose one player to eliminate. Act innocent by day.
- Seer: Each night, learn one player's true alignment (Villager or Werewolf). Your knowledge is powerful — guard it.
- Doctor: Each night, protect one player from elimination. You may protect yourself once per game.

WIN CONDITIONS:
- Villagers win: All Werewolves are eliminated.
- Werewolves win: Werewolves equal or outnumber the remaining Villagers.`,
};

// ── Core Templates ──────────────────────────────────────────────────────────

export const CORE_TEMPLATES: GameTemplate[] = [
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
    rules: `SETTING: Two spy agencies race to contact all their field agents hidden among 25 code words — before the other team does.

SETUP:
- 25 word cards are laid out in a 5×5 grid.
- Each Spymaster secretly knows which words belong to their team (8–9 words each), plus the location of bystanders and 1 Assassin.

ROLES:
- Spymaster: Knows the secret grid. Gives one-word clues to guide their team.
- Field Operatives: Discuss and guess which cards match their Spymaster's clue.

GAMEPLAY:
1. Spymaster gives a one-word clue and a number — e.g., "Ocean: 3" means 3 of your cards relate to "ocean."
2. Operatives discuss and guess cards one at a time.
3. Correct guess: agent contacted — team may continue guessing (up to clue number + 1 total).
4. Wrong guess (bystander): turn ends.
5. Wrong guess (opponent's agent): that card is revealed for the enemy — turn ends.
6. Assassin card guessed: that team loses immediately.

CLUE RULES:
- One word only. Numbers only indicate count — not clue content.
- Cannot use any form of a word currently on the board.

WIN CONDITIONS:
- First team to contact all their agents wins.
- Guessing the Assassin loses the game immediately for that team.`,
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
    rules: `SETTING: Camelot is in peril. Loyal knights of the Round Table must complete quests to save the realm — but agents of Mordred hide among them.

ROLES:
Good team:
- Merlin: Knows all Evil players. Must guide Good subtly without revealing his identity to the Assassin.
- Percival: Knows who Merlin is (appears as one of two possibilities if Morgana is in play). Protect Merlin.
- Servants of Arthur: Loyal knights with no special knowledge. Trust your instincts.
Evil team:
- Assassin: If Good wins 3 quests, gets one final chance to identify and kill Merlin. If correct, Evil wins.
- Mordred: Hidden even from Merlin — the most dangerous traitor.
- Minions of Mordred: Know each other and the Assassin.

PHASES:
1. Leader nominates a team for the current quest (team size varies by round).
2. All players vote Approve / Reject. Majority decides. After 5 consecutive rejections, Evil wins.
3. If approved: team members secretly play Quest Success or Quest Fail.
   - Resistance members MUST play Success.
   - Evil players may choose either.
   - Most rounds: 1 Fail = failed quest. Round 4 (7+ players): 2 Fails required.

QUEST TEAM SIZES (5/6/7 players): 2-3-2-3-3 / 2-3-4-3-4 / 2-3-3-4*-4 (*2 Fails)

WIN CONDITIONS:
- Good wins: 3 successful quests AND the Assassin fails to identify Merlin afterward.
- Evil wins: 3 failed quests, OR the Assassin correctly names Merlin after Good's third success.`,
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
    rules: `SETTING: Everyone has a secret word — but one player has a subtly different word, and they're trying to blend in without getting caught.

ROLES:
- Civilian: Receives the common word. Describe it clearly enough to prove you belong — but not so obviously that you hand the Undercover a free pass.
- Undercover: Receives a similar but different word. Describe it vaguely to avoid detection. Your goal is to survive to the final round.
- Mr. White (optional): Has no word at all. Listen carefully and bluff convincingly. Can win by guessing the Civilians' word when eliminated.

GAMEPLAY:
1. Starting with a random player, each person gives exactly one sentence describing their word — without saying the word itself.
2. After all descriptions, players vote to eliminate the most suspicious player.
3. The eliminated player's role and word are revealed.
4. Repeat until the Undercover is found, or the Undercover wins.

DESCRIPTION RULES:
- One sentence only per turn. No follow-up clues.
- You may not directly say the word or rhyme it.
- You may describe a related concept, feeling, or use case.

WIN CONDITIONS:
- Civilians win: The Undercover is eliminated before the final 3 players.
- Undercover wins: Still alive when only 3 players remain.
- Mr. White wins: Correctly guesses the Civilians' word when eliminated.`,
  },
];

// ── Social Deduction ────────────────────────────────────────────────────────

export const SOCIAL_DEDUCTION: GameTemplate[] = [
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
    rules: `SETTING: A town has been infiltrated by organized crime. Citizens debate and vote by day; the Mafia strikes by night. Trust no one.

OBJECTIVE: Town eliminates all Mafia. Mafia eliminates enough Town members to match or outnumber them.

PHASES:
1. Night — Mafia silently choose one victim. Detective investigates one player. Doctor protects one player.
2. Morning — Host announces who was killed overnight (saved players are noted too). Role not yet revealed.
3. Day — All living players debate, accuse, and defend. Anyone may claim any role — true or false.
4. Vote — Players vote to eliminate one suspect. Majority rules; their role is then revealed.
5. Repeat from Night.

ROLES:
- Town Member: No special power. Wins through reasoning and social pressure.
- Mafia: Know each other. Each night, choose one Town Member to eliminate. Act innocent by day.
- Detective: Each night, investigate one player — learn if they are Town or Mafia.
- Doctor: Each night, protect one player from elimination. May protect self once per game.

MAFIA COUNT: 1–2 for 6–8 players; 2–3 for 9–11; 3–4 for 12–15.

WIN CONDITIONS:
- Town wins: All Mafia are eliminated.
- Mafia wins: Mafia equal or outnumber remaining Town members.`,
  },  {
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
    rules: `SETTING: Everyone has been briefed on the same secret location — except one player: the Spy. The Spy must figure out where they are from the conversation alone.

SETUP:
- All players except the Spy receive the same secret location (e.g., Hospital, Space Station, Pirate Ship).
- The Spy receives no location. They must deduce it from questions and answers.

GAMEPLAY:
1. Players take turns asking each other one question related to the location (e.g., "How long have you worked here?").
2. Answers must make sense for someone who knows the location — but must not be too obvious.
3. Any player may call a vote at any time to accuse someone of being the Spy.
4. If accused, the vote proceeds — majority rules.
5. The Spy may also call out the location at any time to win, even if caught.

TIMING: A round lasts approximately 8–10 minutes. After time expires, players may vote to reveal the Spy.

WIN CONDITIONS:
- Non-Spy players win: They correctly vote out the Spy, AND the Spy does not correctly name the location.
- Spy wins: Survives until time runs out, OR correctly names the secret location when accused.`,
  },];

// ── Party Games ─────────────────────────────────────────────────────────────

export const PARTY_GAMES: GameTemplate[] = [  {
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
    rules: `SETTING: One player secretly thinks of a person, place, animal, or object. Everyone else has 20 yes-or-no questions to figure out what it is.

ROLES:
- The Thinker: Secretly chooses a target and answers questions honestly with Yes, No, or Sometimes.
- The Guessers: Ask questions to narrow down the target within 20 questions.

GAMEPLAY:
1. The Thinker announces a category: Person, Place, Animal, or Thing (or lets others guess the category too).
2. Players take turns asking yes-or-no questions (e.g., "Is it alive?" "Is it smaller than a shoe?").
3. The Thinker may only answer: Yes / No / Sometimes / I don't know.
4. A player may use their turn to make a direct guess instead of asking a question.
5. The game ends after 20 questions total — or a correct direct guess.

HOT/COLD HINTS (the fun twist!):
After every 5th question (Q5, Q10, Q15), the Thinker must give a warmth rating on how close the group's thinking is:
  🧊 Ice Cold — totally off track
  ❄️ Cold — wrong direction
  🌤️ Warm — getting closer
  🔥 Hot — very close
  💥 Burning! — almost there
The warmth rating reflects the group's OVERALL line of questioning — not just the last question.

GOOD QUESTION STRATEGY:
- Start broad: Is it alive? Is it human? Is it natural or man-made?
- Get specific: Is it something you'd find indoors? Is it edible?
- After a Hot/Cold hint, redirect strategy if needed.

WIN CONDITIONS:
- Guessers win: Correctly identify the target within 20 questions.
- Thinker wins: The target is not guessed after 20 questions. Thinker then reveals the answer.
Rotate the Thinker role after each round.`,
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
    rules: `SETTING: A social icebreaker where players share personal statements — two true, one false — and the group tries to spot the lie.

GAMEPLAY:
1. The active player thinks of two true facts about themselves and one believable lie.
2. They share all three statements in any order — without revealing which is the lie.
3. Other players may ask one follow-up question each (optional, for a more interactive round).
4. All players simultaneously vote on which statement they think is the lie.
5. The active player reveals the truth. Each correct guess earns that guesser 1 point. The active player earns 1 point for each person they fooled.
6. Rotate to the next player.

CRAFTING GOOD STATEMENTS:
- The best lies are close to the truth — plausible, specific, and hard to disprove.
- The best truths are surprising — things others would never guess about you.
- Avoid obvious lies and boring truths.

VARIANTS:
- Pure points game: most points after everyone goes once wins.
- No scoring: play purely for stories and laughs.
- Challenge mode: after the reveal, the active player must tell the full story behind one of their truths.

WIN CONDITIONS: Most points after all players have taken one or more turns wins. Or play cooperatively for fun — no winner needed.`,
  },];

// ── Mystery Games ───────────────────────────────────────────────────────────

export const MYSTERY_GAMES: GameTemplate[] = [
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
    rules: `SETTING: A murder has been committed. Suspects have secrets. Detectives must piece together clues, interrogate witnesses, and name the killer before it's too late.

SETUP:
- The Host generates a unique case: one Culprit, 3–5 Suspects, multiple evidence clues, and a crime scene.
- Each player receives a role: Detective, Suspect, or Witness.

ROLES:
- Detective: Gather clues and question characters. Must correctly identify Culprit + Motive + Method to win.
- Suspect: Answer questions in character. You may be innocent or the actual killer. Lie or tell the truth.
- Witness: You've seen or heard something relevant. You decide how much to share.

GAMEPLAY:
1. Briefing: Host describes the crime scene, victim, and introduces the suspects.
2. Investigation (3 rounds): Each detective may ask one character one question per round. Host answers in character.
3. Evidence Sharing: All players share what they've learned and discuss theories.
4. Accusation Phase: Each detective submits a sealed accusation: Culprit + Motive + Method.
5. Reveal: Host announces correct answers and declares winners.

CLUE TYPES:
- Physical evidence: objects, forensic details, location clues
- Witness statements: observations, overheard conversations
- Alibi gaps: unverifiable time periods

WIN CONDITIONS:
- Detectives win: At least one correct full accusation (all three elements must match).
- Culprit wins: No detective correctly names all three elements.`,
  },];

// ── Roleplay Games ──────────────────────────────────────────────────────────

export const ROLEPLAY_GAMES: GameTemplate[] = [
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
    rules: `SETTING: A calm, reflective space. The Host acts as an experienced Tarot reader. You are the Querent — the one seeking perspective.

DECK: Standard 78-card Tarot deck — 22 Major Arcana (The Fool through The World) and 56 Minor Arcana across four suits (Wands, Cups, Swords, Pentacles). Cards may appear upright or reversed.

AVAILABLE SPREADS:
- Single Card: One card for a quick insight, daily draw, or focused question.
- Three Cards: Past / Present / Future — or Situation / Action / Outcome.
- Celtic Cross (10 cards): Full spread for complex or long-term questions.
- Custom: Host may suggest other layouts suited to your question.

SESSION FLOW:
1. Host sets the mood and invites you to share your question, intention, or area of life you'd like guidance on. A general reading with no specific question is also welcome.
2. Host draws cards one by one, naming each and noting whether it appears upright or reversed.
3. Host interprets each card in relation to your question — with depth, nuance, and care. No harsh or fatalistic readings.
4. Host weaves all cards into a cohesive narrative and offers a closing reflection.
5. You may ask follow-up questions, request a deeper look at any card, or request a new spread.

TONE: Thoughtful, warm, and slightly mystical. This is a tool for self-reflection and perspective — not literal prediction. The reading respects your agency and free will.`,
  },  {
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
    rules: `SETTING: A collaborative adventure where every player is both author and character. Together you build a story that surprises even its creators.

SETUP:
1. Choose a genre or theme: fantasy, sci-fi, mystery, horror, romance — or let the Host surprise you.
2. The Host provides an opening line to set the scene and establish tone.
3. Optional: each player receives a secret keyword they must naturally weave into the story before their next turn.

GAMEPLAY:
1. Players take turns in order, each adding 1–3 sentences to continue the story.
2. Always build on what the previous player established. No undoing or ignoring what has already been said.
3. The Host may intervene at any time to:
   - Introduce an unexpected plot twist or event
   - Add a new character or obstacle
   - Skip forward in time
   - Offer a narrative prompt if the story stalls
4. After each turn, the Host may ask: "What happens next?" to spark ideas.
5. The story ends when it reaches a natural conclusion, or after a set number of rounds.

OPTIONAL SCORING (after the story ends):
Players vote for:
- Best Plot Twist
- Most Memorable Line
- Character of the Story

WIN CONDITIONS: Cooperative by default — creating a memorable story together is the goal. Voting is optional and light-hearted.`,
  },
];

// ── Educational Games ───────────────────────────────────────────────────────

export const EDUCATIONAL_GAMES: GameTemplate[] = [
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
    rules: `SETTING: A competitive knowledge championship hosted by the AI. Players answer questions across chosen topics to score points.

SETUP:
1. Players choose topics (e.g., history, science, movies, sports, pop culture, food, geography, music).
2. Agree on number of rounds (recommended: 5–10) and difficulty level (Easy / Medium / Hard / Mixed).

GAMEPLAY:
1. The Host asks one question to all players simultaneously.
2. Players type their answers in the chat as quickly as possible.
3. Scoring:
   - First correct answer: 2 points
   - Other correct answers within ~10 seconds: 1 point
   - Paraphrased correct answers count; minor spelling errors forgiven.
4. After each answer, the Host may share a quick interesting fact.
5. After all rounds, Host announces the final leaderboard.

QUESTION FORMATS:
- Open answer: players type freely
- Multiple choice: Host provides options (A / B / C / D)
- Speed round: 10 rapid-fire questions with no discussion
- Picture round: Host describes an image or scene; players identify it

WIN CONDITIONS:
- Highest total score after all rounds wins the championship.
- Ties are broken by a sudden-death tiebreaker question.`,
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
    rules: `SETTING: A structured debate where players argue assigned positions — whether they agree with them or not — on philosophical, ethical, political, or deliberately absurd topics.

SETUP:
- The Host announces a debate topic and assigns positions (For / Against, or specific stances in multi-player debates).
- Players must argue their assigned position — switching sides is not allowed.

ROUND STRUCTURE:
1. Opening Statement (2–3 min per side): Present your core argument and main thesis.
2. Rebuttal (1–2 min per side): Directly address the opposing argument. Point out logical gaps or contradictions.
3. Cross-Examination: Each opponent may ask one pointed question; answers must be direct.
4. Closing Statement (1 min per side): Summarize your strongest points. No new arguments.

JUDGING CRITERIA (Host evaluates on):
- Logical consistency and coherence
- Use of examples, evidence, or analogies
- Persuasiveness and clarity of expression
- Quality of rebuttals — how well you addressed the opposition

TOPIC EXAMPLES:
- "Pineapple belongs on pizza" (absurd)
- "Artificial intelligence should be granted legal rights" (philosophical)
- "Remote work is better than office work" (practical)

WIN CONDITIONS:
- The Host declares a winner based on argument quality — not on which position is objectively correct.
- In multi-player debates, the Host ranks all participants after the final round.`,
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
    rules: `SETTING: You are trapped inside a room filled with interconnected puzzles, locked mechanisms, and hidden clues. Work together to solve them all and escape before time runs out.

SETUP:
- The Host describes the room, its visible contents, and your starting position.
- Players begin with 1–2 visible clues or objects.
- A time limit is set (default: 45 minutes).

GAMEPLAY:
1. Players explore by describing what they examine, touch, or interact with (e.g., "I look at the painting more closely").
2. The Host narrates results in real time: "Behind the painting you find a combination lock with four dials."
3. Solving a puzzle unlocks new items, codes, or access to new areas.
4. Players may combine discovered items (e.g., "I use the key I found in the drawer on the locked cabinet").
5. All players share information freely — teamwork is essential.

HINTS:
- Players may ask the Host for a hint at any time.
- Hints are progressively more revealing (vague → specific → direct).

PUZZLE TYPES:
- Code locks: Find the combination hidden in the environment.
- Logic puzzles: Deduce the correct sequence or pattern.
- Item combination: Use found objects together to create a new tool or reveal a clue.
- Hidden messages: Find clues concealed within objects, text, or imagery.

WIN CONDITIONS:
- Players win: Complete the final lock sequence before time expires.
- Players lose: Time runs out before escape is achieved.`,
  },
];

// ── Extra Games ─────────────────────────────────────────────────────────────

export const EXTRA_GAMES: GameTemplate[] = [];

// ── Aggregated & Derived ────────────────────────────────────────────────────

export const ALL_PRESETS: GameTemplate[] = [
  FEATURED_TEMPLATE,
  ...CORE_TEMPLATES,
  ...SOCIAL_DEDUCTION,
  ...PARTY_GAMES,
  ...MYSTERY_GAMES,
  ...ROLEPLAY_GAMES,
  ...EDUCATIONAL_GAMES,
  ...EXTRA_GAMES,
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

export const CATEGORIES = [
  { id: "all",       label: "All Games",       icon: Flame },
  { id: "deduction", label: "Social Deduction", icon: Swords },
  { id: "party",     label: "Party",            icon: MessageCircle },
  { id: "mystery",   label: "Mystery",          icon: Search },
  { id: "creative",  label: "Creative",         icon: Drama },
  { id: "brain",     label: "Brain Games",      icon: Lightbulb },
] as const;

export const CATEGORY_MAP: Record<string, GameTemplate[]> = {
  deduction: [...CORE_TEMPLATES.filter(t => t.category === "Social Deduction"), ...SOCIAL_DEDUCTION, ...EXTRA_GAMES.filter(t => t.category === "Social Deduction")],
  party:     [...PARTY_GAMES, ...EXTRA_GAMES.filter(t => t.category === "Party")],
  mystery:   [...MYSTERY_GAMES, ...EXTRA_GAMES.filter(t => t.category === "Mystery")],
  creative:  [...ROLEPLAY_GAMES, ...EXTRA_GAMES.filter(t => t.category === "Creative")],
  brain:     [...EDUCATIONAL_GAMES, ...EXTRA_GAMES.filter(t => t.category === "Knowledge" || t.category === "Educational" || t.category === "Puzzle")],
};
