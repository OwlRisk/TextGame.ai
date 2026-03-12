/**
 * Core RPG data types for the Open World RPG system.
 * These replace the flat Player.hp/inventory/skills with a proper character model
 * and add structured world state tracking.
 */

// ── Items ───────────────────────────────────────────────────────────────

export type ItemType = "weapon" | "armor" | "accessory" | "consumable" | "quest" | "material";
export type ItemRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  rarity: ItemRarity;
  description: string;
  stats?: Record<string, number>;
  effect?: string;
}

export const RARITY_COLORS: Record<ItemRarity, string> = {
  common: "#9ca3af",
  uncommon: "#22c55e",
  rare: "#3b82f6",
  epic: "#a855f7",
  legendary: "#f59e0b",
};

// ── Character System ────────────────────────────────────────────────────

export interface CharacterSkill {
  name: string;
  type: "attack" | "heal" | "buff" | "utility";
  cost: number;
  cooldown: number;
  currentCooldown: number;
  description: string;
}

export interface StatusEffect {
  name: string;
  turnsLeft: number;
  effect: string;
}

export interface CharacterAttributes {
  strength: number;
  agility: number;
  intelligence: number;
  charisma: number;
  constitution: number;
}

export interface CharacterEquipment {
  weapon?: Item;
  armor?: Item;
  accessory?: Item;
}

export interface RPGCharacter {
  id: string;
  name: string;
  class: string;
  level: number;
  xp: number;
  xpToNext: number;

  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;

  attributes: CharacterAttributes;
  skills: CharacterSkill[];
  equipment: CharacterEquipment;
  inventory: Item[];
  gold: number;
  statusEffects: StatusEffect[];
}

// ── Quests ───────────────────────────────────────────────────────────────

export interface QuestObjective {
  id: string;
  description: string;
  completed: boolean;
  current?: number;
  target?: number;
}

export interface Quest {
  id: string;
  name: string;
  description: string;
  type: "main" | "side" | "bounty";
  status: "active" | "completed" | "failed";
  objectives: QuestObjective[];
  rewards?: { xp?: number; gold?: number; items?: string[] };
  givenBy?: string;
  roomId?: string;
}

// ── Room State ──────────────────────────────────────────────────────────

export interface RoomState {
  encountersCompleted: string[];
  npcsSpokenTo: string[];
  itemsCollected: string[];
  isCleared: boolean;
  customFlags: Record<string, boolean>;
}

// ── World Party State ───────────────────────────────────────────────────

export interface WorldPartyState {
  characters: RPGCharacter[];
  activeQuests: Quest[];
  completedQuests: string[];
  currentRoomId: string;
  visitedRoomIds: string[];
  roomStates: Record<string, RoomState>;
  worldEvents: string[];
  gold: number;
  playTimeMinutes: number;
  lastPlayedAt: string;
}

// ── Enemy / Combat ──────────────────────────────────────────────────────

export interface EnemyStats {
  name: string;
  hp: number;
  attack: number;
  defense: number;
  xpReward: number;
  goldReward: number;
  loot?: Array<{ item: string; rarity: ItemRarity; chance: number }>;
}

// ── Theme Enhancements ──────────────────────────────────────────────────

export interface MainQuestStage {
  id: string;
  name: string;
  description: string;
  roomId: string;
  objectives: string[];
}

export interface ThemeItemDef {
  name: string;
  type: ItemType;
  rarity: ItemRarity;
  description: string;
  stats?: Record<string, number>;
  effect?: string;
  buyPrice?: number;
}

export interface ThemeEnemyDef {
  name: string;
  hp: number;
  attack: number;
  defense: number;
  xpReward: number;
  goldReward: number;
  loot?: Array<{ item: string; rarity: ItemRarity; chance: number }>;
}

// ── Class Definitions ───────────────────────────────────────────────────

export interface ClassDef {
  name: string;
  baseHp: number;
  baseMp: number;
  attributes: CharacterAttributes;
  startingSkills: CharacterSkill[];
  startingEquipment: { weapon: string; armor: string };
}

// ── XP Thresholds ───────────────────────────────────────────────────────

export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

// ── Default Character Builder ───────────────────────────────────────────

export const CLASS_DEFINITIONS: Record<string, ClassDef> = {
  Fighter: {
    name: "Fighter",
    baseHp: 120,
    baseMp: 30,
    attributes: { strength: 14, agility: 10, intelligence: 8, charisma: 10, constitution: 14 },
    startingSkills: [
      { name: "Power Strike", type: "attack", cost: 5, cooldown: 0, currentCooldown: 0, description: "A heavy melee attack dealing bonus damage" },
      { name: "Shield Wall", type: "buff", cost: 8, cooldown: 3, currentCooldown: 0, description: "Raises defense for 2 turns" },
    ],
    startingEquipment: { weapon: "Iron Sword", armor: "Chain Mail" },
  },
  Rogue: {
    name: "Rogue",
    baseHp: 90,
    baseMp: 50,
    attributes: { strength: 10, agility: 14, intelligence: 10, charisma: 12, constitution: 10 },
    startingSkills: [
      { name: "Backstab", type: "attack", cost: 6, cooldown: 1, currentCooldown: 0, description: "Deals double damage from stealth" },
      { name: "Evasion", type: "buff", cost: 4, cooldown: 2, currentCooldown: 0, description: "Dodge the next attack" },
    ],
    startingEquipment: { weapon: "Twin Daggers", armor: "Leather Armor" },
  },
  Mage: {
    name: "Mage",
    baseHp: 70,
    baseMp: 100,
    attributes: { strength: 6, agility: 10, intelligence: 16, charisma: 10, constitution: 8 },
    startingSkills: [
      { name: "Fireball", type: "attack", cost: 12, cooldown: 1, currentCooldown: 0, description: "Launches a ball of fire at the enemy" },
      { name: "Arcane Shield", type: "buff", cost: 8, cooldown: 3, currentCooldown: 0, description: "Creates a magical barrier absorbing damage" },
    ],
    startingEquipment: { weapon: "Oak Staff", armor: "Cloth Robes" },
  },
  Healer: {
    name: "Healer",
    baseHp: 85,
    baseMp: 80,
    attributes: { strength: 8, agility: 8, intelligence: 14, charisma: 14, constitution: 12 },
    startingSkills: [
      { name: "Heal", type: "heal", cost: 10, cooldown: 0, currentCooldown: 0, description: "Restores HP to a party member" },
      { name: "Purify", type: "heal", cost: 6, cooldown: 2, currentCooldown: 0, description: "Removes status effects from a party member" },
    ],
    startingEquipment: { weapon: "Holy Mace", armor: "Priest Robes" },
  },
  Soldier: {
    name: "Soldier",
    baseHp: 110,
    baseMp: 40,
    attributes: { strength: 14, agility: 12, intelligence: 8, charisma: 8, constitution: 14 },
    startingSkills: [
      { name: "Burst Fire", type: "attack", cost: 8, cooldown: 1, currentCooldown: 0, description: "Fires a rapid volley of shots" },
      { name: "Fortify", type: "buff", cost: 6, cooldown: 3, currentCooldown: 0, description: "Digs in for increased defense" },
    ],
    startingEquipment: { weapon: "Assault Rifle", armor: "Tactical Vest" },
  },
  Medic: {
    name: "Medic",
    baseHp: 90,
    baseMp: 70,
    attributes: { strength: 8, agility: 10, intelligence: 14, charisma: 12, constitution: 12 },
    startingSkills: [
      { name: "First Aid", type: "heal", cost: 8, cooldown: 0, currentCooldown: 0, description: "Bandages wounds and restores HP" },
      { name: "Adrenaline Shot", type: "buff", cost: 10, cooldown: 3, currentCooldown: 0, description: "Boosts an ally's next attack" },
    ],
    startingEquipment: { weapon: "Pistol", armor: "Medical Vest" },
  },
  Scout: {
    name: "Scout",
    baseHp: 80,
    baseMp: 60,
    attributes: { strength: 10, agility: 16, intelligence: 10, charisma: 10, constitution: 10 },
    startingSkills: [
      { name: "Snipe", type: "attack", cost: 10, cooldown: 2, currentCooldown: 0, description: "Precise long-range shot" },
      { name: "Stealth", type: "utility", cost: 5, cooldown: 2, currentCooldown: 0, description: "Becomes harder to detect" },
    ],
    startingEquipment: { weapon: "Hunting Rifle", armor: "Ghillie Suit" },
  },
  Engineer: {
    name: "Engineer",
    baseHp: 95,
    baseMp: 55,
    attributes: { strength: 10, agility: 10, intelligence: 14, charisma: 10, constitution: 12 },
    startingSkills: [
      { name: "Deploy Turret", type: "attack", cost: 15, cooldown: 4, currentCooldown: 0, description: "Sets up an automated turret" },
      { name: "Repair", type: "heal", cost: 8, cooldown: 1, currentCooldown: 0, description: "Repairs equipment or barricades" },
    ],
    startingEquipment: { weapon: "Shotgun", armor: "Work Vest" },
  },
  "Battle Mage": {
    name: "Battle Mage",
    baseHp: 80,
    baseMp: 90,
    attributes: { strength: 10, agility: 10, intelligence: 16, charisma: 10, constitution: 10 },
    startingSkills: [
      { name: "Lightning Bolt", type: "attack", cost: 10, cooldown: 1, currentCooldown: 0, description: "Strikes with a bolt of lightning" },
      { name: "Mana Shield", type: "buff", cost: 12, cooldown: 3, currentCooldown: 0, description: "Absorbs damage using mana" },
    ],
    startingEquipment: { weapon: "Crystal Wand", armor: "Enchanted Robes" },
  },
  Summoner: {
    name: "Summoner",
    baseHp: 75,
    baseMp: 95,
    attributes: { strength: 6, agility: 8, intelligence: 16, charisma: 12, constitution: 8 },
    startingSkills: [
      { name: "Summon Familiar", type: "attack", cost: 15, cooldown: 3, currentCooldown: 0, description: "Calls a spirit creature to fight" },
      { name: "Spirit Link", type: "heal", cost: 8, cooldown: 2, currentCooldown: 0, description: "Heals through a spiritual bond" },
    ],
    startingEquipment: { weapon: "Spirit Compass", armor: "Spirit Cloak" },
  },
  Enchanter: {
    name: "Enchanter",
    baseHp: 70,
    baseMp: 100,
    attributes: { strength: 6, agility: 10, intelligence: 14, charisma: 16, constitution: 8 },
    startingSkills: [
      { name: "Enchant Weapon", type: "buff", cost: 10, cooldown: 2, currentCooldown: 0, description: "Adds magical damage to an ally's weapon" },
      { name: "Charm", type: "utility", cost: 12, cooldown: 3, currentCooldown: 0, description: "Confuses an enemy for 1 turn" },
    ],
    startingEquipment: { weapon: "Enchanted Quill", armor: "Silk Robes" },
  },
  Netrunner: {
    name: "Netrunner",
    baseHp: 70,
    baseMp: 100,
    attributes: { strength: 6, agility: 12, intelligence: 16, charisma: 10, constitution: 8 },
    startingSkills: [
      { name: "System Hack", type: "attack", cost: 12, cooldown: 1, currentCooldown: 0, description: "Disrupts enemy systems" },
      { name: "Firewall", type: "buff", cost: 8, cooldown: 3, currentCooldown: 0, description: "Blocks incoming digital attacks" },
    ],
    startingEquipment: { weapon: "Hacking Deck", armor: "Neural Interface" },
  },
  "Street Samurai": {
    name: "Street Samurai",
    baseHp: 110,
    baseMp: 30,
    attributes: { strength: 16, agility: 14, intelligence: 6, charisma: 8, constitution: 14 },
    startingSkills: [
      { name: "Blade Storm", type: "attack", cost: 8, cooldown: 1, currentCooldown: 0, description: "A flurry of katana strikes" },
      { name: "Cyber Reflexes", type: "buff", cost: 5, cooldown: 2, currentCooldown: 0, description: "Augmented reflexes boost dodge chance" },
    ],
    startingEquipment: { weapon: "Plasma Katana", armor: "Cybernetic Armor" },
  },
  Techie: {
    name: "Techie",
    baseHp: 90,
    baseMp: 60,
    attributes: { strength: 10, agility: 10, intelligence: 14, charisma: 10, constitution: 12 },
    startingSkills: [
      { name: "EMP Blast", type: "attack", cost: 12, cooldown: 2, currentCooldown: 0, description: "Disables electronics in an area" },
      { name: "Quick Fix", type: "heal", cost: 6, cooldown: 1, currentCooldown: 0, description: "Patches up wounds with tech" },
    ],
    startingEquipment: { weapon: "Plasma Pistol", armor: "Tech Vest" },
  },
  Face: {
    name: "Face",
    baseHp: 80,
    baseMp: 70,
    attributes: { strength: 8, agility: 12, intelligence: 12, charisma: 16, constitution: 8 },
    startingSkills: [
      { name: "Silver Tongue", type: "utility", cost: 6, cooldown: 1, currentCooldown: 0, description: "Persuades or distracts an enemy" },
      { name: "Dirty Trick", type: "attack", cost: 8, cooldown: 2, currentCooldown: 0, description: "An underhanded combat move" },
    ],
    startingEquipment: { weapon: "Hold-out Pistol", armor: "Armored Suit" },
  },
};

export function buildDefaultCharacter(name: string, className: string, id: string): RPGCharacter {
  const def = CLASS_DEFINITIONS[className];
  if (!def) {
    return {
      id, name, class: className,
      level: 1, xp: 0, xpToNext: xpForLevel(1),
      hp: 100, maxHp: 100, mp: 50, maxMp: 50,
      attributes: { strength: 10, agility: 10, intelligence: 10, charisma: 10, constitution: 10 },
      skills: [], equipment: {}, inventory: [], gold: 50, statusEffects: [],
    };
  }
  return {
    id, name, class: className,
    level: 1, xp: 0, xpToNext: xpForLevel(1),
    hp: def.baseHp, maxHp: def.baseHp,
    mp: def.baseMp, maxMp: def.baseMp,
    attributes: { ...def.attributes },
    skills: def.startingSkills.map((s) => ({ ...s })),
    equipment: {},
    inventory: [],
    gold: 50,
    statusEffects: [],
  };
}
