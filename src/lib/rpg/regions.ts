/**
 * Region layer — groups rooms into thematic zones with difficulty, quests, and events.
 */

export interface RegionDefinition {
  id: string;
  name: string;
  nameZh: string;
  description: string;
  descriptionZh: string;
  difficulty: 'easy' | 'normal' | 'hard' | 'deadly';
  recommendedLevel: number;
  tags: string[];
  possibleEvents: string[];
  questIds: string[];
  bossId?: string;
}

export interface QuestDefinition {
  id: string;
  name: string;
  nameZh: string;
  description: string;
  descriptionZh: string;
  type: 'main' | 'side' | 'daily' | 'hidden';
  objectives: QuestObjective[];
  rewards: QuestReward[];
  prerequisiteQuestId?: string;
  regionId: string;
  minLevel?: number;
}

export interface QuestObjective {
  id: string;
  description: string;
  type: 'kill' | 'collect' | 'explore' | 'talk' | 'escort' | 'survive';
  target: string;
  count: number;
}

export interface QuestReward {
  type: 'exp' | 'gold' | 'item' | 'skill' | 'reputation';
  value: string | number;
  itemQuality?: string;
}

export interface RandomEvent {
  id: string;
  name: string;
  nameZh: string;
  description: string;
  descriptionZh: string;
  type: 'combat' | 'treasure' | 'npc_encounter' | 'environmental' | 'merchant' | 'mystery';
  weight: number;
  minLevel?: number;
  maxLevel?: number;
}

export interface RecruitableNpc {
  id: string;
  name: string;
  nameZh: string;
  class: string;
  personality: string;
  recruitCondition: string;
  regionId: string;
  specialAbility?: string;
}

// --- Western Fantasy Regions ---

export const WESTERN_REGIONS: RegionDefinition[] = [
  {
    id: 'verdant-woods',
    name: 'Verdant Woods',
    nameZh: '翠绿森林',
    description: 'A peaceful forest on the outskirts, home to small creatures and wandering merchants.',
    descriptionZh: '城镇外围的宁静森林，栖息着小型生物和流浪商人。',
    difficulty: 'easy',
    recommendedLevel: 1,
    tags: ['forest', 'peaceful', 'wildlife'],
    possibleEvents: ['wandering-merchant', 'herb-gathering', 'lost-traveler', 'fairy-circle'],
    questIds: ['gather-herbs', 'clear-wolves'],
  },
  {
    id: 'shadow-caves',
    name: 'Shadow Caves',
    nameZh: '暗影洞窟',
    description: 'Dark underground tunnels filled with goblins, traps, and ancient treasures.',
    descriptionZh: '充满哥布林、陷阱和古代宝藏的黑暗地下隧道。',
    difficulty: 'normal',
    recommendedLevel: 3,
    tags: ['underground', 'goblin', 'traps', 'treasure'],
    possibleEvents: ['cave-in', 'goblin-ambush', 'hidden-chamber', 'underground-river'],
    questIds: ['goblin-king', 'lost-miners'],
    bossId: 'goblin-king',
  },
  {
    id: 'cursed-ruins',
    name: 'Cursed Ruins',
    nameZh: '诅咒废墟',
    description: 'Ancient ruins tainted by dark magic, where the undead roam and secrets lie buried.',
    descriptionZh: '被黑暗魔法污染的古代废墟，亡灵游荡其中，秘密深埋地下。',
    difficulty: 'hard',
    recommendedLevel: 5,
    tags: ['ruins', 'undead', 'magic', 'ancient'],
    possibleEvents: ['undead-horde', 'cursed-altar', 'ghost-memory', 'sealed-chamber'],
    questIds: ['break-the-curse', 'ancient-library'],
    bossId: 'lich-lord',
  },
  {
    id: 'dragon-peaks',
    name: 'Dragon Peaks',
    nameZh: '龙脊山脉',
    description: 'Treacherous mountain peaks where dragons and elementals guard legendary treasures.',
    descriptionZh: '危险的山脉巅峰，龙与元素精灵守卫着传说中的宝藏。',
    difficulty: 'deadly',
    recommendedLevel: 8,
    tags: ['mountain', 'dragon', 'elemental', 'legendary'],
    possibleEvents: ['dragon-flight', 'avalanche', 'elemental-storm', 'sky-shrine'],
    questIds: ['dragonslayer', 'elemental-orbs'],
    bossId: 'elder-dragon',
  },
];

// --- Wuxia Regions ---

export const WUXIA_REGIONS: RegionDefinition[] = [
  {
    id: 'bamboo-grove',
    name: 'Bamboo Grove',
    nameZh: '竹林幽径',
    description: 'A serene bamboo forest where hermit masters train in secret, and bandits lurk on the trails.',
    descriptionZh: '宁静的竹林，隐士高手在此秘密修炼，山贼潜伏于小道之上。',
    difficulty: 'easy',
    recommendedLevel: 1,
    tags: ['bamboo', 'peaceful', 'hermit', 'bandit'],
    possibleEvents: ['hermit-training', 'bandit-toll', 'lost-scroll', 'tea-ceremony'],
    questIds: ['bamboo-sect-trial', 'bandit-camp'],
  },
  {
    id: 'misty-lake',
    name: 'Misty Lake',
    nameZh: '迷雾湖',
    description: 'A fog-shrouded lake with floating pavilions, hiding a sect of water martial artists.',
    descriptionZh: '雾气笼罩的湖泊，浮动亭阁中隐藏着水系武学门派。',
    difficulty: 'normal',
    recommendedLevel: 3,
    tags: ['lake', 'mist', 'water-sect', 'mystery'],
    possibleEvents: ['fog-maze', 'lotus-gathering', 'water-duel', 'fisherman-tale'],
    questIds: ['sect-alliance', 'sunken-treasure'],
    bossId: 'water-sage',
  },
  {
    id: 'iron-fortress',
    name: 'Iron Fortress',
    nameZh: '铁壁山庄',
    description: 'A fortified mountain stronghold ruled by a tyrannical martial lord.',
    descriptionZh: '由暴虐武林霸主统治的山间要塞。',
    difficulty: 'hard',
    recommendedLevel: 5,
    tags: ['fortress', 'martial', 'tyrant', 'siege'],
    possibleEvents: ['guard-patrol', 'underground-passage', 'prisoner-rescue', 'arena-challenge'],
    questIds: ['overthrow-tyrant', 'secret-technique'],
    bossId: 'iron-lord',
  },
  {
    id: 'celestial-peak',
    name: 'Celestial Peak',
    nameZh: '天枢峰',
    description: 'The highest peak in the realm, where ancient martial arts secrets and immortal cultivators await.',
    descriptionZh: '天下第一高峰，古老武学秘密与仙人修士在此等候。',
    difficulty: 'deadly',
    recommendedLevel: 8,
    tags: ['peak', 'celestial', 'immortal', 'legendary'],
    possibleEvents: ['lightning-trial', 'immortal-encounter', 'heaven-gate', 'martial-tournament'],
    questIds: ['martial-supreme', 'celestial-scripture'],
    bossId: 'fallen-immortal',
  },
];

// --- Sample Random Events ---

export const RANDOM_EVENTS: RandomEvent[] = [
  { id: 'wandering-merchant', name: 'Wandering Merchant', nameZh: '流浪商人', description: 'A mysterious merchant appears with rare goods.', descriptionZh: '神秘商人携带稀有商品出现。', type: 'merchant', weight: 15 },
  { id: 'herb-gathering', name: 'Herb Gathering', nameZh: '采药', description: 'You spot rare herbs growing nearby.', descriptionZh: '你发现附近生长着稀有草药。', type: 'treasure', weight: 20 },
  { id: 'lost-traveler', name: 'Lost Traveler', nameZh: '迷路旅人', description: 'A lost traveler asks for help.', descriptionZh: '一位迷路的旅人请求帮助。', type: 'npc_encounter', weight: 15 },
  { id: 'fairy-circle', name: 'Fairy Circle', nameZh: '精灵环', description: 'A glowing circle of mushrooms pulses with magic.', descriptionZh: '发光的蘑菇圈脉动着魔力。', type: 'mystery', weight: 8 },
  { id: 'cave-in', name: 'Cave-In', nameZh: '塌方', description: 'The tunnel collapses! Find another way.', descriptionZh: '隧道坍塌了！寻找其他出路。', type: 'environmental', weight: 10 },
  { id: 'goblin-ambush', name: 'Goblin Ambush', nameZh: '哥布林伏击', description: 'Goblins spring from the shadows!', descriptionZh: '哥布林从暗处突袭！', type: 'combat', weight: 15 },
  { id: 'hidden-chamber', name: 'Hidden Chamber', nameZh: '密室', description: 'You discover a hidden chamber behind a false wall.', descriptionZh: '你发现了假墙后的密室。', type: 'treasure', weight: 8 },
  { id: 'underground-river', name: 'Underground River', nameZh: '地下河', description: 'An underground river blocks your path.', descriptionZh: '地下河阻断了前路。', type: 'environmental', weight: 10 },
  { id: 'undead-horde', name: 'Undead Horde', nameZh: '亡灵大军', description: 'A horde of undead rises from the ground!', descriptionZh: '亡灵大军从地下涌出！', type: 'combat', weight: 12 },
  { id: 'cursed-altar', name: 'Cursed Altar', nameZh: '诅咒祭坛', description: 'A dark altar radiates malevolent energy.', descriptionZh: '黑暗祭坛散发着邪恶能量。', type: 'mystery', weight: 8 },
  { id: 'ghost-memory', name: 'Ghost Memory', nameZh: '幽灵记忆', description: 'A spectral figure shows you visions of the past.', descriptionZh: '幽灵向你展示过去的幻象。', type: 'npc_encounter', weight: 10 },
  // Wuxia events
  { id: 'hermit-training', name: 'Hermit Training', nameZh: '隐士指点', description: 'A hidden master offers to train you briefly.', descriptionZh: '隐世高手愿意短暂指点你。', type: 'npc_encounter', weight: 10 },
  { id: 'bandit-toll', name: 'Bandit Toll', nameZh: '山贼关卡', description: 'Bandits demand a toll to pass.', descriptionZh: '山贼要求交过路费。', type: 'combat', weight: 15 },
  { id: 'lost-scroll', name: 'Lost Scroll', nameZh: '遗失秘籍', description: 'You find a partially damaged martial arts scroll.', descriptionZh: '你发现了一卷残破的武功秘籍。', type: 'treasure', weight: 8 },
  { id: 'tea-ceremony', name: 'Tea Ceremony', nameZh: '品茶论道', description: 'A scholar invites you for tea and philosophical discussion.', descriptionZh: '文人雅士邀你品茶论道。', type: 'npc_encounter', weight: 12 },
];

// --- Recruitable NPCs ---

export const RECRUITABLE_NPCS: RecruitableNpc[] = [
  { id: 'elena-healer', name: 'Elena', nameZh: '艾莲娜', class: 'cleric', personality: 'Gentle and devoted, speaks softly but with conviction.', recruitCondition: 'Complete the "gather-herbs" quest', regionId: 'verdant-woods', specialAbility: 'Group Heal' },
  { id: 'gruk-warrior', name: 'Gruk', nameZh: '格鲁克', class: 'warrior', personality: 'Gruff former gladiator seeking redemption.', recruitCondition: 'Free him from the goblin prison', regionId: 'shadow-caves', specialAbility: 'Taunt' },
  { id: 'sera-mage', name: 'Sera', nameZh: '瑟拉', class: 'mage', personality: 'Curious researcher obsessed with ancient magic.', recruitCondition: 'Help her decode the ancient library', regionId: 'cursed-ruins', specialAbility: 'Arcane Shield' },
  // Wuxia
  { id: 'xiaoyue', name: 'Xiao Yue', nameZh: '小月', class: 'assassin', personality: 'Quick-witted thief with a heart of gold.', recruitCondition: 'Spare her during the bandit camp quest', regionId: 'bamboo-grove', specialAbility: 'Shadow Step' },
  { id: 'master-liu', name: 'Master Liu', nameZh: '柳师父', class: 'monk', personality: 'Serene monk who speaks in riddles and proverbs.', recruitCondition: 'Defeat him in a friendly duel at the tea ceremony', regionId: 'misty-lake', specialAbility: 'Iron Body' },
  { id: 'zhang-wei', name: 'Zhang Wei', nameZh: '张威', class: 'swordsman', personality: 'Disgraced former guard seeking to restore his honor.', recruitCondition: 'Help him clear his name during the tyrant overthrow', regionId: 'iron-fortress', specialAbility: 'Counter Strike' },
];

// --- Helpers ---

export const ALL_REGIONS = [...WESTERN_REGIONS, ...WUXIA_REGIONS];

export function getRegionById(id: string): RegionDefinition | undefined {
  return ALL_REGIONS.find(r => r.id === id);
}

export function getRegionsForWorld(worldId: string): RegionDefinition[] {
  if (worldId === 'western-fantasy') return WESTERN_REGIONS;
  if (worldId === 'wuxia') return WUXIA_REGIONS;
  return [];
}

export function getRandomEvent(regionId: string, partyLevel: number): RandomEvent | undefined {
  const region = getRegionById(regionId);
  if (!region) return undefined;
  const eligible = RANDOM_EVENTS.filter(e =>
    region.possibleEvents.includes(e.id) &&
    (!e.minLevel || partyLevel >= e.minLevel) &&
    (!e.maxLevel || partyLevel <= e.maxLevel)
  );
  if (eligible.length === 0) return undefined;
  const totalWeight = eligible.reduce((sum, e) => sum + e.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const event of eligible) {
    roll -= event.weight;
    if (roll <= 0) return event;
  }
  return eligible[eligible.length - 1];
}

export function getRecruitableNpcsForRegion(regionId: string): RecruitableNpc[] {
  return RECRUITABLE_NPCS.filter(n => n.regionId === regionId);
}
