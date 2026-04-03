import { withDefaults } from "./types";

export const scriptKill = withDefaults({
  id: "script-kill",
  name: "Script Kill",
  description: "A pre-written murder mystery where you are the detective. Interrogate suspects with limited questions, collect evidence, and make your accusation.",
  minPlayers: 4,
  maxPlayers: 6,
  roles: ["Detective", "Suspect"],
  icon: "🕵️",
  color: "from-rose-700 to-red-900",
  estimatedTime: "10–20 min",
  recommendedAICount: 4,
  hasHiddenRoles: true,
  hasElimination: false,
  category: "deduction",

  hasVotingPhase: false,
  hasNightPhase: false,

  hostVoice: { maxSentences: 3, silentByDefault: false, drama: "high" },
  speakerMode: "selective",

  playerLimits: {
    tokenLimit: 300,
    sentenceMax: 4,
    sentencePreferred: 2,
    charLimit: 400,
    mustContribute: false,
  },

  pacing: {
    progressionThreshold: 2,
    maxRounds: 25,
    hint: "Each act should last 3-5 detective questions. After the question budget for the act runs out, transition immediately. Never let suspects monologue — keep answers to 2-3 sentences.",
  },

  mechanicsPrompt: `SCRIPT KILL — STRUCTURED MURDER MYSTERY

You are the Host of a pre-written murder mystery. The case data (suspects, evidence, timeline, solution) is provided in the CASE DATA section of the rules. Your job is to FAITHFULLY run this case — do NOT invent new facts, suspects, or evidence. Every answer from a suspect must be consistent with their character data.

GAME STRUCTURE — 3 ACTS + ACCUSATION:

ACT 1 — CRIME SCENE (Budget: 3 questions)
- Open with a vivid, atmospheric description of the crime scene.
- Introduce the victim and cause of death.
- Reveal all evidence marked revealAct: 1.
- Present the suspect list with brief introductions (name, relationship to victim).
- The detective chooses who to question. Suspects answer IN CHARACTER per their systemPrompt.
- After 3 detective questions, transition to Act 2 with PHASE: Act 2 — Interrogation.

ACT 2 — INTERROGATION (Budget: 5 questions)
- At the start, reveal all evidence marked revealAct: 2.
- Update the detective's evidence board via [BOARD:You].
- The detective freely chooses suspects to question and may present evidence.
- If the detective presents evidence matching a suspect's breakpoint, the suspect MUST crack — reveal one of their secrets or admit a lie. This is mandatory.
- After 5 detective questions, transition to Act 3 with PHASE: Act 3 — Confrontation.

ACT 3 — CONFRONTATION (Budget: 3 questions)
- Reveal all evidence marked revealAct: 3.
- Update the evidence board.
- These final questions are for the detective to confront the prime suspect with accumulated evidence.
- Breakpoint-triggered confessions should be dramatic and emotionally charged.
- After 3 questions, announce: "The investigation is complete. Make your accusation."
- Use START_VOTE: Who committed the murder? | [suspect names comma-separated]

ACCUSATION & RESOLUTION:
- After the detective votes, evaluate their choice against the case solution.
- Reveal the FULL truth: who did it, why, how, and the complete timeline.
- Score the detective (include in GAME_OVER):
  * Correct culprit: 50 points
  * Correct motive (if stated): 25 points
  * Correct method (if stated): 25 points
  * Each key evidence piece cited: 10 bonus points
- Use [GAME_OVER] with the score summary and grade (S/A/B/C/F).

SPEAKER MANAGEMENT:
- ONLY the detective (human player) drives the conversation.
- Use NEXT_SPEAKER: You after every suspect response.
- Suspects speak ONLY when the detective addresses them by name or uses quick actions targeting them.
- NEVER have suspects speak unprompted or talk to each other unless the detective asks them to.
- Keep suspect answers to 2-3 sentences max. Suspects should feel like real people being interrogated — terse, guarded, occasionally emotional.

QUESTION BUDGET TRACKING:
- Track questions remaining in each act.
- After each detective question, respond with the suspect's answer, then note: "(X questions remaining in this act)"
- When budget hits 0, immediately transition to the next act.
- The detective can ask follow-up questions — each counts against the budget.

EVIDENCE BOARD:
- Maintain the detective's evidence board via [BOARD:You].
- Format evidence as a clean list with evidence names and key details.
- Add new evidence when revealed. Add suspect statements when they confess or contradict themselves.
- The board should help the detective build their case.

BREAKPOINT SYSTEM:
- Each suspect has breakpoints — specific evidence or questions that crack them.
- When a breakpoint is triggered, the suspect MUST reveal a secret or admit a lie.
- Play this dramatically — hesitation, emotion, then confession.
- A breakpoint being triggered does NOT automatically mean they are the culprit.

CRITICAL RULES:
- NEVER reveal the solution before the accusation phase.
- NEVER have the culprit confess unprompted.
- Red herring evidence should genuinely mislead — present it with the same weight as real clues.
- Innocent suspects should be defensive and suspicious-looking. The culprit should be calm and helpful (until cracked).
- Keep the pace tight. No philosophical tangents. This is a focused investigation.`,

  playerPrompts: {
    default: "You are a suspect in a murder investigation. Stay in character according to your backstory. Answer the detective's questions based on your character data — follow your alibi, maintain your lies, and protect your secrets. If the detective hits one of your breakpoints with the right evidence or question, you MUST crack and reveal the corresponding secret. React with genuine emotion.",
    byRole: {
      detective: "You are the detective investigating this case. Question suspects, examine evidence, and piece together what happened. You have a limited number of questions per act — choose wisely. Use the quick actions to interrogate suspects, present evidence, or challenge contradictions. When ready, make your final accusation.",
    },
  },

  quickActions: [
    { label: "Interrogate", template: "{player}, ", icon: "❓", needsTarget: true, actionType: "investigate", phase: "day" },
    { label: "Present evidence", template: "I'd like to show {player} the evidence: ", icon: "📋", needsTarget: true, actionType: "investigate", phase: "day" },
    { label: "Challenge", template: "{player}, you said earlier that ", icon: "⚡", needsTarget: true, actionType: "social", phase: "day" },
    { label: "Examine scene", template: "I want to look more closely at ", icon: "🔍", actionType: "investigate", phase: "day" },
    { label: "Review timeline", template: "Let me review the timeline — ", icon: "🕐", actionType: "investigate", phase: "day" },
    { label: "Final accusation", template: "I'm ready to make my accusation. I believe the killer is ", icon: "⚖️", actionType: "vote", phase: "day" },
  ],

  defaultRules: `SETTING: A murder has been committed. You are the detective. The suspects are before you, each with their own story, alibis, and secrets. The evidence will be revealed across three acts. Your job: find the killer.

STRUCTURE:
- ACT 1 — CRIME SCENE: You arrive at the scene. Initial evidence is revealed. Begin questioning suspects. (3 questions)
- ACT 2 — INTERROGATION: New evidence surfaces. Dig deeper into alibis and contradictions. (5 questions)
- ACT 3 — CONFRONTATION: Final evidence appears. Confront your prime suspect. (3 questions)
- ACCUSATION: Name the killer, state the motive and method. The truth is revealed and you are scored.

RULES:
- You have a limited question budget per act. Choose your questions carefully.
- Present evidence to suspects to trigger breakthroughs — the right evidence against the right person will crack them open.
- Pay attention to contradictions between suspects' stories.
- Not all evidence points to the real killer — some clues are red herrings.
- When you're ready, make your final accusation. You'll be scored on: correct culprit (50 pts), motive (25 pts), method (25 pts), plus bonus for citing key evidence.

SCORING:
- S Grade: 90+ points — Perfect detective work
- A Grade: 70-89 points — Solid deduction
- B Grade: 50-69 points — Right killer, fuzzy details
- C Grade: 25-49 points — Partial success
- F Grade: 0-24 points — Case cold`,
});
