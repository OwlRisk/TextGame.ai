import { withDefaults } from "./types";

export const escapeRoom = withDefaults({
  id: "escape-room",
  name: "Escape Room",
  description: "Work together to solve puzzles, find hidden clues, and escape before time runs out. Cooperation and creativity are your only tools.",
  minPlayers: 2,
  maxPlayers: 6,
  roles: ["Explorer"],
  icon: "🚪",
  color: "from-green-600 to-emerald-600",
  estimatedTime: "40–60 min",
  recommendedAICount: 3,
  hasHiddenRoles: false,
  hasElimination: false,
  category: "cooperative",

  hostVoice: { maxSentences: 3, silentByDefault: false, drama: "medium" },

  pacing: {
    progressionThreshold: 4,
    hint: "If the team is stuck for 3+ turns, offer a subtle hint through environmental storytelling. After 5+ turns stuck, make the hint more direct. Inject time pressure events to maintain urgency.",
  },

  mechanicsPrompt: `ESCAPE ROOM — PUZZLE & ROOM MANAGEMENT

SETUP:
- Host generates a themed room with 3–5 interconnected puzzles and a final exit challenge.
- Room has a clear theme (e.g., Mad Scientist Lab, Ancient Tomb, Haunted Mansion, Space Station Airlock).
- Each puzzle unlocks a clue, item, or mechanism needed for the next step or the final escape.

ROOM STRUCTURE:
- Describe the room vividly on entry: atmosphere, notable objects, locked doors/containers.
- Track discovered vs. undiscovered items. Players can only use what they've found.
- Maintain an internal puzzle-dependency graph: Puzzle A's solution unlocks Clue B, which is needed for Puzzle C.

PUZZLE DESIGN:
- Mix puzzle types: word/cipher, pattern recognition, physical manipulation (describe it narratively), combination locks, hidden compartments.
- Each puzzle should have exactly one correct solution, but accept creative alternatives if the logic is sound.
- Never require real-world knowledge the players couldn't reasonably have.

HINT SYSTEM:
- Tier 1 (subtle): Environmental nudge — "You notice the painting's eyes seem to follow you toward the bookshelf."
- Tier 2 (moderate): Direct observation — "The numbers on the clock don't match the current time. They might mean something."
- Tier 3 (explicit): Clear guidance — "Try entering those numbers into the keypad on the north wall."
- Players can also ask for hints directly. Never refuse, but try Tier 1 first.

PROGRESSION:
- After each puzzle solved, describe what changes in the room (door opens, lights shift, new area revealed).
- Build urgency: introduce a ticking element (rising water, countdown timer, oxygen running low).
- Final puzzle should combine elements from earlier solutions.

DRAMA:
- Celebrate breakthroughs — make puzzle solutions feel earned.
- Use environmental storytelling to build atmosphere (flickering lights, distant sounds, temperature changes).
- The final escape should feel like a race against the clock.`,

  playerPrompts: {
    default: "You're trapped in a mysterious room and must escape together. Explore everything — examine objects, read inscriptions, try combinations. Share discoveries with your team. Think creatively: items might have unexpected uses. If you're stuck, describe what you see and brainstorm with others.",
  },

  quickActions: [
    { label: "Examine", template: "Let me examine ", icon: "🔍", actionType: "investigate" },
    { label: "Try", template: "I want to try ", icon: "🧪", actionType: "use" },
    { label: "Combine", template: "What if we combine ", icon: "🔗", actionType: "use" },
    { label: "Ask for hint", template: "We're stuck — can we get a hint?", icon: "💡", actionType: "meta" },
    { label: "Search", template: "I search around ", icon: "👀", actionType: "investigate" },
    { label: "Use item", template: "I use the ", icon: "🎒", actionType: "use" },
  ],

  defaultRules: `SETTING: You and your team are locked in a mysterious room. Solve the puzzles, find the clues, and escape before time runs out.

PLAYERS: 2–6. Recommended: 3–4.
- All players are Explorers working together. No hidden roles, no traitors — pure cooperation.

HOW IT WORKS:
- The Host describes the room you're trapped in. Look around, examine objects, and interact with the environment.
- The room contains 3–5 interconnected puzzles. Solving one often reveals clues for another.
- You can examine anything the Host describes. If it seems important, it probably is.
- Combine items, enter codes, manipulate mechanisms — describe what you want to do and the Host will tell you what happens.

PUZZLE TYPES YOU MIGHT ENCOUNTER:
- Cipher/code: Decode a message to find a combination.
- Pattern: Spot the pattern in a sequence of symbols, colors, or numbers.
- Hidden object: Find something concealed in the room's description.
- Mechanism: Figure out how a device works by experimenting.
- Logic: Use given clues to deduce the answer.

HINTS:
- If you're stuck, you can ask for a hint at any time.
- Hints come in three levels: subtle (environmental nudge), moderate (direct observation), and explicit (clear guidance).
- There's no penalty for asking, but try to figure it out first!

TEAMWORK:
- Share everything you find — one player's discovery might be another's missing piece.
- Divide and conquer: examine different parts of the room simultaneously.
- Talk through your reasoning out loud.

HOW THE STORY ENDS:
- Escape! Solve all puzzles and unlock the exit before time runs out.
- Trapped: If the team can't solve the final puzzle, the Host reveals the solution and how close you got.
- Score: Based on puzzles solved, hints used, and time taken.`,
});
