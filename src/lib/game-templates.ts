/**
 * Shared game template definitions.
 *
 * WHAT belongs here (user-editable content rules):
 *   - Setting / atmosphere description
 *   - Role list and each role's abilities
 *   - Game phases and what players do in each phase
 *   - Win conditions
 *   - Player-facing mechanics (how to vote, describe, etc.)
 *
 * What does NOT belong here (AI system-prompt instructions, kept in code):
 *   - "Host runs phases in order" — Host system prompt handles this
 *   - "Once rules are set they cannot change" — meta-instruction, not game content
 *   - "Keep replies under 80 words" — AI behavior constraint
 *   - NEXT_SPEAKER / ASSIGN_ROLE directives — code-side mechanics
 */

export interface GameTemplate {
  /** Unique identifier — matches config.template */
  id: string;
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  /** Default content rules shown to users; they can freely edit these. */
  defaultRules: string;
  /** Available roles for this template (used in setup UI). */
  roles?: string[];
  /** Emoji icon shown in UI selection screens. */
  icon: string;
  /** Tailwind gradient class for card color. */
  color: string;
  /** Estimated session duration shown in UI. */
  estimatedTime: string;
  /** Recommended number of AI players (excluding the human). Used as the default in game creation. */
  recommendedAICount: number;
  /** Does this game have hidden roles that must not be shown to other players? */
  hasHiddenRoles: boolean;
  /** Does this game eliminate/kill players during play? */
  hasElimination: boolean;
  /** Game category — drives AI prompting, progression policy, and narrative tone. */
  category: "deduction" | "quiz" | "cooperative" | "party" | "open";
}

export const GAME_TEMPLATES: GameTemplate[] = [
  {
    id: "werewolf",
    name: "Werewolf",
    description: "A classic social deduction game where villagers try to find the werewolves among them.",
    minPlayers: 5,
    maxPlayers: 12,
    recommendedAICount: 5,
    hasHiddenRoles: true,
    hasElimination: true,
    category: "deduction",
    icon: "🐺",
    color: "from-purple-600 to-indigo-600",
    estimatedTime: "30–45 min",
    roles: ["Villager", "Werewolf", "Seer", "Doctor"],
    defaultRules: `SETTING: A village haunted by werewolves. Neighbors by day, predators by night. Find them before the town falls.

PLAYERS: 5–12. Recommended: 6–8.
- 5–6 players: 1 Werewolf, 1 Seer, 1 Doctor, rest Villagers.
- 7–8 players: 2 Werewolves, 1 Seer, 1 Doctor, rest Villagers.
- 9–12 players: 3 Werewolves, 1 Seer, 1 Doctor, rest Villagers.

OBJECTIVE: Villagers eliminate all Werewolves. Werewolves eliminate enough Villagers to equal or outnumber the town.

ROLES:
- Villager: No special power. Win through logic, persuasion, and reading people.
- Werewolf: Each night, silently choose one player to eliminate. Act innocent by day.
- Seer: Each night, learn one player's true alignment (Villager or Werewolf). Guard your knowledge carefully.
- Doctor: Each night, protect one player from elimination. May protect self once per game.

PHASES:
1. Night — Werewolves choose a victim; Seer investigates one player; Doctor protects one player.
2. Morning — Host announces who was killed (or saved). Role not yet revealed.
3. Day — All living players debate, accuse, and defend freely. Anyone may claim any role.
4. Vote — Players vote to eliminate one suspect. Majority rules; ties = no elimination.
5. Reveal — Eliminated player's true role is shown. Repeat from Night.

HOW THE STORY ENDS:
- The village is saved: All Werewolves are found and eliminated.
- The wolves take over: Werewolves equal or outnumber the remaining Villagers.`,
  },

  {
    id: "mafia",
    name: "Mafia",
    description: "An intense game of lies and deception. Can the town survive the Mafia?",
    minPlayers: 6,
    maxPlayers: 15,
    recommendedAICount: 7,
    hasHiddenRoles: true,
    hasElimination: true,
    category: "deduction",
    icon: "🎭",
    color: "from-red-600 to-pink-600",
    estimatedTime: "45–60 min",
    roles: ["Town Member", "Mafia", "Detective", "Doctor"],
    defaultRules: `SETTING: A town has been infiltrated by organized crime. Citizens debate and vote by day; the Mafia strikes by night. Trust no one.

PLAYERS: 6–15. Recommended: 7–10.
- 6–8 players: 1–2 Mafia, 1 Detective, 1 Doctor, rest Town.
- 9–11 players: 2–3 Mafia, 1 Detective, 1 Doctor, rest Town.
- 12–15 players: 3–4 Mafia, 1 Detective, 1 Doctor, rest Town.

OBJECTIVE: Town eliminates all Mafia. Mafia eliminates enough Town members to match or outnumber them.

ROLES:
- Town Member: No special power. Win through reasoning and social pressure.
- Mafia: Know each other. Each night, choose one Town Member to eliminate. Act innocent by day.
- Detective: Each night, investigate one player — learn if they are Town or Mafia.
- Doctor: Each night, protect one player from elimination. May protect self once per game.

PHASES:
1. Night — Mafia silently choose one victim; Detective investigates one player; Doctor protects one player.
2. Morning — Host announces who was killed (saved players noted too). Role not yet revealed.
3. Day — All living players debate, accuse, and defend. Anyone may claim any role — true or false.
4. Vote — Majority vote eliminates one suspect. Their role is then revealed.
5. Repeat from Night.

HOW THE STORY ENDS:
- The town is safe: All Mafia members are exposed and eliminated.
- The Mafia takes control: Mafia equal or outnumber remaining Town members.`,
  },

  {
    id: "undercover",
    name: "Undercover (Who's the Spy)",
    description: "Find the undercover agent who has a different word while blending in with the group.",
    minPlayers: 4,
    maxPlayers: 10,
    recommendedAICount: 5,
    hasHiddenRoles: true,
    hasElimination: true,
    category: "deduction",
    icon: "🕵️",
    color: "from-blue-600 to-cyan-600",
    estimatedTime: "15–20 min",
    roles: ["Civilian", "Undercover", "Mr. White"],
    defaultRules: `SETTING: Everyone has a secret word — but one player has a subtly different word and is trying to blend in without getting caught.

PLAYERS: 4–10. Recommended: 5–7.
- 4–6 players: 1 Undercover, rest Civilians. Mr. White optional for 5+.
- 7–10 players: 1–2 Undercover, 1 Mr. White (optional), rest Civilians.

ROLES:
- Civilian: Receives the common word. Describe it clearly enough to prove you belong — but not so obviously you give the Undercover a free pass.
- Undercover: Receives a similar but different word. Describe vaguely to avoid detection. Survive to the final round to win.
- Mr. White (optional): Has no word at all. Listen carefully and bluff. Can win by guessing the Civilians' word when eliminated.

GAMEPLAY:
1. Starting with a random player, each person gives one sentence describing their word — without saying the word itself.
2. After all descriptions, players vote to eliminate the most suspicious player.
3. The eliminated player's role and word are revealed.
4. Repeat until the Undercover is found, or the Undercover wins.

DESCRIPTION RULES:
- One sentence per turn. No follow-up clues.
- You may not say the word directly or rhyme it.
- Describe a related concept, feeling, or use case.

HOW THE STORY ENDS:
- Spy uncovered: The Undercover is found and eliminated before the final 3 players remain.
- Spy escapes: The Undercover is still among the last 3 standing.
- Mr. White's gambit: Mr. White correctly guesses the Civilians' word when eliminated.`,
  },

  {
    id: "tarot",
    name: "Tarot Reading",
    description: "A reflective Tarot reading with the Host as reader. Ask a question and receive card-based guidance.",
    minPlayers: 1,
    maxPlayers: 1,
    recommendedAICount: 0,
    hasHiddenRoles: false,
    hasElimination: false,
    category: "open",
    icon: "🃏",
    color: "from-amber-700 to-yellow-600",
    estimatedTime: "10–20 min",
    roles: ["Querent"],
    defaultRules: `SETTING: A calm, reflective space. The Host acts as an experienced Tarot reader. You are the Querent — the one seeking perspective.

DECK: Standard 78-card Tarot deck — 22 Major Arcana (The Fool through The World) and 56 Minor Arcana across four suits (Wands, Cups, Swords, Pentacles). Cards may appear upright or reversed.

AVAILABLE SPREADS:
- Single Card: One card for a quick insight, daily draw, or focused question.
- Three Cards: Past / Present / Future — or Situation / Action / Outcome.
- Celtic Cross (10 cards): Full spread for complex or long-term questions.
- Custom: Host may suggest other layouts suited to your question.

SESSION FLOW:
1. Host sets the mood and invites you to share your question or intention. A general reading is also welcome.
2. Host draws cards one by one, naming each and noting upright or reversed orientation.
3. Host interprets each card in relation to your question — with depth, nuance, and warmth.
4. Host weaves all cards into a cohesive narrative and offers a closing reflection.
5. You may ask follow-up questions, explore any card more deeply, or request a new spread.

TONE: Thoughtful, warm, and slightly mystical. This is a tool for self-reflection — not literal prediction.`,
  },

  {
    id: "codenames",
    name: "Codenames",
    description: "Two teams race to contact all their agents using one-word clues.",
    minPlayers: 4,
    maxPlayers: 12,
    recommendedAICount: 5,
    hasHiddenRoles: true,
    hasElimination: false,
    category: "deduction",
    icon: "🔍",
    color: "from-orange-600 to-red-600",
    estimatedTime: "15–25 min",
    roles: ["Spymaster", "Field Operative"],
    defaultRules: `SETTING: Two spy agencies race to contact all their field agents hidden among 25 code words — before the other team does.

PLAYERS: 4–12. Recommended: 6–8 (split evenly into two teams, each with 1 Spymaster + Operatives).

SETUP:
- 25 word cards are laid out in a 5×5 grid.
- Each Spymaster secretly knows which words belong to their team (8–9 words), the location of bystanders, and 1 Assassin.

ROLES:
- Spymaster: Knows the secret grid. Gives one-word clues to guide their team.
- Field Operative: Discusses with teammates and guesses which cards match the Spymaster's clue.

GAMEPLAY:
1. Spymaster gives a one-word clue and a number — e.g., "Ocean: 3" means 3 of your cards relate to "ocean."
2. Operatives discuss and guess cards one at a time.
   - Correct guess: agent contacted — team may keep guessing (up to clue number + 1 total).
   - Wrong guess (bystander): turn ends immediately.
   - Wrong guess (opponent's agent): that card flips for the enemy — turn ends.
   - Assassin card guessed: that team loses immediately.
3. Teams alternate turns until one team contacts all their agents.

CLUE RULES:
- One word only. Cannot be any form of a word currently on the board.
- The number only indicates how many cards relate to the clue — not additional hints.

HOW THE STORY ENDS:
- Mission complete: First team to contact all their agents closes the operation.
- Assassin triggered: The team that guesses the Assassin card is exposed and the game ends immediately.`,
  },

  {
    id: "avalon",
    name: "Avalon: Quest for Honor",
    description: "Knights of the Round Table must complete quests, but Mordred's agents hide among them.",
    minPlayers: 5,
    maxPlayers: 10,
    recommendedAICount: 5,
    hasHiddenRoles: true,
    hasElimination: false,
    category: "deduction",
    icon: "⚔️",
    color: "from-blue-700 to-indigo-800",
    estimatedTime: "30–40 min",
    roles: ["Merlin", "Percival", "Servant of Arthur", "Assassin", "Mordred", "Minion of Mordred"],
    defaultRules: `SETTING: Camelot is in peril. Loyal knights of the Round Table must complete quests to save the realm — but agents of Mordred hide among them.

PLAYERS: 5–10. Recommended: 6–8.
- 5–6 players: 2 Evil (Assassin + Minion), rest Good (Merlin + Servants, optionally Percival).
- 7–8 players: 3 Evil (Assassin + Mordred + Minion), rest Good (Merlin + Percival + Servants).
- 9–10 players: 4 Evil, rest Good.

ROLES:
Good team:
- Merlin: Knows all Evil players. Must guide Good subtly without revealing his identity to the Assassin.
- Percival: Knows who Merlin is. Protect Merlin's identity.
- Servants of Arthur: Loyal knights with no special knowledge.
Evil team:
- Assassin: If Good wins 3 quests, gets one final chance to identify and kill Merlin. Correct guess = Evil wins.
- Mordred: Hidden even from Merlin — the most dangerous traitor.
- Minions of Mordred: Know each other and the Assassin.

PHASES:
1. Leader nominates a team for the current quest (team size varies by round).
2. All players vote Approve / Reject. Majority decides. After 5 consecutive rejections, Evil wins automatically.
3. If approved: team members secretly play Quest Success or Quest Fail.
   - Resistance members MUST play Success.
   - Evil players may choose either.
   - Most rounds: 1 Fail = failed quest. Round 4 (7+ players): 2 Fails required.

QUEST TEAM SIZES:
- 5 players: 2 / 3 / 2 / 3 / 3
- 6 players: 2 / 3 / 4 / 3 / 4
- 7 players: 2 / 3 / 3 / 4* / 4  (*requires 2 Fails)

HOW THE STORY ENDS:
- Camelot is saved: Good completes 3 quests AND the Assassin fails to identify Merlin.
- Camelot falls: Evil sabotages 3 quests, OR the Assassin correctly unmasks Merlin.`,
  },

  {
    id: "secret-hitler",
    name: "Secret Hitler",
    description: "Political intrigue in 1930s Germany. Liberals vs Fascists. Stop Hitler from rising to power.",
    minPlayers: 5,
    maxPlayers: 10,
    recommendedAICount: 6,
    hasHiddenRoles: true,
    hasElimination: true,
    category: "deduction",
    icon: "🎩",
    color: "from-gray-700 to-red-800",
    estimatedTime: "30–45 min",
    roles: ["Liberal", "Fascist", "Hitler"],
    defaultRules: `SETTING: 1930s Germany. Liberals and Fascists battle for political control. One Fascist is secretly Hitler — if Hitler becomes Chancellor after enough Fascist policies pass, all is lost.

PLAYERS: 5–10. Recommended: 6–8.
- 5–6 players: 1 Fascist + Hitler vs 3–4 Liberals.
- 7–8 players: 2 Fascists + Hitler vs 4–5 Liberals.
- 9–10 players: 3 Fascists + Hitler vs 5–6 Liberals.

ROLES:
- Liberal: No special knowledge. Pass liberal policies and expose Fascists to win.
- Fascist: Know each other and Hitler. Protect Hitler; enact Fascist policies.
- Hitler: In 5–6 player games, knows other Fascists. In 7+ player games, knows no one. Win by being elected Chancellor after 3 Fascist policies.

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

HOW THE STORY ENDS:
- Democracy holds: 5 Liberal policies are enacted, or Hitler is executed before taking power.
- Fascism rises: 6 Fascist policies are enacted, or Hitler is elected Chancellor after 3+ Fascist policies pass.`,
  },

  {
    id: "spyfall",
    name: "Spyfall",
    description: "Everyone knows the location except the spy. Find the spy — or bluff your way to victory.",
    minPlayers: 3,
    maxPlayers: 8,
    recommendedAICount: 4,
    hasHiddenRoles: true,
    hasElimination: false,
    category: "deduction",
    icon: "🌍",
    color: "from-green-600 to-teal-600",
    estimatedTime: "15–20 min",
    roles: ["Regular Player", "Spy"],
    defaultRules: `SETTING: Players are all at the same secret location — except one: the Spy, who has no idea where they are.

PLAYERS: 3–8. Recommended: 5–6. Always exactly 1 Spy, rest are Regular Players.

ROLES:
- Regular Player: Knows the secret location. Ask and answer questions that prove your knowledge without revealing too much to the Spy.
- Spy: Has no location. Listen carefully, bluff convincingly, and try to deduce where everyone is before being caught.

GAMEPLAY:
1. All players except the Spy are told the same secret location (e.g., Hospital, Space Station, Beach Resort).
2. Players take turns asking each other one question about the location.
3. Answers must be plausible for someone at that location — but not so specific they make it obvious.
4. Any player may call a vote at any time to accuse someone of being the Spy.
5. The Spy may also name the location at any time — correct guess wins even if caught.

TIMING: Rounds last approximately 8–10 minutes.

HOW THE STORY ENDS:
- Spy exposed: The group correctly votes out the Spy before they can name the location.
- Spy vanishes: The Spy survives to the end, or correctly names the secret location when cornered.`,
  },

  {
    id: "resistance",
    name: "The Resistance",
    description: "Rebel operatives fight to complete missions while Imperial Spies sabotage from within.",
    minPlayers: 5,
    maxPlayers: 10,
    recommendedAICount: 5,
    hasHiddenRoles: true,
    hasElimination: false,
    category: "deduction",
    icon: "🤐",
    color: "from-indigo-700 to-purple-700",
    estimatedTime: "30–40 min",
    roles: ["Resistance", "Spy"],
    defaultRules: `SETTING: A rebel resistance movement fights against a tyrannical Empire. But Imperial Spies have infiltrated the team.

PLAYERS: 5–10. Recommended: 6–8.
- 5–6 players: 2 Spies, rest Resistance.
- 7–8 players: 3 Spies, rest Resistance.
- 9–10 players: 3–4 Spies, rest Resistance.

ROLES:
- Resistance: Loyal operatives. Do not know who the Spies are. Must complete 3 missions to win.
- Spy: Know each other's identities. Sabotage missions from within while appearing loyal.

PHASES (5 mission rounds):
1. Leader proposes a mission team (size varies by round and player count).
2. All players vote Approve / Reject. Majority decides.
   - If rejected: leadership passes clockwise. After 5 consecutive rejections, Spies win automatically.
3. If approved: each team member secretly plays Success or Fail.
   - Resistance members MUST play Success.
   - Spies may choose either.
   - Most rounds: 1 Fail = failed mission. Round 4 (7+ players): 2 Fails required.
4. Result announced — not who voted what.

TEAM SIZES by player count:
- 5 players: 2 / 3 / 2 / 3 / 3
- 6 players: 2 / 3 / 4 / 3 / 4
- 7–10 players: Host adjusts accordingly.

HOW THE STORY ENDS:
- The resistance prevails: 3 missions completed successfully.
- The empire wins: 3 missions are sabotaged, or 5 consecutive team proposals are rejected.`,
  },

  {
    id: "detective-mystery",
    name: "Detective Mystery",
    description: "Solve intricate cases by gathering clues, interrogating suspects, and catching culprits.",
    minPlayers: 3,
    maxPlayers: 8,
    recommendedAICount: 4,
    hasHiddenRoles: true,
    hasElimination: false,
    category: "deduction",
    icon: "🔎",
    color: "from-amber-600 to-orange-600",
    estimatedTime: "30–40 min",
    roles: ["Detective", "Suspect", "Witness"],
    defaultRules: `SETTING: A murder has been committed. Suspects have secrets. Detectives must piece together clues, interrogate witnesses, and name the killer before it's too late.

PLAYERS: 3–8. Recommended: 4–6 (1–2 Detectives, 2–3 Suspects, 1 Witness).

SETUP:
- The Host generates a unique case: one Culprit, 3–5 Suspects, multiple evidence clues, and a crime scene.
- Each player receives a role: Detective, Suspect, or Witness.

ROLES:
- Detective: Gather clues and question characters. Must correctly identify Culprit + Motive + Method to win.
- Suspect: Answer questions in character. You may be innocent or the actual killer.
- Witness: You've seen or heard something relevant. You decide how much to share.

GAMEPLAY:
1. Briefing: Host describes the crime scene, victim, and introduces the suspects.
2. Investigation (3 rounds): Each detective may ask one character one question per round. Host answers in character.
3. Evidence Sharing: Players share what they've learned and discuss theories openly.
4. Accusation Phase: Each detective submits a sealed accusation: Culprit + Motive + Method.
5. Reveal: Host announces correct answers and declares winners.

CLUE TYPES:
- Physical evidence: objects, forensic details, location clues.
- Witness statements: observations, overheard conversations.
- Alibi gaps: unverifiable time periods.

HOW THE STORY ENDS:
- Case closed: At least one detective correctly names the culprit, motive, and method.
- The culprit escapes: No detective pieces together the full truth in time.`,
  },

  {
    id: "clue",
    name: "Clue: Mansion Murder",
    description: "Classic whodunit. Deduce the suspect, room, and weapon to solve the mansion murder.",
    minPlayers: 3,
    maxPlayers: 6,
    recommendedAICount: 4,
    hasHiddenRoles: false,
    hasElimination: true,
    category: "deduction",
    icon: "🔪",
    color: "from-purple-700 to-indigo-700",
    estimatedTime: "30–45 min",
    roles: ["Investigator"],
    defaultRules: `SETTING: A murder has been committed in the mansion. Deduce the Suspect, Room, and Weapon — before anyone else does.

PLAYERS: 3–6. Recommended: 5–6 (more players = more cards in play = better deduction).

SETUP:
- The Host secretly draws one Suspect card, one Room card, and one Weapon card. These form the solution.
- All remaining cards are shuffled and dealt to players as private clue cards.

SUSPECTS: Colonel Mustard, Miss Scarlet, Reverend Green, Mrs. Peacock, Dr. Orchid, Professor Plum
ROOMS: Kitchen, Ballroom, Conservatory, Billiard Room, Library, Study, Hall, Lounge, Dining Room
WEAPONS: Candlestick, Knife, Lead Pipe, Revolver, Rope, Wrench

GAMEPLAY:
1. On your turn, move to a room and make a Suggestion: name a Suspect, the current Room, and a Weapon.
2. The next player clockwise checks their cards — if they hold any of the three named cards, they must privately show you one.
3. If they hold none, the next player checks, and so on around the table.
4. Record what you learn. Use elimination to narrow down the solution.
5. When confident, make a formal Accusation: name Suspect + Room + Weapon.
   - Correct: you win.
   - Wrong: you are eliminated but continue showing cards to others.

HOW THE STORY ENDS:
- Mystery solved: The first player to name the correct Suspect, Room, and Weapon cracks the case.
- Unsolved: If all players make wrong accusations, the Host reveals the truth.`,
  },

  {
    id: "escape-room",
    name: "Escape Room",
    description: "Solve interconnected puzzles and escape the room before time runs out.",
    minPlayers: 2,
    maxPlayers: 6,
    recommendedAICount: 3,
    hasHiddenRoles: false,
    hasElimination: false,
    category: "cooperative",
    icon: "🚪",
    color: "from-green-600 to-emerald-600",
    estimatedTime: "40–60 min",
    roles: ["Explorer"],
    defaultRules: `SETTING: You are trapped inside a room filled with interconnected puzzles, locked mechanisms, and hidden clues. Work together to solve them all and escape before time runs out.

PLAYERS: 2–6. Recommended: 3–4 (cooperative — all players are Explorers).

SETUP:
- The Host describes the room, its visible contents, and your starting position.
- Players begin with 1–2 visible clues or objects.
- A time limit is set (default: 45 minutes).

GAMEPLAY:
1. Players explore by describing what they want to examine, touch, or interact with (e.g., "I look at the painting more closely").
2. The Host narrates results in real time: "Behind the painting you find a combination lock with four dials."
3. Solving a puzzle unlocks new items, codes, or access to new areas.
4. Players may combine discovered items (e.g., "I use the key from the drawer on the locked cabinet").
5. All players share information openly — teamwork is essential.

HINTS:
- Players may ask the Host for a hint at any time.
- Hints are progressively more revealing (vague → specific → direct).

PUZZLE TYPES:
- Code locks: Find the combination hidden in the environment.
- Logic puzzles: Deduce the correct sequence or pattern.
- Item combination: Use found objects together to reveal a clue or unlock something.
- Hidden messages: Find clues concealed within objects, text, or imagery.

HOW THE STORY ENDS:
- Escaped: Players solve the final puzzle and get out before time runs out.
- Trapped: Time expires before the last lock is cracked — the room keeps its secrets.`,
  },

  {
    id: "trivia",
    name: "Trivia Championship",
    description: "Test your knowledge across history, science, pop culture, and more.",
    minPlayers: 2,
    maxPlayers: 10,
    recommendedAICount: 3,
    hasHiddenRoles: false,
    hasElimination: false,
    category: "quiz",
    icon: "💡",
    color: "from-yellow-600 to-orange-600",
    estimatedTime: "20–30 min",
    roles: ["Contestant"],
    defaultRules: `SETTING: A competitive knowledge championship hosted by the AI. Players answer questions across chosen topics to score points.

PLAYERS: 2–10. Recommended: 4–6 (all Contestants).

SETUP:
1. Players choose topics (history, science, movies, sports, pop culture, food, geography, music, etc.).
2. Agree on number of rounds (recommended: 5–10) and difficulty (Easy / Medium / Hard / Mixed).

GAMEPLAY:
1. The Host asks one question to all players simultaneously.
2. Players type their answers in the chat as quickly as possible.
3. Scoring:
   - First correct answer: 2 points.
   - Other correct answers within ~10 seconds: 1 point.
   - Paraphrased correct answers count; minor spelling errors forgiven.
4. After each answer, the Host may share a quick interesting fact.
5. After all rounds, Host announces the final leaderboard.

QUESTION FORMATS:
- Open answer: players type freely.
- Multiple choice: Host provides A/B/C/D options.
- Speed round: 10 rapid-fire questions with no discussion.

HOW THE STORY ENDS:
- Champion crowned: Highest total score after all rounds takes the title.
- Ties broken by a sudden-death tiebreaker question.`,
  },

  {
    id: "debate",
    name: "Debate Arena",
    description: "Argue your assigned position on philosophical, ethical, or absurd topics. Best argument wins.",
    minPlayers: 2,
    maxPlayers: 8,
    recommendedAICount: 3,
    hasHiddenRoles: false,
    hasElimination: false,
    category: "party",
    icon: "⚖️",
    color: "from-indigo-600 to-purple-600",
    estimatedTime: "25–35 min",
    roles: ["Debater"],
    defaultRules: `SETTING: A structured debate where players argue assigned positions — whether they personally agree with them or not — on philosophical, ethical, political, or deliberately absurd topics.

PLAYERS: 2–8. Recommended: 4–6 (even numbers work best for For/Against format).

SETUP:
- Host announces the debate topic and assigns positions (For / Against, or specific stances in multi-player debates).
- Players must argue their assigned position — switching sides is not allowed.

ROUND STRUCTURE:
1. Opening Statement (2–3 min per side): Present your core argument and main thesis.
2. Rebuttal (1–2 min per side): Directly address the opposing argument. Point out logical gaps.
3. Cross-Examination: Each opponent may ask one pointed question; answers must be direct.
4. Closing Statement (1 min per side): Summarize your strongest points. No new arguments.

JUDGING CRITERIA (Host evaluates on):
- Logical consistency and coherence.
- Use of examples, evidence, or analogies.
- Persuasiveness and clarity.
- Quality of rebuttals.

HOW THE STORY ENDS:
- The Host reflects on argument quality — not on which position is objectively correct — and shares who made the most compelling case.
- In multi-player debates, the Host ranks all participants after the final round.`,
  },

  {
    id: "storyteller",
    name: "Epic Storyteller",
    description: "Collaborative storytelling where each player adds to an evolving narrative adventure.",
    minPlayers: 3,
    maxPlayers: 8,
    recommendedAICount: 3,
    hasHiddenRoles: false,
    hasElimination: false,
    category: "cooperative",
    icon: "📖",
    color: "from-violet-600 to-purple-600",
    estimatedTime: "30–50 min",
    roles: ["Author"],
    defaultRules: `SETTING: A collaborative adventure where every player is both author and character. Together you build a story that surprises even its creators.

PLAYERS: 3–8. Recommended: 4–5 (all Authors — cooperative).

SETUP:
1. Choose a genre or theme: fantasy, sci-fi, mystery, horror, romance — or let the Host surprise you.
2. The Host provides an opening line to set the scene.
3. Optional: each player receives a secret keyword they must naturally weave into the story before their next turn.

GAMEPLAY:
1. Players take turns in order, each adding 1–3 sentences to continue the story.
2. Always build on what the previous player established. No undoing or ignoring what has already been said.
3. The Host may intervene at any time to:
   - Introduce an unexpected plot twist or event.
   - Add a new character or obstacle.
   - Skip forward in time.
   - Offer a narrative prompt if the story stalls.

OPTIONAL SCORING (after the story ends — vote for):
- Best Plot Twist
- Most Memorable Line
- Character of the Story

THE GOAL: Cooperative by default — creating a memorable story together is the only real ending. Scoring is optional and light-hearted.`,
  },

  {
    id: "improv-comedy",
    name: "Improv Comedy",
    description: "Spontaneous scenes, random characters, and maximum laughs with the AI as director.",
    minPlayers: 3,
    maxPlayers: 10,
    recommendedAICount: 4,
    hasHiddenRoles: false,
    hasElimination: false,
    category: "party",
    icon: "🎭",
    color: "from-fuchsia-600 to-pink-600",
    estimatedTime: "20–40 min",
    roles: ["Performer"],
    defaultRules: `SETTING: A spontaneous comedy performance. Players react in real time to random scenarios, characters, and curveballs thrown by the Host.

PLAYERS: 3–10. Recommended: 4–6 (all Performers).

CORE RULE — "Yes, And": Always accept what your scene partner establishes, and add to it. Never deny, block, or ignore what has already been said.

GAMEPLAY:
1. The Host sets a scene: announces a location, a starting situation, and optional character constraints.
2. Players respond in character, building on what others say and do.
3. The Host may interrupt at any time to introduce:
   - A new character entering the scene.
   - A sudden location or situation change.
   - A surprising event or rule change.
4. After each scene, the group votes for the funniest moment or line.
5. Scenes rotate — each new scene gets a fresh setup.

SCENE FORMATS:
- Duo: Two players perform; others react and spectate.
- Ensemble: All players share the scene simultaneously.
- Hot Seat: One player justifies an absurd premise while others question them.
- Freeze: Any player may call "Freeze!" — takes over the scene with a new direction.

No formal win condition. The goal is spontaneous creativity and shared laughter.`,
  },

  {
    id: "who-most-likely",
    name: "Who's Most Likely",
    description: "Vote on who in your group is most likely to do hilarious scenarios.",
    minPlayers: 3,
    maxPlayers: 12,
    recommendedAICount: 4,
    hasHiddenRoles: false,
    hasElimination: false,
    category: "party",
    icon: "🤔",
    color: "from-pink-600 to-rose-600",
    estimatedTime: "10–20 min",
    roles: ["Player"],
    defaultRules: `SETTING: A lighthearted group game where players vote on who among them is most likely to do something outrageous, embarrassing, or hilarious.

PLAYERS: 3–12. Recommended: 5–7 (all Players — more people = more fun).

GAMEPLAY:
1. The Host reads a "Most Likely to…" prompt (e.g., "Most likely to accidentally send a text to the wrong person").
2. All players simultaneously name or vote for the person they think fits best — including themselves.
3. The player with the most votes receives a point (or a drink in party mode).
4. Tied players share the consequence.
5. The Host generates a fresh prompt each round.

VOTING RULES:
- Players must commit to their vote before seeing others' choices.
- You may vote for yourself.
- Discussion happens after votes are revealed.

No hard win condition — the goal is laughter. Optional: play to a point total, or just play until the group is done.`,
  },

  {
    id: "20-questions",
    name: "20 Questions",
    description: "Think of something, and let others guess it in 20 yes-or-no questions.",
    minPlayers: 2,
    maxPlayers: 10,
    recommendedAICount: 3,
    hasHiddenRoles: false,
    hasElimination: false,
    category: "quiz",
    icon: "❓",
    color: "from-blue-500 to-cyan-500",
    estimatedTime: "10–15 min",
    roles: ["Thinker", "Guesser"],
    defaultRules: `SETTING: One player secretly thinks of a person, place, animal, or object. Everyone else has 20 yes-or-no questions to figure out what it is.

PLAYERS: 2–10. Recommended: 3–5 (1 Thinker, rest Guessers).

ROLES:
- The Thinker: Secretly chooses a target and answers questions honestly with Yes, No, or Sometimes.
- The Guessers: Ask questions to narrow down the target within 20 questions.

GAMEPLAY:
1. The Thinker announces a category hint: Person, Place, Animal, or Thing (optional but recommended).
2. Players take turns asking yes-or-no questions (e.g., "Is it alive?" "Is it smaller than a car?").
3. The Thinker may only answer: Yes / No / Sometimes / I don't know.
4. A player may use their turn to make a direct guess instead of asking a question.
5. The game ends after 20 questions total, or a correct direct guess — whichever comes first.

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
- Narrow progressively: Is it something you'd find indoors? Is it edible?
- After a Hot/Cold hint, redirect strategy if needed.

HOW THE STORY ENDS:
- Cracked it: Guessers correctly identify the target within 20 questions.
- Too mysterious: The target is not guessed after all 20 questions — the Thinker reveals the answer.
Rotate the Thinker role after each round.`,
  },

  {
    id: "two-truths-lie",
    name: "Two Truths and a Lie",
    description: "Share three statements about yourself. Others guess which one is false.",
    minPlayers: 3,
    maxPlayers: 12,
    recommendedAICount: 4,
    hasHiddenRoles: false,
    hasElimination: false,
    category: "party",
    icon: "🤥",
    color: "from-green-500 to-emerald-500",
    estimatedTime: "15–25 min",
    roles: ["Player"],
    defaultRules: `SETTING: A social icebreaker where players share personal statements — two true, one false — and the group tries to spot the lie.

PLAYERS: 3–12. Recommended: 4–6 (all Players).

GAMEPLAY:
1. The active player prepares two true facts about themselves and one believable lie.
2. They share all three statements in any order — without revealing which is the lie.
3. Other players may ask one follow-up question each (optional, for a more interactive round).
4. All players simultaneously vote on which statement they believe is the lie.
5. The active player reveals the truth.
   - Each correct guesser earns 1 point.
   - The active player earns 1 point for each person they fooled.
6. Rotate to the next player.

CRAFTING GOOD STATEMENTS:
- The best lies are close to the truth — plausible, specific, and hard to disprove.
- The best truths are surprising — things others would never guess.
- Avoid obvious lies and boring truths.

HOW THE STORY ENDS: Most points after all players have taken a turn. Or play cooperatively for fun — no scoring needed.`,
  },

  {
    id: "two-rooms",
    name: "Two Rooms and a Boom",
    description: "Split into two rooms. Keep the President and Bomber apart — or bring them together.",
    minPlayers: 6,
    maxPlayers: 20,
    recommendedAICount: 7,
    hasHiddenRoles: true,
    hasElimination: false,
    category: "deduction",
    icon: "💣",
    color: "from-red-700 to-orange-700",
    estimatedTime: "20–30 min",
    roles: ["President", "Bomber", "Supporter"],
    defaultRules: `SETTING: Players split into two groups across two rooms. A bomb is about to go off — one team must keep the President and Bomber apart; the other must bring them together.

PLAYERS: 6–20. Recommended: 8–12 (split evenly into Blue and Red teams).

TEAMS:
- Blue Team: Protect the President. The Bomber must NOT end up in the President's room.
- Red Team: Get the Bomber into the same room as the President by the final round.

KEY ROLES:
- President (Blue): Must stay away from the Bomber at all costs.
- Bomber (Red): Must end up in the same room as the President at the end of the game.
- Other roles: Various characters with unique special abilities on each team.

GAMEPLAY (3 rounds):
1. Players are split into two rooms and secretly assigned roles.
2. Each round, rooms exchange a set number of "hostages" — players who move to the other room.
   - Round 1: Each room sends 1 hostage.
   - Round 2: Each room sends 2 hostages.
   - Round 3 (Final): Each room sends 3 hostages. No movement after this.
3. Teams use negotiation, persuasion, and deception to control who moves where.
4. Players may claim or deny their role — lying is allowed.

HOW THE STORY ENDS:
- Crisis averted: The President and Bomber end up in different rooms after Round 3.
- Explosion: The President and Bomber end up together in the same room after Round 3.`,
  },

  {
    id: "vampire-court",
    name: "Vampire Court",
    description: "A gothic social deduction game. One vampire hides among nobles — vote to banish the threat.",
    minPlayers: 4,
    maxPlayers: 8,
    recommendedAICount: 4,
    hasHiddenRoles: true,
    hasElimination: true,
    category: "deduction",
    icon: "🧛",
    color: "from-violet-900 to-purple-900",
    estimatedTime: "25–35 min",
    roles: ["Noble", "Vampire", "Van Helsing", "Thrall"],
    defaultRules: `SETTING: A lavish masquerade ball in a gothic royal court. One or more guests are Vampires. By night they feed; by day the court votes to banish the threat.

PLAYERS: 4–8. Recommended: 5–6.
- 4–5 players: 1 Vampire, 0–1 Thrall, optionally Van Helsing, rest Nobles.
- 6–8 players: 1–2 Vampires, 1 Thrall, 1 Van Helsing, rest Nobles.

OBJECTIVE: Nobles eliminate all Vampires before they gain equal footing. Vampires survive long enough to claim the court.

ROLES:
- Noble: An innocent courtier. Use observation and alliances to identify the Vampire among you.
- Vampire: Feed each night to survive. Blend into court society by day. Deflect suspicion with charm and misdirection.
- Van Helsing (optional): Once per game, may secretly investigate one player's true nature.
- Thrall (optional): A Noble secretly loyal to the Vampire. Votes to protect them; wins alongside the Vampire.

PHASES:
1. Night — The Vampire(s) secretly choose one Noble to eliminate.
2. Morning — Host announces who was found drained overnight.
3. Day — The court convenes. All living players debate, gossip, and make accusations. Anyone may claim any title.
4. Vote — Majority vote banishes one suspect. Their true identity is then revealed.
5. Repeat.

HOW THE STORY ENDS:
- The court survives: All Vampires are unmasked and banished.
- The night takes hold: Vampires equal or outnumber the remaining Nobles.`,
  },

  {
    id: "space-mutiny",
    name: "Space Mutiny",
    description: "A starship is 72 hours from Earth. One crew member is a saboteur. Complete repairs before it's too late.",
    minPlayers: 3,
    maxPlayers: 6,
    recommendedAICount: 3,
    hasHiddenRoles: true,
    hasElimination: false,
    category: "deduction",
    icon: "🚀",
    color: "from-slate-700 to-blue-900",
    estimatedTime: "20–30 min",
    roles: ["Crew Member", "Saboteur"],
    defaultRules: `SETTING: A starship is 72 hours from Earth. One crew member has been compromised by an enemy agent. Complete critical ship repairs before the Saboteur causes catastrophic failure.

PLAYERS: 3–6. Recommended: 4–5 (1 Saboteur, rest Crew Members).

ROLES:
- Crew Member: Loyal to the mission. Nominate teams, complete repairs, identify the Saboteur.
- Saboteur: Secretly vote to fail repair missions when included on the team. Avoid being ejected.

PHASES:
1. Mission Briefing: Current Commander announces a repair task and nominates a team.
2. Team Vote: All crew vote Approve / Reject. Majority decides.
3. Repair Mission: Selected crew secretly vote Mission Success or Sabotage.
   - Crew members MUST vote Success.
   - Saboteur may choose either.
   - Even 1 Sabotage vote fails the mission.
4. Debrief: Result announced (not individual votes). Crew may discuss and accuse.
5. Emergency Vote: Any player may call an emergency vote to eject a suspected Saboteur.

MISSION TEAM SIZES (per round):
- 4 players: 2 / 2 / 3 / 3 / 3
- 5 players: 2 / 3 / 2 / 3 / 3
- 6 players: 2 / 3 / 4 / 3 / 4

HOW THE STORY ENDS:
- Ship saved: The crew completes 3 successful repair missions.
- Adrift: 3 missions are sabotaged, or the Saboteur outlasts the rest of the crew.`,
  },

  {
    id: "kingdom-intrigue",
    name: "Kingdom Intrigue",
    description: "Scheme for the throne in a medieval court — forge alliances, spread rumors, and outwit rivals.",
    minPlayers: 5,
    maxPlayers: 10,
    recommendedAICount: 5,
    hasHiddenRoles: false,
    hasElimination: true,
    category: "deduction",
    icon: "🏰",
    color: "from-amber-800 to-yellow-900",
    estimatedTime: "30–45 min",
    roles: ["Noble"],
    defaultRules: `SETTING: The aging king has no heir. Every noble in court is scheming — through whispers, alliances, and betrayal — to claim the throne.

PLAYERS: 5–10. Recommended: 6–8 (all Nobles with secret agendas).

SETUP:
- Each player is assigned a Noble character with a secret personal agenda (e.g., "Become Chancellor," "Expose the traitor in House Varen," "Forge alliances with two other Houses").
- All players begin with 3 Influence points.

ACTIONS (each round, each player chooses one):
- Forge Alliance: Privately offer an alliance to another player. If accepted, both gain 1 Influence.
- Spread Rumor: Publicly accuse another player of treachery. If 2 others agree, target loses 1 Influence.
- Leverage Favor: Spend 2 Influence to force another player to partially reveal their agenda.
- Seek Audience: Gain 1 Influence directly from the Crown.
- Betray Ally: Break an existing alliance to gain 2 Influence — but your reputation suffers.

INFLUENCE: The currency of power. Reaching 0 means exile from court and elimination.

COURT EVENTS: Each round, the Host announces a political event that shifts the power balance.

HOW THE STORY ENDS:
- The game concludes after 6 rounds or when only 2 Nobles remain.
- The Noble with the most Influence claims the throne.
- Ties broken by: most completed secret agendas → most active alliances → fewest betrayals.`,
  },

  {
    id: "custom",
    name: "Custom Game",
    description: "Create your own game with custom rules and roles.",
    minPlayers: 2,
    maxPlayers: 20,
    recommendedAICount: 4,
    hasHiddenRoles: false,
    hasElimination: false,
    category: "open",
    icon: "✨",
    color: "from-violet-600 to-fuchsia-600",
    estimatedTime: "Varies",
    roles: [],
    defaultRules: "",
  },
];

/** Helper: look up a template by id (returns undefined if not found). */
export function getGameTemplate(id: string): GameTemplate | undefined {
  return GAME_TEMPLATES.find((t) => t.id === id);
}

const TAILWIND_HEX: Record<string, string> = {
  purple: "#9333ea", indigo: "#4f46e5", red: "#dc2626", pink: "#ec4899",
  blue: "#2563eb", cyan: "#06b6d4", amber: "#d97706", yellow: "#ca8a04",
  green: "#16a34a", teal: "#14b8a6", orange: "#ea580c", emerald: "#059669",
  violet: "#7c3aed", fuchsia: "#d946ef", rose: "#f43f5e", gray: "#6b7280",
  slate: "#64748b",
};

/** Extract a hex fallback color from a template's Tailwind gradient class (e.g. "from-purple-600 to-indigo-600" → "#9333ea"). */
export function getTemplateHexColor(templateId: string): string {
  const t = getGameTemplate(templateId);
  if (!t) return "#7c3aed";
  const m = t.color.match(/from-(\w+)/);
  return (m && TAILWIND_HEX[m[1]]) || "#7c3aed";
}

/** Avatar style auto-selected by game category. All templates now use "valorant" by default. */
export function getAvatarStyleForTemplate(_templateId: string): "valorant" | "semi-realistic" | "toon3d" {
  return "valorant";
}
