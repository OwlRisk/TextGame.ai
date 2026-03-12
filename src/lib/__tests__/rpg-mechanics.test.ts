import { describe, it, expect } from "vitest";
import {
  parseDiceDirective,
  calculateLevelUp,
  parseLootDirective,
  createItemFromLoot,
  parseCombatStartDirective,
  attributeModifier,
} from "../rpg-mechanics";
import { buildDefaultCharacter, xpForLevel } from "../rpg-types";

// ── parseDiceDirective ───────────────────────────────────────────────────

describe("parseDiceDirective", () => {
  it("parses a standard d20 roll", () => {
    const result = parseDiceDirective("Kael | d20 | 15 | +3 | = 18 | Attack roll");
    expect(result).not.toBeNull();
    expect(result!.character).toBe("Kael");
    expect(result!.diceType).toBe("d20");
    expect(result!.roll).toBe(15);
    expect(result!.modifier).toBe(3);
    expect(result!.total).toBe(18);
    expect(result!.context).toBe("Attack roll");
  });

  it("detects a critical roll (natural 20)", () => {
    const result = parseDiceDirective("Hero | d20 | 20 | +2 | = 22 | Crit!");
    expect(result!.isCritical).toBe(true);
    expect(result!.isFumble).toBe(false);
  });

  it("detects a fumble (natural 1)", () => {
    const result = parseDiceDirective("Hero | d20 | 1 | +5 | = 6 | Fumble");
    expect(result!.isFumble).toBe(true);
    expect(result!.isCritical).toBe(false);
  });

  it("handles zero modifier", () => {
    const result = parseDiceDirective("Aria | d20 | 12 | +0 | = 12 | Perception");
    expect(result!.modifier).toBe(0);
    expect(result!.total).toBe(12);
  });

  it("handles missing context", () => {
    const result = parseDiceDirective("Hero | d20 | 10 | +2 | = 12");
    expect(result).not.toBeNull();
    expect(result!.context).toBe("");
  });

  it("returns null for insufficient parts", () => {
    expect(parseDiceDirective("Hero | d20")).toBeNull();
    expect(parseDiceDirective("Hero")).toBeNull();
    expect(parseDiceDirective("")).toBeNull();
  });

  it("parses d6 and other dice types", () => {
    const result = parseDiceDirective("Mage | d6 | 4 | +1 | = 5 | Damage");
    expect(result!.diceType).toBe("d6");
    expect(result!.roll).toBe(4);
  });
});

// ── calculateLevelUp ─────────────────────────────────────────────────────

describe("calculateLevelUp", () => {
  it("does not level up when XP is insufficient", () => {
    const char = buildDefaultCharacter("Test", "Fighter", "c1");
    const { updatedCharacter, leveledUp } = calculateLevelUp(char, 50);
    expect(leveledUp).toBe(false);
    expect(updatedCharacter.xp).toBe(50);
    expect(updatedCharacter.level).toBe(1);
  });

  it("levels up when XP reaches threshold", () => {
    const char = buildDefaultCharacter("Test", "Fighter", "c1");
    const { updatedCharacter, leveledUp, result } = calculateLevelUp(char, 100);
    expect(leveledUp).toBe(true);
    expect(result).toBeDefined();
    expect(result!.newLevel).toBe(2);
    expect(updatedCharacter.level).toBe(2);
    expect(updatedCharacter.xpToNext).toBe(xpForLevel(2));
  });

  it("carries over excess XP after leveling", () => {
    const char = buildDefaultCharacter("Test", "Mage", "c1");
    const { updatedCharacter, leveledUp } = calculateLevelUp(char, 130);
    expect(leveledUp).toBe(true);
    expect(updatedCharacter.xp).toBe(30);
  });

  it("increases maxHp and maxMp on level up", () => {
    const char = buildDefaultCharacter("Test", "Fighter", "c1");
    const oldMaxHp = char.maxHp;
    const oldMaxMp = char.maxMp;
    const { updatedCharacter, result } = calculateLevelUp(char, 100);
    expect(updatedCharacter.maxHp).toBe(oldMaxHp + result!.hpGain);
    expect(updatedCharacter.maxMp).toBe(oldMaxMp + result!.mpGain);
  });

  it("fully restores HP and MP on level up", () => {
    const char = buildDefaultCharacter("Test", "Fighter", "c1");
    char.hp = 10;
    char.mp = 5;
    const { updatedCharacter, leveledUp } = calculateLevelUp(char, 100);
    expect(leveledUp).toBe(true);
    expect(updatedCharacter.hp).toBe(updatedCharacter.maxHp);
    expect(updatedCharacter.mp).toBe(updatedCharacter.maxMp);
  });

  it("grants 2 attribute points per level", () => {
    const char = buildDefaultCharacter("Test", "Rogue", "c1");
    const { result } = calculateLevelUp(char, 100);
    expect(result!.attributePoints).toBe(2);
  });

  it("HP gain scales with constitution", () => {
    const char1 = buildDefaultCharacter("Low Con", "Mage", "c1");
    const char2 = buildDefaultCharacter("High Con", "Fighter", "c2");
    const r1 = calculateLevelUp(char1, 100);
    const r2 = calculateLevelUp(char2, 100);
    expect(r2.result!.hpGain).toBeGreaterThan(r1.result!.hpGain);
  });
});

// ── parseLootDirective ───────────────────────────────────────────────────

describe("parseLootDirective", () => {
  it("parses a full loot line", () => {
    const result = parseLootDirective("Dragon Scale Shield | epic | A shield forged from dragon scales");
    expect(result).not.toBeNull();
    expect(result!.name).toBe("Dragon Scale Shield");
    expect(result!.rarity).toBe("epic");
    expect(result!.description).toBe("A shield forged from dragon scales");
  });

  it("defaults to common rarity and empty description", () => {
    const result = parseLootDirective("Rusty Key | common");
    expect(result!.rarity).toBe("common");
    expect(result!.description).toBe("");
  });

  it("handles case insensitivity for rarity", () => {
    const result = parseLootDirective("Magic Ring | RARE | Shiny");
    expect(result!.rarity).toBe("rare");
  });

  it("returns null for insufficient parts", () => {
    expect(parseLootDirective("just-a-name")).toBeNull();
    expect(parseLootDirective("")).toBeNull();
  });
});

// ── createItemFromLoot ───────────────────────────────────────────────────

describe("createItemFromLoot", () => {
  it("creates a weapon item from name containing 'sword'", () => {
    const item = createItemFromLoot("Iron Sword", "common", "A basic sword");
    expect(item.type).toBe("weapon");
    expect(item.rarity).toBe("common");
    expect(item.stats?.attack).toBeDefined();
    expect(item.id).toContain("iron_sword");
  });

  it("creates an armor item from name containing 'armor'", () => {
    const item = createItemFromLoot("Chain Armor", "uncommon", "Sturdy chain links");
    expect(item.type).toBe("armor");
    expect(item.stats?.defense).toBeDefined();
  });

  it("creates a consumable from 'potion'", () => {
    const item = createItemFromLoot("Healing Potion", "common", "Restores HP");
    expect(item.type).toBe("consumable");
  });

  it("creates an accessory from 'ring'", () => {
    const item = createItemFromLoot("Silver Ring", "rare", "Glows faintly");
    expect(item.type).toBe("accessory");
    expect(item.stats?.attack).toBeDefined();
    expect(item.stats?.defense).toBeDefined();
  });

  it("creates a quest item from 'key'", () => {
    const item = createItemFromLoot("Dungeon Key", "uncommon", "Opens the dungeon");
    expect(item.type).toBe("quest");
  });

  it("defaults to material type for unrecognized names", () => {
    const item = createItemFromLoot("Mysterious Orb", "epic", "Pulsates with energy");
    expect(item.type).toBe("material");
  });

  it("higher rarity gives higher stats", () => {
    const common = createItemFromLoot("Iron Sword", "common", "");
    const legendary = createItemFromLoot("Legendary Sword", "legendary", "");
    expect(legendary.stats!.attack).toBeGreaterThan(common.stats!.attack);
  });
});

// ── parseCombatStartDirective ────────────────────────────────────────────

describe("parseCombatStartDirective", () => {
  it("parses a full combat start with stats", () => {
    const result = parseCombatStartDirective("Shadow Wraith | hp:150 | atk:25 | def:12");
    expect(result).not.toBeNull();
    expect(result!.name).toBe("Shadow Wraith");
    expect(result!.hp).toBe(150);
    expect(result!.maxHp).toBe(150);
    expect(result!.attack).toBe(25);
    expect(result!.defense).toBe(12);
  });

  it("uses defaults when stat keys are missing", () => {
    const result = parseCombatStartDirective("Wolf | hp:30");
    expect(result!.name).toBe("Wolf");
    expect(result!.hp).toBe(30);
    expect(result!.attack).toBe(10);
    expect(result!.defense).toBe(5);
  });

  it("sets maxHp equal to hp", () => {
    const result = parseCombatStartDirective("Bandit | hp:80 | atk:15 | def:8");
    expect(result!.maxHp).toBe(result!.hp);
  });

  it("returns null for insufficient parts", () => {
    expect(parseCombatStartDirective("Lonely")).toBeNull();
    expect(parseCombatStartDirective("")).toBeNull();
  });

  it("handles partial stat lines gracefully", () => {
    const result = parseCombatStartDirective("Troll | atk:20");
    expect(result!.name).toBe("Troll");
    expect(result!.hp).toBe(50);
    expect(result!.attack).toBe(20);
    expect(result!.defense).toBe(5);
  });
});

// ── attributeModifier ────────────────────────────────────────────────────

describe("attributeModifier", () => {
  it("returns 0 for score of 10 or 11", () => {
    expect(attributeModifier(10)).toBe(0);
    expect(attributeModifier(11)).toBe(0);
  });

  it("returns negative for low scores", () => {
    expect(attributeModifier(8)).toBe(-1);
    expect(attributeModifier(6)).toBe(-2);
    expect(attributeModifier(1)).toBe(-5);
  });

  it("returns positive for high scores", () => {
    expect(attributeModifier(14)).toBe(2);
    expect(attributeModifier(16)).toBe(3);
    expect(attributeModifier(20)).toBe(5);
  });

  it("follows D&D formula: floor((score - 10) / 2)", () => {
    for (let score = 1; score <= 30; score++) {
      expect(attributeModifier(score)).toBe(Math.floor((score - 10) / 2));
    }
  });
});
