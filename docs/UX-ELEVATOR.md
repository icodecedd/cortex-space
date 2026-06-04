# UX Elevator: Pane Management Implementation

## Overview
The "UX Elevator" provides a streamlined, non-intrusive interface for managing individual terminal panes within the workspace grid. It centralizes renaming, process control, layout manipulation, and snippet capturing.

## Core Features

### 1. Integrated Inline Renaming
- **Interaction**: Double-click the pane name in the header to enter edit mode.
- **UI**: Transitions into a high-contrast inline input field (`11px Extra Bold`).
- **Persistence**: 
  - `Enter` or `Blur`: Commits the change to the global workspace state.
  - `Escape`: Cancels editing and reverts to the previous name.
- **Technical**: Uses `e.stopPropagation()` to prevent terminal key bleed during entry.

### 2. Consolidated Process Control
- **"Reset Process"**: Moved the redundant external refresh button into the kebab menu.
- **Visuals**: Uses `RefreshCw` icon for clarity.
- **Shortcuts**: Displayed via `DropdownMenuShortcut` for discoverability (`Ctrl+Alt+R`).

### 3. Dynamic Layout Manipulation
- **Split Horizontally**: Divides the current pane into two side-by-side terminals.
- **Split Vertically**: Divides the current pane into two stacked terminals.
- **Kill Process**: Removes the pane from the layout tree and terminates its associated PTY.
- **Logic**: Powered by recursive tree mutation utilities in `setup-utils.ts` (`splitNode`, `removeNode`).

### 4. Smart Focus Hints
- **Shortcut Display**: Headers dynamically show the focus shortcut (e.g., `Ctrl+1`, `Ctrl+2`) based on the pane's absolute index in the grid, regardless of layout complexity.

## Technical Architecture

### Component Chain
1. `App.tsx`: Manages `workspaces` state and houses mutation handlers.
2. `SpaceView.tsx`: Recursively renders the `LayoutNode` tree and calculates pane indices.
3. `TerminalPane.tsx`: Acts as the visual container and focus manager.
4. `XtermTerminal.tsx`: Hosts the terminal instance.
5. `PaneElevator.tsx`: Standalone UI for pane management (the "UX Elevator").

### Elevator Enhancements
- **Refactored**: Extracted from `XtermTerminal` for better maintainability and testability.
- **Improved Visibility**: Now accessible on hover even for unfocused panes.
- **Precision Triggering**: Restricted to a top-right 30% trigger zone to reduce visual noise.
- **Flexible UI**: Added a toggle for "Compact" (icons only) vs "Expanded" (labels + focus hints + direct split buttons) modes.
- **Non-blocking**: Utilizes `pointer-events: none` on the trigger container to ensure the terminal remains fully interactive until the elevator is explicitly summoned.

### Tree Mutation Utilities (`src/lib/setup-utils.ts`)
- `splitNode`: Replaces a `PaneNode` with a `SplitNode` containing the original and a fresh pane.
- `removeNode`: Prunes a node and collapses its parent split to maintain tree integrity.
- `updatePaneNode`: Surgically updates properties (like `name`) of a specific leaf.

## Next Steps: Verification
- [ ] Test recursive splitting (depth > 3).
- [ ] Verify focus restoration after a "Kill" action.
- [ ] Ensure `1fr` distribution remains balanced after multiple splits.
