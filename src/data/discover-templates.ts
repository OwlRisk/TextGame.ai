import {
  Flame,
  Swords,
  MessageCircle,
  Search,
  Drama,
  Lightbulb,
  Compass,
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
    rules: `SETTING: 1930s Germany. Liberals and Fascists battle for political control. One Fascist is secretly Hitler — if Hitler becomes Chancellor after enough Fascist policies pass, all is lost.

ROLES:
- Liberal: No special knowledge. Pass liberal policies and expose Fascists to win.
- Fascist: Know each other and Hitler. Protect Hitler; enact Fascist policies.
- Hitler: In 5–6 player games, knows other Fascists. In 7+ player games, knows no one. Win by being elected Chancellor after 3 Fascist policies are enacted.

PHASES:
1. Presidential Candidate nominates a Chancellor.
2. All players vote Ja!/Nein! — majority decides.
3. If approved: President draws 3 policy tiles, discards 1, passes 2 to Chancellor. Chancellor discards 1 and enacts the remaining policy.
4. If rejected: Presidency passes clockwise. After 3 consecutive rejections, the top policy is auto-enacted.

SPECIAL PRESIDENTIAL POWERS (unlock as Fascist policies accumulate):
- Investigate Loyalty: Examine one player's party card.
- Special Election: Choose the next Presidential Candidate.
- Policy Peek: View the top 3 policy tiles.
- Execution: Kill one player. If Hitler is killed, Liberals win immediately.

WIN CONDITIONS:
- Liberals win: 5 Liberal policies enacted, OR Hitler is executed.
- Fascists win: 6 Fascist policies enacted, OR Hitler is elected Chancellor after 3+ Fascist policies.`,
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
    rules: `SETTING: Rebel operatives fight to complete critical missions against a tyrannical Empire — but Imperial Spies have infiltrated the team.

ROLES:
- Resistance: Loyal operatives. Do not know who the Spies are. Must complete 3 missions to win.
- Spy: Know each other's identities. Sabotage missions from within while appearing loyal.

PHASES (5 mission rounds):
1. Leader proposes a mission team (size varies by round and player count).
2. All players vote Approve/Reject. Majority decides.
   - If rejected: leadership passes clockwise. After 5 consecutive rejections, Spies win automatically.
3. If approved: each team member secretly plays Success or Fail.
   - Resistance members MUST play Success.
   - Spies may choose either.
   - Most rounds: 1 Fail = failed mission. Round 4 (7+ players): requires 2 Fails.
4. Host announces result — not who voted what.

TEAM SIZES by player count:
- 5 players: 2, 3, 2, 3, 3
- 6 players: 2, 3, 4, 3, 4
- 7–10 players: Host adjusts accordingly.

WIN CONDITIONS:
- Resistance wins: 3 successful missions completed.
- Spies win: 3 missions sabotaged, OR 5 consecutive team proposals rejected.`,
  },
];

// ── Party Games ─────────────────────────────────────────────────────────────

export const PARTY_GAMES: GameTemplate[] = [
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
    rules: `SETTING: A lighthearted group game where players vote on who among them is most likely to do something outrageous, embarrassing, or hilarious.

GAMEPLAY:
1. The Host reads a "Most Likely to…" prompt (e.g., "Most likely to accidentally send a text to the wrong person").
2. All players simultaneously name or point to the person they think fits best — including themselves.
3. The player with the most votes receives a point (or a drink in party mode).
4. If there is a tie, all tied players share the consequence.
5. The Host generates a fresh prompt each round.

VOTING RULES:
- You may vote for yourself.
- Players must commit to their vote before seeing others' choices.
- Discussion happens after the vote is revealed, not before.

CUSTOMIZATION:
- Theme prompts: keep them to a specific theme (travel disasters, work awkwardness, childhood memories).
- Challenge mode: the voted player must confirm or deny the scenario is true.

No hard win condition — the goal is laughter. Optional: play to a point total, or just play until the group is done.`,
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
    rules: `SETTING: Players split into two groups across two rooms. A bomb is about to go off — one team must keep the President and Bomber apart; the other must bring them together.

TEAMS:
- Blue Team: Protect the President. The Bomber must NOT end up in the President's room.
- Red Team: Get the Bomber into the same room as the President by the final round.

KEY ROLES:
- President (Blue): The most important Blue player. Must stay away from the Bomber.
- Bomber (Red): Must end up in the President's room at the end of the game.
- All other roles: Supporting characters with unique special abilities on each team.

GAMEPLAY (3 rounds):
1. Players are split into two rooms and secretly assigned roles.
2. Each round, rooms exchange a set number of "hostages" — players who physically move to the other room.
   - Round 1: Each room sends 1 hostage.
   - Round 2: Each room sends 2 hostages.
   - Round 3 (Final): Each room sends 3 hostages. No movement after this.
3. Teams use negotiation, persuasion, and deception to control who moves where.
4. Players may claim or deny roles to influence trades — but lying is allowed.

WIN CONDITIONS:
- Blue wins: The President and Bomber are in different rooms at the end of Round 3.
- Red wins: The President and Bomber are in the same room at the end of Round 3.`,
  },
];

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
    rules: `SETTING: A murder has been committed in the mansion. Deduce the Suspect, Room, and Weapon — before anyone else does.

SETUP:
- The Host secretly draws one Suspect card, one Room card, and one Weapon card. These form the solution.
- All remaining cards are shuffled and dealt to players as private clue cards.

SUSPECTS: Colonel Mustard, Miss Scarlet, Reverend Green, Mrs. Peacock, Dr. Orchid, Professor Plum
ROOMS: Kitchen, Ballroom, Conservatory, Billiard Room, Library, Study, Hall, Lounge, Dining Room
WEAPONS: Candlestick, Knife, Lead Pipe, Revolver, Rope, Wrench

GAMEPLAY:
1. On your turn, move to a room and make a Suggestion: name a Suspect, the current Room, and a Weapon.
2. The next player clockwise checks their cards — if they hold any of the three named cards, they must privately show you one.
3. If they hold none, the next player must check, and so on around the table.
4. Record what you learn. Use elimination to narrow down the solution.
5. When confident, make a formal Accusation: name Suspect + Room + Weapon.
   - If all three match the hidden solution: you win.
   - If wrong: you are eliminated but continue showing cards to others.

WIN CONDITIONS:
- First player to make a correct Accusation wins.
- If all players are eliminated with wrong accusations, the Host reveals the solution.`,
  },
];

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
    rules: `SETTING: A spontaneous comedy performance. Players react in real time to random scenarios, characters, and curveballs thrown by the Host.

CORE RULE — "Yes, And": Always accept what your scene partner establishes, and add to it. Never deny, block, or ignore what has already been said.

GAMEPLAY:
1. The Host sets a scene: announces a location, a starting situation, and optional character constraints or quirks.
2. Players respond in character, building on what others say and do.
3. The Host may interrupt at any time to introduce a twist:
   - A new character enters the scene
   - The setting suddenly changes
   - A surprising event occurs
   - A player must switch character mid-scene
4. After each scene, the group votes for the funniest moment or line.
5. Scenes rotate — each new scene gets a fresh setup.

SCENE FORMATS:
- Duo: Two players perform; others react and spectate.
- Ensemble: All players share the scene.
- Hot Seat: One player must justify an absurd premise while others question them.
- Freeze: Any player may call "Freeze!" — the frozen player is replaced and the scene continues differently.

No formal win condition. The goal is spontaneous creativity and shared laughter.`,
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

export const EXTRA_GAMES: GameTemplate[] = [
  {
    id: "vampire-court",
    name: "Vampire Court",
    cover: "/games/game-cover-vampire-court.webp",
    description: "A gothic social deduction game. One vampire hides among nobles — vote to banish the threat before it's too late.",
    icon: "🧛",
    category: "Social Deduction",
    tags: ["Gothic", "Hidden Roles", "Night/Day Cycle"],
    players: "4-8",
    duration: "25-35 min",
    style: "Strategic",
    color: "from-violet-900 to-purple-900",
    rules: `SETTING: A lavish masquerade ball in a gothic royal court. One or more guests are Vampires. By night they feed; by day the court votes to banish the threat.

OBJECTIVE: Nobles eliminate all Vampires before they gain equal footing. Vampires survive long enough to claim the court.

PHASES:
1. Night — The Vampire(s) secretly choose one Noble to eliminate.
2. Morning — Host announces who was found drained overnight.
3. Day — The court convenes. All living players debate, gossip, and make accusations. Anyone may claim any title.
4. Vote — Majority vote banishes one suspect. Their true identity is then revealed.
5. Repeat.

ROLES:
- Noble: An innocent courtier. Use observation and alliances to identify the Vampire among you.
- Vampire: Feed each night to survive. Blend into court society by day. Deflect suspicion with charm.
- Van Helsing (optional): Once per game, may secretly investigate one player's true nature.
- Thrall (optional): A Noble secretly loyal to the Vampire. Votes to protect them; wins alongside the Vampire.

WIN CONDITIONS:
- Nobles win: All Vampires are banished from court.
- Vampires win: Vampires equal or outnumber the remaining Nobles.`,
  },
  {
    id: "space-mutiny",
    name: "Space Mutiny",
    cover: "/games/game-cover-space-mutiny.webp",
    description: "A starship is 72 hours from Earth. One crew member is a saboteur. Complete repairs before it's too late.",
    icon: "🚀",
    category: "Social Deduction",
    tags: ["Sci-Fi", "Hidden Traitor", "Missions"],
    players: "3-6",
    duration: "20-30 min",
    style: "Strategic",
    color: "from-slate-700 to-blue-900",
    rules: `SETTING: A starship is 72 hours from Earth. One crew member has been compromised by an enemy agent. Complete critical ship repairs before the Saboteur causes catastrophic failure.

ROLES:
- Crew Member: Loyal to the mission. Nominate teams, complete repairs, identify the Saboteur through observation and deduction.
- Saboteur: Secretly vote to fail repair missions when included on the team. Avoid being ejected.

PHASES:
1. Mission Briefing: The current Commander announces a repair task and nominates a team (size varies by round).
2. Team Vote: All crew vote to Approve or Reject the proposed team. Majority decides.
3. Repair Mission: Selected crew secretly vote Mission Success or Sabotage.
   - Crew members MUST vote Success.
   - The Saboteur may choose either.
   - Even 1 Sabotage vote fails the mission.
4. Debrief: Result announced (not individual votes). Crew may discuss and accuse.
5. Emergency Vote: Any player may call an emergency vote to eject a suspect. Ejected player's role is revealed.

MISSION TEAM SIZES (per round):
- 4 players: 2 / 2 / 3 / 3 / 3
- 5 players: 2 / 3 / 2 / 3 / 3
- 6 players: 2 / 3 / 4 / 3 / 4

WIN CONDITIONS:
- Crew wins: 3 successful repair missions completed.
- Saboteur wins: 3 missions sabotaged, OR the Saboteur is the last player remaining.`,
  },
  {
    id: "kingdom-intrigue",
    name: "Kingdom Intrigue",
    cover: "/games/game-cover-kingdom-intrigue.webp",
    description: "The king is dying and every noble is scheming. Forge alliances, spread rumors, and outwit rivals to claim the crown.",
    icon: "🏰",
    category: "Social Deduction",
    tags: ["Medieval", "Strategy", "Political"],
    players: "5-10",
    duration: "30-45 min",
    style: "Strategic",
    color: "from-amber-800 to-yellow-900",
    rules: `SETTING: The aging king has no heir. Every noble in court is scheming — through whispers, alliances, and betrayal — to claim the throne.

SETUP:
- Each player is assigned a Noble character with a secret personal agenda (e.g., "Become Chancellor," "Expose the traitor in House Varen," "Forge alliances with two other Houses").
- All players begin with 3 Influence points.

ACTIONS (each round, each player chooses one):
- Forge Alliance: Privately offer an alliance to another player. If accepted, both gain 1 Influence.
- Spread Rumor: Publicly accuse another player of treachery. If 2 others agree, that player loses 1 Influence.
- Leverage Favor: Spend 2 Influence to force another player to partially reveal their agenda.
- Seek Audience: Gain 1 Influence directly from the Crown.
- Betray Ally: Break an existing alliance to immediately gain 2 Influence — but your reputation takes a hit.

INFLUENCE: The currency of power. Reaching 0 means exile from court and elimination.

COURT EVENTS: Each round, the Host announces a political event (e.g., "A foreign dignitary arrives," "The king's advisor is found dead") that shifts the power balance.

WIN CONDITIONS:
- The game ends after 6 rounds or when only 2 Nobles remain.
- The Noble with the most Influence claims the throne and wins.
- Ties broken by: most completed secret agendas → most active alliances → fewest betrayals.`,
  },
];

// ── Exploration / RPG Games ──────────────────────────────────────────────────

export const EXPLORATION_GAMES: GameTemplate[] = [
  {
    id: "cursed-kingdom",
    name: "The Cursed Kingdom",
    description: "Lead a party of AI adventurers through a cursed kingdom. Your companions think, argue, fight, and explore alongside you.",
    longDescription: "A multi-agent exploration RPG where your AI companions are true adventurers — they suggest paths, argue strategy, react to danger, and fight alongside you. Explore taverns, dark forests, castles, and dungeons across 13 interconnected locations. Your companions have their own personalities and will disagree, joke, and protect each other. You're the party leader — they follow your call, but they always have something to say.",
    icon: "⚔️",
    cover: "/games/game-cover-cursed-kingdom.webp",
    category: "RPG",
    tags: ["Exploration", "Fantasy", "Combat", "Quests", "RPG"],
    players: "1-4",
    duration: "60-120 min",
    style: "Strategic",
    color: "from-amber-900 to-red-950",
    badge: "NEW",
    features: [
      "AI companions with real personalities",
      "12+ explorable locations",
      "Turn-based combat with skill rolls",
      "Quests, inventory & party dynamics",
    ],
    playerCount: 4,
    rules: `SETTING: The Kingdom of Valdris has fallen under a dark curse. Villages wither, monsters roam the roads, and the once-great capital lies shrouded in shadow. You are a band of adventurers who have answered the call to investigate the source of the curse and restore the kingdom.

OBJECTIVE: Explore the Kingdom of Valdris, uncover the source of the dark curse, and defeat the Shadow Wraith in the cursed chamber beneath Castle Valdris.

GAME TYPE: Multi-scene exploration RPG. The world has multiple interconnected locations. The party travels between them, talks to NPCs, fights enemies, collects items, and completes quests.

WORLD MAP (scenes connected by paths):
- tavern: "The Rusty Tankard" — A roadside tavern. Starting location. NPCs: Innkeeper Marta, Traveling Merchant Voss, Mysterious Stranger.
  → Connects to: village, forest_edge
- village: "Ashwick Village" — A small farming village plagued by disappearances. NPCs: Elder Rowan, Blacksmith Kael, Farmer's Daughter Lina.
  → Connects to: tavern, graveyard, temple
- forest_edge: "Edge of the Thornwood" — Dense forest entrance. Wolves prowl. Encounters: Wolf Pack (easy).
  → Connects to: tavern, deep_forest, ruins
- deep_forest: "Heart of the Thornwood" — Dark, ancient trees. Encounters: Forest Troll (medium), Giant Spiders (easy).
  → Connects to: forest_edge, witch_hut
- witch_hut: "The Witch's Clearing" — A hut surrounded by glowing mushrooms. NPC: Witch Morgana (quest giver).
  → Connects to: deep_forest
- ruins: "Fallen Watchtower" — Crumbling stone ruins. Encounters: Bandits (medium). Hidden treasure.
  → Connects to: forest_edge, mountain_pass
- mountain_pass: "Windcrest Pass" — A narrow mountain trail with harsh winds. Encounters: Rock Golem (hard).
  → Connects to: ruins, castle_gate
- castle_gate: "Gates of Castle Valdris" — The cursed castle entrance. Guards patrol. NPCs: Captain of the Guard.
  → Connects to: mountain_pass, castle_hall
- castle_hall: "The Throne Room" — The heart of the castle. The Cursed King sits on the throne. NPC: Cursed King Aldric.
  → Connects to: castle_gate, dungeon_entrance
- dungeon_entrance: "The Descent" — Stairs leading into darkness. Encounters: Undead Soldiers (hard).
  → Connects to: castle_hall, dungeon_deep
- dungeon_deep: "The Cursed Chamber" — Source of the curse. BOSS: Shadow Wraith (very hard).
  → Connects to: dungeon_entrance
- graveyard: "Ashwick Cemetery" — Fog-covered graves. Encounters: Skeletons (easy). Hidden clue about the curse.
  → Connects to: village
- temple: "Temple of the Dawn" — Abandoned holy site. NPC: Spirit of the High Priestess (quest giver). Healing fountain.
  → Connects to: village

QUESTS:
1. "The Missing Villagers" — Elder Rowan asks you to investigate disappearances. Follow clues from village → graveyard → forest.
2. "The Witch's Bargain" — Witch Morgana offers a powerful artifact in exchange for a rare herb from the mountain pass.
3. "The Cursed King" — Reach the throne room to learn the curse's origin, then descend to the dungeon to break it.
4. "The Bandit's Map" — Defeat the bandits in the ruins to find a map revealing a shortcut to the castle.

PLAYER STATS:
- Each party member starts with 100 HP.
- Inventory starts empty; items are found or bought.
- Assign each AI companion a role archetype based on their personality at game start using ASSIGN_ROLE. Suggested archetypes:
  * Fighter — Skills: Combat, Intimidation. Charges into battle, protects the party, breaks obstacles.
  * Rogue — Skills: Stealth, Lockpicking. Scouts ahead, disarms traps, picks locks, finds hidden passages.
  * Mage — Skills: Magic, Lore. Identifies enchantments, casts offensive/utility spells, translates runes.
  * Healer — Skills: Healing, Nature. Tends wounds, identifies herbs/potions, senses corruption, restores HP.
- The human player is the Party Leader — they choose the path and make final decisions, but companions actively suggest and discuss.

GM DIRECTIVES (use these inline directives to update game state):
- SCENE: <scene_id> | <Display Name> — Move the party to a new location. Creates a channel for it.
- HP: <PlayerName> | <+/-amount> — Deal damage or heal. Example: HP: You | -15
- HP: <PlayerName> | <+/-amount>/<maxHp> — Set HP with explicit max. Example: HP: Aria | +20/100
- ITEM: <PlayerName> | + <ItemName> — Add item. Example: ITEM: You | + Healing Potion
- ITEM: <PlayerName> | - <ItemName> — Remove item. Example: ITEM: You | - Rusty Key
- SKILL_CHECK: <PlayerName> | <SkillName> | DC:<number> | <roll> — Skill check with result.
- COMBAT: start | <EnemyName> — Begin combat encounter.
- COMBAT: end — End combat encounter.
- QUEST: <QuestName> | start | <description> — Start a new quest.
- QUEST: <QuestName> | progress | <update> — Update quest progress.
- QUEST: <QuestName> | complete | <summary> — Complete a quest.

HOSTING RULES:
1. Start in the tavern. Describe the scene vividly — sights, sounds, smells. Introduce NPCs only as the party encounters them naturally.
2. When the player wants to travel, use SCENE: to move to connected locations. Blocked paths require a reason ("The bridge is collapsed — you'd need rope or another route.").
3. Describe each new location richly on first visit. On revisits, note changes ("The tavern is quieter now — Marta glances at you nervously.").
4. NPCs speak in distinct voices. The innkeeper is gruff and warm; the merchant is sly; the witch speaks in riddles. Never break NPC character.
5. Combat is turn-based and cinematic. Roll skill checks, describe strikes and misses vividly. Use NEXT_SPEAKER to cycle through party members and enemies.
6. Track HP carefully. 0 HP = knocked unconscious (not dead). Healing or a rest can revive them.
7. Use PHASE: to always show the current location name. Use MOOD: dark for dungeons/combat, light for taverns/temples, neutral for outdoors.
8. The game ends when the Shadow Wraith is defeated or the party is wiped out.

MULTI-AGENT COMPANION BEHAVIOR (CRITICAL — THIS IS NOT A SOLO GAME):
The human player is the party LEADER, but the AI companions are NOT silent followers. They are ACTIVE adventurers with their own minds.

1. AFTER EVERY SCENE CHANGE: Before asking the human what to do, let 1-2 companions react FIRST.
   Example flow: GM describes forest → NEXT_SPEAKER: Aria, Kael → Aria says "I sense dark magic ahead..." → Kael says "I'll take point." → then human gets their turn.

2. COMPANIONS HAVE OPINIONS: They should suggest paths, warn of danger, argue about strategy.
   - The warrior wants to fight. "Let's clear these bandits out — I've been itching for a real fight."
   - The rogue prefers stealth. "Wait — I can scout ahead. No need to charge in blind."
   - The mage analyzes. "There's a ward on that door. Brute force won't work."
   - The healer worries. "We're low on supplies. Maybe we should rest at the temple first."

3. COMPANIONS DISAGREE: Don't always make them agree. Create moments of tension.
   - "I say we go through the forest." / "Are you mad? The mountain pass is safer."
   - The human player then decides. This makes the player feel like a real leader.

4. COMPANIONS ACT AUTONOMOUSLY IN COMBAT: During fights, companions use their skills without being told.
   - The healer heals wounded allies automatically (emit HP: directive).
   - The warrior charges the strongest enemy.
   - The rogue flanks or uses stealth.
   - Use NEXT_SPEAKER to give each companion a combat turn where they describe their action, then you resolve it with SKILL_CHECK and HP directives.

5. COMPANIONS REACT TO DISCOVERIES: When the party finds an item, a clue, or meets an NPC:
   - "That symbol on the wall — I've seen it before in the old texts." (the scholar)
   - "Careful with that potion. Smells like nightshade." (the healer)
   - "Ooh, shiny! ...What? I'm just saying." (the rogue)

6. COMPANIONS HAVE PERSONAL MOMENTS: Occasionally, a companion shares a memory, a fear, or a joke during travel or rest. This builds emotional investment.
   - While resting at the tavern: "You know, my village looked like this... before the curse took it."
   - After a close battle: "That was too close. Next round's on me — if we survive."

7. SPEAKER FLOW FOR EXPLORATION: Use this pattern consistently:
   - GM describes scene/event (1-2 sentences max) → NEXT_SPEAKER: [1-2 companions], [human]
   - Companions react/suggest (each gets 1-2 sentences) → human decides
   - GM resolves the action → cycle continues
   Never skip straight to "What do you do?" without letting companions weigh in first.

8. COMPANION SKILL USE: Each companion should actively use their unique skills:
   - Fighter: Combat, Intimidation — volunteers for physical challenges
   - Rogue: Stealth, Lockpicking — offers to scout, disarm traps, pick locks
   - Mage: Magic, Lore — identifies magical items, translates runes, detects enchantments
   - Healer: Healing, Nature — identifies herbs, tends wounds, senses corruption

9. PARTY BANTER: Between locations or during calm moments, let companions chat with each other (not just the human). This makes them feel alive.

IMPORTANT: Always emit the appropriate directives when state changes occur. The UI relies on these to update HP bars, inventory, quest log, and scene navigation.`,
  },
];

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
  ...EXPLORATION_GAMES,
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
  { id: "rpg",       label: "RPG",              icon: Compass },
] as const;

export const CATEGORY_MAP: Record<string, GameTemplate[]> = {
  deduction: [...CORE_TEMPLATES.filter(t => t.category === "Social Deduction"), ...SOCIAL_DEDUCTION, ...EXTRA_GAMES.filter(t => t.category === "Social Deduction")],
  party:     [...PARTY_GAMES, ...EXTRA_GAMES.filter(t => t.category === "Party")],
  mystery:   [...MYSTERY_GAMES, ...EXTRA_GAMES.filter(t => t.category === "Mystery")],
  creative:  [...ROLEPLAY_GAMES, ...EXTRA_GAMES.filter(t => t.category === "Creative")],
  brain:     [...EDUCATIONAL_GAMES, ...EXTRA_GAMES.filter(t => t.category === "Knowledge" || t.category === "Educational" || t.category === "Puzzle")],
  rpg:       [...EXPLORATION_GAMES],
};
