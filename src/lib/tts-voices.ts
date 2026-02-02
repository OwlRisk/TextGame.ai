/**
 * TTS voice assignment by gender, name, and personality.
 * Voices: alloy, ash, ballad, coral, echo, fable, nova, onyx, sage, shimmer, verse, marin, cedar
 */

export const TTS_VOICES = [
  'alloy', 'ash', 'ballad', 'coral', 'echo', 'fable', 'nova', 'onyx', 'sage', 'shimmer', 'verse', 'marin', 'cedar',
] as const;
export type TTSVoice = (typeof TTS_VOICES)[number];

/** Male-leaning voices */
const MALE_VOICES: TTSVoice[] = ['alloy', 'echo', 'onyx', 'sage', 'cedar', 'ash', 'verse'];
/** Female-leaning voices */
const FEMALE_VOICES: TTSVoice[] = ['nova', 'shimmer', 'coral', 'fable', 'ballad', 'marin'];
/** Neutral / other */
const NEUTRAL_VOICES: TTSVoice[] = ['alloy', 'ash', 'ballad', 'coral', 'verse', 'marin'];

/** When gender is "other", infer from first name so avatar and voice match (e.g. Liam -> male) */
const COMMON_MALE_FIRST_NAMES = new Set(['liam', 'james', 'carlos', 'jin', 'alex', 'marcus', 'david', 'ryan', 'noah', 'ethan', 'daniel', 'michael', 'william', 'oliver', 'jack', 'ben', 'leo', 'lucas', 'henry', 'oscar']);
const COMMON_FEMALE_FIRST_NAMES = new Set(['amina', 'zuri', 'sarah', 'emma', 'olivia', 'ava', 'sophia', 'sofia', 'isabella', 'mia', 'charlotte', 'lily', 'zoe', 'ella', 'aria', 'luna', 'jacqueline', 'brooke', 'tessa', 'nova']);

function inferGenderFromName(name: string | undefined): 'male' | 'female' | null {
  if (!name || typeof name !== 'string') return null;
  const first = name.trim().split(/\s+/)[0]?.toLowerCase();
  if (!first) return null;
  if (COMMON_MALE_FIRST_NAMES.has(first)) return 'male';
  if (COMMON_FEMALE_FIRST_NAMES.has(first)) return 'female';
  return null;
}

function hashStr(s: string): number {
  let h = 0;
  const str = s.trim().toLowerCase();
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/**
 * Get TTS voice for Host by gender, name, and personality.
 * Same as players: no preset voices; gender picks pool, name+personality hash picks stable voice.
 * When gender is missing or "other", infer from name so voice matches avatar.
 */
export function getVoiceForHost(
  _hostId: string,
  name?: string,
  personality?: string,
  gender?: string
): TTSVoice {
  let g = (gender || '').toLowerCase();
  if (g !== 'male' && g !== 'female') {
    const inferred = inferGenderFromName(name);
    if (inferred) g = inferred;
  }
  const list = g === 'female' ? FEMALE_VOICES : g === 'male' ? MALE_VOICES : NEUTRAL_VOICES;
  const seed = `${name ?? ''}|${personality ?? ''}`;
  const idx = hashStr(seed) % list.length;
  return list[idx];
}

/**
 * Get TTS voice for a player from gender, name, and personality.
 * Same character (name+personality) gets the same voice; gender picks male/female pool.
 * When gender is "other" or missing, infer from first name so voice matches avatar (e.g. Liam -> male voice).
 */
export function getVoiceForPlayer(
  gender: string | undefined,
  name?: string,
  personality?: string
): TTSVoice {
  let g = (gender || '').toLowerCase();
  if (g !== 'male' && g !== 'female') {
    const inferred = inferGenderFromName(name);
    if (inferred) g = inferred;
  }
  const list = g === 'female' ? FEMALE_VOICES : g === 'male' ? MALE_VOICES : NEUTRAL_VOICES;
  const seed = `${name ?? ''}|${personality ?? ''}`;
  const idx = hashStr(seed) % list.length;
  return list[idx];
}
