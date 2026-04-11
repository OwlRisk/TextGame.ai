import { withDefaults } from "./types";

export const avalon = withDefaults({
  id: "avalon",
  name: "Avalon",
  description: "Quest-based deduction in the court of King Arthur. Loyal servants must complete quests while agents of Mordred sabotage from within.",
  minPlayers: 5,
  maxPlayers: 10,
  roles: ["Merlin", "Percival", "Servant of Arthur", "Assassin", "Mordred", "Minion of Mordred"],
  icon: "⚔️",
  color: "from-blue-700 to-indigo-800",
  estimatedTime: "30–40 min",
  recommendedAICount: 5,
  hasHiddenRoles: true,
  hasElimination: false,
  category: "deduction",

  hasVotingPhase: true,
  hasNightPhase: false,

  pacing: {
    progressionThreshold: 3,
    maxRounds: 5,
    hint: "Each round is one quest. After team nomination stalls (2+ rejections), nudge players toward compromise. Keep quest results dramatic.",
  },

  mechanicsPrompt: `AVALON — QUEST MANAGEMENT & SPEAKER ORDER

SETUP:
- Assign roles secretly at game start. Reveal evil teammates to each other (except Mordred, who stays hidden from Merlin).
- Merlin learns all Evil players except Mordred. Percival learns who Merlin is.
- Rotate the Leader token clockwise each quest.

TEAM NOMINATION:
- The current Leader proposes a team of the required size for this quest.
- All players discuss, then vote Approve or Reject simultaneously.
- Majority Approve → team goes on the quest. Tie = Rejected.
- Track consecutive rejections. After 5 straight rejections, Evil wins immediately.

QUEST EXECUTION:
- Approved team members secretly play Success or Fail.
- Good players MUST play Success. Evil players choose freely.
- Reveal results without identifying who played what.
- Most quests: 1+ Fail = quest fails. Quest 4 with 7+ players: 2+ Fails required.

ASSASSINATION PHASE:
- If Good wins 3 quests, the Assassin gets one chance to name Merlin.
- Correct guess → Evil wins despite losing the quests.
- Incorrect → Good wins the game.

SPEAKER ORDER:
- During discussion: round-table starting from the Leader, then open floor.
- During quest results: Host reveals cards one at a time.

DRAMA:
- Build tension as quest results are revealed one card at a time.
- The assassination attempt should feel like a final boss moment.
- Play up the paranoia — every rejected team is a clue about loyalties.`,

  playerPrompts: {
    default: "You are a Servant of Arthur — loyal but uninformed. Watch voting patterns and quest results closely. Trust your instincts about who speaks too confidently or deflects suspicion.",
    byRole: {
      merlin: "You are Merlin. You know who the Evil players are, but you must NOT reveal yourself. Guide the Good team through subtle hints — agree with correct accusations, cast doubt on evil players without being obvious. If the Assassin identifies you, Evil wins even if Good completed 3 quests.",
      assassin: "You are the Assassin. Sabotage quests when safe, but your true mission is to identify Merlin. Watch for the player who seems to 'just know' things. If Good wins 3 quests, you get one shot — name Merlin correctly and Evil still wins.",
      mordred: "You are Mordred — hidden even from Merlin. This makes you the most dangerous traitor. You can advocate boldly for Evil's agenda since Merlin cannot out you. Coordinate with your Evil teammates through subtle signals.",
      percival: "You are Percival. You know who Merlin is — protect their identity at all costs. Sometimes act as a decoy Merlin to draw the Assassin's attention away from the real one.",
      "minion of mordred": "You are a Minion of Mordred. You know your Evil teammates. Support them subtly — fail quests when safe, defend teammates under suspicion, and help the Assassin identify Merlin. You're expendable if it protects the Assassin.",
      "servant of arthur": "You are a loyal Servant of Arthur. You have no special knowledge — rely on voting patterns, quest results, and your instincts. Speak up about suspicious behavior. Watch who rejects good teams or defends failed quests.",
    },
  },

  quickActions: [
    { label: "Approve team", template: "I approve this team for the quest.", icon: "✅", phase: "vote" },
    { label: "Reject team", template: "I reject this team — ", icon: "❌", phase: "vote" },
    { label: "Play Success", template: "I play Success on this quest.", icon: "🏆", phase: "day", actionType: "support" },
    { label: "Play Fail", template: "I play Fail on this quest.", icon: "💀", phase: "day", role: "assassin", actionType: "attack" },
    { label: "Play Fail", template: "I play Fail on this quest.", icon: "💀", phase: "day", role: "mordred", actionType: "attack" },
    { label: "Play Fail", template: "I play Fail on this quest.", icon: "💀", phase: "day", role: "minion of mordred", actionType: "attack" },
    { label: "Nominate", template: "I nominate {player} for the quest team.", icon: "👑", needsTarget: true, phase: "day" },
    { label: "Accuse", template: "I think {player} is Evil — ", icon: "🔍", needsTarget: true, phase: "day" },
  ],

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
   - Good players MUST play Success.
   - Evil players may choose either.
   - Most rounds: 1 Fail = failed quest. Round 4 (7+ players): 2 Fails required.

QUEST TEAM SIZES (quests 1–5):
- 5 players: 2 / 3 / 2 / 3 / 3
- 6 players: 2 / 3 / 4 / 3 / 4
- 7 players: 2 / 3 / 3 / 4* / 4
- 8 players: 3 / 4 / 4 / 5* / 5
- 9–10 players: 3 / 4 / 4 / 5* / 5
(* = 2 Fails required to fail this quest)

HOW THE STORY ENDS:
- Camelot is saved: Good completes 3 quests AND the Assassin fails to identify Merlin.
- Camelot falls: Evil sabotages 3 quests, OR the Assassin correctly unmasks Merlin.`,
});
