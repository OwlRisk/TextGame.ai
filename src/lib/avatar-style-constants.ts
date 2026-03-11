/**
 * Single source of truth for avatar style configuration.
 *
 * To add a new style:
 *  1. Append the style value to VALID_STYLES below.
 *  2. Add a corresponding entry to AVATAR_STYLE_PACKS (label + description).
 *  3. Run `node scripts/generate-avatars.js <newStyle>` to generate the images.
 *  No changes are required in API routes, hooks, or components.
 */

export const VALID_STYLES = [
  'toon3d',
  'semi-realistic',
  'anime',
  'painted',
  'pixel',
  'cyberpunk',
] as const;

export type AvatarStyle = (typeof VALID_STYLES)[number];

export const DEFAULT_STYLE: AvatarStyle = 'semi-realistic';

export const AVATAR_STYLE_STORAGE_KEY = 'avatar_style_pack';

/** Returns true if `s` is a known AvatarStyle value. */
export function isValidStyle(s: string): s is AvatarStyle {
  return (VALID_STYLES as readonly string[]).includes(s);
}

/** Coerces an arbitrary string to a valid AvatarStyle, falling back to DEFAULT_STYLE. */
export function coerceStyle(s: string | null | undefined): AvatarStyle {
  return s && isValidStyle(s) ? s : DEFAULT_STYLE;
}

/** UI metadata for each style — consumed by settings-content.tsx and any preview components. */
export const AVATAR_STYLE_PACKS: ReadonlyArray<{
  value: AvatarStyle;
  label: string;
  description: string;
}> = [
  {
    value: 'toon3d',
    label: '3D Animated',
    description: 'Vibrant 3D animation studio style',
  },
  {
    value: 'semi-realistic',
    label: 'Semi-Realistic',
    description: 'Painterly game art, Arcane-inspired',
  },
  {
    value: 'anime',
    label: 'Anime',
    description: 'Japanese cel-shaded illustration',
  },
  {
    value: 'painted',
    label: 'Painted Portrait',
    description: 'Oil-painting brush strokes',
  },
  {
    value: 'pixel',
    label: 'Pixel Art',
    description: 'Retro 16-bit game sprites',
  },
  {
    value: 'cyberpunk',
    label: 'Cyberpunk',
    description: 'Neon-noir sci-fi aesthetic',
  },
] as const;

/** Custom event name dispatched when the user changes their avatar style. */
export const AVATAR_STYLE_CHANGED_EVENT = 'avatar-style-changed';
