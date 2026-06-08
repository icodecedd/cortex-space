# Project Overview: Cortex Space

Cortex Space is a local-first, high-performance developer workspace and dashboard application. It provides developers with a unified, keyboard-driven environment to manage complex multi-pane terminal grids, execute reusable command snippets, automate local server port detection, and integrate AI agent CLIs.

Built on top of **Tauri v2** and **React**, the application prioritizes local execution speed, aesthetic excellence, and robust offline utility.

---

## 1. Core Tech Stack

- **Frontend Framework:** React 19 (TypeScript, Vite)
- **Styling & Design System:** TailwindCSS (via PostCSS/Vite) & Vanilla CSS Custom Properties (Variables)
- **Runtime & Native Shell:** Tauri v2 (Rust-backed file system access, terminal PTY processes, dialogs, and configuration store)
- **Terminal Rendering:** Xterm.js with WebGL/Canvas renderer, Fit Addon, and Web Links Addon
- **Animations:** Framer Motion (for spring physics and tiered transitions)
- **Iconography:** `@hugeicons/react` and `@hugeicons/core-free-icons` (recently migrated from `lucide-react` via a centralized abstraction layer)
- **State Management:** Local React state, custom React hooks, and persistent key-value configuration via `@tauri-apps/plugin-store`

---

## 2. Core Functional Modules

### A. Multi-Pane Terminal Grid
A flexible, recursive split-pane manager (supporting nested horizontal and vertical panels). Each pane runs a live pseudo-terminal (PTY) shell process spawned by the Rust backend, providing complete access to the local shell environment with native speed.

### B. Workspaces & Space Templates
Concurrent workspace sessions enable developers to isolate different context directories. Workspaces can be captured as reusable "Space Templates," preserving the split ratios, directory roots, and default startup commands.

### C. Command Snippets & Variable Prompts
A repository of frequently used command scripts. Snippets support dynamic double-curly placeholder variables (e.g., `git checkout {{BRANCH_NAME}}`). When clicked or run, a glassmorphic prompt modal resolves user inputs before sending the command down the terminal PTY pipe.

### D. TCP Port Detection & Link Badges
The terminal output stream is parsed in real time to capture local network addresses (such as `localhost:3000` or `127.0.0.1:8000`). The Rust backend verifies if the port is actively listening via a TCP handshake, then injects a clickable link badge into the pane header for quick browser access.

### E. Environment-Aware Onboarding
The first-launch wizard scans the user's system path to check if agentic CLIs (Gemini, Claude, Antigravity) are pre-installed. Users can run on-demand installers from the settings pane, keeping the core app bundle lightweight.

---

## 3. Hugeicons Iconography Layer

In order to establish a premium visual aesthetic, Cortex Space migrated its entire iconography from `lucide-react` to `@hugeicons/react` and `@hugeicons/core-free-icons`. 

To maintain safety and prevent editing dozens of React TSX files, the app routes all icon imports through a centralized wrapper layer:

- **Location:** [icons.tsx](file:///c:/Users/Chaoscedd/Programming/web-development/cortex-space/src/components/ui/icons.tsx)
- **Abstraction:** The `wrapIcon` wrapper maps Lucide-style properties (`size`, `color`, `className`) to the `@hugeicons/react` properties, meaning components can simply swap their Lucide import to `@/components/ui/icons` without refactoring their JSX markup.
- **Dependency Changes:** Installed `@hugeicons/react` and `@hugeicons/core-free-icons`, and cleanly pruned `lucide-react` from [package.json](file:///c:/Users/Chaoscedd/Programming/web-development/cortex-space/package.json).
