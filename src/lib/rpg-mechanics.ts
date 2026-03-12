/**
 * RPG Mechanics Engine — dice rolls, XP, leveling, combat resolution helpers.
 * These functions are used by the client to interpret GM directives and update UI state.
 * The actual combat resolution happens in the AI GM's prompt (it "simulates" dice).
 */

import { type RPGCharacter, type Item, type ItemRarity, xpForLevel, RARITY_COLORS } from "./rpg-types";

// ── Dice Helpers ────────────────────────────────────────────────────────

export interface DiceRollResult {
  character: string;
  diceType: string;
  roll: number;
  modifier: number;
  total: number;
  context: string;
  isCritical: boolean;
  isFumble: boolean;
}

export function parseDiceDirective(raw: string): DiceRollResult | null {
  const parts = raw.split("|").map((s) => s.trim());
  if (parts.length < 5) return null;

  const character = parts[0];
  const diceType = parts[1];
  const roll = parseInt(parts[2], 10);
  const modifier = parseInt(parts[3].replace("+", ""), 10) || 0;
  const total = parseInt(parts[4].replace("=", "").trim(), 10) || roll + modifier;
  const context = parts[5] || "";

  return {
    character,
    diceType,
    roll,
    modifier,
    total,
    context,
    isCritical: roll === 20,
    isFumble: roll === 1,
  };
}

// ── XP & Leveling ───────────────────────────────────────────────────────

export interface LevelUpResult {
  newLevel: number;
  hpGain: number;
  mpGain: number;
  attributePoints: number;
}

export function calculateLevelUp(character: RPGCharacter, xpGain: number): { updatedCharacter: RPGCharacter; leveledUp: boolean; result?: LevelUpResult } {
  const updated = { ...character, xp: character.xp + xpGain };
  if (updated.xp < updated.xpToNext) {
    return { updatedCharacter: updated, leveledUp: false };
  }

  const newLevel = updated.level + 1;
  const hpGain = 5 + Math.floor(updated.attributes.constitution / 3);
  const mpGain = 3 + Math.floor(updated.attributes.intelligence / 3);

  updated.level = newLevel;
  updated.xp = updated.xp - updated.xpToNext;
  updated.xpToNext = xpForLevel(newLevel);
  updated.maxHp += hpGain;
  updated.hp = updated.maxHp;
  updated.maxMp += mpGain;
  updated.mp = updated.maxMp;

  return {
    updatedCharacter: updated,
    leveledUp: true,
    result: { newLevel, hpGain, mpGain, attributePoints: 2 },
  };
}

// ── Loot Generation ─────────────────────────────────────────────────────

export function parseLootDirective(raw: string): { name: string; rarity: ItemRarity; description: string } | null {
  const parts = raw.split("|").map((s) => s.trim());
  if (parts.length < 2) return null;
  const name = parts[0];
  const rarity = (parts[1]?.toLowerCase() || "common") as ItemRarity;
  const description = parts[2] || "";
  return { name, rarity, description };
}

export function createItemFromLoot(name: string, rarity: ItemRarity, description: string): Item {
  const id = `loot_${name.toLowerCase().replace(/\s+/g, "_")}_${Date.now()}`;
  const type = guessItemType(name, description);
  const stats = generateStatsForRarity(rarity, type);

  return { id, name, type, rarity, description, stats, effect: description || undefined };
}

function guessItemType(name: string, description: string): Item["type"] {
  const n = (name + " " + description).toLowerCase();
  if (/sword|axe|bow|staff|dagger|wand|gun|rifle|pistol|blade|katana|mace/.test(n)) return "weapon";
  if (/armor|shield|helm|mail|robe|vest|cloak|boots/.test(n)) return "armor";
  if (/ring|amulet|charm|necklace|bracelet/.test(n)) return "accessory";
  if (/potion|herb|bandage|food|stim|kit|med/.test(n)) return "consumable";
  if (/key|letter|map|badge|chip|scroll|tome/.test(n)) return "quest";
  return "material";
}

function generateStatsForRarity(rarity: ItemRarity, type: Item["type"]): Record<string, number> {
  const multiplier = { common: 1, uncommon: 2, rare: 3, epic: 5, legendary: 8 }[rarity];
  if (type === "weapon") return { attack: 2 * multiplier };
  if (type === "armor") return { defense: 2 * multiplier };
  if (type === "accessory") return { defense: multiplier, attack: multiplier };
  return {};
}

// ── Combat helpers ──────────────────────────────────────────────────────

export interface CombatEnemy {
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
}

export function parseCombatStartDirective(raw: string): CombatEnemy | null {
  const parts = raw.split("|").map((s) => s.trim());
  if (parts.length < 2) return null;

  const name = parts[0];
  let hp = 50, attack = 10, defense = 5;

  for (const p of parts.slice(1)) {
    const [key, val] = p.split(":").map((s) => s.trim());
    if (key === "hp") hp = parseInt(val, 10) || 50;
    else if (key === "atk") attack = parseInt(val, 10) || 10;
    else if (key === "def") defense = parseInt(val, 10) || 5;
  }

  return { name, hp, maxHp: hp, attack, defense };
}

// ── Attribute modifier (D&D-style) ─────────────────────────────────────

export function attributeModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

// ── Rarity colors for UI ────────────────────────────────────────────────

export { RARITY_COLORS };
