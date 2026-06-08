# Plan: UX Elevator - Terminal Drag-and-Drop

Enable re-partitioning of the terminal layout by dragging pane headers and dropping them into new positions, providing a high-fidelity visual preview of the resulting split.

## Summary
Implement a drag-and-drop system using `@dnd-kit/core` that allows users to move terminal panes within the recursive `LayoutNode` tree. The implementation will feature a "ghost-rectangle" overlay system to indicate the split direction (Top/Bottom/Left/Right) before the drop is finalized.

## Context
- **Current State**: Layouts are static after initial creation, only splittable/removable via context menus.
- **Goal**: Intuitive "Pillar: UX Elevator" feature for dynamic workspace reorganization.
- **Constraints**: Must maintain compatibility with `react-resizable-panels` and the recursive `LayoutNode` tree structure.

## System Impact
- **State Ownership**: Remains in `App.tsx` (`workspaces` state), but requires a new `onMovePane` handler.
- **Tree Manipulation**: `src/lib/setup-utils.ts` needs a new recursive function to move nodes between branches.
- **Visual Feedback**: A new overlay layer in `SpaceView` to render the ghost preview.

## Approach
1.  **Dependency**: Install `@dnd-kit/core`.
2.  **Data Logic**: Implement `repositionNode(root, dragId, dropId, direction)` in `setup-utils.ts`.
3.  **Drag Initiation**: Update `PaneElevator` to use `useDraggable`.
4.  **Drop Orchestration**: 
    - Update `SpaceView` with `DndContext`.
    - Implement a `DropZone` component that wraps `TerminalPane` to detect pointer position and calculate the split quadrant.
5.  **Ghost Feedback**: Render a semi-transparent, animated rectangle over the target quadrant using `framer-motion`.

## Changes

### 1. Library Installation
- `package.json`: Add `@dnd-kit/core` and `@dnd-kit/utilities`.

### 2. Tree Utilities
- `src/lib/setup-utils.ts`:
    - Implement `repositionNode`: Safely removes the dragged node and re-inserts it as a sibling to the drop target with a new `SplitNode` parent.

### 3. Components
- `src/features/space/components/DropZone.tsx` (New):
    - Wraps `TerminalPane`.
    - Uses `useDroppable`.
    - Calculates `direction` based on pointer position relative to its bounding box.
    - Renders the "Ghost Overlay".
- `src/features/space/components/PaneElevator.tsx`:
    - Add `useDraggable` hook to the header container.
    - Add drag handle visual indicators (optional, or just make the whole header a handle).
- `src/features/space/SpaceView.tsx`:
    - Wrap layout in `DndContext`.
    - Handle `onDragEnd` by calling a new `onMovePane` prop.
- `src/App.tsx`:
    - Implement `handleMovePane` to update the workspace layout state.

## Verification
- **End-to-End**:
    1. Drag a pane header.
    2. Hover over another pane's edges; verify the ghost rectangle appears on the correct side.
    3. Drop the pane; verify the layout re-partitions correctly.
- **Edge Cases**:
    - Moving a pane to its own drop zone (should be ignored).
    - Moving the only pane in a workspace (should be impossible/ignored).
    - Dragging during Zen Mode (should be disabled).
    - Rapidly moving between drop zones (verify overlay animation smoothness).
