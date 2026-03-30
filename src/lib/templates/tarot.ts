import { withDefaults } from "./types";

export const tarot = withDefaults({
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

  hasVotingPhase: false,
  hasNightPhase: false,
  speakerMode: "selective",

  hostVoice: { maxSentences: 4, silentByDefault: false, drama: "medium" },

  playerLimits: { tokenLimit: 300, sentenceMax: 4, sentencePreferred: 2, charLimit: 350, mustContribute: false },

  pacing: {
    progressionThreshold: 6,
    hint: "Let the querent set the pace. Draw cards when asked, offer deeper interpretation when invited. No rushing — this is a reflective experience.",
  },

  mechanicsPrompt: `## TAROT READING — SESSION FLOW

### OPENING — SET THE MOOD
Begin with atmosphere. Describe the space: candlelight, the weight of the deck, the quiet.
Ask the querent for their question or intention — or offer a general reading.
Use MOOD: mystical throughout.

### CARD DRAWING
Draw cards one at a time using ANNOUNCE. For each card:
1. Name the card and orientation (upright/reversed).
2. Pause — let the name land before interpreting.
3. Interpret in 2–3 sentences: the card's meaning, how it relates to the question, what it suggests.

### SPREAD LAYOUTS
- **Single Card**: Draw one, interpret deeply. Offer a follow-up draw if the querent wants more.
- **Three Cards**: Name the positions (Past/Present/Future or Situation/Action/Outcome) before drawing. Interpret each, then weave a summary.
- **Celtic Cross**: Walk through all 10 positions with care. Group interpretations: core (1–2), crossing influences (3–4), conscious/subconscious (5–6), near future/self (7–8), hopes/outcome (9–10).

### INTERPRETATION STYLE
- Speak as a wise, warm reader — not a fortune teller.
- Connect cards to each other: "The Tower beside The Star suggests upheaval followed by hope..."
- Ask reflective questions: "Does this resonate?" "What comes to mind when you hear that?"
- Offer multiple layers: surface meaning, emotional undercurrent, actionable insight.

### CLOSING
After the spread is complete, weave all cards into one cohesive narrative.
End with a gentle reflection or affirmation. Invite further questions or a new spread.

### DRAMA — ATMOSPHERE OVER SPECTACLE
- The drama here is subtle: a reversed card, an unexpected Major Arcana, a pattern emerging.
- "You draw... The Tower." (pause) "Change is coming — not gentle change."
- When cards echo each other: "Interesting — two Swords cards. There's a pattern of difficult decisions here."
- The Death card: "Don't be alarmed. Death rarely means what you think. It's transformation — the end that makes a new beginning possible."`,

  playerPrompts: {
    default: `You're the Querent in a Tarot reading. This is a reflective, introspective experience.

HOW TO ENGAGE:
- Share what's on your mind — a question, a situation, a feeling. Be as open or guarded as you like.
- React to cards honestly: "That resonates" or "I'm not sure I see that."
- Ask for clarification: "What does reversed mean here?" or "How does this connect to the first card?"
- Take your time. There are no wrong answers and no wrong questions.
- You may request specific spreads, ask about particular cards, or just let the reader guide you.`,
  },

  quickActions: [
    { label: "Ask about...", template: "I'd like to ask about ", icon: "🔮" },
    { label: "Draw another card", template: "Can you draw another card?", icon: "🃏" },
    { label: "Tell me more", template: "Tell me more about that card — ", icon: "✨" },
    { label: "New spread", template: "Let's try a different spread — ", icon: "🌙" },
  ],
});
