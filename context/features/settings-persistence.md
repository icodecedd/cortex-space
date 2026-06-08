# ADR-005: Persistence & Theming Sync

## Status
Approved

## Context
User configurations (e.g. customized workspace grids, themes, snippet directories, font styling) need to persist between application launches. Additionally, theme choices must remain consistent across the app UI and the terminal canvas. A mismatch between theme styling (e.g., a dark terminal inside a light-themed sidebar) degrades visual polish.

---

## Decisions Made

### 1. Local-First Tauri Store (`tauri-plugin-store`)
We chose Tauri's official store plugin over the browser's standard `localStorage`:
- It stores variables in a local JSON file (`.settings.bin` or similar) inside the application data directory.
- This prevents data loss during browser-level cache resets and ensures settings are accessible directly from Rust backend logic if needed.

### 2. Dual-Engine Theme Synchronization
To maintain aesthetic cohesion, switching the theme updates two layers concurrently:
- **CSS Custom Properties**: Tailwind/Vanilla styles inject the primary color tokens (e.g. `--bg-color`, `--accent-primary`) into the root HTML node.
- **Xterm Terminal Options**: The app updates the `options.theme` settings on all active terminal instances (mapping color keywords like `--ansi-green` and `--ansi-blue` to the canvas palette).

### 3. Dynamic Font Scaling
Instead of using static style sizing, font sizes across the workspace scale reactively through a global scale modifier. Changing scale configurations in Settings computes and updates root EM font parameters dynamically without breaking flex grid proportions.

---

## Consequences

### Positive (Pros)
* **Visual Polish**: Terminals and layout dialogs are perfectly color-coordinated.
* **Persistent Reliability**: User configurations are fully safe and independent of browser state.
* **OS-Level Sync**: System color schemes (light/dark mode triggers) propagate automatically.

### Trade-offs & Negatives (Cons)
* **Async Disk Writes**: Reading and writing settings via `tauri-plugin-store` is asynchronous. The frontend must handle loading states (e.g., via `isInitialized` checks in hooks) to avoid visual flicker during state mounting.
