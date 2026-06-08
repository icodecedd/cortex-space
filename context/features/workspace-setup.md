# ADR-003: Workspace Setup Module

## Status
Approved

## Context
When developers configure a workspace, selecting directories, choosing grid layouts, and binding specific startup commands for multiple panes can feel tedious. The system requires an intuitive wizard flow that accelerates creation and automates naming conventions.

---

## Decisions Made

### 1. 3-Step Setup Stepper (Optimized Wizard)
We reduced the workspace wizard from 4 steps to 3:
- **Step 1: Workspace Basics**: Select mount directory path and visual layout topology (1x1, 1x2, 2x2, etc.).
- **Step 2: Command Configuration**: Customize the commands executed by each grid cell.
- **Step 3: Preview**: Verify the layout tree, command mapping, and auto-resolved tab names.
- *Reasoning*: The "AI Agent CLI Setup" step was removed from the wizard entirely and moved to first-launch onboarding to prevent repetitive setup checks on subsequent workspace creations.

### 2. Native File Directory Dialogs
Instead of building a complex web-based folder tree browser, the application invokes Tauri's native system dialogs (`tauri-plugin-dialog`) to let users pick their workspace path. This guarantees native performance, respects system permissions, and handles Windows drive letters correctly.

### 3. Automated Command-Based Labeling
To avoid requiring users to manually label every terminal tab:
- The setup module parses the configured command and derives semantic defaults (e.g. `npm run dev` -> `"DEV"`, `docker-compose up` -> `"DOCKER"`, `git log` -> `"GIT"`).

---

## Consequences

### Positive (Pros)
* **High-Speed Creation**: Users can configure and spin up a 4-pane workspace in under 15 seconds.
* **UI Cleanliness**: The wizard is lightweight and leverages Framer Motion step transitions.
* **Auto-Focus**: Automating tab labeling keeps the grid clean without manual label entry.

### Trade-offs & Negatives (Cons)
* **Custom Layout Restructuring**: If a user switches grid layouts (e.g., from 2x2 to 1x2) during the wizard, the pane configs are pruned/restructured, occasionally resetting customized commands.
