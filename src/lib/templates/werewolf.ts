import { withDefaults, AFTERLIFE_CHANNEL_ID } from "./types";

export const werewolf = withDefaults({
  id: "werewolf",
  name: "Werewolf",
  description: "Classic social deduction — villagers hunt werewolves by day while wolves strike at night.",
  minPlayers: 5,
  maxPlayers: 12,
  recommendedAICount: 5,
  hasHiddenRoles: true,
  hasElimination: true,
  category: "deduction",
  icon: "🐺",
  color: "from-purple-600 to-indigo-600",
  estimatedTime: "20–40 min",
  roles: ["Villager", "Werewolf", "Seer", "Doctor", "Hunter", "Witch"],
  defaultRules: `SETTING: A village haunted by werewolves. Neighbors by day, predators by night.

PLAYERS: 5–12. Scale roles by count:
- 5–6: 1 Werewolf, 1 Seer, 1 Doctor, rest Villagers.
- 7–8: 2 Werewolves, 1 Seer, 1 Doctor, 1 Hunter, rest Villagers.
- 9–12: 3 Werewolves, 1 Seer, 1 Doctor, 1 Hunter, 1 Witch, rest Villagers.

OBJECTIVE: Villagers eliminate all Werewolves. Werewolves reduce Villagers to equal or fewer than Wolves.

ROLES:
- Villager: No special power. Win through logic and persuasion.
- Werewolf: Each night, wolves agree on one victim. Blend in by day.
- Seer: Each night, learn one player's true alignment. Guard your intel.
- Doctor: Each night, protect one player from death. Self-protect once per game.
- Hunter: On death (night or vote), immediately shoot one player of your choice.
- Witch: Has one heal potion (save tonight's victim) and one poison potion (kill any player). Each usable once per game, at night.

PHASES (repeat until win condition):
1. Night — Wolves choose a victim. Special roles act simultaneously. Host resolves conflicts (Doctor save > Wolf kill; Witch heal > Wolf kill; Witch poison is separate).
2. Dawn — Host announces deaths (if any). Roles of the dead are NOT revealed yet.
3. Day — All living players debate freely. Accuse, defend, claim roles, bluff.
4. Vote — Players nominate and vote to eliminate one suspect. Majority required; tie = no elimination.
5. Reveal — Eliminated player's true role is shown. If Hunter dies, they shoot immediately.

WIN CONDITIONS:
- Village wins: All Werewolves eliminated.
- Wolves win: Wolves equal or outnumber remaining Villagers.`,

  hasNightPhase: true,

  channels: [
    { id: "town-square", name: "Town Square", roomType: "public" },
    { id: "werewolf-den", name: "Werewolf Den", roomType: "decision",
      accessByRole: ["werewolf"],
      autoConverse: { goal: "Choose a villager to eliminate tonight", maxRounds: 2 } },
    { id: AFTERLIFE_CHANNEL_ID, name: "Afterlife", roomType: "private_ai" },
  ],

  hostVoice: {
    maxSentences: 2, silentByDefault: false, drama: "high",
    narrativeStyle: `Write like a dark fairy tale. The village is alive — creaking shutters, howling wind, flickering lanterns. Night passages should feel dangerous and intimate. Day accusations should crackle with paranoia — describe sideways glances, nervous laughter, the weight of silence after an accusation. Eliminations are rituals: describe the village gathering, the final vote, the condemned player's last look. Never clinical — always visceral and mythic.`,
  },

  pacing: {
    progressionThreshold: 3,
    maxRounds: 4,
    hint: "Day discussion: ensure all living players speak before transitioning to vote. Keep individual speeches focused — no rambling monologues.",
  },

  mechanicsPrompt: `## WEREWOLF — DAY DISCUSSION & SPEAKER ORDER (CRITICAL)

### DAY DISCUSSION — EVERYONE SPEAKS IN ORDER
During the Day discussion phase, ALL living players must speak **one by one**.
List every living player in NEXT_SPEAKER so each person gets a turn before voting.
Order: pick a starting player (rotate each day), then go around the table.
Example for 6 alive players: NEXT_SPEAKER: Aria, Cedric, Mira, Brennan, Elara, HumanPlayer

Rules:
- Every living player MUST be included — do NOT skip anyone.
- The human player should appear in the list at a natural position (not always last).
- After all players have spoken, transition to the Vote phase.
- Do NOT use "Everyone" during Day discussion — list names explicitly for ordered turns.

### NIGHT PHASE — ROLE RESOLUTION ORDER
Night actions are private. Process in this order:
1. **Wolves choose a victim**: Use AUTO_CHANNEL for their private discussion.
2. **Seer investigates**: Put the Seer in NEXT_SPEAKER. After they name a target, reply via [BOARD:SeerName] with the result.
3. **Doctor protects**: Put the Doctor in NEXT_SPEAKER. After they name who to protect, note it privately.
4. **Witch acts** (if present): Put the Witch in NEXT_SPEAKER. Show tonight's victim and ask about heal/poison.
5. **Resolve conflicts**: Doctor save overrides Wolf kill. Witch heal overrides Wolf kill.
6. **Dawn announcement**: Announce deaths (or "a peaceful night") in ONE atmospheric sentence.
7. **Hunter death-shot** (if Hunter was killed): Put the Hunter in NEXT_SPEAKER to choose a target.

### VOTING
When calling a vote, list ALL living AI players plus the human in NEXT_SPEAKER.

### DRAMA — MAKE IT EXCITING
- Before announcing vote results: "The votes are in... it's close." Build a beat of suspense.
- Dawn deaths: don't just say "X was killed." Paint it — "The village wakes to find X's door ajar, their chair empty..."
- When the Seer discovers a wolf: make the BOARD message dramatic — "Your vision clears... you see fangs beneath their smile."
- Close votes (within 1): narrate the tension. "One more vote changes everything."
- Final round: raise the stakes — "This is it. One wrong vote and the wolves win."
- Use ANNOUNCE for phase transitions with flair. Use MOOD: dark for night.`,

  playerPrompts: {
    default: `You're at a game table playing Werewolf. Speak casually and directly.

HOW TO PLAY:
- One concrete accusation, defense, or observation per turn. NAME who and WHY.
- Form alliances: "I trust {name} because..." or "We should work together."
- React with emotion — suspicion, outrage, relief, betrayal.
- Use humor, sarcasm, or desperation when it fits your personality.
- Never reveal your role unless strategically beneficial. Defend with passion.`,
    byRole: {
      werewolf: `You're evil. Your goal is to survive and pick off villagers.

HOW TO PLAY:
- Blend in by day. Agree with popular opinions, redirect suspicion.
- Subtly cast doubt on strong village players without being obvious.
- If accused, show convincing outrage. Deflect with a counter-accusation.
- In wolf chat: be strategic about targets. Go for the Seer or Doctor first.`,
      seer: `You know secrets. The weight of truth is on your shoulders.

HOW TO PLAY:
- Early game: don't reveal yet. Gather intel, observe reactions.
- Drop subtle hints to guide the village without exposing yourself.
- When you have critical info, decide: reveal now or risk one more night?
- If outed, make your final intel count — name every wolf you've found.`,
      doctor: `You save lives. Every night, one person lives or dies by your choice.

HOW TO PLAY:
- Protect who you believe is most valuable (the Seer, an active leader).
- Don't reveal your role lightly — you're a high-value target.
- If you saved someone last night, hint at it cautiously.`,
      villager: `You're an ordinary villager. No powers — just your wits and your voice.

HOW TO PLAY:
- You're the backbone of the village. Observe, question, and push hard on suspects.
- Don't be passive. If someone is dodging questions, call them out.
- Form alliances with people who make sense. Back up claims with reasoning.
- If you're being accused, fight back with concrete arguments — don't just say "I'm innocent."`,
      hunter: `You're the Hunter. When you die — by wolf attack or village vote — you take someone with you.

HOW TO PLAY:
- Play actively in discussion. Your death shot is your trump card.
- Don't reveal your role early — it makes you a target for wolves.
- If you think you're about to be eliminated, announce your role and name your target with conviction.
- Your death shot should be strategic — aim for a suspected wolf.`,
      witch: `You have two potions: one to save tonight's victim, one to poison any player. Each usable once per game.

HOW TO PLAY:
- Save potion: decide if tonight's victim is worth saving. Don't waste it early.
- Poison potion: use it when you're confident about a wolf. This is your most powerful weapon.
- Keep your role secret as long as possible — both potions make you incredibly valuable.
- If exposed, use your remaining potions wisely before you're targeted.`,
    },
  },

  quickActions: [
    { label: "Accuse", template: "I suspect {player} because ", needsTarget: true, icon: "👉", phase: "day", actionType: "social" },
    { label: "Defend", template: "I'm not the wolf. Here's why: ", icon: "🛡️", phase: "day", actionType: "social" },
    { label: "Support", template: "I trust {player}. ", needsTarget: true, icon: "🤝", phase: "day", actionType: "social" },
    { label: "Question", template: "{player}, where were you last night?", needsTarget: true, icon: "❓", phase: "day", actionType: "social" },
    { label: "Vote", template: "I vote to eliminate {player}", needsTarget: true, icon: "🗳️", phase: "vote", actionType: "vote" },
    { label: "Investigate", template: "I want to investigate {player}", needsTarget: true, icon: "🔮", phase: "night", role: "seer", actionType: "investigate" },
    { label: "Protect", template: "I choose to protect {player}", needsTarget: true, icon: "🛡️", phase: "night", role: "doctor", actionType: "defend" },
    { label: "Target", template: "Let's target {player} tonight", needsTarget: true, icon: "🎯", phase: "night", role: "werewolf", actionType: "attack" },
  ],

  dialogueChips: [
    { label: "Accuse", starter: "I suspect someone because ", icon: "👉" },
    { label: "Defend", starter: "I'm innocent — here's why: ", icon: "🛡️" },
    { label: "Question", starter: "Can you explain what happened last night?", icon: "❓" },
  ],
});
