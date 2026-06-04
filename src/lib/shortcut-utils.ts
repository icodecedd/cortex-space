import { ShortcutSettings } from "./store";

/**
 * Checks if a KeyboardEvent matches a specific shortcut string (e.g., 'Ctrl+K', 'Ctrl+Shift+Z')
 */
export function matchesShortcut(e: KeyboardEvent | React.KeyboardEvent, shortcut: string): boolean {
  if (!shortcut) return false;

  const parts = shortcut.split('+').map(p => p.trim().toLowerCase());
  const key = parts[parts.length - 1];
  const hasCtrl = parts.includes('ctrl') || parts.includes('cmd') || parts.includes('meta');
  const hasAlt = parts.includes('alt') || parts.includes('opt');
  const hasShift = parts.includes('shift');

  // Handle Meta/Cmd on Mac vs Ctrl on Windows/Linux
  const ctrlKey = e.ctrlKey || e.metaKey;

  return (
    e.key.toLowerCase() === key &&
    ctrlKey === hasCtrl &&
    e.altKey === hasAlt &&
    e.shiftKey === hasShift
  );
}

/**
 * Checks if a KeyboardEvent matches ANY of the defined application shortcuts.
 */
export function isGlobalShortcut(e: KeyboardEvent | React.KeyboardEvent, shortcuts: ShortcutSettings): boolean {
  return Object.values(shortcuts).some(s => matchesShortcut(e, s));
}
