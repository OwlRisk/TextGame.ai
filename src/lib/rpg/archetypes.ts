/**
 * Character archetypes — generic role templates with personality traits,
 * visual tags for avatar generation, and world functions.
 * Used by the avatar generation pipeline and NPC/party member creation.
 */

export interface CharacterArchetype {
  id: string;
  label: string;
  labelZh: string;
  /** Visual description tags for avatar prompt (hair, clothing, weapon, etc.) */
  visualTags: string[];
  /** Default personality when none specified */
  personality: string;
  /** Default goal when none specified */
  goal: string;
  /** Default fear when none specified */
  fear: string;
  /** Default attitude toward the player */
  attitudeToPlayer: string;
  /** Genders this archetype appears as (for avatar generation pooling) */
  genders: Array<"male" | "female">;
  /** Which RPG worlds this archetype fits (empty = universal) */
  worlds: string[];
  /** Room tags where this archetype naturally appears as an NPC */
  roomTags: string[];
}

export const ARCHETYPES: CharacterArchetype[] = [
  {
    id: "knight",
    label: "Knight",
    labelZh: "骑士",
    visualTags: ["heavy plate armor", "longsword", "cape", "short cropped hair", "battle scars"],
    personality: "Stoic and honorable. Speaks few words but means every one. Rushes to the front line without hesitation.",
    goal: "Protect the weak and uphold an oath sworn long ago.",
    fear: "Failing to save someone under their protection.",
    attitudeToPlayer: "Loyal and respectful — follows the leader's command but will speak up if innocents are at risk.",
    genders: ["male", "female"],
    worlds: ["western-fantasy"],
    roomTags: ["safe", "castle", "garrison"],
  },
  {
    id: "mage",
    label: "Mage",
    labelZh: "法师",
    visualTags: ["flowing robes", "glowing staff", "arcane runes", "long hair", "mystical eyes"],
    personality: "Intellectually curious and slightly aloof. Prefers elegant solutions over brute force. Gets excited by magical anomalies.",
    goal: "Uncover the lost secrets of ancient magic.",
    fear: "Losing control of their power and harming allies.",
    attitudeToPlayer: "Treats the leader as an equal mind — offers knowledge freely but dislikes being rushed.",
    genders: ["male", "female"],
    worlds: ["western-fantasy"],
    roomTags: ["library", "tower", "arcane"],
  },
  {
    id: "rogue",
    label: "Rogue",
    labelZh: "盗贼",
    visualTags: ["leather armor", "hood", "twin daggers", "belt pouches", "shadowed face"],
    personality: "Sharp-tongued and street-smart. Spots traps and lies before anyone else. Has a dark sense of humor.",
    goal: "Amass enough wealth to leave the criminal life behind.",
    fear: "Being trapped with no escape route.",
    attitudeToPlayer: "Casual and teasing — tests the leader's judgment but proves loyal when it counts.",
    genders: ["male", "female"],
    worlds: ["western-fantasy"],
    roomTags: ["shop", "tavern", "dungeon"],
  },
  {
    id: "cleric",
    label: "Cleric",
    labelZh: "牧师",
    visualTags: ["white and gold vestments", "holy symbol pendant", "healing staff", "gentle expression", "prayer beads"],
    personality: "Compassionate and firm. Heals without question but judges silently. Uncomfortable with unnecessary violence.",
    goal: "Bring light to the darkest corners of the world.",
    fear: "Losing faith in the face of overwhelming evil.",
    attitudeToPlayer: "Supportive and nurturing — trusts the leader's heart but gently guides toward mercy.",
    genders: ["male", "female"],
    worlds: ["western-fantasy"],
    roomTags: ["temple", "safe", "hospital"],
  },
  {
    id: "ranger",
    label: "Ranger",
    labelZh: "游侠",
    visualTags: ["green cloak", "longbow", "quiver", "animal companion", "nature-worn leather"],
    personality: "Quiet and observant. Prefers the wilderness to cities. Speaks more to animals than people.",
    goal: "Protect the ancient forests from encroaching corruption.",
    fear: "Watching nature destroyed by greed or war.",
    attitudeToPlayer: "Watchful ally — trusts the leader outdoors but gets restless in towns.",
    genders: ["male", "female"],
    worlds: ["western-fantasy"],
    roomTags: ["forest", "wilderness", "camp"],
  },
  {
    id: "merchant",
    label: "Merchant",
    labelZh: "商人",
    visualTags: ["fine travel clothes", "coin purse", "trade wagon", "shrewd eyes", "jeweled rings"],
    personality: "Charming negotiator with an eye for value. Always calculating risk vs reward. Surprisingly brave when profit is involved.",
    goal: "Build a trade empire that spans the continent.",
    fear: "Going bankrupt and losing everything built over years.",
    attitudeToPlayer: "Friendly and transactional — helps the group but always looking for the angle.",
    genders: ["male", "female"],
    worlds: ["western-fantasy", "wuxia"],
    roomTags: ["shop", "market", "trade"],
  },
  {
    id: "blacksmith",
    label: "Blacksmith",
    labelZh: "铁匠",
    visualTags: ["leather apron", "muscular arms", "forge hammer", "soot-covered", "burn scars on hands"],
    personality: "Blunt and no-nonsense. Respects craftsmanship and hard work. Dislikes magic users who take shortcuts.",
    goal: "Forge a legendary weapon worthy of the old masters.",
    fear: "Creating something that brings destruction instead of protection.",
    attitudeToPlayer: "Gruff but dependable — tests the leader's resolve before committing.",
    genders: ["male", "female"],
    worlds: ["western-fantasy"],
    roomTags: ["shop", "forge", "craft"],
  },
  {
    id: "bard",
    label: "Bard",
    labelZh: "吟游诗人",
    visualTags: ["colorful traveling clothes", "lute or flute", "feathered hat", "expressive face", "dancing posture"],
    personality: "Dramatic, witty, and emotionally perceptive. Uses humor to defuse tension but hides deep sadness behind the performance.",
    goal: "Compose the greatest ballad ever sung — one that captures a real adventure.",
    fear: "Being forgotten — living a life not worth telling.",
    attitudeToPlayer: "Enthusiastic companion — narrates the leader's deeds and pushes them toward heroic choices.",
    genders: ["male", "female"],
    worlds: ["western-fantasy"],
    roomTags: ["tavern", "safe", "festival"],
  },
  {
    id: "necromancer",
    label: "Necromancer",
    labelZh: "死灵法师",
    visualTags: ["dark robes with bone ornaments", "skull staff", "pale skin", "glowing eyes", "ethereal aura"],
    personality: "Pragmatic and misunderstood. Studies death not from malice but from scientific curiosity. Uncomfortable with social norms.",
    goal: "Understand the boundary between life and death.",
    fear: "Becoming the monster others already believe them to be.",
    attitudeToPlayer: "Reserved but genuine — respects the leader for not judging them by their craft.",
    genders: ["male", "female"],
    worlds: ["western-fantasy"],
    roomTags: ["dungeon", "crypt", "arcane"],
  },
  {
    id: "swordmaster",
    label: "Swordmaster",
    labelZh: "剑客",
    visualTags: ["flowing hanfu robes", "jian sword", "topknot hairstyle", "calm expression", "jade pendant"],
    personality: "Disciplined and philosophical. Speaks in measured words. Practices sword forms at dawn. Values honor above victory.",
    goal: "Achieve perfect harmony between body and blade.",
    fear: "Killing someone unworthy of their blade in anger.",
    attitudeToPlayer: "Respectful peer — sees the leader as a fellow traveler on the path of martial virtue.",
    genders: ["male", "female"],
    worlds: ["wuxia"],
    roomTags: ["dojo", "temple", "mountain"],
  },
  {
    id: "poisoner",
    label: "Poisoner",
    labelZh: "用毒者",
    visualTags: ["dark changshan with hidden pockets", "bamboo container", "mask", "sharp calculating eyes", "herbal pouches"],
    personality: "Cunning and patient. Prefers indirect methods. Speaks softly but every word carries weight.",
    goal: "Create an antidote for an incurable poison that afflicts someone they love.",
    fear: "Accidentally poisoning an innocent with a careless mistake.",
    attitudeToPlayer: "Pragmatic ally — advises caution and unconventional approaches.",
    genders: ["male", "female"],
    worlds: ["wuxia"],
    roomTags: ["shop", "forest", "secret"],
  },
  {
    id: "monk",
    label: "Monk",
    labelZh: "武僧",
    visualTags: ["orange kasaya robes", "shaved head", "prayer beads", "powerful fists", "serene expression"],
    personality: "Calm and compassionate but fierce in combat. Speaks in proverbs. Struggles between pacifism and the need to fight evil.",
    goal: "Find enlightenment through the trials of the mortal world.",
    fear: "Being consumed by rage and breaking their sacred vows.",
    attitudeToPlayer: "Wise mentor figure — offers guidance but lets the leader make their own mistakes.",
    genders: ["male"],
    worlds: ["wuxia"],
    roomTags: ["temple", "mountain", "safe"],
  },
  {
    id: "sect-disciple",
    label: "Sect Disciple",
    labelZh: "门派弟子",
    visualTags: ["sect uniform hanfu", "sect emblem badge", "training weapon", "eager expression", "sect hairpin"],
    personality: "Eager to prove themselves. Loyal to their sect but questioning its traditions. Gets competitive with rivals.",
    goal: "Rise through the sect ranks and earn their master's recognition.",
    fear: "Disappointing their master and being expelled from the sect.",
    attitudeToPlayer: "Admiring rival — competitive but genuinely wants the leader to succeed alongside them.",
    genders: ["male", "female"],
    worlds: ["wuxia"],
    roomTags: ["dojo", "sect", "tournament"],
  },
  {
    id: "wandering-doctor",
    label: "Wandering Doctor",
    labelZh: "游医",
    visualTags: ["plain traveling robes", "medicine box on back", "herbs and bottles", "kind weathered face", "bamboo hat"],
    personality: "Gentle-hearted and worldly-wise. Has seen suffering everywhere and refuses to turn away. Stubborn about saving every life.",
    goal: "Cure a plague spreading through the remote villages.",
    fear: "Running out of medicine when someone needs it most.",
    attitudeToPlayer: "Warm and protective — treats the leader like a younger sibling who needs looking after.",
    genders: ["male", "female"],
    worlds: ["wuxia"],
    roomTags: ["village", "safe", "camp"],
  },
  {
    id: "assassin",
    label: "Assassin",
    labelZh: "刺客",
    visualTags: ["black tight-fitting clothes", "hidden blades", "mask covering lower face", "cold eyes", "silent movement"],
    personality: "Cold and professional on the surface. Follows a strict personal code. Has dry humor that surfaces unexpectedly.",
    goal: "Complete one final contract to buy freedom from their guild.",
    fear: "Being hunted by the very organization they serve.",
    attitudeToPlayer: "Detached professional — follows orders but slowly develops genuine loyalty.",
    genders: ["male", "female"],
    worlds: ["western-fantasy", "wuxia"],
    roomTags: ["dungeon", "secret", "night"],
  },
  {
    id: "innkeeper",
    label: "Innkeeper",
    labelZh: "客栈老板",
    visualTags: ["practical work clothes", "cooking ladle or broom", "warm smile", "rosy cheeks", "apron"],
    personality: "Warm, gossipy, and surprisingly well-connected. Knows everyone's secrets. Tougher than they look.",
    goal: "Keep the inn running as a safe haven in dangerous times.",
    fear: "War reaching their doorstep and destroying what they've built.",
    attitudeToPlayer: "Hospitable and informative — the first person to offer help and the last to ask for it.",
    genders: ["male", "female"],
    worlds: ["western-fantasy", "wuxia"],
    roomTags: ["tavern", "rest", "safe"],
  },
  {
    id: "scholar",
    label: "Scholar",
    labelZh: "书生",
    visualTags: ["flowing scholar robes", "bamboo scroll case", "ink-stained fingers", "spectacles", "calligraphy brush"],
    personality: "Bookish and absent-minded about practical matters. Brilliant with lore and languages. Gets dangerously excited about ancient texts.",
    goal: "Decipher a forbidden text that could change the understanding of history.",
    fear: "Knowledge being destroyed by the ignorant.",
    attitudeToPlayer: "Respectful but pedantic — corrects the leader's historical references while genuinely trying to help.",
    genders: ["male", "female"],
    worlds: ["wuxia", "western-fantasy"],
    roomTags: ["library", "temple", "tower"],
  },
  {
    id: "beast-tamer",
    label: "Beast Tamer",
    labelZh: "驯兽师",
    visualTags: ["fur-trimmed leather outfit", "animal companion", "whip or staff", "wild hair", "claw-mark scars"],
    personality: "Wild and instinctual. Trusts animals more than people. Communicates emotions physically rather than verbally.",
    goal: "Find and bond with a legendary beast of myth.",
    fear: "Their bonded companion being killed because of their choices.",
    attitudeToPlayer: "Wary at first — warms up once the leader proves they respect nature.",
    genders: ["male", "female"],
    worlds: ["western-fantasy", "wuxia"],
    roomTags: ["wilderness", "forest", "stable"],
  },
  {
    id: "prince",
    label: "Exiled Noble",
    labelZh: "流亡贵族",
    visualTags: ["faded noble attire", "royal signet ring", "elegant posture", "haunted eyes", "concealed dagger"],
    personality: "Refined manners hiding deep bitterness. Alternates between regal composure and impulsive rage. Hates being pitied.",
    goal: "Reclaim their rightful position and avenge their family.",
    fear: "Becoming as cruel as the usurper who destroyed their house.",
    attitudeToPlayer: "Cautiously respectful — sees the leader as a potential ally but trusts slowly.",
    genders: ["male", "female"],
    worlds: ["western-fantasy", "wuxia"],
    roomTags: ["castle", "tavern", "secret"],
  },
  {
    id: "fortune-teller",
    label: "Fortune Teller",
    labelZh: "占卜师",
    visualTags: ["mystic veils and jewelry", "crystal ball or tarot cards", "third-eye marking", "flowing garments", "incense smoke"],
    personality: "Cryptic and dramatic. Sees fragments of possible futures. Struggles with whether to reveal what they see.",
    goal: "Prevent a catastrophic future they've glimpsed in visions.",
    fear: "Their predictions coming true despite every effort to stop them.",
    attitudeToPlayer: "Enigmatic guide — drops hints and warnings without explaining, forcing the leader to choose wisely.",
    genders: ["male", "female"],
    worlds: ["western-fantasy", "wuxia"],
    roomTags: ["shop", "festival", "temple"],
  },
];

export function getArchetype(id: string): CharacterArchetype | undefined {
  return ARCHETYPES.find((a) => a.id === id);
}

export function getArchetypesForWorld(worldId: string): CharacterArchetype[] {
  return ARCHETYPES.filter((a) => a.worlds.length === 0 || a.worlds.includes(worldId));
}

export function getArchetypesForRoomTag(tag: string): CharacterArchetype[] {
  return ARCHETYPES.filter((a) => a.roomTags.includes(tag));
}

/** Maps RPG class IDs (from classes.ts) to the closest archetype for avatar generation */
const CLASS_TO_ARCHETYPE: Record<string, string> = {
  warrior: "knight",
  mage: "mage",
  thief: "rogue",
  cleric: "cleric",
  swordsman: "swordmaster",
  scholar: "scholar",
  monk: "monk",
  assassin: "assassin",
};

export function archetypeIdForClass(classId: string): string | undefined {
  return CLASS_TO_ARCHETYPE[classId];
}

/** Build the Supabase Storage path for a pre-generated archetype avatar */
export function archetypeAvatarPath(archetypeId: string, gender: string): string {
  const g = gender === "female" ? "female" : "male";
  return `pool/archetype/${archetypeId}_${g}.webp`;
}
