/**
 * Inworld TTS voice selection by gender and personality similarity.
 * Voice metadata from Inworld docs (Dennis, Ashley, Alex).
 */

export const INWORLD_VOICE_IDS = ['Dennis', 'Ashley', 'Alex'] as const;
export type InworldVoiceId = (typeof INWORLD_VOICE_IDS)[number];

export interface VoiceMeta {
  voiceId: InworldVoiceId;
  gender: 'male' | 'female';
  /** Keywords that match personality/voiceStyle for similarity scoring */
  keywords: string[];
}

export const INWORLD_VOICE_META: VoiceMeta[] = [
  {
    voiceId: 'Dennis',
    gender: 'male',
    keywords: ['calm', 'smooth', 'friendly', 'enigmatic', 'mysterious', 'thoughtful', 'wise', 'balanced', 'philosophical', 'professional', 'middle-aged', 'atmosphere'],
  },
  {
    voiceId: 'Ashley',
    gender: 'female',
    keywords: ['warm', 'natural', 'encouraging', 'playful', 'upbeat', 'inclusive', 'expressive', 'friendly'],
  },
  {
    voiceId: 'Alex',
    gender: 'male',
    keywords: ['energetic', 'expressive', 'quick', 'witty', 'competitive', 'fast-paced', 'brisk', 'dynamic', 'mid-range', 'nasal'],
  },
];

function normalizeGender(g?: string | null): 'male' | 'female' | undefined {
  if (!g || typeof g !== 'string') return undefined;
  const s = g.trim().toLowerCase();
  if (s === 'male') return 'male';
  if (s === 'female') return 'female';
  return undefined;
}

/** Tokenize text for keyword overlap (lowercase, split on non-alpha) */
function tokenize(text: string): Set<string> {
  const out = new Set<string>();
  const lower = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  for (const w of lower.split(/\s+/)) {
    if (w.length >= 2) out.add(w);
  }
  return out;
}

/**
 * Pick the best Inworld voice for a speaker by gender and personality/voiceStyle.
 * - Gender match first (male → Dennis/Alex, female → Ashley).
 * - Then score by keyword overlap with personality/voiceStyle; higher = better fit.
 */
export function pickVoiceForSpeaker(
  gender?: string | null,
  personalityOrVoiceStyle?: string | null
): InworldVoiceId {
  const g = normalizeGender(gender);
  const text = (personalityOrVoiceStyle || '').trim();
  const tokens = text ? tokenize(text) : new Set<string>();

  const candidates = g
    ? INWORLD_VOICE_META.filter((v) => v.gender === g)
    : [...INWORLD_VOICE_META];

  if (candidates.length === 0) return 'Dennis';

  let best = candidates[0];
  let bestScore = -1;

  for (const v of candidates) {
    let score = 0;
    for (const kw of v.keywords) {
      if (tokens.has(kw)) score += 2;
    }
    // Prefer first in list when tie (Dennis for male calm, Ashley for female)
    if (score > bestScore || (score === bestScore && candidates.indexOf(v) < candidates.indexOf(best))) {
      bestScore = score;
      best = v;
    }
  }

  return best.voiceId;
}
