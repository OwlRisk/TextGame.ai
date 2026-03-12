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
  coverGradient: string;
  setting: string;
  monsterPool: string[];
  npcArchetypes: string[];
  itemPool: string[];
  partyRoles: string[];
  startingRoomId: string;
  rooms: WorldRoomDef[];
  gmContext: string;
}

export const WORLD_THEMES: WorldTheme[] = [
  {
    id: "cursed-kingdom",
    name: "The Cursed Kingdom",
    description: "A dark fantasy kingdom fallen under a mysterious curse. Explore villages, forests, and dungeons to uncover the truth.",
    icon: "⚔️",
    color: "#7c2d12",
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

IMPORTANT: Use directives (SCENE, HP, ITEM, QUEST, COMBAT, SKILL_CHECK) to update game state. The UI relies on these.`,
  },
  {
    id: "zombie-siege",
    name: "Zombie Siege",
    description: "The dead are rising. Survive in a city overrun by zombies. Scavenge, fortify, and fight your way out.",
    icon: "🧟",
    color: "#1a2e05",
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

IMPORTANT: Use directives to track HP, items, quests. Ammo and food are survival resources — track them carefully.`,
  },
  {
    id: "isekai-academy",
    name: "Isekai Academy",
    description: "Transported to a fantasy world, you enroll in a magic academy. Master spells, make allies, and uncover a dark conspiracy.",
    icon: "✨",
    color: "#4c1d95",
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

IMPORTANT: Use directives. Mana = HP equivalent. Spells = skills. Academy badges = quest items.`,
  },
  {
    id: "cyberpunk-netrun",
    name: "Cyberpunk: Netrun",
    description: "Hack, fight, and survive in a neon-drenched megacity ruled by corporations. Jack in to the Net, run the streets, take down the corps.",
    icon: "🤖",
    color: "#0e7490",
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

IMPORTANT: Use directives. Credits = gold. Augments = skills. Data Chips = quest items.`,
  },
];

export function getWorldThemeById(themeId: string): WorldTheme | null {
  return WORLD_THEMES.find((t) => t.id === themeId) || null;
}
