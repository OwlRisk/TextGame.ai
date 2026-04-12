import type { ClassDefinition } from "./classes";
import { WESTERN_CLASSES, WUXIA_CLASSES } from "./classes";

export interface WorldSetting {
  id: string;
  name: string;
  nameZh: string;
  description: string;
  descriptionZh: string;
  icon: string;
  color: string;
  classes: ClassDefinition[];
  factions: WorldFaction[];
  terminology: WorldTerminology;
}

export interface WorldFaction {
  id: string;
  name: string;
  nameZh: string;
  description: string;
}

export interface WorldTerminology {
  mp: string;
  mpZh: string;
  skill: string;
  skillZh: string;
  faction: string;
  factionZh: string;
  currency: string;
  currencyZh: string;
}

export const WESTERN_FANTASY: WorldSetting = {
  id: "western-fantasy",
  name: "Western Fantasy",
  nameZh: "西方奇幻",
  description: "A world of magic and monsters. Explore dungeons, slay dragons, and uncover ancient artifacts.",
  descriptionZh: "魔法与怪物的世界。探索地牢、屠龙、发掘远古神器。",
  icon: "🐉",
  color: "from-indigo-600 to-purple-900",
  classes: WESTERN_CLASSES,
  factions: [
    { id: "arcane-guild", name: "Arcane Guild", nameZh: "奥术公会", description: "A secretive organization of mages pursuing forbidden knowledge." },
    { id: "iron-legion", name: "Iron Legion", nameZh: "铁血军团", description: "An elite mercenary company renowned across the realm." },
    { id: "shadow-hand", name: "Shadow Hand", nameZh: "暗影之手", description: "A thieves' guild operating from the city's underbelly." },
    { id: "order-of-light", name: "Order of Light", nameZh: "光明教团", description: "Holy knights and clerics devoted to banishing darkness." },
  ],
  terminology: {
    mp: "Mana", mpZh: "魔力",
    skill: "Spell", skillZh: "法术",
    faction: "Guild", factionZh: "公会",
    currency: "Gold", currencyZh: "金币",
  },
};

export const WUXIA: WorldSetting = {
  id: "wuxia",
  name: "Wuxia",
  nameZh: "武侠",
  description: "The martial world of ancient China. Master secret techniques, join legendary sects, and forge your own path in the jianghu.",
  descriptionZh: "刀光剑影的江湖世界。习得绝世武功、加入传奇门派、在武林中闯出自己的天地。",
  icon: "⚔️",
  color: "from-red-600 to-amber-900",
  classes: WUXIA_CLASSES,
  factions: [
    { id: "wudang", name: "Wudang Sect", nameZh: "武当派", description: "Taoist swordsmen known for their internal energy cultivation and elegant sword techniques." },
    { id: "shaolin", name: "Shaolin Temple", nameZh: "少林寺", description: "Buddhist warrior monks with unmatched physical conditioning and iron-body techniques." },
    { id: "emei", name: "Emei Sect", nameZh: "峨眉派", description: "A sect known for combining martial arts with healing and protective techniques." },
    { id: "beggar-clan", name: "Beggar Clan", nameZh: "丐帮", description: "The largest martial arts organization, with an intelligence network spanning the empire." },
    { id: "tang-clan", name: "Tang Clan", nameZh: "唐门", description: "Secretive clan specializing in hidden weapons, poisons, and mechanical traps." },
  ],
  terminology: {
    mp: "Qi", mpZh: "内力",
    skill: "Technique", skillZh: "武功",
    faction: "Sect", factionZh: "门派",
    currency: "Silver Taels", currencyZh: "银两",
  },
};

export const ALL_WORLDS: WorldSetting[] = [WESTERN_FANTASY, WUXIA];

export function getWorldById(id: string): WorldSetting | undefined {
  return ALL_WORLDS.find((w) => w.id === id);
}
