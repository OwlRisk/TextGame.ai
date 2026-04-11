/**
 * Normalize and infer gender for AI characters so avatars, pools, and voices stay consistent
 * across templates (script-kill, scene, generate-players, GM pool, legacy saves).
 */

export type PlayerGender = "male" | "female" | "other";

export function normalizePlayerGender(raw?: string | null): PlayerGender | undefined {
  if (raw == null || !String(raw).trim()) return undefined;
  const g = String(raw).trim().toLowerCase();
  if (g === "male" || g === "m") return "male";
  if (g === "female" || g === "f") return "female";
  if (g === "other" || g === "nonbinary" || g === "nb" || g === "non-binary") return "other";
  return undefined;
}

const FEMALE_HINTS =
  /\b(she|her|hers|woman|women|female|girl|girls|wife|wives|daughter|mother|sister|aunt|niece|grandmother|actress|lady|ladies|queen|princess|waitress|hostess|ms\.|mrs\.|miss|woman\s+in\s+her|girl\s+in\s+her)\b/i;
const MALE_HINTS =
  /\b(he|his|him|man|men|male|boy|boys|husband|son|father|brother|uncle|nephew|grandfather|actor|gentleman|waiter|host\b|mr\.|man\s+in\s+his|boy\s+who)\b/i;

/**
 * Infer gender from personality/background text (English prose from templates / LLM).
 */
export function inferPlayerGender(
  name: string,
  opts?: { personality?: string; background?: string },
): PlayerGender {
  const blob = `${opts?.personality || ""} ${opts?.background || ""}`;
  const fem = FEMALE_HINTS.test(blob);
  const mal = MALE_HINTS.test(blob);
  if (fem && !mal) return "female";
  if (mal && !fem) return "male";
  return "other";
}

/**
 * Use explicit gender when valid; otherwise infer from text. Always returns male | female | other.
 */
export function resolvePlayerGender(
  name: string,
  raw?: string | null,
  opts?: { personality?: string; background?: string },
): PlayerGender {
  return normalizePlayerGender(raw) ?? inferPlayerGender(name, opts);
}

/**
 * Avatar storage pools are binary (male/female). Map "other" and unknown to a stable bucket per name
 * so we do not default everyone to male-looking pool art.
 */
export function poolGenderBinary(gender: PlayerGender, name: string): "male" | "female" {
  if (gender === "female") return "female";
  if (gender === "male") return "male";
  let h = 0;
  const s = name || "player";
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) % 2 === 0 ? "female" : "male";
}
