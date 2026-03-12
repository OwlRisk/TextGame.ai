import { describe, it, expect } from "vitest";
import {
  xpForLevel,
  buildDefaultCharacter,
  CLASS_DEFINITIONS,
  RARITY_COLORS,
  type RPGCharacter,
  type ItemRarity,
} from "../rpg-types";

describe("xpForLevel", () => {
  it("returns 100 for level 1", () => {
    expect(xpForLevel(1)).toBe(100);
  });

  it("returns 150 for level 2", () => {
    expect(xpForLevel(2)).toBe(150);
  });

  it("increases exponentially", () => {
    const l3 = xpForLevel(3);
    const l4 = xpForLevel(4);
    expect(l4).toBeGreaterThan(l3);
    expect(l3).toBeGreaterThan(xpForLevel(2));
  });

  it("never returns zero or negative", () => {
    for (let i = 1; i <= 50; i++) {
      expect(xpForLevel(i)).toBeGreaterThan(0);
    }
  });

  it("returns an integer", () => {
    for (let i = 1; i <= 20; i++) {
      expect(Number.isInteger(xpForLevel(i))).toBe(true);
    }
  });
});

describe("CLASS_DEFINITIONS", () => {
  const classNames = Object.keys(CLASS_DEFINITIONS);

  it("has at least 10 classes defined", () => {
    expect(classNames.length).toBeGreaterThanOrEqual(10);
  });

  it.each(classNames)("class '%s' has valid baseHp and baseMp", (name) => {
    const def = CLASS_DEFINITIONS[name];
    expect(def.baseHp).toBeGreaterThan(0);
    expect(def.baseMp).toBeGreaterThanOrEqual(0);
  });

  it.each(classNames)("class '%s' has all five attributes", (name) => {
    const attrs = CLASS_DEFINITIONS[name].attributes;
    expect(attrs).toHaveProperty("strength");
    expect(attrs).toHaveProperty("agility");
    expect(attrs).toHaveProperty("intelligence");
    expect(attrs).toHaveProperty("charisma");
    expect(attrs).toHaveProperty("constitution");
    for (const val of Object.values(attrs)) {
      expect(val).toBeGreaterThan(0);
    }
  });

  it.each(classNames)("class '%s' has at least 1 starting skill", (name) => {
    const skills = CLASS_DEFINITIONS[name].startingSkills;
    expect(skills.length).toBeGreaterThanOrEqual(1);
    for (const skill of skills) {
      expect(skill.name).toBeTruthy();
      expect(["attack", "heal", "buff", "utility"]).toContain(skill.type);
      expect(skill.cost).toBeGreaterThanOrEqual(0);
      expect(skill.cooldown).toBeGreaterThanOrEqual(0);
      expect(skill.currentCooldown).toBe(0);
      expect(skill.description).toBeTruthy();
    }
  });

  it.each(classNames)("class '%s' has starting equipment", (name) => {
    const equip = CLASS_DEFINITIONS[name].startingEquipment;
    expect(equip.weapon).toBeTruthy();
    expect(equip.armor).toBeTruthy();
  });
});

describe("buildDefaultCharacter", () => {
  it("builds a Fighter with correct stats from class definition", () => {
    const char = buildDefaultCharacter("Hero", "Fighter", "char_1");
    expect(char.id).toBe("char_1");
    expect(char.name).toBe("Hero");
    expect(char.class).toBe("Fighter");
    expect(char.level).toBe(1);
    expect(char.xp).toBe(0);
    expect(char.xpToNext).toBe(xpForLevel(1));
    expect(char.hp).toBe(CLASS_DEFINITIONS.Fighter.baseHp);
    expect(char.maxHp).toBe(CLASS_DEFINITIONS.Fighter.baseHp);
    expect(char.mp).toBe(CLASS_DEFINITIONS.Fighter.baseMp);
    expect(char.maxMp).toBe(CLASS_DEFINITIONS.Fighter.baseMp);
    expect(char.skills.length).toBe(CLASS_DEFINITIONS.Fighter.startingSkills.length);
    expect(char.gold).toBe(50);
    expect(char.statusEffects).toEqual([]);
    expect(char.inventory).toEqual([]);
  });

  it("returns default stats for an unknown class", () => {
    const char = buildDefaultCharacter("Unknown", "Druid", "char_2");
    expect(char.class).toBe("Druid");
    expect(char.hp).toBe(100);
    expect(char.maxHp).toBe(100);
    expect(char.mp).toBe(50);
    expect(char.maxMp).toBe(50);
    expect(char.skills).toEqual([]);
    expect(char.attributes.strength).toBe(10);
  });

  it("does not share references with class definition", () => {
    const char1 = buildDefaultCharacter("A", "Mage", "c1");
    const char2 = buildDefaultCharacter("B", "Mage", "c2");
    char1.attributes.intelligence = 999;
    expect(char2.attributes.intelligence).not.toBe(999);
    expect(CLASS_DEFINITIONS.Mage.attributes.intelligence).not.toBe(999);
  });

  it("skills are independent copies", () => {
    const char = buildDefaultCharacter("A", "Rogue", "c1");
    char.skills[0].currentCooldown = 5;
    const char2 = buildDefaultCharacter("B", "Rogue", "c2");
    expect(char2.skills[0].currentCooldown).toBe(0);
  });

  it.each(Object.keys(CLASS_DEFINITIONS))("builds valid character for class '%s'", (className) => {
    const char = buildDefaultCharacter("Test", className, "test_id");
    expect(char.level).toBe(1);
    expect(char.hp).toBe(char.maxHp);
    expect(char.mp).toBe(char.maxMp);
    expect(char.xpToNext).toBe(100);
    expect(char.gold).toBe(50);
  });
});

describe("RARITY_COLORS", () => {
  const rarities: ItemRarity[] = ["common", "uncommon", "rare", "epic", "legendary"];

  it("has a color for every rarity tier", () => {
    for (const r of rarities) {
      expect(RARITY_COLORS[r]).toBeTruthy();
      expect(RARITY_COLORS[r]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("all colors are unique", () => {
    const colors = Object.values(RARITY_COLORS);
    expect(new Set(colors).size).toBe(colors.length);
  });
});
