import { ShortcutSettings } from "./store";

/**
 * Checks if a KeyboardEvent matches a specific shortcut string (e.g., 'Ctrl+K', 'Ctrl+Shift+Z')
 */
export function matchesShortcut(e: KeyboardEvent | React.KeyboardEvent, shortcut: string): boolean {
  if (!shortcut || shortcut === "unassigned") return false;

  const parts = shortcut.split('+').map(p => p.trim().toLowerCase());
  const key = parts[parts.length - 1];
  const hasCtrl = parts.includes('ctrl') || parts.includes('cmd') || parts.includes('meta');
  const hasAlt = parts.includes('alt') || parts.includes('opt');
  const hasShift = parts.includes('shift');

  // Handle Meta/Cmd on Mac vs Ctrl on Windows/Linux
  const ctrlKey = e.ctrlKey || e.metaKey;

  // Use code for non-character keys to avoid issues with different layouts
  // But for simple characters, key is fine.
  let eventKey = e.key.toLowerCase();
  
  // Special mapping for common key names to display names
  if (eventKey === ' ') eventKey = 'space';

  return (
    eventKey === key &&
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

/**
 * Converts a KeyboardEvent into a standardized shortcut string.
 */
export function getShortcutString(e: KeyboardEvent | React.KeyboardEvent): string {
  const parts: string[] = [];
  
  if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
  if (e.altKey) parts.push('Alt');
  if (e.shiftKey) parts.push('Shift');
  
  let key = e.key;
  
  // Normalize key names
  if (key === ' ') key = 'Space';
  if (key.length === 1) key = key.toUpperCase();
  
  // Don't add if it's just a modifier key
  if (!['Control', 'Shift', 'Alt', 'Meta', 'AltGraph'].includes(key)) {
    parts.push(key);
  } else {
    // If only modifiers are pressed, return empty or a partial representation if needed.
    // Usually we want a full combination.
    return "";
  }
  
  return parts.join(' + ');
}
