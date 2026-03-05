/**
 * Inworld TTS voice selection by gender, language and personality similarity.
 * Voice metadata sourced from Inworld API (113 voices across 16 languages).
 */

export type InworldVoiceId = string;

export interface VoiceMeta {
  voiceId: string;
  gender: 'male' | 'female';
  langCode: string;
  /** Keywords / tags that match personality/voiceStyle for similarity scoring */
  keywords: string[];
}

export const INWORLD_VOICE_META: VoiceMeta[] = [
  // ── English (EN_US) ──────────────────────────────────────────────────────────
  // Southern accent
  { voiceId: 'Loretta',   gender: 'female', langCode: 'EN_US', keywords: ['inviting', 'folksy', 'charming', 'southern'] },
  { voiceId: 'Darlene',   gender: 'female', langCode: 'EN_US', keywords: ['soothing', 'comforting', 'gentle', 'southern'] },
  { voiceId: 'Marlene',   gender: 'female', langCode: 'EN_US', keywords: ['friendly', 'relaxed', 'down-to-earth', 'southern'] },
  { voiceId: 'Hank',      gender: 'male',   langCode: 'EN_US', keywords: ['warm', 'laid-back', 'authentic', 'southern'] },
  // Calm / serene
  { voiceId: 'Evelyn',    gender: 'female', langCode: 'EN_US', keywords: ['gentle', 'serene', 'comforting'] },
  { voiceId: 'Celeste',   gender: 'female', langCode: 'EN_US', keywords: ['soft', 'whispery', 'tranquil'] },
  { voiceId: 'Luna',      gender: 'female', langCode: 'EN_US', keywords: ['calm', 'relaxing'] },
  { voiceId: 'Gareth',    gender: 'male',   langCode: 'EN_US', keywords: ['soothing', 'gentle', 'steady'] },
  { voiceId: 'Oliver',    gender: 'male',   langCode: 'EN_US', keywords: ['soothing', 'precise', 'reassuring'] },
  { voiceId: 'Simon',     gender: 'male',   langCode: 'EN_US', keywords: ['articulate', 'insightful', 'steady'] },
  { voiceId: 'Shaun',     gender: 'male',   langCode: 'EN_US', keywords: ['calm', 'casual'] },
  { voiceId: 'Blake',     gender: 'male',   langCode: 'EN_US', keywords: ['intimate', 'romantic'] },
  // Australian accent
  { voiceId: 'Pippa',     gender: 'female', langCode: 'EN_US', keywords: ['soothing', 'trustworthy', 'gentle', 'australian'] },
  { voiceId: 'Tessa',     gender: 'female', langCode: 'EN_US', keywords: ['upbeat', 'conversational', 'lighthearted', 'australian'] },
  { voiceId: 'Liam',      gender: 'male',   langCode: 'EN_US', keywords: ['upbeat', 'motivating', 'informal', 'australian'] },
  { voiceId: 'Callum',    gender: 'male',   langCode: 'EN_US', keywords: ['laid-back', 'amiable', 'inviting', 'australian'] },
  { voiceId: 'Hamish',    gender: 'male',   langCode: 'EN_US', keywords: ['calm', 'trustworthy', 'comforting', 'australian'] },
  // Youthful / bright
  { voiceId: 'Abby',      gender: 'female', langCode: 'EN_US', keywords: ['bright', 'eager', 'youthful'] },
  { voiceId: 'Kayla',     gender: 'female', langCode: 'EN_US', keywords: ['enthusiastic', 'youthful', 'energetic'] },
  { voiceId: 'Chloe',     gender: 'female', langCode: 'EN_US', keywords: ['thoughtful', 'introspective', 'youthful'] },
  { voiceId: 'Hana',      gender: 'female', langCode: 'EN_US', keywords: ['bright', 'playful'] },
  { voiceId: 'Julia',     gender: 'female', langCode: 'EN_US', keywords: ['childish', 'quirky'] },
  { voiceId: 'Pixie',     gender: 'female', langCode: 'EN_US', keywords: ['cartoonish', 'high-pitched'] },
  // British accent
  { voiceId: 'Graham',    gender: 'male',   langCode: 'EN_US', keywords: ['profound', 'authoritative', 'sophisticated', 'british'] },
  { voiceId: 'Rupert',    gender: 'male',   langCode: 'EN_US', keywords: ['resonant', 'commanding', 'motivational', 'british'] },
  { voiceId: 'Craig',     gender: 'male',   langCode: 'EN_US', keywords: ['posh', 'raspy', 'british'] },
  { voiceId: 'Ronald',    gender: 'male',   langCode: 'EN_US', keywords: ['confident', 'expressive', 'british'] },
  { voiceId: 'Clive',     gender: 'male',   langCode: 'EN_US', keywords: ['calm', 'friendly', 'british'] },
  { voiceId: 'Olivia',    gender: 'female', langCode: 'EN_US', keywords: ['cute', 'upbeat', 'british'] },
  { voiceId: 'Wendy',     gender: 'female', langCode: 'EN_US', keywords: ['pleasant', 'casual', 'british'] },
  // Villainous / dark
  { voiceId: 'Mortimer',  gender: 'male',   langCode: 'EN_US', keywords: ['gravelly', 'menacing', 'whimsical'] },
  { voiceId: 'Snik',      gender: 'male',   langCode: 'EN_US', keywords: ['hoarse', 'cunning', 'avaricious'] },
  { voiceId: 'Hades',     gender: 'male',   langCode: 'EN_US', keywords: ['commanding', 'gruff'] },
  { voiceId: 'Edward',    gender: 'male',   langCode: 'EN_US', keywords: ['emphatic', 'shouty'] },
  { voiceId: 'Veronica',  gender: 'female', langCode: 'EN_US', keywords: ['intimidating', 'commanding', 'icy'] },
  { voiceId: 'Victoria',  gender: 'female', langCode: 'EN_US', keywords: ['silky', 'cunning', 'elegant'] },
  { voiceId: 'Miranda',   gender: 'female', langCode: 'EN_US', keywords: ['menacing', 'serene', 'dominant'] },
  { voiceId: 'Sebastian', gender: 'male',   langCode: 'EN_US', keywords: ['intimidating', 'steely', 'calculating'] },
  { voiceId: 'Victor',    gender: 'male',   langCode: 'EN_US', keywords: ['ominous', 'sinister', 'controlled'] },
  { voiceId: 'Malcolm',   gender: 'male',   langCode: 'EN_US', keywords: ['authoritative', 'manipulative', 'persuasive'] },
  // Indian accent
  { voiceId: 'Anjali',    gender: 'female', langCode: 'EN_US', keywords: ['soothing', 'assured', 'polished', 'indian'] },
  { voiceId: 'Saanvi',    gender: 'female', langCode: 'EN_US', keywords: ['crisp', 'articulate', 'dynamic', 'indian'] },
  { voiceId: 'Arjun',     gender: 'male',   langCode: 'EN_US', keywords: ['smooth', 'enthusiastic', 'informative', 'indian'] },
  // Warm / professional
  { voiceId: 'Claire',    gender: 'female', langCode: 'EN_US', keywords: ['warm', 'gentle', 'soothing'] },
  { voiceId: 'Serena',    gender: 'female', langCode: 'EN_US', keywords: ['soft', 'nurturing', 'gentle'] },
  { voiceId: 'Jessica',   gender: 'female', langCode: 'EN_US', keywords: ['encouraging', 'articulate', 'warm'] },
  { voiceId: 'Lauren',    gender: 'female', langCode: 'EN_US', keywords: ['confident', 'friendly', 'engaging'] },
  { voiceId: 'Amina',     gender: 'female', langCode: 'EN_US', keywords: ['warm', 'inviting', 'articulate', 'west african'] },
  { voiceId: 'Priya',     gender: 'female', langCode: 'EN_US', keywords: ['friendly', 'gentle'] },
  { voiceId: 'Sarah',     gender: 'female', langCode: 'EN_US', keywords: ['upbeat', 'excited'] },
  { voiceId: 'Deborah',   gender: 'female', langCode: 'EN_US', keywords: ['gentle', 'elegant'] },
  { voiceId: 'Elizabeth', gender: 'female', langCode: 'EN_US', keywords: ['informative', 'calm'] },
  { voiceId: 'Elliot',    gender: 'male',   langCode: 'EN_US', keywords: ['deep', 'commanding', 'resonant'] },
  { voiceId: 'James',     gender: 'male',   langCode: 'EN_US', keywords: ['vibrant', 'expressive', 'captivating'] },
  { voiceId: 'Ethan',     gender: 'male',   langCode: 'EN_US', keywords: ['assured', 'precise', 'captivating'] },
  { voiceId: 'Tyler',     gender: 'male',   langCode: 'EN_US', keywords: ['authoritative', 'insightful', 'dynamic'] },
  { voiceId: 'Jason',     gender: 'male',   langCode: 'EN_US', keywords: ['lucid', 'engrossing', 'supportive'] },
  { voiceId: 'Mark',      gender: 'male',   langCode: 'EN_US', keywords: ['articulate', 'engaging'] },
  { voiceId: 'Theodore',  gender: 'male',   langCode: 'EN_US', keywords: ['elderly', 'wise'] },
  { voiceId: 'Timothy',   gender: 'male',   langCode: 'EN_US', keywords: ['hyped', 'upbeat'] },
  { voiceId: 'Carter',    gender: 'male',   langCode: 'EN_US', keywords: ['intense', 'motivational'] },
  { voiceId: 'Dominus',   gender: 'male',   langCode: 'EN_US', keywords: ['robotic', 'monotone'] },
  // New York
  { voiceId: 'Vinny',     gender: 'male',   langCode: 'EN_US', keywords: ['gritty', 'assertive', 'authentic', 'new york'] },
  // Casual / social
  { voiceId: 'Nate',      gender: 'male',   langCode: 'EN_US', keywords: ['laid-back', 'engaging', 'sociable'] },
  { voiceId: 'Jake',      gender: 'male',   langCode: 'EN_US', keywords: ['amiable', 'introspective', 'charming'] },
  { voiceId: 'Brian',     gender: 'male',   langCode: 'EN_US', keywords: ['friendly', 'encouraging', 'clear'] },
  // Customer support
  { voiceId: 'Kelsey',    gender: 'female', langCode: 'EN_US', keywords: ['warm', 'empathetic', 'reassuring', 'customer support', 'call center'] },
  { voiceId: 'Derek',     gender: 'male',   langCode: 'EN_US', keywords: ['steady', 'professional', 'composed', 'customer support', 'call center'] },
  { voiceId: 'Grant',     gender: 'male',   langCode: 'EN_US', keywords: ['calm', 'attentive', 'helpful', 'customer support', 'call center'] },
  { voiceId: 'Evan',      gender: 'male',   langCode: 'EN_US', keywords: ['friendly', 'approachable', 'easygoing', 'customer support', 'call center'] },
  // Legacy / original trio
  { voiceId: 'Alex',      gender: 'male',   langCode: 'EN_US', keywords: ['friendly', 'expressive', 'energetic', 'quick', 'witty', 'competitive', 'fast-paced', 'dynamic'] },
  { voiceId: 'Ashley',    gender: 'female', langCode: 'EN_US', keywords: ['warm', 'mellow', 'natural', 'encouraging', 'playful', 'upbeat', 'inclusive'] },
  { voiceId: 'Dennis',    gender: 'male',   langCode: 'EN_US', keywords: ['outgoing', 'upbeat', 'smooth', 'calm', 'enigmatic', 'mysterious', 'thoughtful', 'wise', 'philosophical', 'professional'] },

  // ── Chinese Mandarin (ZH_CN) ─────────────────────────────────────────────────
  { voiceId: 'Yichen',    gender: 'male',   langCode: 'ZH_CN', keywords: ['clear', 'friendly'] },
  { voiceId: 'Xiaoyin',   gender: 'female', langCode: 'ZH_CN', keywords: ['polite', 'kind'] },
  { voiceId: 'Xinyi',     gender: 'female', langCode: 'ZH_CN', keywords: ['professional', 'warm'] },
  { voiceId: 'Jing',      gender: 'female', langCode: 'ZH_CN', keywords: ['soft', 'clear'] },

  // ── Dutch (NL_NL) ────────────────────────────────────────────────────────────
  { voiceId: 'Erik',      gender: 'male',   langCode: 'NL_NL', keywords: ['smooth', 'strong'] },
  { voiceId: 'Katrien',   gender: 'female', langCode: 'NL_NL', keywords: ['bright', 'melodic'] },
  { voiceId: 'Lennart',   gender: 'male',   langCode: 'NL_NL', keywords: ['authoritative', 'robust'] },
  { voiceId: 'Lore',      gender: 'female', langCode: 'NL_NL', keywords: ['strong', 'clear'] },

  // ── French (FR_FR) ───────────────────────────────────────────────────────────
  { voiceId: 'Alain',     gender: 'male',   langCode: 'FR_FR', keywords: ['deep', 'warm'] },
  { voiceId: 'Hélène',    gender: 'female', langCode: 'FR_FR', keywords: ['expressive', 'soothing'] },
  { voiceId: 'Mathieu',   gender: 'male',   langCode: 'FR_FR', keywords: ['robust', 'strong'] },
  { voiceId: 'Étienne',   gender: 'male',   langCode: 'FR_FR', keywords: ['robust', 'strong'] },

  // ── German (DE_DE) ───────────────────────────────────────────────────────────
  { voiceId: 'Johanna',   gender: 'female', langCode: 'DE_DE', keywords: ['rich', 'deep'] },
  { voiceId: 'Josef',     gender: 'male',   langCode: 'DE_DE', keywords: ['resonant', 'clear'] },

  // ── Italian (IT_IT) ──────────────────────────────────────────────────────────
  { voiceId: 'Gianni',    gender: 'male',   langCode: 'IT_IT', keywords: ['warm', 'deep'] },
  { voiceId: 'Orietta',   gender: 'female', langCode: 'IT_IT', keywords: ['warm', 'smooth'] },

  // ── Japanese (JA_JP) ─────────────────────────────────────────────────────────
  { voiceId: 'Asuka',     gender: 'female', langCode: 'JA_JP', keywords: ['energetic', 'clear'] },
  { voiceId: 'Satoshi',   gender: 'male',   langCode: 'JA_JP', keywords: ['nervous', 'curious'] },

  // ── Korean (KO_KR) ───────────────────────────────────────────────────────────
  { voiceId: 'Hyunwoo',   gender: 'male',   langCode: 'KO_KR', keywords: ['polite', 'warm'] },
  { voiceId: 'Minji',     gender: 'female', langCode: 'KO_KR', keywords: ['light', 'bright'] },
  { voiceId: 'Seojun',    gender: 'male',   langCode: 'KO_KR', keywords: ['deep', 'authoritative'] },
  { voiceId: 'Yoona',     gender: 'female', langCode: 'KO_KR', keywords: ['sad', 'clear'] },

  // ── Polish (PL_PL) ───────────────────────────────────────────────────────────
  { voiceId: 'Szymon',    gender: 'male',   langCode: 'PL_PL', keywords: ['fast', 'soft'] },
  { voiceId: 'Wojciech',  gender: 'male',   langCode: 'PL_PL', keywords: ['confident', 'strong'] },

  // ── Portuguese Brazil (PT_BR) ────────────────────────────────────────────────
  { voiceId: 'Heitor',    gender: 'male',   langCode: 'PT_BR', keywords: ['calm', 'demanding'] },
  { voiceId: 'Maitê',     gender: 'female', langCode: 'PT_BR', keywords: ['reassuring', 'clear'] },

  // ── Spanish (ES_ES) ──────────────────────────────────────────────────────────
  { voiceId: 'Diego',     gender: 'male',   langCode: 'ES_ES', keywords: ['soft', 'nervous'] },
  { voiceId: 'Lupita',    gender: 'female', langCode: 'ES_ES', keywords: ['lively', 'bright'] },
  { voiceId: 'Miguel',    gender: 'male',   langCode: 'ES_ES', keywords: ['warm', 'bright'] },
  { voiceId: 'Rafael',    gender: 'male',   langCode: 'ES_ES', keywords: ['warm', 'bright'] },

  // ── Russian (RU_RU) ──────────────────────────────────────────────────────────
  { voiceId: 'Svetlana',  gender: 'female', langCode: 'RU_RU', keywords: ['high-pitched', 'soft'] },
  { voiceId: 'Elena',     gender: 'female', langCode: 'RU_RU', keywords: ['clear', 'moderately-paced'] },
  { voiceId: 'Dmitry',    gender: 'male',   langCode: 'RU_RU', keywords: ['gravelly', 'authoritative'] },
  { voiceId: 'Nikolai',   gender: 'male',   langCode: 'RU_RU', keywords: ['deep', 'dramatic'] },

  // ── Hindi (HI_IN) ────────────────────────────────────────────────────────────
  { voiceId: 'Riya',      gender: 'female', langCode: 'HI_IN', keywords: ['professional', 'clean'] },
  { voiceId: 'Manoj',     gender: 'male',   langCode: 'HI_IN', keywords: ['professional', 'clean'] },

  // ── Hebrew (HE_IL) ───────────────────────────────────────────────────────────
  { voiceId: 'Yael',      gender: 'female', langCode: 'HE_IL', keywords: ['neutral', 'articulate'] },
  { voiceId: 'Oren',      gender: 'male',   langCode: 'HE_IL', keywords: ['steady', 'professional'] },

  // ── Arabic (AR_SA) ───────────────────────────────────────────────────────────
  { voiceId: 'Nour',      gender: 'female', langCode: 'AR_SA', keywords: ['polished', 'friendly'] },
  { voiceId: 'Omar',      gender: 'male',   langCode: 'AR_SA', keywords: ['bright', 'confident'] },
];

export function normalizeGender(g?: string | null): 'male' | 'female' | undefined {
  if (!g || typeof g !== 'string') return undefined;
  const s = g.trim().toLowerCase();
  if (s === 'male') return 'male';
  if (s === 'female') return 'female';
  return undefined;
}

/** Tokenize text for keyword overlap (lowercase, split on non-alpha) */
export function tokenize(text: string): Set<string> {
  const out = new Set<string>();
  const lower = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  for (const w of lower.split(/\s+/)) {
    if (w.length >= 2) out.add(w);
  }
  return out;
}

/** Score a single voice candidate against personality/voiceStyle tokens */
function scoreVoice(voice: VoiceMeta, tokens: Set<string>): number {
  let score = 0;
  for (const kw of voice.keywords) {
    if (tokens.has(kw)) score += 2;
  }
  return score;
}

/**
 * Pick the best Inworld voice for a speaker by gender, language and personality/voiceStyle.
 * - Filters by langCode first (defaults to EN_US).
 * - Then filters by gender if provided.
 * - When gender is "other"/unknown, scores male and female pools separately and
 *   picks the best overall match, ensuring the voice gender aligns with personality
 *   rather than accidentally crossing genders due to a single keyword hit.
 * - Scores remaining candidates by keyword overlap with personality/voiceStyle.
 */
export function pickVoiceForSpeaker(
  gender?: string | null,
  personalityOrVoiceStyle?: string | null,
  langCode?: string,
  speakerName?: string | null,
): string {
  if (!langCode) {
    langCode = (typeof window !== 'undefined' ? localStorage.getItem('voice_lang') : null) ?? 'EN_US';
  }
  const g = normalizeGender(gender);
  const text = (personalityOrVoiceStyle || '').trim();
  const tokens = text ? tokenize(text) : new Set<string>();

  let pool = INWORLD_VOICE_META.filter((v) => v.langCode === langCode);
  if (pool.length === 0) pool = INWORLD_VOICE_META.filter((v) => v.langCode === 'EN_US');

  if (g) {
    // Explicit gender: filter then score
    const candidates = pool.filter((v) => v.gender === g);
    const finalCandidates = candidates.length > 0 ? candidates : pool;
    let best = finalCandidates[0];
    let bestScore = -1;
    for (const v of finalCandidates) {
      const s = scoreVoice(v, tokens);
      if (s > bestScore) { bestScore = s; best = v; }
    }
    return best.voiceId;
  }

  // Gender unknown ("other" / undefined): score male and female pools separately,
  // then pick the gender whose best candidate has the higher score. This prevents
  // a single keyword hit in one gender from dominating when the character has no
  // explicit gender set (e.g. host generated as "other").
  const males = pool.filter((v) => v.gender === 'male');
  const females = pool.filter((v) => v.gender === 'female');

  let bestMale = males[0]; let bestMaleScore = -1;
  for (const v of males) {
    const s = scoreVoice(v, tokens);
    if (s > bestMaleScore) { bestMaleScore = s; bestMale = v; }
  }
  let bestFemale = females[0]; let bestFemaleScore = -1;
  for (const v of females) {
    const s = scoreVoice(v, tokens);
    if (s > bestFemaleScore) { bestFemaleScore = s; bestFemale = v; }
  }

  // If scores are tied, use a name-based tiebreaker for consistency
  if (bestMaleScore === bestFemaleScore && speakerName) {
    let h = 0;
    for (let i = 0; i < speakerName.length; i++) {
      h = ((h << 5) - h + speakerName.charCodeAt(i)) | 0;
    }
    return Math.abs(h) % 2 === 0 ? bestMale.voiceId : bestFemale.voiceId;
  }

  // If scores are tied with no name, default to male for neutral-sounding hosts
  if (bestMaleScore === bestFemaleScore) {
    return bestMale.voiceId;
  }

  return bestMaleScore > bestFemaleScore ? bestMale.voiceId : bestFemale.voiceId;
}
