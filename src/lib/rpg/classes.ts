import type { RpgCharacter, RpgSkill, RpgItem } from "@/types/rpg";

export interface ClassDefinition {
  id: string;
  name: string;
  nameZh: string;
  description: string;
  descriptionZh: string;
  baseHp: number;
  baseMp: number;
  baseAttack: number;
  baseDefense: number;
  baseSpeed: number;
  baseLuck: number;
  growthHp: number;
  growthMp: number;
  growthAttack: number;
  growthDefense: number;
  startSkills: RpgSkill[];
  startWeapon: RpgItem;
  startArmor: RpgItem;
}

// ── Western Fantasy Classes ──

// Warrior skill evolution tree:
//   Shield Bash (T1) → Fortress Slam (T2, lv5) → Aegis Breaker (T3, lv10)
//   Power Strike (T1) → Crushing Blow (T2, lv5) → Titan Cleave (T3, lv10)
export const WARRIOR: ClassDefinition = {
  id: "warrior",
  name: "Warrior",
  nameZh: "战士",
  description: "A frontline fighter with heavy armor and devastating melee attacks.",
  descriptionZh: "身披重甲的前线斗士，拥有毁灭性的近战攻击。",
  baseHp: 120, baseMp: 30,
  baseAttack: 18, baseDefense: 16, baseSpeed: 8, baseLuck: 6,
  growthHp: 15, growthMp: 3, growthAttack: 4, growthDefense: 3,
  startSkills: [
    { id: "shield-bash", name: "Shield Bash", description: "Stun an enemy for one turn.", type: "active", mpCost: 8, damage: 12, tier: 1, evolvesTo: "fortress-slam", evolveLevel: 5 },
    { id: "power-strike", name: "Power Strike", description: "A devastating blow that deals double damage.", type: "active", mpCost: 15, damage: 25, tier: 1, evolvesTo: "crushing-blow", evolveLevel: 5 },
  ],
  startWeapon: { id: "iron-sword", name: "Iron Sword", description: "A sturdy blade.", icon: "⚔️", rarity: "common", quantity: 1, type: "equipment", quality: "common", statBonus: { attack: 5 } },
  startArmor: { id: "chain-mail", name: "Chain Mail", description: "Linked metal rings.", icon: "🛡️", rarity: "common", quantity: 1, type: "equipment", quality: "common", statBonus: { defense: 8 } },
};

// Mage skill evolution tree:
//   Fireball (T1) → Meteor (T2, lv5) → Cataclysm (T3, lv10)
//   Ice Shield (T1) → Frost Aegis (T2, lv5) → Absolute Zero (T3, lv10)
export const MAGE: ClassDefinition = {
  id: "mage",
  name: "Mage",
  nameZh: "法师",
  description: "A master of arcane forces, dealing massive magic damage from range.",
  descriptionZh: "精通奥术的施法者，从远处释放毁灭性的魔法。",
  baseHp: 70, baseMp: 100,
  baseAttack: 8, baseDefense: 6, baseSpeed: 10, baseLuck: 10,
  growthHp: 6, growthMp: 12, growthAttack: 2, growthDefense: 1,
  startSkills: [
    { id: "fireball", name: "Fireball", description: "Hurl a ball of flame at the enemy.", type: "active", mpCost: 15, damage: 30, tier: 1, evolvesTo: "meteor", evolveLevel: 5 },
    { id: "ice-shield", name: "Ice Shield", description: "Create a barrier of ice that reduces damage.", type: "active", mpCost: 10, effect: "defense +10 for 3 turns", tier: 1, evolvesTo: "frost-aegis", evolveLevel: 5 },
  ],
  startWeapon: { id: "oak-staff", name: "Oak Staff", description: "A gnarled wooden staff.", icon: "🪄", rarity: "common", quantity: 1, type: "equipment", quality: "common", statBonus: { attack: 3 } },
  startArmor: { id: "cloth-robe", name: "Cloth Robe", description: "Light mage robes.", icon: "👘", rarity: "common", quantity: 1, type: "equipment", quality: "common", statBonus: { defense: 2, maxMp: 15 } },
};

// Thief skill evolution tree:
//   Backstab (T1) → Assassination (T2, lv5) → Death Mark (T3, lv10)
//   Lockpick (T1) → Master Infiltrator (T2, lv5) → Phantom Hands (T3, lv10)
export const THIEF: ClassDefinition = {
  id: "thief",
  name: "Thief",
  nameZh: "盗贼",
  description: "A swift rogue specializing in critical hits and utility skills.",
  descriptionZh: "行动迅捷的游侠，擅长暴击和实用技能。",
  baseHp: 85, baseMp: 50,
  baseAttack: 14, baseDefense: 8, baseSpeed: 18, baseLuck: 14,
  growthHp: 8, growthMp: 5, growthAttack: 3, growthDefense: 2,
  startSkills: [
    { id: "backstab", name: "Backstab", description: "Strike from the shadows for triple damage.", type: "active", mpCost: 12, damage: 20, tier: 1, evolvesTo: "assassination", evolveLevel: 5 },
    { id: "lockpick", name: "Lockpick", description: "Open locked doors and chests.", type: "active", mpCost: 5, effect: "unlock", tier: 1, evolvesTo: "master-infiltrator", evolveLevel: 5 },
  ],
  startWeapon: { id: "twin-daggers", name: "Twin Daggers", description: "A pair of sharp blades.", icon: "🗡️", rarity: "common", quantity: 1, type: "equipment", quality: "common", statBonus: { attack: 4, speed: 3 } },
  startArmor: { id: "leather-vest", name: "Leather Vest", description: "Light and flexible.", icon: "🧥", rarity: "common", quantity: 1, type: "equipment", quality: "common", statBonus: { defense: 4, speed: 2 } },
};

// Cleric skill evolution tree:
//   Heal (T1) → Greater Heal (T2, lv5) → Divine Restoration (T3, lv10)
//   Holy Light (T1) → Sacred Flame (T2, lv5) → Judgment (T3, lv10)
export const CLERIC: ClassDefinition = {
  id: "cleric",
  name: "Cleric",
  nameZh: "牧师",
  description: "A holy healer who keeps the party alive and smites the undead.",
  descriptionZh: "神圣的治愈者，维持队伍生命并驱除亡灵。",
  baseHp: 90, baseMp: 80,
  baseAttack: 10, baseDefense: 12, baseSpeed: 8, baseLuck: 12,
  growthHp: 10, growthMp: 8, growthAttack: 2, growthDefense: 3,
  startSkills: [
    { id: "heal", name: "Heal", description: "Restore HP to an ally.", type: "active", mpCost: 12, effect: "heal 30 HP", tier: 1, evolvesTo: "greater-heal", evolveLevel: 5 },
    { id: "holy-light", name: "Holy Light", description: "Blast enemies with radiant energy. Extra damage to undead.", type: "active", mpCost: 18, damage: 22, tier: 1, evolvesTo: "sacred-flame", evolveLevel: 5 },
  ],
  startWeapon: { id: "iron-mace", name: "Iron Mace", description: "A heavy blunt weapon.", icon: "🔨", rarity: "common", quantity: 1, type: "equipment", quality: "common", statBonus: { attack: 4 } },
  startArmor: { id: "scale-armor", name: "Scale Armor", description: "Overlapping metal scales.", icon: "🛡️", rarity: "common", quantity: 1, type: "equipment", quality: "common", statBonus: { defense: 6, maxMp: 10 } },
};

// ── Registry ──

export const WESTERN_CLASSES: ClassDefinition[] = [WARRIOR, MAGE, THIEF, CLERIC];
export const ALL_CLASSES: ClassDefinition[] = [...WESTERN_CLASSES];

export function getClassById(id: string): ClassDefinition | undefined {
  return ALL_CLASSES.find((c) => c.id === id);
}

/** Create a fresh level-1 RpgCharacter from a class definition */
export function createCharacterFromClass(cls: ClassDefinition, faction?: string): RpgCharacter {
  return {
    class: cls.id,
    level: 1,
    exp: 0,
    expToNext: 100,
    hp: cls.baseHp,
    maxHp: cls.baseHp,
    mp: cls.baseMp,
    maxMp: cls.baseMp,
    attack: cls.baseAttack,
    defense: cls.baseDefense,
    speed: cls.baseSpeed,
    luck: cls.baseLuck,
    skills: [...cls.startSkills],
    equipment: {
      weapon: { ...cls.startWeapon },
      armor: { ...cls.startArmor },
    },
    inventory: [],
    statusEffects: [],
    faction,
  };
}
