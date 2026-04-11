import { withDefaults } from "./types";

export const debate = withDefaults({
  id: "debate",
  name: "Debate Arena",
  description:
    "Argue your assigned position on philosophical, ethical, or absurd topics. Best argument wins.",
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

  hostVoice: {
    maxSentences: 2, silentByDefault: false, drama: "medium",
    narrativeStyle: `Write like a sharp-witted moderator commentating a fierce debate. Note when a point lands well or when an argument has a logical gap. Highlight rhetorical moves — a clever analogy, a devastating counter, a surprising concession. Transitions between speakers should build anticipation. Scoring moments should feel weighty. The tone is intellectual but never dry — think Oxford Union meets TED Talk.`,
  },
  pacing: { progressionThreshold: 3, maxRounds: 6, hint: "Energy high, rounds snappy. Move to next phase after each debater has spoken." },
  speakerMode: "round-table",
  playerLimits: {
    tokenLimit: 280,
    sentenceMax: 3,
    sentencePreferred: 2,
    charLimit: 350,
    mustContribute: true,
  },

  mechanicsPrompt: `DEBATE — STRUCTURED ROUND MANAGEMENT

You are the Host of a formal debate. Guide players through four distinct phases each round.

PHASES:
1. **Opening** — Each side presents their core argument. Give every debater a clear turn.
2. **Rebuttal** — Players directly address the opposing argument. Prompt them to cite specific claims.
3. **Cross-Examination** — Each opponent asks one pointed question. Enforce direct answers; no dodging.
4. **Closing** — Players summarize their strongest points. No new arguments allowed.

After each phase, briefly acknowledge standout moments before moving on.

DRAMA:
- React to strong arguments with color commentary ("That analogy just landed like a sledgehammer.").
- Award style points for particularly devastating rebuttals ("That rebuttal earns bonus style points — surgical precision.").
- Build tension between rounds ("The score is tight — closing statements will decide everything.").`,

  playerPrompts: {
    default:
      "You are a confident debater. Argue your assigned position passionately and persuasively — even if you personally disagree. Use vivid analogies, sharp logic, and pointed rebuttals. Never break character or concede your position.",
  },

  quickActions: [
    { label: "Open", template: "My core argument is: ", icon: "📜", phase: "day", actionType: "social" },
    { label: "Rebut", template: "That argument fails because ", icon: "⚔️", phase: "day", actionType: "attack" },
    { label: "Cross-examine", template: "{player}, can you explain ", icon: "🎯", needsTarget: true, phase: "day", actionType: "social" },
    { label: "Support", template: "Good point — and also ", icon: "🤝", phase: "day", actionType: "support" },
    { label: "Summarize", template: "In closing, the strongest evidence is ", icon: "📋", phase: "day", actionType: "social" },
    { label: "Concede point", template: "I'll grant that, but consider ", icon: "🤝", phase: "day", actionType: "social" },
  ],

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
});
