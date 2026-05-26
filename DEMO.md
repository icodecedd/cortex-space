# 🧪 Cortex Space Demo Features

This document outlines the features implemented specifically for the **Demo Phase**. These features allow for deep UI customization and experimentation, but are designed to be easily "rolled back" or integrated into the core settings once the demo concludes.

## 🚀 Active Demo Features

All demo features are controlled via the **Preferences > Demo** tab.

### 1. Workspace Minimalist Toggle
- **Toggle:** `Show Workspaces Tab`
- **Impact:** Hides the entire top-left workspace management area, including the tab bar and the "New Workspace" (+) button.
- **Affected Components:** `AppHeader.tsx`, `App.tsx`

### 2. Tactile Button Highlights
- **Toggle:** `Enable Terminal Button Highlight`
- **Impact:** Toggles the `.btn-tactile` CSS class on terminal action buttons (like "Relaunch Session").
- **Affected Components:** `XtermTerminal.tsx`

### 3. Header Action Toggles
- **Toggles:** `Show Cortex Library Button`, `Show Keyboard Shortcuts Button`
- **Impact:** Conditionally renders the Rocket and Keyboard icons in the global header.
- **Affected Components:** `AppHeader.tsx`

### 4. Mode Selector Shortcut Hints
- **Toggle:** `Show Mode Shortcut Hints`
- **Impact:** Hides the `<Kbd>` shortcut indicators (Ctrl+N, Ctrl+A, etc.) on the mode selection screen.
- **Affected Components:** `ModeSelectorScreen.tsx`

### 5. Terminal Shortcut Hints
- **Toggle:** `Show Terminal Shortcut Hints`
- **Impact:** Hides the `Ctrl+Alt+R` shortcut hint displayed in terminal pane headers.
- **Affected Components:** `XtermTerminal.tsx`

---

## 🛠️ Implementation Architecture

The demo system uses a dedicated settings group to avoid polluting core workspace state.

1. **State Store (`src/lib/store.ts`):** 
   - Uses the `DemoSettings` interface and `DEMO_DEFAULTS`.
   - Data is persisted in `settings.json` under the `demo.*` prefix.
2. **Synchronization:** 
   - A custom hook `useDemoSettings.ts` manages local component state.
   - Global updates are broadcast via the `cortex-demo-settings-changed` custom event for decoupled components (like the PTY-managed terminal).

---

## 🔄 Reversion / Production Transition

To revert these changes or transition them to production settings after the demo phase:

### Option A: Complete Reversion
1. **Remove the Demo Tab:** Delete the "Demo" `TabsTrigger` and `TabsContent` in `src/components/dialogs/SettingsDialog.tsx`.
2. **Clean the Store:** Delete the `DemoSettings` interface and `DEMO_DEFAULTS` from `src/lib/store.ts`.
3. **Remove Logic:** Search for `demoSettings` and `showShortcutHints` props in `App.tsx`, `AppHeader.tsx`, and `ModeSelectorScreen.tsx` and revert to their standard default values (usually `true`).
4. **Delete Hook:** Delete `src/hooks/useDemoSettings.ts`.

### Option B: Integrate into Production
1. **Move Settings:** Move the relevant fields from `DemoSettings` into `AppearanceSettings` or `FocusSettings` in `src/lib/store.ts`.
2. **Relocate UI:** Move the toggles from the "Demo" tab into the "Themes" or "Focus" tabs in the Settings dialog.
3. **Refactor Hooks:** Replace usage of `useDemoSettings` with the updated `useColorScheme` or `useFocusSettings` hooks.

---

*Last Updated: May 26, 2026*
