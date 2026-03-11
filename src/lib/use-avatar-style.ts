'use client';

import { useState, useEffect } from 'react';
import {
  AvatarStyle,
  DEFAULT_STYLE,
  AVATAR_STYLE_STORAGE_KEY,
  AVATAR_STYLE_CHANGED_EVENT,
  coerceStyle,
} from './avatar-style-constants';

/**
 * Returns the currently selected avatar style.
 *
 * - SSR-safe: returns DEFAULT_STYLE on the server.
 * - Reactive: updates instantly when the user changes their style in the
 *   Settings page (via the 'avatar-style-changed' CustomEvent) or in
 *   another browser tab (via the native 'storage' event).
 */
export function useAvatarStyle(): AvatarStyle {
  // Start with DEFAULT_STYLE to avoid SSR/hydration mismatches.
  const [style, setStyle] = useState<AvatarStyle>(DEFAULT_STYLE);

  useEffect(() => {
    // Read the persisted value on the client.
    setStyle(coerceStyle(localStorage.getItem(AVATAR_STYLE_STORAGE_KEY)));

    // React to style changes triggered in the same tab.
    function handleCustom(e: Event) {
      const detail = (e as CustomEvent<string>).detail;
      setStyle(coerceStyle(detail));
    }

    // React to style changes triggered in other tabs.
    function handleStorage(e: StorageEvent) {
      if (e.key === AVATAR_STYLE_STORAGE_KEY) {
        setStyle(coerceStyle(e.newValue));
      }
    }

    window.addEventListener(AVATAR_STYLE_CHANGED_EVENT, handleCustom);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener(AVATAR_STYLE_CHANGED_EVENT, handleCustom);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  return style;
}

/**
 * Writes the new style to localStorage and notifies all useAvatarStyle()
 * consumers in the same tab. Use this instead of raw localStorage.setItem
 * so that components update reactively.
 */
export function setAvatarStyleGlobal(style: AvatarStyle): void {
  localStorage.setItem(AVATAR_STYLE_STORAGE_KEY, style);
  window.dispatchEvent(
    new CustomEvent<string>(AVATAR_STYLE_CHANGED_EVENT, { detail: style })
  );
}
