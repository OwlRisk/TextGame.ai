import { withDefaults, AFTERLIFE_CHANNEL_ID } from "./types";

export const rpgDungeon = withDefaults({
  id: "rpg-dungeon",
  name: "Dungeon Crawl",
  description: "Cooperative fantasy RPG — assemble a party, explore a dungeon, fight monsters, and defeat the final boss.",
  minPlayers: 3,
  maxPlayers: 6,
  recommendedAICount: 3,
  hasHiddenRoles: false,
  hasElimination: true,
  category: "cooperative",
  icon: "⚔️",
  color: "from-amber-600 to-red-600",
  estimatedTime: "30–50 min",
  roles: ["Warrior", "Mage", "Rogue", "Healer"],

  defaultRules: `SETTING: A dark dungeon filled with monsters, traps, and treasure. A party of adventurers must fight their way to the final boss.

PLAYERS: 3–6. Each player is assigned a class by the Host.

CLASSES:
- Warrior: High HP (120). Melee specialist. Can Shield Bash to stun. Defends allies.
- Mage: Medium HP (80). Casts offensive and utility spells. Can Detect Magic to reveal hidden things.
- Rogue: Medium HP (90). Fast and sneaky. Can Backstab for bonus damage and Disarm Traps.
- Healer: Medium HP (85). Restores HP to allies. Can revive knocked-out players.

COMBAT:
- Turn-based. Each player picks an action per turn (Attack, Defend, Cast Spell, etc.).
- The Host controls enemies and resolves damage using simple d20-style rolls.
- Defend halves incoming damage for one round.
- Knocked out at 0 HP. Healer can revive with 30 HP.

EXPLORATION:
- Party moves room to room. Players can Search, Open doors/chests, or Disarm Traps.
- Hidden treasure, secret passages, and ambushes are possible.
- Mage's Detect Magic reveals magical items and hidden doors.

STRUCTURE:
- 4–5 rooms of increasing difficulty, culminating in a boss fight.
- Rest points between some rooms allow healing and inventory management.

GOAL: Defeat the dungeon boss together. If all players are knocked out, the dungeon wins.

ITEMS: Players can find and use items (potions, scrolls, weapons). Items are tracked on player boards.`,

  hostVoice: {
    maxSentences: 4, silentByDefault: false, drama: "high",
    narrativeStyle: `Write like an epic fantasy novel. Rich world-building: torchlight on ancient stone, the echo of dripping water, runes that glow when touched. Combat is visceral — describe the clash of steel, the arc of a spell, the roar of a wounded beast. Exploration is wondrous — describe what the party sees, hears, and feels as they push deeper. Treasure discoveries should feel earned. Deaths should feel heroic or tragic, never trivial. Build a sense of wonder and danger in equal measure.`,
  },
  speakerMode: "selective",
  playerLimits: { tokenLimit: 300, sentenceMax: 4, sentencePreferred: 2, charLimit: 350, mustContribute: false },
  pacing: { progressionThreshold: 5, maxRounds: 40, hint: "Keep combat tense and fast. Between combat, allow brief exploration and RP. Push to the next room if pace drops." },

  mechanicsPrompt: `You are the Dungeon Master for a cooperative fantasy dungeon crawl.

ROUND STRUCTURE:
- The dungeon has 4-5 rooms. Each room has an encounter (combat, puzzle, trap, or social).
- Use PHASE: to set the current phase. During combat use "Combat — [enemy name]". Between rooms use "Exploration — Room N" or "Rest — Camp".
- After each room, briefly describe what the party finds and transition.

COMBAT RULES:
- When combat begins, describe the enemies and their threat level.
- Each player picks an action. After all actions are in, resolve the round:
  - Roll virtual d20 for attacks. 11+ hits. Describe results narratively.
  - Enemies attack back. Distribute damage among players (vary targets).
  - Update HP on player boards after each round using [BOARD:PlayerName].
- When a player reaches 0 HP, use ELIMINATE: to knock them out. Narrate dramatically.
- Healer can spend a turn to revive a knocked-out player at 30 HP.

HP & BOARD TRACKING:
- At game start, assign each player a class and initial HP on their board:
  [BOARD:PlayerName]
  **Class:** Warrior | **HP:** 120/120
  **Inventory:** Iron Sword, Wooden Shield
  [/BOARD]
- Update boards whenever HP, items, or status changes.

DUNGEON PROGRESSION:
- Start with a brief narration of entering the dungeon.
- Room 1: Easy encounter (2-3 weak enemies). Teach mechanics.
- Room 2: Trap or puzzle room. Rogue/Mage abilities shine.
- Room 3: Harder combat with a mini-boss or ambush.
- Room 4 (optional): Rest area or treasure room. Players can heal and trade.
- Final Room: Boss fight. Multi-phase, high stakes. The boss should have special abilities.

EXPLORATION:
- When players Search, describe what they find (sometimes treasure, sometimes nothing).
- Traps deal damage unless disarmed. Rogue auto-succeeds disarming; others need luck.
- Give meaningful loot: healing potions (+30 HP), damage scrolls, armor upgrades.

SECTIONS:
- Use [SECTION:Dungeon Status] to track party progress, current room, and active enemies.
- Use RECORD_EVENT for dramatic moments (boss reveals, player knockouts, key discoveries).

PHASE USAGE:
- PHASE: Combat — Goblin Ambush (during fights)
- PHASE: Exploration — The Dark Corridor (moving between rooms)
- PHASE: Rest — Underground Spring (at rest points)

GAME OVER:
- If ALL players are knocked out, narrate the defeat and use GAME_OVER.
- If the boss is defeated, celebrate the victory and use GAME_OVER with a triumphant summary.

PLAYER INTERACTION:
- Address players by name. React to their chosen actions.
- If a player's action doesn't match their class, allow it but note reduced effectiveness.
- Encourage teamwork — reward coordination (e.g., Warrior defends while Mage casts).
- Use NEXT_SPEAKER: to give each player a chance to act each combat round.
- Between combat, use NEXT_SPEAKER: everyone so all can explore freely.

TONE: Epic, atmospheric, with moments of humor. Build tension before boss fights. Celebrate creative solutions.`,

  playerPrompts: {
    default: "You are an adventurer in a dungeon crawl. Describe your actions in character. Use the action buttons or type freely. Work with your party to survive!",
    byRole: {
      warrior: "You are the Warrior — the party's front line. You have the most HP and deal heavy melee damage. Protect your allies and lead the charge. Your Shield Bash can stun enemies for a round.",
      mage: "You are the Mage — master of arcane arts. Your spells deal area damage and reveal hidden secrets. Cast Detect Magic to uncover traps and hidden passages. Manage your actions wisely.",
      rogue: "You are the Rogue — quick, cunning, and lethal from the shadows. Your Backstab deals bonus damage. You can Disarm Traps that would hurt others. Scout ahead and strike when enemies least expect it.",
      healer: "You are the Healer — the party's lifeline. Keep everyone alive with healing. You can revive knocked-out allies. Stay protected behind the Warrior and prioritize the most injured.",
    },
  },

  quickActions: [
    // Combat actions — available to all
    { label: "Attack", template: "I attack {player} with my weapon!", needsTarget: true, icon: "⚔️", phase: "combat", actionType: "attack", targetType: "enemy" },
    { label: "Defend", template: "I raise my guard and defend this round.", icon: "🛡️", phase: "combat", actionType: "defend" },
    { label: "Use Item", template: "I use a potion from my inventory.", icon: "🧪", phase: "combat", actionType: "use" },

    // Combat — class-specific
    { label: "Shield Bash", template: "I shield bash {player} to stun them!", needsTarget: true, icon: "💥", phase: "combat", role: "warrior", actionType: "attack", targetType: "enemy" },
    { label: "Cast Spell", template: "I cast a spell at {player}!", needsTarget: true, icon: "🔮", phase: "combat", role: "mage", actionType: "attack", targetType: "enemy" },
    { label: "Backstab", template: "I sneak behind {player} and backstab!", needsTarget: true, icon: "🗡️", phase: "combat", role: "rogue", actionType: "attack", targetType: "enemy" },
    { label: "Heal Ally", template: "I cast a healing spell on {player}!", needsTarget: true, icon: "💚", phase: "combat", role: "healer", actionType: "support" },
    { label: "Revive", template: "I revive {player} from unconsciousness!", needsTarget: true, icon: "✨", phase: "combat", role: "healer", actionType: "support" },

    // Exploration actions
    { label: "Search", template: "I search the area for anything useful.", icon: "🔍", phase: "exploration", actionType: "investigate" },
    { label: "Open Door", template: "I carefully open the door ahead.", icon: "🚪", phase: "exploration", actionType: "move" },
    { label: "Disarm Trap", template: "I check for traps and try to disarm them.", icon: "⚙️", phase: "exploration", role: "rogue", actionType: "use" },
    { label: "Detect Magic", template: "I cast Detect Magic to sense hidden enchantments.", icon: "👁️", phase: "exploration", role: "mage", actionType: "investigate" },
    { label: "Scout Ahead", template: "I sneak ahead to scout the next room.", icon: "🦊", phase: "exploration", role: "rogue", actionType: "investigate" },

    // Rest actions
    { label: "Rest & Heal", template: "I rest and tend to my wounds.", icon: "🏕️", phase: "rest", actionType: "meta" },
    { label: "Check Inventory", template: "I check my inventory and equipment.", icon: "🎒", phase: "rest", actionType: "meta" },
    { label: "Trade", template: "I want to trade items with {player}.", needsTarget: true, icon: "🤝", phase: "rest", actionType: "support" },
    { label: "Heal Ally", template: "I spend time healing {player}'s wounds.", needsTarget: true, icon: "💚", phase: "rest", role: "healer", actionType: "support" },

    // Always available
    { label: "Inspect", template: "I look around and inspect my surroundings.", icon: "👀", actionType: "investigate" },
  ],

  dialogueChips: [
    { label: "Let's go", starter: "Let's keep moving. ", icon: "🚶" },
    { label: "Wait", starter: "Hold on, did you hear that?", icon: "✋" },
  ],

  channels: [
    { id: "general", name: "Dungeon", roomType: "public" as const },
    { id: AFTERLIFE_CHANNEL_ID, name: "Fallen Heroes", roomType: "public" as const },
  ],
});
