# ADR-004: Shortcuts & Global Command Palette

## Status
Approved

## Context
Developers rely heavily on keyboard efficiency. Cortex Space has two competing keyboard inputs:
1. **The Active Terminal**: Intercepts all inputs to forward to the underlying PTY shell (e.g., standard key presses, cursor navigation, terminal control sequences).
2. **The Global App**: Needs to intercept specific hotkeys (e.g., `Ctrl/Cmd + K` for search, `Ctrl + ,` for settings, or layout switching keys).
Without a deliberate event-bubbling architecture, either the terminal eats all app shortcuts, or global app listeners break normal terminal CLI actions.

---

## Decisions Made

### 1. Unified Event Bubbling & Interception
In `XtermTerminal.tsx`, we bind a key event listener via the Xterm API. 
- It evaluates key combos against a regex/whitelist of global keys (`isGlobalShortcut` check).
- If matched (e.g., `Ctrl + ,`), it calls `e.stopPropagation()` inside Xterm's handler and allows the native DOM event to bubble up to the window listener (`useAppShortcuts.ts`).
- If not matched, Xterm consumes the keystroke entirely.

### 2. Global "Omni-search" Command Palette
We implemented `Ctrl/Cmd + K` as the central gateway for the interface:
- It serves as a unified entry point, displaying workspaces, templates, command snippets, and settings shortcuts.
- Keyboard focus shifts instantly to the search input, allowing developers to execute actions without lifting hands from the keyboard.

### 3. Directional Focus Navigation
To navigate complex nested terminal grid layouts (horizontal/vertical splits):
- We mapped `Cmd/Ctrl + Opt + Arrow Keys` to switch terminal focus.
- The engine calculates target coordinates mathematically based on active flex structures, selecting the adjacent pane cell cleanly.

---

## Consequences

### Positive (Pros)
* **Consistent Hotkeys**: Settings, snippets, and workspaces can always be triggered, even with a terminal actively running a command.
* **Ergonomic Layout Navigation**: Arrow-based focus switching makes mouse navigation unnecessary for layout management.

### Trade-offs & Negatives (Cons)
* **Shortcut Conflicts**: Certain complex global shortcuts may collide with command-line shortcuts (e.g. some Emacs or shell control commands). A whitelist override must be maintained in `shortcut-utils.ts` to manage exceptions.
