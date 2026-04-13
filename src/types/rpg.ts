export type ItemRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";
export type ItemType = "consumable" | "material" | "quest" | "equipment";
export type SkillType = "active" | "passive";

export interface RpgSkill {
  id: string;
  name: string;
  description: string;
  type: SkillType;
  mpCost?: number;
  cooldown?: number;
  damage?: number;
  effect?: string;
  /** Skill evolution tier (1 = base, 2 = advanced, 3 = master) */
  tier?: number;
  /** ID of the evolved version of this skill */
  evolvesTo?: string;
  /** Character level required to evolve this skill */
  evolveLevel?: number;
}

export interface RpgItem {
  id: string;
  name: string;
  description: string;
  icon?: string;
  rarity: ItemRarity;
  quantity: number;
  type: ItemType;
  effects?: string;
  /** Stat bonuses when equipped */
  statBonus?: Partial<Record<"attack" | "defense" | "speed" | "luck" | "maxHp" | "maxMp", number>>;
  /** Equipment quality tier */
  quality?: "common" | "uncommon" | "rare" | "epic" | "legendary";
  /** Whether this item can be crafted at a workshop */
  craftable?: boolean;
  /** Materials required to craft this item */
  craftRecipe?: { itemId: string; quantity: number }[];
  /** Equipment set name — wearing multiple pieces grants a bonus */
  setBonus?: string;
}

export interface RpgEquipment {
  weapon?: RpgItem;
  armor?: RpgItem;
  accessory?: RpgItem;
}

export interface StatusEffect {
  id: string;
  name: string;
  icon?: string;
  turnsRemaining?: number;
  effect: string;
}

export interface RpgAchievement {
  id: string;
  name: string;
  description: string;
  unlockedAt?: string;
  icon?: string;
}

export interface RpgCharacter {
  class: string;
  level: number;
  exp: number;
  expToNext: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  attack: number;
  defense: number;
  speed: number;
  luck: number;
  skills: RpgSkill[];
  equipment: RpgEquipment;
  inventory: RpgItem[];
  statusEffects: StatusEffect[];
  faction?: string;
  achievements?: RpgAchievement[];
}

/** Enemy in combat — includes optional boss fields for multi-phase encounters */
export interface RpgEnemy {
  name: string;
  hp: number;
  maxHp: number;
  isBoss?: boolean;
  phases?: number;
  currentPhase?: number;
  weakness?: string;
  specialMechanics?: string;
}

/** Partial update payload from GM's PLAYER_UPDATE directive */
export interface RpgUpdate {
  hp?: number;
  mp?: number;
  exp?: number;
  attack?: number;
  defense?: number;
  speed?: number;
  luck?: number;
  addItem?: RpgItem | string;
  removeItem?: string;
  addSkill?: RpgSkill | string;
  addEffect?: StatusEffect | string;
  removeEffect?: string;
  equip?: { slot: "weapon" | "armor" | "accessory"; item: RpgItem };
  levelUp?: boolean;
}

/** Apply a partial update to an RpgCharacter, returning a new copy */
export function applyRpgUpdate(char: RpgCharacter, update: RpgUpdate): RpgCharacter {
  const next = { ...char, skills: [...char.skills], inventory: [...char.inventory], statusEffects: [...char.statusEffects], equipment: { ...char.equipment } };

  if (update.hp != null) next.hp = Math.max(0, Math.min(next.maxHp, next.hp + update.hp));
  if (update.mp != null) next.mp = Math.max(0, Math.min(next.maxMp, next.mp + update.mp));
  if (update.exp != null) next.exp += update.exp;
  if (update.attack != null) next.attack += update.attack;
  if (update.defense != null) next.defense += update.defense;
  if (update.speed != null) next.speed += update.speed;
  if (update.luck != null) next.luck += update.luck;

  if (update.addItem) {
    const item: RpgItem = typeof update.addItem === "string"
      ? { id: update.addItem.toLowerCase().replace(/\s+/g, "-"), name: update.addItem, description: "", rarity: "common", quantity: 1, type: "material" }
      : update.addItem;
    const existing = next.inventory.find((i) => i.id === item.id);
    if (existing) existing.quantity += item.quantity;
    else next.inventory.push(item);
  }

  if (update.removeItem) {
    next.inventory = next.inventory.filter((i) => i.id !== update.removeItem && i.name !== update.removeItem);
  }

  if (update.addSkill) {
    const skill: RpgSkill = typeof update.addSkill === "string"
      ? { id: update.addSkill.toLowerCase().replace(/\s+/g, "-"), name: update.addSkill, description: "", type: "active" }
      : update.addSkill;
    if (!next.skills.find((s) => s.id === skill.id)) next.skills.push(skill);
  }

  if (update.addEffect) {
    const eff: StatusEffect = typeof update.addEffect === "string"
      ? { id: update.addEffect.toLowerCase().replace(/\s+/g, "-"), name: update.addEffect, effect: update.addEffect }
      : update.addEffect;
    next.statusEffects.push(eff);
  }

  if (update.removeEffect) {
    next.statusEffects = next.statusEffects.filter((e) => e.id !== update.removeEffect && e.name !== update.removeEffect);
  }

  if (update.equip) {
    next.equipment[update.equip.slot] = update.equip.item;
  }

  if (update.levelUp || next.exp >= next.expToNext) {
    next.level += 1;
    next.exp = Math.max(0, next.exp - next.expToNext);
    next.expToNext = Math.floor(next.expToNext * 1.5);
    next.maxHp += 10;
    next.maxMp += 5;
    next.hp = next.maxHp;
    next.mp = next.maxMp;
    next.attack += 2;
    next.defense += 2;
    next.speed += 1;
    next.luck += 1;
  }

  return next;
}
