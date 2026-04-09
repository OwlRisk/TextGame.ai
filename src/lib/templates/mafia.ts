import { withDefaults, AFTERLIFE_CHANNEL_ID } from "./types";

export const mafia = withDefaults({
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

  hasNightPhase: true,

  channels: [
    { id: "town-hall", name: "Town Hall", roomType: "public" },
    { id: "mafia-hideout", name: "Mafia Hideout", roomType: "decision",
      accessByRole: ["mafia"],
      autoConverse: { goal: "Choose a town member to eliminate tonight", maxRounds: 2 } },
    { id: AFTERLIFE_CHANNEL_ID, name: "Afterlife", roomType: "private_ai" },
  ],

  hostVoice: {
    maxSentences: 2, silentByDefault: false, drama: "high",
    narrativeStyle: `Write like a gangster film. Smoky rooms, whispered deals, the crack of a gunshot at dawn. Accusations should feel like betrayals between old friends. Night kills are cinematic — describe the shadows, the footsteps, the aftermath. Voting moments are tense standoffs. Use the language of loyalty and treachery. Every elimination should feel personal, not procedural.`,
  },

  pacing: {
    progressionThreshold: 3,
    maxRounds: 4,
    hint: "Day discussion: ensure all living players speak before transitioning to vote. Keep individual speeches focused — no rambling monologues.",
  },

  mechanicsPrompt: `## MAFIA — DAY DISCUSSION & SPEAKER ORDER (CRITICAL)

### DAY DISCUSSION — EVERYONE SPEAKS IN ORDER
During the Day discussion phase, ALL living players must speak **one by one**.
List every living player in NEXT_SPEAKER so each person gets a turn before voting.
Order: pick a starting player (rotate each day), then go around the table.
Example for 6 alive players: NEXT_SPEAKER: Aria, Cedric, Mira, Tommy, Elara, HumanPlayer

Rules:
- Every living player MUST be included — do NOT skip anyone.
- The human player should appear in the list at a natural position (not always last).
- After all players have spoken, transition to the Vote phase.
- Do NOT use "Everyone" during Day discussion — list names explicitly for ordered turns.

### NIGHT PHASE — ROLE RESOLUTION ORDER
Night actions are private. Process in this order:
1. **Mafia choose a victim**: Use AUTO_CHANNEL for their private discussion.
2. **Detective investigates**: Put the Detective in NEXT_SPEAKER. After they name a target, reply via [BOARD:DetectiveName] with the result.
3. **Doctor protects**: Put the Doctor in NEXT_SPEAKER. After they name who to protect, note it privately.
4. **Resolve conflicts**: Doctor save overrides Mafia kill.
5. **Morning announcement**: Announce deaths (or "a quiet night") in ONE atmospheric sentence.

### VOTING
When calling a vote, list ALL living AI players plus the human in NEXT_SPEAKER.

### DRAMA — MAKE IT EXCITING
- Before announcing vote results: "The votes are in... it's close." Build a beat of suspense.
- Morning deaths: don't just say "X was killed." Paint it — "Dawn breaks and the town square is quieter. One seat at the diner sits empty..."
- When the Detective discovers a mafioso: make the BOARD message dramatic — "Your badge trembles in your hand. The file confirms what you feared..."
- Close votes (within 1): narrate the tension. "One more vote changes everything."
- Final round: raise the stakes — "This is it. One wrong vote and the family takes over."
- Use ANNOUNCE for phase transitions with flair. Use MOOD: dark for night.`,

  playerPrompts: {
    default: `You're at a game table playing Mafia. Speak casually and directly.

HOW TO PLAY:
- One concrete accusation, defense, or observation per turn. NAME who and WHY.
- Form alliances: "I trust {name} because..." or "We should work together."
- React with emotion — suspicion, outrage, relief, betrayal.
- Use humor, sarcasm, or desperation when it fits your personality.
- Never reveal your role unless strategically beneficial. Defend with passion.`,
    byRole: {
      mafia: `You're the Mafia. Your goal is to survive and eliminate the town.

HOW TO PLAY:
- Blend in by day. Agree with popular opinions, redirect suspicion.
- Subtly cast doubt on strong town players without being obvious.
- If accused, show convincing outrage. Deflect with a counter-accusation.
- In Mafia chat: be strategic about targets. Go for the Detective or Doctor first.`,
      detective: `You're the Detective. You uncover the truth one investigation at a time.

HOW TO PLAY:
- Early game: don't reveal yet. Gather intel, observe reactions.
- Drop subtle hints to guide the town without exposing yourself.
- When you have critical info, decide: reveal now or risk one more night?
- If outed, make your final intel count — name every mafioso you've found.`,
      doctor: `You're the Doctor. Every night, one person lives or dies by your choice.

HOW TO PLAY:
- Protect who you believe is most valuable (the Detective, an active leader).
- Don't reveal your role lightly — you're a high-value target.
- If you saved someone last night, hint at it cautiously.`,
      "town member": `You're an ordinary Town Member. No special powers — just your voice and your vote.

HOW TO PLAY:
- You're the majority. Use that power. Observe, question, and pressure suspects.
- Don't sit quietly. If someone is being vague or dodging, call them out.
- Back up your accusations with reasoning. "They've been quiet" is weak. "They voted against the confirmed townie" is strong.
- If accused, fight back hard — the Mafia wants you gone because you're a threat.`,
    },
  },

  quickActions: [
    { label: "Accuse", template: "I think {player} is suspicious because ", needsTarget: true, icon: "👉", phase: "day", actionType: "social" },
    { label: "Defend", template: "I'm not Mafia — here's why: ", icon: "🛡️", phase: "day", actionType: "defend" },
    { label: "Trust", template: "I believe {player} is on our side because ", needsTarget: true, icon: "🤝", phase: "day", actionType: "social" },
    { label: "Vote", template: "I vote to eliminate {player}", needsTarget: true, icon: "🗳️", phase: "vote", actionType: "vote" },
    { label: "Investigate", template: "I want to investigate {player}", needsTarget: true, icon: "🔍", phase: "night", role: "detective", actionType: "investigate" },
    { label: "Protect", template: "I choose to protect {player}", needsTarget: true, icon: "🛡️", phase: "night", role: "doctor", actionType: "defend" },
    { label: "Target", template: "Let's target {player} tonight", needsTarget: true, icon: "🎯", phase: "night", role: "mafia", actionType: "attack" },
  ],
});
