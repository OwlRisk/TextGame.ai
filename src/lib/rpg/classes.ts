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
    { id: "shield-bash", name: "Shield Bash", description: "Stun an enemy for one turn.", type: "active", mpCost: 8, damage: 12 },
    { id: "power-strike", name: "Power Strike", description: "A devastating blow that deals double damage.", type: "active", mpCost: 15, damage: 25 },
  ],
  startWeapon: { id: "iron-sword", name: "Iron Sword", description: "A sturdy blade.", icon: "⚔️", rarity: "common", quantity: 1, type: "equipment", statBonus: { attack: 5 } },
  startArmor: { id: "chain-mail", name: "Chain Mail", description: "Linked metal rings.", icon: "🛡️", rarity: "common", quantity: 1, type: "equipment", statBonus: { defense: 8 } },
};

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
    { id: "fireball", name: "Fireball", description: "Hurl a ball of flame at the enemy.", type: "active", mpCost: 15, damage: 30 },
    { id: "ice-shield", name: "Ice Shield", description: "Create a barrier of ice that reduces damage.", type: "active", mpCost: 10, effect: "defense +10 for 3 turns" },
  ],
  startWeapon: { id: "oak-staff", name: "Oak Staff", description: "A gnarled wooden staff.", icon: "🪄", rarity: "common", quantity: 1, type: "equipment", statBonus: { attack: 3 } },
  startArmor: { id: "cloth-robe", name: "Cloth Robe", description: "Light mage robes.", icon: "👘", rarity: "common", quantity: 1, type: "equipment", statBonus: { defense: 2, maxMp: 15 } },
};

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
    { id: "backstab", name: "Backstab", description: "Strike from the shadows for triple damage.", type: "active", mpCost: 12, damage: 20 },
    { id: "lockpick", name: "Lockpick", description: "Open locked doors and chests.", type: "active", mpCost: 5, effect: "unlock" },
  ],
  startWeapon: { id: "twin-daggers", name: "Twin Daggers", description: "A pair of sharp blades.", icon: "🗡️", rarity: "common", quantity: 1, type: "equipment", statBonus: { attack: 4, speed: 3 } },
  startArmor: { id: "leather-vest", name: "Leather Vest", description: "Light and flexible.", icon: "🧥", rarity: "common", quantity: 1, type: "equipment", statBonus: { defense: 4, speed: 2 } },
};

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
    { id: "heal", name: "Heal", description: "Restore HP to an ally.", type: "active", mpCost: 12, effect: "heal 30 HP" },
    { id: "holy-light", name: "Holy Light", description: "Blast enemies with radiant energy. Extra damage to undead.", type: "active", mpCost: 18, damage: 22 },
  ],
  startWeapon: { id: "iron-mace", name: "Iron Mace", description: "A heavy blunt weapon.", icon: "🔨", rarity: "common", quantity: 1, type: "equipment", statBonus: { attack: 4 } },
  startArmor: { id: "scale-armor", name: "Scale Armor", description: "Overlapping metal scales.", icon: "🛡️", rarity: "common", quantity: 1, type: "equipment", statBonus: { defense: 6, maxMp: 10 } },
};

// ── Wuxia Classes ──

export const SWORDSMAN: ClassDefinition = {
  id: "swordsman",
  name: "Swordsman",
  nameZh: "剑客",
  description: "A master of the blade, balanced between offense and defense.",
  descriptionZh: "剑道大师，攻守兼备，招式凌厉。",
  baseHp: 110, baseMp: 50,
  baseAttack: 16, baseDefense: 12, baseSpeed: 14, baseLuck: 8,
  growthHp: 12, growthMp: 5, growthAttack: 4, growthDefense: 2,
  startSkills: [
    { id: "swift-blade", name: "Swift Blade", description: "A lightning-fast slash that strikes twice.", type: "active", mpCost: 10, damage: 18 },
    { id: "sword-qi", name: "Sword Qi", description: "Project blade energy at distant foes.", type: "active", mpCost: 20, damage: 28 },
  ],
  startWeapon: { id: "iron-jian", name: "Iron Jian", description: "A straight double-edged sword.", icon: "⚔️", rarity: "common", quantity: 1, type: "equipment", statBonus: { attack: 5, speed: 2 } },
  startArmor: { id: "martial-robe", name: "Martial Robe", description: "Robes suited for combat.", icon: "👘", rarity: "common", quantity: 1, type: "equipment", statBonus: { defense: 4, speed: 2 } },
};

export const SCHOLAR: ClassDefinition = {
  id: "scholar",
  name: "Scholar",
  nameZh: "书生",
  description: "A cultivator of inner energy, wielding qi-based arts and wisdom.",
  descriptionZh: "修炼内功的文人，以气劲和智慧制敌。",
  baseHp: 75, baseMp: 95,
  baseAttack: 10, baseDefense: 8, baseSpeed: 10, baseLuck: 12,
  growthHp: 7, growthMp: 10, growthAttack: 2, growthDefense: 2,
  startSkills: [
    { id: "qi-blast", name: "Qi Blast", description: "Release concentrated inner energy.", type: "active", mpCost: 14, damage: 26 },
    { id: "calming-mantra", name: "Calming Mantra", description: "Restore qi and clear status effects.", type: "active", mpCost: 8, effect: "restore 20 MP, remove debuffs" },
  ],
  startWeapon: { id: "folding-fan", name: "Folding Fan", description: "A deceptively sharp iron fan.", icon: "🪭", rarity: "common", quantity: 1, type: "equipment", statBonus: { attack: 3, luck: 3 } },
  startArmor: { id: "silk-robe", name: "Silk Robe", description: "Fine silk with hidden armor plates.", icon: "👘", rarity: "common", quantity: 1, type: "equipment", statBonus: { defense: 3, maxMp: 15 } },
};

export const MONK: ClassDefinition = {
  id: "monk",
  name: "Monk",
  nameZh: "僧人",
  description: "A martial monk who fights barehanded and heals with Buddhist mantras.",
  descriptionZh: "以拳掌和佛法行走江湖的武僧。",
  baseHp: 100, baseMp: 65,
  baseAttack: 14, baseDefense: 14, baseSpeed: 10, baseLuck: 8,
  growthHp: 12, growthMp: 6, growthAttack: 3, growthDefense: 3,
  startSkills: [
    { id: "iron-palm", name: "Iron Palm", description: "A devastating palm strike hardened by years of training.", type: "active", mpCost: 10, damage: 20 },
    { id: "buddha-guard", name: "Buddha's Guard", description: "Enter a defensive stance and heal slowly.", type: "active", mpCost: 15, effect: "heal 20 HP, defense +5 for 2 turns" },
  ],
  startWeapon: { id: "prayer-beads", name: "Prayer Beads", description: "Heavy wooden beads, doubles as a weapon.", icon: "📿", rarity: "common", quantity: 1, type: "equipment", statBonus: { attack: 4, defense: 2 } },
  startArmor: { id: "kasaya", name: "Kasaya", description: "A monk's orange robe.", icon: "👘", rarity: "common", quantity: 1, type: "equipment", statBonus: { defense: 5, maxHp: 10 } },
};

export const ASSASSIN: ClassDefinition = {
  id: "assassin",
  name: "Assassin",
  nameZh: "刺客",
  description: "A shadow operative who strikes with poison and vanishes without a trace.",
  descriptionZh: "暗影杀手，以毒术和暗器制敌于无形。",
  baseHp: 80, baseMp: 55,
  baseAttack: 16, baseDefense: 6, baseSpeed: 20, baseLuck: 12,
  growthHp: 7, growthMp: 5, growthAttack: 4, growthDefense: 1,
  startSkills: [
    { id: "shadow-strike", name: "Shadow Strike", description: "Attack from stealth for massive damage.", type: "active", mpCost: 14, damage: 24 },
    { id: "poison-needle", name: "Poison Needle", description: "A hidden needle that poisons the target.", type: "active", mpCost: 8, damage: 10, effect: "poison: 5 damage per turn for 3 turns" },
  ],
  startWeapon: { id: "hidden-blade", name: "Hidden Blade", description: "A retractable wrist blade.", icon: "🗡️", rarity: "common", quantity: 1, type: "equipment", statBonus: { attack: 5, speed: 3 } },
  startArmor: { id: "shadow-cloak", name: "Shadow Cloak", description: "A dark cloak that blends with shadows.", icon: "🧥", rarity: "common", quantity: 1, type: "equipment", statBonus: { defense: 3, speed: 4 } },
};

// ── Registry ──

export const WESTERN_CLASSES: ClassDefinition[] = [WARRIOR, MAGE, THIEF, CLERIC];
export const WUXIA_CLASSES: ClassDefinition[] = [SWORDSMAN, SCHOLAR, MONK, ASSASSIN];
export const ALL_CLASSES: ClassDefinition[] = [...WESTERN_CLASSES, ...WUXIA_CLASSES];

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
