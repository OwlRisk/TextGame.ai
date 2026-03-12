'use client';

import {
  AvatarStyle,
  DEFAULT_STYLE,
} from './avatar-style-constants';

/**
 * Returns the default avatar style.
 *
 * Style is now determined per-game via getAvatarStyleForTemplate() — this hook
 * exists only as a safe fallback for components that render outside a game
 * context (e.g. landing page previews). Inside a game room the style should
 * always be passed explicitly via props.
 */
export function useAvatarStyle(): AvatarStyle {
  return DEFAULT_STYLE;
}

/**
 * No-op retained for backward compatibility.
 * @deprecated Avatar style is now auto-selected per game template.
 */
export function setAvatarStyleGlobal(_style: AvatarStyle): void {
  // Style is now template-driven; this function is intentionally a no-op.
}
