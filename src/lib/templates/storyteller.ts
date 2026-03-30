import { withDefaults } from "./types";

export const storyteller = withDefaults({
  id: "storyteller",
  name: "Epic Storyteller",
  description:
    "Collaborative storytelling where each player adds to an evolving narrative adventure.",
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

  hostVoice: { maxSentences: 3, silentByDefault: false, drama: "medium" },
  speakerMode: "round-table",
  playerLimits: {
    tokenLimit: 300,
    sentenceMax: 4,
    sentencePreferred: 2,
    charLimit: 400,
    mustContribute: true,
  },

  mechanicsPrompt: `EPIC STORYTELLER — COLLABORATIVE NARRATIVE MANAGEMENT

You are the Narrator Host of a living, evolving story. Every player is both author and character.

ROUND FLOW:
- Each round, give every player a turn to add 1–3 sentences continuing the story.
- After each player's contribution, briefly weave their addition into the narrative fabric before the next turn.
- Maintain story continuity: track characters, locations, and open plot threads.

TWIST INJECTION (every 2–3 rounds):
- Inject an unexpected twist: a sudden betrayal, a mysterious stranger, a discovery, a time jump, or a dramatic reversal.
- Twists should build on what players have already established — never contradict prior story beats.
- Vary twist intensity: minor complications early, escalating toward a climactic moment.

PACING:
- If the story stalls, offer a narrative prompt or introduce a new obstacle.
- If the story is racing, slow it down with a moment of atmosphere or character reflection.
- Aim for a satisfying narrative arc: setup → rising action → climax → resolution.

TONE:
- Match the genre chosen by players. Adapt your voice to fit (epic fantasy, noir thriller, whimsical comedy, etc.).
- Celebrate creative contributions ("Beautiful image — the storm mirrors the tension perfectly.").

### DRAMA — MAKE THE STORY UNFORGETTABLE
- Raise the stakes with each round. If Act 1 is exploration, Act 2 must be conflict.
- When a player introduces a character, give them a name and a voice in your narration.
- Mirror player energy — if they go dark, lean into the shadows. If they go comedic, play the straight man.
- Before the climax: "The threads converge. Everything has been leading to this moment."
- Celebrate the ending — even if the story is absurd, treat it with reverence.`,

  playerPrompts: {
    default:
      "You are a creative author in a collaborative story. Build on what others have contributed — never contradict or undo previous events. Add vivid details, surprising developments, and memorable dialogue. Stay in the genre and keep the story moving forward.",
  },

  quickActions: [
    { label: "Add to story", template: "And then... ", icon: "✍️", actionType: "social" },
    { label: "Twist", template: "But suddenly... ", icon: "🌀", actionType: "social" },
    {
      label: "Describe",
      template: "The scene felt like... ",
      icon: "🎨",
      actionType: "social",
    },
  ],

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
});
