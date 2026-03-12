import type { MainQuestStage, ThemeItemDef, ThemeEnemyDef } from "@/lib/rpg-types";

export interface WorldRoomDef {
  id: string;
  name: string;
  roomType: "hub" | "combat" | "quest" | "shop" | "boss" | "mystery";
  description: string;
  icon: string;
  connections: string[];
  encounters?: string[];
  npcs?: string[];
}

export interface WorldTheme {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  cover: string;
  coverGradient: string;
  setting: string;
  monsterPool: string[];
  npcArchetypes: string[];
  itemPool: string[];
  partyRoles: string[];
  startingRoomId: string;
  rooms: WorldRoomDef[];
  gmContext: string;
  mainQuest?: MainQuestStage[];
  itemTable?: ThemeItemDef[];
  enemyTable?: ThemeEnemyDef[];
}

export const WORLD_THEMES: WorldTheme[] = [
  {
    id: "cursed-kingdom",
    name: "The Cursed Kingdom",
    description: "A dark fantasy kingdom fallen under a mysterious curse. Explore villages, forests, and dungeons to uncover the truth.",
    icon: "⚔️",
    color: "#7c2d12",
    cover: "/games/game-cover-cursed-kingdom.webp",
    coverGradient: "from-amber-900 to-red-950",
    setting: "The Kingdom of Valdris has fallen under a dark curse. Villages wither, monsters roam the roads, and the once-great capital lies shrouded in shadow.",
    monsterPool: ["Wolf Pack", "Giant Spiders", "Forest Troll", "Bandits", "Skeletons", "Undead Soldiers", "Rock Golem", "Shadow Wraith"],
    npcArchetypes: ["Innkeeper", "Merchant", "Village Elder", "Blacksmith", "Witch", "Guard Captain", "Cursed King", "Spirit Priestess"],
    itemPool: ["Healing Potion", "Rusty Sword", "Iron Shield", "Magic Staff", "Lockpick Set", "Torch", "Rope", "Antidote", "Map Fragment", "Enchanted Amulet", "Shadow Ward", "Dragon Scale"],
    partyRoles: ["Fighter", "Rogue", "Mage", "Healer"],
    startingRoomId: "tavern",
    rooms: [
      { id: "tavern", name: "The Rusty Tankard", roomType: "hub", description: "A roadside tavern — warm, safe, with a crackling fire. The innkeeper knows all the local gossip.", icon: "🍺", connections: ["village", "forest_edge"], npcs: ["Innkeeper Marta", "Traveling Merchant Voss", "Mysterious Stranger"] },
      { id: "village", name: "Ashwick Village", roomType: "quest", description: "A small farming village plagued by disappearances. The elder seeks help.", icon: "🏘️", connections: ["tavern", "graveyard", "temple"], npcs: ["Elder Rowan", "Blacksmith Kael", "Farmer's Daughter Lina"] },
      { id: "forest_edge", name: "Edge of the Thornwood", roomType: "combat", description: "Dense forest entrance. Wolves prowl between the ancient trees.", icon: "🌲", connections: ["tavern", "deep_forest", "ruins"], encounters: ["Wolf Pack"] },
      { id: "deep_forest", name: "Heart of the Thornwood", roomType: "combat", description: "Dark, ancient trees block the sky. Things move in the shadows.", icon: "🌑", connections: ["forest_edge", "witch_hut"], encounters: ["Forest Troll", "Giant Spiders"] },
      { id: "witch_hut", name: "The Witch's Clearing", roomType: "quest", description: "A hut surrounded by glowing mushrooms. Smoke curls from the chimney.", icon: "🍄", connections: ["deep_forest"], npcs: ["Witch Morgana"] },
      { id: "ruins", name: "Fallen Watchtower", roomType: "combat", description: "Crumbling stone ruins. Bandits have made camp in the rubble.", icon: "🏚️", connections: ["forest_edge", "mountain_pass"], encounters: ["Bandits"] },
      { id: "mountain_pass", name: "Windcrest Pass", roomType: "combat", description: "A narrow mountain trail battered by harsh winds.", icon: "⛰️", connections: ["ruins", "castle_gate"], encounters: ["Rock Golem"] },
      { id: "castle_gate", name: "Gates of Castle Valdris", roomType: "mystery", description: "The cursed castle entrance. Guards patrol the walls with hollow eyes.", icon: "🏰", connections: ["mountain_pass", "castle_hall"], npcs: ["Captain of the Guard"] },
      { id: "castle_hall", name: "The Throne Room", roomType: "quest", description: "The heart of the castle. The Cursed King sits motionless on his throne.", icon: "👑", connections: ["castle_gate", "dungeon_entrance"], npcs: ["Cursed King Aldric"] },
      { id: "dungeon_entrance", name: "The Descent", roomType: "combat", description: "Stairs spiral down into darkness. The air is cold and smells of decay.", icon: "🕳️", connections: ["castle_hall", "dungeon_deep"], encounters: ["Undead Soldiers"] },
      { id: "dungeon_deep", name: "The Cursed Chamber", roomType: "boss", description: "Source of the curse. Dark energy pulses from a shattered altar.", icon: "💀", connections: ["dungeon_entrance"], encounters: ["Shadow Wraith"] },
      { id: "graveyard", name: "Ashwick Cemetery", roomType: "mystery", description: "Fog-covered graves. Something stirs beneath the earth.", icon: "⚰️", connections: ["village"], encounters: ["Skeletons"] },
      { id: "temple", name: "Temple of the Dawn", roomType: "hub", description: "Abandoned holy site with a healing fountain. A ghostly priestess guards it.", icon: "⛪", connections: ["village"], npcs: ["Spirit of the High Priestess"] },
    ],
    gmContext: `You are the Game Master for an open-world exploration RPG set in the Kingdom of Valdris.
The kingdom is under a dark curse. The party must explore locations, talk to NPCs, fight monsters, and complete quests to find and break the curse.

MULTI-AGENT BEHAVIOR: AI companions are active participants. After describing a scene, let 1-2 companions react before asking the human. Companions suggest, argue, warn, and act autonomously in combat. They have opinions and personality.

ROOM BEHAVIOR BY TYPE:
- hub: Safe zone. NPCs offer quests, trade items, share info. No random encounters. Companions relax, share stories.
- combat: Random encounters likely. Describe tension, sounds, danger. Companions ready weapons, suggest tactics.
- quest: Story-driven. NPCs have dialogue, objectives, revelations. Companions react to plot developments.
- boss: Major fight. Build tension. Multi-phase combat. Companions coordinate tactics.
- mystery: Puzzles, hidden clues, investigation. Companions use skills (Lore, Stealth) to help.
- shop: Buy/sell items. Merchant NPCs. Companions comment on gear.

IMPORTANT: Use directives (SCENE, HP, ITEM, QUEST, COMBAT, SKILL_CHECK, DICE, MP, XP, LOOT) to update game state. The UI relies on these.`,
    mainQuest: [
      { id: "mq1", name: "The Village Plea", description: "Elder Rowan asks for help investigating disappearances in Ashwick.", roomId: "village", objectives: ["Speak with Elder Rowan", "Investigate the graveyard", "Report findings"] },
      { id: "mq2", name: "The Witch's Knowledge", description: "Witch Morgana may know the source of the curse.", roomId: "witch_hut", objectives: ["Find the Witch's Clearing", "Earn Morgana's trust", "Learn the curse's origin"] },
      { id: "mq3", name: "The Fallen Watchtower", description: "Bandits hold a piece of the curse-breaking artifact.", roomId: "ruins", objectives: ["Clear the bandits", "Recover the Shard of Dawn"] },
      { id: "mq4", name: "Audience with the King", description: "The Cursed King may still be saved.", roomId: "castle_hall", objectives: ["Reach the throne room", "Break through the king's enchantment", "Learn the ritual"] },
      { id: "mq5", name: "The Cursed Chamber", description: "Destroy the source of the curse in the dungeon depths.", roomId: "dungeon_deep", objectives: ["Defeat the Shadow Wraith", "Destroy the shattered altar", "Lift the curse"] },
    ],
    itemTable: [
      { name: "Healing Potion", type: "consumable", rarity: "common", description: "Restores 30 HP", effect: "Heals 30 HP", buyPrice: 15 },
      { name: "Mana Potion", type: "consumable", rarity: "common", description: "Restores 20 MP", effect: "Restores 20 MP", buyPrice: 20 },
      { name: "Iron Sword", type: "weapon", rarity: "common", description: "A sturdy iron blade", stats: { attack: 3 }, buyPrice: 30 },
      { name: "Steel Longsword", type: "weapon", rarity: "uncommon", description: "Well-crafted steel", stats: { attack: 6 }, buyPrice: 80 },
      { name: "Enchanted Staff", type: "weapon", rarity: "rare", description: "Hums with arcane energy", stats: { attack: 8, intelligence: 2 }, buyPrice: 150 },
      { name: "Chain Mail", type: "armor", rarity: "common", description: "Standard chain armor", stats: { defense: 3 }, buyPrice: 40 },
      { name: "Shadow Ward", type: "accessory", rarity: "rare", description: "Protects against dark magic", stats: { defense: 2, intelligence: 2 }, buyPrice: 120 },
      { name: "Shard of Dawn", type: "quest", rarity: "epic", description: "Fragment of the curse-breaking artifact" },
      { name: "Antidote", type: "consumable", rarity: "common", description: "Cures poison", effect: "Removes poison", buyPrice: 10 },
      { name: "Dragon Scale", type: "material", rarity: "legendary", description: "Scale from an ancient dragon" },
    ],
    enemyTable: [
      { name: "Wolf Pack", hp: 30, attack: 8, defense: 3, xpReward: 15, goldReward: 5 },
      { name: "Giant Spiders", hp: 25, attack: 10, defense: 4, xpReward: 20, goldReward: 8 },
      { name: "Forest Troll", hp: 60, attack: 12, defense: 8, xpReward: 40, goldReward: 20, loot: [{ item: "Troll Hide", rarity: "uncommon", chance: 0.3 }] },
      { name: "Bandits", hp: 35, attack: 9, defense: 5, xpReward: 25, goldReward: 30, loot: [{ item: "Steel Longsword", rarity: "uncommon", chance: 0.2 }] },
      { name: "Skeletons", hp: 20, attack: 7, defense: 6, xpReward: 15, goldReward: 5 },
      { name: "Undead Soldiers", hp: 40, attack: 11, defense: 7, xpReward: 30, goldReward: 15 },
      { name: "Rock Golem", hp: 80, attack: 14, defense: 12, xpReward: 50, goldReward: 25, loot: [{ item: "Stone Heart", rarity: "rare", chance: 0.25 }] },
      { name: "Shadow Wraith", hp: 120, attack: 18, defense: 10, xpReward: 100, goldReward: 50, loot: [{ item: "Shadowbane Blade", rarity: "epic", chance: 0.5 }] },
    ],
  },
  {
    id: "zombie-siege",
    name: "Zombie Siege",
    description: "The dead are rising. Survive in a city overrun by zombies. Scavenge, fortify, and fight your way out.",
    icon: "🧟",
    color: "#1a2e05",
    cover: "/games/game-cover-zombie-siege.webp",
    coverGradient: "from-green-950 to-zinc-900",
    setting: "A viral outbreak has turned the city of Haven into a death trap. The living are few, the dead are many. Your group must survive, find supplies, and escape before the military quarantine seals the city forever.",
    monsterPool: ["Zombie Horde", "Crawler", "Bloater", "Screamer", "Zombie Dog Pack", "Infected Survivor", "Zombie Brute"],
    npcArchetypes: ["Survivor", "Military Deserter", "Doctor", "Mechanic", "Looter", "Radio Operator", "Child Survivor"],
    itemPool: ["First Aid Kit", "Pistol Ammo", "Shotgun", "Crowbar", "Canned Food", "Water Bottle", "Flashlight", "Duct Tape", "Car Battery", "Fuel Can", "Radio Parts", "Antibiotics"],
    partyRoles: ["Soldier", "Medic", "Scout", "Engineer"],
    startingRoomId: "safehouse",
    rooms: [
      { id: "safehouse", name: "The Safehouse", roomType: "hub", description: "A boarded-up apartment. Relatively safe. For now.", icon: "🏠", connections: ["street", "hospital"], npcs: ["Radio Operator Jake"] },
      { id: "street", name: "Main Street", roomType: "combat", description: "Abandoned cars, broken glass, and the shuffling of the dead.", icon: "🛣️", connections: ["safehouse", "mall", "police_station"], encounters: ["Zombie Horde", "Crawler"] },
      { id: "mall", name: "Haven Mall", roomType: "combat", description: "A massive shopping center. Plenty of supplies — and plenty of undead.", icon: "🏬", connections: ["street", "parking_garage"], encounters: ["Zombie Horde", "Bloater"] },
      { id: "hospital", name: "City Hospital", roomType: "quest", description: "Overrun but still has medical supplies deep inside.", icon: "🏥", connections: ["safehouse", "underground"], npcs: ["Dr. Chen"], encounters: ["Infected Survivor"] },
      { id: "police_station", name: "Police Station", roomType: "mystery", description: "Weapons lockup still intact. But what happened to the officers?", icon: "🚔", connections: ["street", "sewer"], npcs: ["Military Deserter Cruz"] },
      { id: "underground", name: "Subway Tunnels", roomType: "combat", description: "Dark, cramped tunnels. The echoes make it impossible to tell where they are.", icon: "🚇", connections: ["hospital", "extraction"], encounters: ["Zombie Dog Pack", "Screamer"] },
      { id: "parking_garage", name: "Parking Garage", roomType: "mystery", description: "Vehicles everywhere. If you can find one that works...", icon: "🅿️", connections: ["mall"], npcs: ["Mechanic Rosa"] },
      { id: "sewer", name: "Storm Drain", roomType: "combat", description: "Waist-deep water. Things swim beneath the surface.", icon: "🕳️", connections: ["police_station", "extraction"], encounters: ["Crawler", "Zombie Brute"] },
      { id: "extraction", name: "Extraction Point", roomType: "boss", description: "The helicopter landing zone. But the noise has drawn every zombie in the city.", icon: "🚁", connections: ["underground", "sewer"], encounters: ["Zombie Brute", "Zombie Horde"] },
    ],
    gmContext: `You are the Game Master for a zombie survival RPG set in the city of Haven.
The city is overrun. The party must scavenge supplies, find survivors, and reach the extraction point before the military bombs the city.

TONE: Tense, desperate, gritty. Resources are scarce. Every decision has consequences. Death is real.

MULTI-AGENT BEHAVIOR: AI companions react with fear, determination, or recklessness. The soldier wants to fight through. The medic wants to save everyone. The scout wants to sneak. The engineer wants to build defenses. Let them argue.

ROOM BEHAVIOR:
- hub: Temporary safety. Plan, rest, distribute supplies. Tension of "how long can we stay?"
- combat: Zombie encounters. Describe sounds, smells, panic. Ammo is limited. Companions cover each other.
- quest: Survivor encounters, moral dilemmas (save them or keep moving?), supply caches.
- boss: Final stand. Waves of zombies. Helicopter is coming but need to hold position.
- mystery: What happened here? Find clues about the outbreak. Hidden supply stashes.

IMPORTANT: Use directives (SCENE, HP, ITEM, QUEST, COMBAT, SKILL_CHECK, DICE, MP, XP, LOOT) to track HP, items, quests. Ammo and food are survival resources — track them carefully.`,
    mainQuest: [
      { id: "mq1", name: "Radio Contact", description: "Jake needs help fixing the radio to contact rescue.", roomId: "safehouse", objectives: ["Talk to Radio Operator Jake", "Find Radio Parts"] },
      { id: "mq2", name: "Medical Emergency", description: "A survivor at the hospital needs antibiotics.", roomId: "hospital", objectives: ["Reach the hospital", "Find Dr. Chen", "Secure antibiotics"] },
      { id: "mq3", name: "The Arms Cache", description: "The police station weapons lockup could turn the tide.", roomId: "police_station", objectives: ["Break into the police station", "Find the weapons cache", "Deal with Cruz"] },
      { id: "mq4", name: "Wheels Up", description: "Find a working vehicle in the parking garage.", roomId: "parking_garage", objectives: ["Find Mechanic Rosa", "Locate a working vehicle", "Get fuel"] },
      { id: "mq5", name: "The Last Stand", description: "Hold the extraction point until the helicopter arrives.", roomId: "extraction", objectives: ["Reach the extraction point", "Survive the zombie horde", "Board the helicopter"] },
    ],
    itemTable: [
      { name: "First Aid Kit", type: "consumable", rarity: "common", description: "Restores 30 HP", effect: "Heals 30 HP", buyPrice: 20 },
      { name: "Stim Pack", type: "consumable", rarity: "uncommon", description: "Restores 20 MP and boosts next attack", effect: "Restores 20 MP", buyPrice: 30 },
      { name: "Pistol Ammo", type: "consumable", rarity: "common", description: "+5 ammo for pistol", effect: "+5 ammo", buyPrice: 10 },
      { name: "Shotgun", type: "weapon", rarity: "uncommon", description: "Close range devastation", stats: { attack: 8 }, buyPrice: 80 },
      { name: "Crowbar", type: "weapon", rarity: "common", description: "Reliable melee weapon and tool", stats: { attack: 4 }, buyPrice: 15 },
      { name: "Tactical Vest", type: "armor", rarity: "uncommon", description: "Military-grade protection", stats: { defense: 5 }, buyPrice: 60 },
      { name: "Canned Food", type: "consumable", rarity: "common", description: "Restores 15 HP", effect: "Heals 15 HP", buyPrice: 5 },
      { name: "Radio Parts", type: "quest", rarity: "rare", description: "Components to fix the radio" },
      { name: "Car Battery", type: "quest", rarity: "rare", description: "Power source for vehicles" },
      { name: "Antibiotics", type: "quest", rarity: "rare", description: "Powerful medicine against infection" },
    ],
    enemyTable: [
      { name: "Zombie Horde", hp: 40, attack: 8, defense: 3, xpReward: 20, goldReward: 5 },
      { name: "Crawler", hp: 20, attack: 12, defense: 2, xpReward: 15, goldReward: 3 },
      { name: "Bloater", hp: 60, attack: 15, defense: 5, xpReward: 35, goldReward: 10 },
      { name: "Screamer", hp: 15, attack: 6, defense: 2, xpReward: 25, goldReward: 5 },
      { name: "Zombie Dog Pack", hp: 25, attack: 10, defense: 3, xpReward: 20, goldReward: 5 },
      { name: "Infected Survivor", hp: 45, attack: 11, defense: 6, xpReward: 30, goldReward: 15 },
      { name: "Zombie Brute", hp: 100, attack: 18, defense: 10, xpReward: 60, goldReward: 30, loot: [{ item: "Reinforced Armor", rarity: "rare", chance: 0.3 }] },
    ],
  },
  {
    id: "isekai-academy",
    name: "Isekai Academy",
    description: "Transported to a fantasy world, you enroll in a magic academy. Master spells, make allies, and uncover a dark conspiracy.",
    icon: "✨",
    color: "#4c1d95",
    cover: "/games/game-cover-isekai-academy.webp",
    coverGradient: "from-violet-950 to-indigo-900",
    setting: "You've been summoned to the world of Aetheria and enrolled in the prestigious Starfall Academy — a school for heroes from other worlds. But something sinister lurks beneath the academy's gleaming towers.",
    monsterPool: ["Training Golem", "Shadow Familiar", "Corrupted Student", "Void Beast", "Crystal Guardian", "Dark Professor"],
    npcArchetypes: ["Professor", "Student Rival", "Student Friend", "Mysterious Librarian", "Academy Dean", "Cafeteria Cook", "Spirit Guide"],
    itemPool: ["Mana Potion", "Spell Scroll", "Enchanted Textbook", "Crystal Wand", "Academy Badge", "Teleport Stone", "Spirit Compass", "Memory Orb", "Forbidden Tome", "Starfall Charm"],
    partyRoles: ["Battle Mage", "Healer", "Summoner", "Enchanter"],
    startingRoomId: "entrance_hall",
    rooms: [
      { id: "entrance_hall", name: "Entrance Hall", roomType: "hub", description: "Grand marble halls with floating crystals and enchanted tapestries.", icon: "🏛️", connections: ["classroom", "library", "dormitory"], npcs: ["Academy Dean Aldwin", "Spirit Guide Lumi"] },
      { id: "classroom", name: "Combat Training Hall", roomType: "combat", description: "An arena where students practice combat magic against training golems.", icon: "⚡", connections: ["entrance_hall", "tower"], encounters: ["Training Golem"] },
      { id: "library", name: "The Infinite Library", roomType: "mystery", description: "Shelves that extend into impossible dimensions. Some books bite.", icon: "📚", connections: ["entrance_hall", "restricted_section"], npcs: ["Librarian Void"] },
      { id: "dormitory", name: "Student Dormitory", roomType: "hub", description: "Cozy rooms with enchanted windows showing different worlds.", icon: "🛏️", connections: ["entrance_hall", "cafeteria"], npcs: ["Student Rival Kaito", "Student Friend Elara"] },
      { id: "cafeteria", name: "Enchanted Cafeteria", roomType: "hub", description: "Food appears on plates magically. The cook knows everyone's secrets.", icon: "🍽️", connections: ["dormitory", "garden"], npcs: ["Cook Magda"] },
      { id: "tower", name: "Starfall Tower", roomType: "quest", description: "The academy's highest point. Stars fall here on certain nights.", icon: "🗼", connections: ["classroom", "observatory"], npcs: ["Professor Nightwhisper"] },
      { id: "garden", name: "Spirit Garden", roomType: "mystery", description: "A garden where spirits roam. Plants grow emotions instead of flowers.", icon: "🌸", connections: ["cafeteria", "underground_lab"], encounters: ["Shadow Familiar"] },
      { id: "restricted_section", name: "Restricted Section", roomType: "mystery", description: "Forbidden books and sealed artifacts. Entry is strictly prohibited.", icon: "🚫", connections: ["library", "underground_lab"], encounters: ["Corrupted Student"] },
      { id: "underground_lab", name: "The Sealed Laboratory", roomType: "quest", description: "A hidden lab beneath the academy. Someone has been conducting forbidden experiments.", icon: "🧪", connections: ["garden", "restricted_section", "void_gate"], encounters: ["Void Beast"] },
      { id: "observatory", name: "The Observatory", roomType: "quest", description: "Telescopes that see across dimensions. Something is watching back.", icon: "🔭", connections: ["tower"] },
      { id: "void_gate", name: "The Void Gate", roomType: "boss", description: "A rift between worlds. The source of the corruption threatening the academy.", icon: "🌀", connections: ["underground_lab"], encounters: ["Dark Professor", "Crystal Guardian"] },
    ],
    gmContext: `You are the Game Master for an isekai (transported to another world) RPG at Starfall Academy.
The party are heroes from other worlds, enrolled at a magic academy. They attend classes, make friends and rivals, and gradually uncover a conspiracy involving a dark professor and a void gate.

TONE: Anime-inspired. Mix lighthearted school life with serious magical threats. Humor in the cafeteria, tension in the restricted section.

MULTI-AGENT BEHAVIOR: AI companions are fellow students. They have school-life personalities — the rival is competitive, the friend is supportive, the summoner is shy. In class, they compete. In danger, they unite.

ROOM BEHAVIOR:
- hub: School life. Chatting, eating, studying. Character development and bonding.
- combat: Training exercises or real threats. Magic-based combat with flashy descriptions.
- quest: Story revelations, professor interactions, clue discovery.
- boss: Dramatic magical battles with multi-phase encounters.
- mystery: Investigation, puzzle-solving, forbidden knowledge.

IMPORTANT: Use directives (SCENE, HP, ITEM, QUEST, COMBAT, SKILL_CHECK, DICE, MP, XP, LOOT). Mana = HP equivalent. Spells = skills. Academy badges = quest items.`,
    mainQuest: [
      { id: "mq1", name: "Enrollment", description: "Meet the Dean and receive your first assignment.", roomId: "entrance_hall", objectives: ["Speak with Dean Aldwin", "Get your Academy Badge", "Meet Spirit Guide Lumi"] },
      { id: "mq2", name: "Combat Training", description: "Prove yourself in the training hall.", roomId: "classroom", objectives: ["Defeat a Training Golem", "Learn your first combat spell"] },
      { id: "mq3", name: "The Forbidden Section", description: "Strange books are appearing. Investigate.", roomId: "restricted_section", objectives: ["Gain access to the restricted section", "Find the Forbidden Tome", "Report to Librarian Void"] },
      { id: "mq4", name: "The Dark Professor", description: "Someone is conducting forbidden experiments.", roomId: "underground_lab", objectives: ["Discover the sealed laboratory", "Confront the corrupted students", "Find evidence"] },
      { id: "mq5", name: "The Void Gate", description: "Close the rift before it consumes the academy.", roomId: "void_gate", objectives: ["Reach the Void Gate", "Defeat the Dark Professor", "Seal the rift"] },
    ],
    itemTable: [
      { name: "Mana Potion", type: "consumable", rarity: "common", description: "Restores 25 MP", effect: "Restores 25 MP", buyPrice: 15 },
      { name: "Healing Herb", type: "consumable", rarity: "common", description: "Restores 20 HP", effect: "Heals 20 HP", buyPrice: 10 },
      { name: "Crystal Wand", type: "weapon", rarity: "uncommon", description: "Focuses magical energy", stats: { attack: 5, intelligence: 2 }, buyPrice: 60 },
      { name: "Enchanted Textbook", type: "accessory", rarity: "uncommon", description: "Boosts spell power", stats: { intelligence: 3 }, buyPrice: 45 },
      { name: "Academy Badge", type: "quest", rarity: "uncommon", description: "Proof of enrollment" },
      { name: "Spell Scroll", type: "consumable", rarity: "rare", description: "Teaches a random spell", effect: "Learn a new skill", buyPrice: 100 },
      { name: "Starfall Charm", type: "accessory", rarity: "epic", description: "Imbued with starlight", stats: { intelligence: 5, charisma: 3 } },
      { name: "Forbidden Tome", type: "quest", rarity: "epic", description: "Contains dangerous knowledge" },
      { name: "Memory Orb", type: "quest", rarity: "rare", description: "Stores a memory" },
    ],
    enemyTable: [
      { name: "Training Golem", hp: 30, attack: 6, defense: 8, xpReward: 15, goldReward: 5 },
      { name: "Shadow Familiar", hp: 20, attack: 10, defense: 3, xpReward: 20, goldReward: 8 },
      { name: "Corrupted Student", hp: 40, attack: 12, defense: 6, xpReward: 30, goldReward: 15 },
      { name: "Void Beast", hp: 55, attack: 14, defense: 7, xpReward: 40, goldReward: 20, loot: [{ item: "Void Essence", rarity: "rare", chance: 0.25 }] },
      { name: "Crystal Guardian", hp: 80, attack: 16, defense: 12, xpReward: 60, goldReward: 30, loot: [{ item: "Crystal Core", rarity: "epic", chance: 0.2 }] },
      { name: "Dark Professor", hp: 120, attack: 20, defense: 10, xpReward: 100, goldReward: 50, loot: [{ item: "Staff of Corruption", rarity: "legendary", chance: 0.5 }] },
    ],
  },
  {
    id: "cyberpunk-netrun",
    name: "Cyberpunk: Netrun",
    description: "Hack, fight, and survive in a neon-drenched megacity ruled by corporations. Jack in to the Net, run the streets, take down the corps.",
    icon: "🤖",
    color: "#0e7490",
    cover: "/games/game-cover-cyberpunk-netrun.webp",
    coverGradient: "from-cyan-950 to-zinc-900",
    setting: "Neo-Kyoto, 2087. Megacorporations own the government. The Net is a virtual battlefield. Augmented mercenaries run the streets. Your crew operates from the shadows, taking jobs that nobody else will touch.",
    monsterPool: ["Corporate Security Drone", "Street Gang", "Rogue AI", "Cyborg Enforcer", "Security Mech", "Net Ghost", "Corporate Assassin", "Mutant Rat Pack"],
    npcArchetypes: ["Fixer", "Street Doc", "Hacker", "Corp Executive", "Bar Owner", "Info Broker", "Black Market Dealer", "Rogue Scientist"],
    itemPool: ["Stim Pack", "Neural Interface", "EMP Grenade", "Hacking Deck", "Cybernetic Arm", "Stealth Cloak", "Plasma Pistol", "Data Chip", "Medkit", "Cred Stick", "Scrambler", "Neural Virus"],
    partyRoles: ["Netrunner", "Street Samurai", "Techie", "Face"],
    startingRoomId: "hideout",
    rooms: [
      { id: "hideout", name: "The Hideout", roomType: "hub", description: "An abandoned warehouse converted into your crew's base. Neon leaks through cracked windows. The hum of servers fills the air.", icon: "🏚️", connections: ["neon_alley", "black_market"], npcs: ["Fixer Zero", "Street Doc Mei"] },
      { id: "neon_alley", name: "Neon Alley", roomType: "combat", description: "Rain-slicked streets bathed in flickering holographic ads. Gangs control this territory.", icon: "🌆", connections: ["hideout", "club_void", "corp_plaza"], encounters: ["Street Gang"] },
      { id: "black_market", name: "Underground Market", roomType: "shop", description: "Hidden beneath a noodle shop. If it exists, someone here sells it.", icon: "🏪", connections: ["hideout", "sewer_access"], npcs: ["Black Market Dealer Sato", "Info Broker Whisper"] },
      { id: "club_void", name: "Club Void", roomType: "quest", description: "The city's hottest nightclub. VIPs, fixers, and corp agents mingle under laser lights.", icon: "🎵", connections: ["neon_alley", "vip_lounge"], npcs: ["Bar Owner Duchess", "Corp Executive Tanaka"] },
      { id: "corp_plaza", name: "Nexus Corp Plaza", roomType: "mystery", description: "Glass and steel towers pierce the sky. Surveillance drones patrol every corner.", icon: "🏙️", connections: ["neon_alley", "corp_tower"], npcs: ["Corporate Security AI"] },
      { id: "sewer_access", name: "Sewer Network", roomType: "combat", description: "Tunnel networks beneath the city. Home to outcasts, mutants, and forgotten tech.", icon: "🕳️", connections: ["black_market", "server_farm"], encounters: ["Mutant Rat Pack", "Rogue AI"] },
      { id: "vip_lounge", name: "The VIP Lounge", roomType: "quest", description: "Behind Club Void's velvet ropes. Where the real deals happen.", icon: "🍸", connections: ["club_void"], npcs: ["Rogue Scientist Dr. Kim"] },
      { id: "corp_tower", name: "Nexus Corp Tower", roomType: "combat", description: "The corporation's fortress. Armed guards, laser grids, and AI security.", icon: "🏢", connections: ["corp_plaza", "server_farm"], encounters: ["Corporate Security Drone", "Cyborg Enforcer"] },
      { id: "server_farm", name: "The Server Farm", roomType: "mystery", description: "Massive data center. The corporation's darkest secrets are stored here.", icon: "💾", connections: ["sewer_access", "corp_tower", "net_core"], encounters: ["Security Mech"] },
      { id: "net_core", name: "The Net Core", roomType: "boss", description: "Deep in cyberspace. The rogue AI that controls the corporation awaits.", icon: "🧠", connections: ["server_farm"], encounters: ["Net Ghost", "Corporate Assassin"] },
    ],
    gmContext: `You are the Game Master for a cyberpunk RPG set in Neo-Kyoto, 2087.
The crew takes jobs, hacks systems, fights corporate security, and navigates the neon-lit underworld. The corporations are the enemy. Trust is a commodity.

TONE: Gritty, stylish, morally grey. Technology is both tool and threat. Everyone has an angle.

MULTI-AGENT BEHAVIOR: AI companions are crew members with specialties. The Netrunner wants to hack everything. The Street Samurai wants to fight. The Techie wants to build gadgets. The Face wants to talk their way through. Let them clash over approach.

ROOM BEHAVIOR:
- hub: Crew base or safe house. Plan heists, upgrade gear, share intel. Companions banter about past jobs.
- combat: Street fights, corporate raids. Tactical with cover, hacking mid-combat, cyber-augment abilities.
- quest: Fixer jobs, infiltration missions, data heists. Multiple approaches (stealth vs force vs social).
- boss: Major confrontation — corporate AI, rival crew, or megacorp boss battle.
- mystery: Hacking puzzles, surveillance evasion, data analysis, corporate espionage.
- shop: Black market deals. Upgrades, weapons, information. Everything has a price in credits.

IMPORTANT: Use directives (SCENE, HP, ITEM, QUEST, COMBAT, SKILL_CHECK, DICE, MP, XP, LOOT). Credits = gold. Augments = skills. Data Chips = quest items.`,
    mainQuest: [
      { id: "mq1", name: "The Job", description: "Fixer Zero has a job that could change everything.", roomId: "hideout", objectives: ["Talk to Fixer Zero", "Gather intel on Nexus Corp", "Prepare for the run"] },
      { id: "mq2", name: "Club Contacts", description: "Corp Executive Tanaka has information to trade.", roomId: "club_void", objectives: ["Gain VIP access", "Meet Tanaka", "Extract the data"] },
      { id: "mq3", name: "The Breach", description: "Hack into the corporate network from the sewers.", roomId: "sewer_access", objectives: ["Navigate the sewer network", "Find the access point", "Upload the virus"] },
      { id: "mq4", name: "Tower Assault", description: "Infiltrate the Nexus Corp Tower.", roomId: "corp_tower", objectives: ["Bypass security", "Reach the server farm", "Download the evidence"] },
      { id: "mq5", name: "Net Core Showdown", description: "The rogue AI must be stopped.", roomId: "net_core", objectives: ["Jack into the Net Core", "Defeat the AI", "Choose: destroy or control"] },
    ],
    itemTable: [
      { name: "Stim Pack", type: "consumable", rarity: "common", description: "Restores 25 HP", effect: "Heals 25 HP", buyPrice: 20 },
      { name: "Neural Booster", type: "consumable", rarity: "uncommon", description: "Restores 30 MP", effect: "Restores 30 MP", buyPrice: 30 },
      { name: "EMP Grenade", type: "consumable", rarity: "uncommon", description: "Stuns electronic enemies", effect: "Stuns for 1 turn", buyPrice: 40 },
      { name: "Plasma Pistol", type: "weapon", rarity: "uncommon", description: "Energy-based sidearm", stats: { attack: 6 }, buyPrice: 70 },
      { name: "Hacking Deck", type: "weapon", rarity: "rare", description: "Advanced netrunning hardware", stats: { attack: 8, intelligence: 3 }, buyPrice: 150 },
      { name: "Cybernetic Arm", type: "accessory", rarity: "rare", description: "Enhanced strength augmentation", stats: { strength: 4, attack: 2 }, buyPrice: 200 },
      { name: "Stealth Cloak", type: "armor", rarity: "rare", description: "Light-bending fabric", stats: { defense: 3, agility: 3 }, buyPrice: 180 },
      { name: "Data Chip", type: "quest", rarity: "rare", description: "Contains encrypted corporate data" },
      { name: "Cred Stick", type: "material", rarity: "common", description: "Anonymous credit transfer" },
      { name: "Neural Virus", type: "quest", rarity: "epic", description: "Weapon against the rogue AI" },
    ],
    enemyTable: [
      { name: "Street Gang", hp: 30, attack: 8, defense: 4, xpReward: 15, goldReward: 20 },
      { name: "Corporate Security Drone", hp: 40, attack: 10, defense: 8, xpReward: 25, goldReward: 15 },
      { name: "Rogue AI", hp: 50, attack: 14, defense: 6, xpReward: 35, goldReward: 25 },
      { name: "Cyborg Enforcer", hp: 70, attack: 16, defense: 10, xpReward: 45, goldReward: 35, loot: [{ item: "Cybernetic Parts", rarity: "uncommon", chance: 0.3 }] },
      { name: "Security Mech", hp: 90, attack: 18, defense: 14, xpReward: 55, goldReward: 40, loot: [{ item: "Mech Core", rarity: "rare", chance: 0.2 }] },
      { name: "Net Ghost", hp: 60, attack: 20, defense: 5, xpReward: 50, goldReward: 30 },
      { name: "Corporate Assassin", hp: 100, attack: 22, defense: 12, xpReward: 80, goldReward: 50, loot: [{ item: "Plasma Katana", rarity: "epic", chance: 0.3 }] },
    ],
  },
];

export function getWorldThemeById(themeId: string): WorldTheme | null {
  return WORLD_THEMES.find((t) => t.id === themeId) || null;
}
