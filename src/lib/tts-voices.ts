/**
 * OpenAI TTS voice assignment by personality, gender, and name.
 * Voices: alloy, ash, ballad, coral, echo, fable, nova, onyx, sage, shimmer, verse, marin, cedar
 */

export const TTS_VOICES = [
  'alloy', 'ash', 'ballad', 'coral', 'echo', 'fable', 'nova', 'onyx', 'sage', 'shimmer', 'verse', 'marin', 'cedar',
] as const;
export type TTSVoice = (typeof TTS_VOICES)[number];

/** Preset host id -> default voice (used when no generated host) */
const HOST_VOICE_MAP: Record<string, TTSVoice> = {
  echo: 'onyx',
  nova: 'nova',
  sage: 'sage',
  spark: 'shimmer',
};

/** Male-leaning voices */
const MALE_VOICES: TTSVoice[] = ['alloy', 'echo', 'onyx', 'sage', 'cedar', 'ash', 'verse'];
/** Female-leaning voices */
const FEMALE_VOICES: TTSVoice[] = ['nova', 'shimmer', 'coral', 'fable', 'ballad', 'marin'];
/** Neutral / other */
const NEUTRAL_VOICES: TTSVoice[] = ['alloy', 'ash', 'ballad', 'coral', 'verse', 'marin'];

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
 * Get TTS voice for Host: preset host uses map; generated host uses name + personality.
 */
export function getVoiceForHost(
  hostId: string,
  name?: string,
  personality?: string
): TTSVoice {
  const preset = HOST_VOICE_MAP[hostId];
  if (preset) return preset;
  const seed = `${name ?? ''}|${personality ?? ''}`;
  const idx = hashStr(seed) % TTS_VOICES.length;
  return TTS_VOICES[idx];
}

/**
 * Get TTS voice for a player from gender, name, and personality.
 * Same character (name+personality) gets the same voice; gender picks male/female pool.
 */
export function getVoiceForPlayer(
  gender: string | undefined,
  name?: string,
  personality?: string
): TTSVoice {
  const g = (gender || '').toLowerCase();
  const list = g === 'female' ? FEMALE_VOICES : g === 'male' ? MALE_VOICES : NEUTRAL_VOICES;
  const seed = `${name ?? ''}|${personality ?? ''}`;
  const idx = hashStr(seed) % list.length;
  return list[idx];
}
