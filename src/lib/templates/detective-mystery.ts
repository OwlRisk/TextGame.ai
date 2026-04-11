import { withDefaults } from "./types";

export const detectiveMystery = withDefaults({
  id: "detective-mystery",
  name: "Detective Mystery",
  description: "A crime has been committed. One player is the detective, others are witnesses and suspects. Interrogate, deduce, and solve the case.",
  minPlayers: 4,
  maxPlayers: 8,
  roles: ["Detective", "Witness", "Suspect", "Culprit"],
  icon: "🔎",
  color: "from-amber-600 to-orange-600",
  estimatedTime: "30–40 min",
  recommendedAICount: 4,
  hasHiddenRoles: true,
  hasElimination: false,
  category: "deduction",

  hasVotingPhase: false,
  hasNightPhase: false,

  hostVoice: {
    maxSentences: 3, silentByDefault: false, drama: "high",
    narrativeStyle: `Write like a classic whodunit mystery. Agatha Christie meets modern thriller. Every clue should be planted with care — describe where it was found, how it looks, what it might mean. Red herrings should be seductive. Suspect interrogations are chess matches — describe the power dynamics, the tells, the deflections. Build toward the "aha" moment where pieces click together. The detective should feel like they're unraveling a web, thread by thread.`,
  },
  speakerMode: "selective",

  pacing: {
    progressionThreshold: 3,
    maxRounds: 12,
    hint: "Reveal evidence like breadcrumbs — one clue per act. If the Detective stalls, have a witness volunteer new information or introduce a twist.",
  },

  mechanicsPrompt: `DETECTIVE MYSTERY — CASE MANAGEMENT

SETUP:
- Host generates a crime scenario: victim, location, motive, method, and 3–5 clues.
- One player is the Detective. One is secretly the Culprit. Others are Witnesses or Suspects.
- The Culprit knows they did it and must deflect suspicion. Witnesses have partial truths. Suspects have alibis (some shaky).

INVESTIGATION FLOW:
- Act 1 — Crime Scene: Host describes the scene and first clue. Detective may examine the scene and question one player.
- Act 2 — Interrogation: Detective questions suspects and witnesses. Host reveals a second clue based on questions asked.
- Act 3 — Breakthrough: A key piece of evidence surfaces (planted by Host). Suspects may turn on each other.
- Act 4 — Accusation: Detective names the Culprit and explains their reasoning. Host reveals the truth.

SPEAKER MANAGEMENT:
- The Detective drives the conversation — they choose who to question.
- Other players speak only when addressed, or when the Host prompts them.
- The Culprit may volunteer information to deflect suspicion.

CLUE SYSTEM:
- Host holds 5 clues, revealed progressively. Some are red herrings.
- Clues should be specific enough to narrow suspects but ambiguous enough to maintain tension.
- If the Detective asks the right questions, bonus clues may be revealed early.

DRAMA:
- Reveal evidence like a detective show — one clue at a time, with dramatic pauses.
- Build suspicion between suspects — have them contradict each other.
- The accusation moment should feel like the climax of a mystery novel.
- If a suspect cracks under pressure, play it up.`,

  playerPrompts: {
    default: "You are part of a mystery. Answer questions truthfully based on what your character knows, but everyone has secrets. Stay in character and react to accusations naturally.",
    byRole: {
      detective: "You are the Detective. Your job is to solve the case. Question suspects and witnesses, examine evidence, and piece together what happened. You choose who to interrogate and when to make your accusation. Take your time — wrong accusations damage your credibility.",
      witness: "You are a Witness. You saw or heard something related to the crime, but your memory may be incomplete. Answer the Detective's questions honestly, but you might misremember details. You may have your own reasons for not wanting to get involved.",
      suspect: "You are a Suspect. You didn't commit the crime, but circumstances make you look guilty. You have an alibi, though it might have gaps. Defend yourself convincingly, but don't be too eager — that looks suspicious too.",
      culprit: "You are the Culprit. You committed the crime and must avoid being caught. Blend in with the other suspects. Deflect suspicion, point fingers at others, and keep your story consistent. If pressed, show just enough emotion to seem innocent — but not so much that it looks rehearsed.",
    },
  },

  quickActions: [
    { label: "Ask", template: "{player}, tell me about ", icon: "❓", needsTarget: true, role: "detective", phase: "day", actionType: "investigate" },
    { label: "Examine", template: "I want to examine ", icon: "🔍", role: "detective", phase: "day", actionType: "investigate" },
    { label: "Accuse", template: "I believe {player} is the culprit because ", icon: "⚖️", needsTarget: true, role: "detective", phase: "day", actionType: "social" },
    { label: "Alibi", template: "I was at ", icon: "🛡️", phase: "day", actionType: "defend" },
    { label: "Point out", template: "That's strange — {player} said ", icon: "👉", needsTarget: true, phase: "day", actionType: "social" },
    { label: "Confess info", template: "There's something I haven't mentioned… ", icon: "💬", phase: "day", actionType: "social" },
  ],

  defaultRules: `SETTING: A crime has been committed. One detective must unravel the truth. Suspects have alibis, witnesses have fragments of the truth, and the culprit hides in plain sight.

PLAYERS: 4–8. Recommended: 5–6.
- 1 Detective, 1 Culprit, rest are Witnesses and Suspects (Host assigns mix based on player count).
- With 4 players: 1 Detective, 1 Culprit, 1 Suspect, 1 Witness.
- With 6+ players: 1 Detective, 1 Culprit, 2 Suspects, rest Witnesses.

ROLES:
- Detective: Leads the investigation. Questions players, examines evidence, makes the final accusation.
- Witness: Has partial knowledge — saw or heard something. May have biases or faulty memory.
- Suspect: Looks guilty but (usually) isn't. Has an alibi with possible holes.
- Culprit: Committed the crime. Knows the full truth but must hide it. Blends in with suspects.

PHASES:
1. ACT 1 — CRIME SCENE: Host describes the crime and reveals the first clue. Detective examines the scene.
2. ACT 2 — INTERROGATION: Detective questions suspects and witnesses in any order. Host reveals additional clues based on the quality of questions.
3. ACT 3 — BREAKTHROUGH: A key piece of evidence surfaces. Tensions rise. Suspects may contradict each other.
4. ACT 4 — ACCUSATION: Detective names the Culprit and presents their case. Host reveals the truth and scores the Detective.

EVIDENCE SYSTEM:
- 5 clues total, revealed progressively across acts.
- 1–2 red herrings mixed in to complicate deduction.
- Clever questions may unlock bonus clues early.

HOW THE STORY ENDS:
- Case solved: Detective correctly identifies the Culprit with sound reasoning.
- Case cold: Detective accuses the wrong person — the Culprit escapes.
- Bonus: Style points for dramatic reveals, clever deductions, and staying in character.`,
});
