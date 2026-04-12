/**
 * Single source of truth for avatar style configuration.
 *
 * Styles are auto-selected per game template via getAvatarStyleForTemplate()
 * in game-templates.ts — there is no user-facing style picker.
 *
 * Legacy styles (painted, pixel, cyberpunk) remain in the DB avatar_styles
 * column for backward compatibility but are no longer generated or actively served.
 */

export const VALID_STYLES = [
  'valorant',
  'semi-realistic',
  'toon3d',
  'anime',
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

/** Custom event name dispatched when the game room avatar style changes. */
export const AVATAR_STYLE_CHANGED_EVENT = 'avatar-style-changed';
